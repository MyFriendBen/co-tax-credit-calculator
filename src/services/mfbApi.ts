import type { CalculatorFormData } from '@/lib/schemas/calculator.schema';

export type TaxCreditId =
  | 'co_tax_credit_ctc'
  | 'co_tax_credit_coctc'
  | 'co_tax_credit_eitc'
  | 'co_tax_credit_coeitc'
  | 'co_tax_credit_fatc'
  | 'co_tax_credit_care_worker';

export interface TaxCredit {
  id: TaxCreditId;
  value: number;
  external_name: string;
  estimated_value: number;
}

export interface ApiIncomeStream {
  type: 'wages';
  frequency: string;
  amount: number;
  hours_worked?: number;
}

export interface ApiHouseholdMember {
  relationship: 'headOfHousehold' | 'spouse' | 'child';
  age: number;
  hasIncome: boolean;
  is_care_worker: boolean;
  income_streams: ApiIncomeStream[];
  insurance: Record<string, unknown>;
}

export interface ApiScreenData {
  is_test: boolean;
  white_label: string;
  referrer_code: string;
  household_size: number;
  household_members: ApiHouseholdMember[];
  expenses: unknown[];
}

export interface ApiScreenResponse {
  uuid: string;
  id: string;
}

export interface ApiEligibilityResponse {
  programs: Array<{
    external_name: string;
    estimated_value: number;
  }>;
}

/**
 * MyFriendBen API Client
 * Handles communication with the MFB backend for tax credit calculations
 */
export class MfbApi {
  private readonly DEFAULT_AGE = 44;
  private readonly API_KEY: string;
  private readonly API_DOMAIN: string;

  private readonly TAX_CREDIT_NAMES: TaxCreditId[] = [
    'co_tax_credit_ctc',
    'co_tax_credit_coctc',
    'co_tax_credit_eitc',
    'co_tax_credit_coeitc',
    'co_tax_credit_fatc',
    'co_tax_credit_care_worker',
  ];

  private uuid: string | null = null;
  private id: string | null = null;

  constructor() {
    this.API_KEY = import.meta.env.VITE_MFB_API_KEY;
    this.API_DOMAIN = import.meta.env.VITE_MFB_DOMAIN;

    if (!this.API_KEY) {
      console.warn('VITE_MFB_API_KEY is not set. API calls will fail.');
    }
    if (!this.API_DOMAIN) {
      console.warn('VITE_MFB_DOMAIN is not set. API calls will fail.');
    }
  }

  private get requestHeaders() {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `TOKEN ${this.API_KEY}`,
    };
  }

  private async fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit,
    timeoutMs = 15000
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Create or update a screen with household data
   */
  async updateScreen(formData: CalculatorFormData): Promise<void> {
    const url = this.getUpsertScreenUrl();
    const method = this.getUpsertScreenMethod();
    const data = this.createApiData(formData);

    const response = await this.fetchWithTimeout(url, {
      method,
      headers: this.requestHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const responseData: ApiScreenResponse = await response.json();

    if (this.uuid === null) {
      this.uuid = responseData.uuid;
      this.id = responseData.id;
    }
  }

  /**
   * Get tax credit results for the current screen
   */
  async getResults(): Promise<TaxCredit[]> {
    if (!this.uuid) {
      throw new Error('Screen must be created before fetching results. Call updateScreen() first.');
    }

    const url = `${this.API_DOMAIN}/api/eligibility/${this.uuid}`;

    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
      headers: this.requestHeaders,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data: ApiEligibilityResponse = await response.json();

    const credits: TaxCredit[] = [];
    for (const program of data.programs) {
      if (this.TAX_CREDIT_NAMES.includes(program.external_name as TaxCreditId)) {
        credits.push({
          id: program.external_name as TaxCreditId,
          value: program.estimated_value,
          external_name: program.external_name,
          estimated_value: program.estimated_value,
        });
      }
    }

    // Track analytics if GA is available
    if (typeof window !== 'undefined' && 'dataLayer' in window) {
      // @ts-ignore - Google Analytics dataLayer
      window.dataLayer.push({ event: 'results_shown', uuid: this.uuid });
    }

    return credits;
  }

  /**
   * Reset the API client state
   */
  reset(): void {
    this.uuid = null;
    this.id = null;
  }

  private createApiData(formData: CalculatorFormData): ApiScreenData {
    const urlParams = new URLSearchParams(window.location.search);
    const isTest = urlParams.get('test') !== null;

    const householdMembers: ApiHouseholdMember[] = [];

    // Add head of household with all income
    const headIncomes = formData.incomes.map(income => ({
      type: 'wages' as const,
      frequency: income.frequency || 'monthly',
      amount: parseFloat(income.amount) || 0,
      hours_worked: income.frequency === 'hourly' ? parseFloat(income.hours) || 0 : undefined,
    }));

    householdMembers.push(
      this.createPerson('headOfHousehold', this.DEFAULT_AGE, headIncomes, formData.headIsCareWorker)
    );

    // Add spouse if married
    if (formData.isMarried) {
      householdMembers.push(
        this.createPerson('spouse', this.DEFAULT_AGE, [], formData.spouseIsCareWorker)
      );
    }

    // Add children under 6
    const children0To5Count = parseInt(formData.children0To5) || 0;
    for (let i = 0; i < children0To5Count; i++) {
      householdMembers.push(this.createPerson('child', 4, [], false));
    }

    // Add children 6-16
    const children6To16Count = parseInt(formData.children6To16) || 0;
    for (let i = 0; i < children6To16Count; i++) {
      householdMembers.push(this.createPerson('child', 10, [], false));
    }

    return {
      is_test: isTest,
      white_label: 'co_tax_calculator',
      referrer_code: 'getaheadtaxcalculator',
      household_size: householdMembers.length,
      household_members: householdMembers,
      expenses: [],
    };
  }

  private createPerson(
    relationship: 'headOfHousehold' | 'spouse' | 'child',
    age: number,
    incomeStreams: ApiIncomeStream[],
    isCareWorker: boolean
  ): ApiHouseholdMember {
    return {
      relationship,
      age,
      hasIncome: incomeStreams.length > 0,
      is_care_worker: isCareWorker,
      income_streams: incomeStreams,
      insurance: {},
    };
  }

  private getUpsertScreenUrl(): string {
    if (this.uuid !== null) {
      return `${this.API_DOMAIN}/api/screens/${this.uuid}/`;
    }
    return `${this.API_DOMAIN}/api/screens/`;
  }

  private getUpsertScreenMethod(): 'POST' | 'PUT' {
    return this.uuid !== null ? 'PUT' : 'POST';
  }
}

// Export singleton instance
export const mfbApi = new MfbApi();
