import type { TaxCredit, TaxCreditId } from '@/services/mfbApi';
import type { TaxCreditResults, CreditResult } from '@/utils/taxCalculator';
import type { CalculatorFormData } from '@/lib/schemas/calculator.schema';

/**
 * Maps API tax credit results to the UI format
 */
export function mapApiResultsToTaxCreditResults(
  apiResults: TaxCredit[],
  formData: CalculatorFormData
): TaxCreditResults {
  // Create a map for easy lookup
  const resultsMap = new Map<TaxCreditId, number>();
  apiResults.forEach(credit => {
    resultsMap.set(credit.id, credit.value);
  });

  // Helper to create credit result
  const createCreditResult = (
    creditId: TaxCreditId,
    name: string,
    eligibleExplanation: string,
    ineligibleExplanation: string
  ): CreditResult => {
    const value = resultsMap.get(creditId) || 0;
    const isEligible = value > 0;

    return {
      status: isEligible ? 'eligible' : 'ineligible',
      estimatedBenefit: value,
      explanation: isEligible ? eligibleExplanation : ineligibleExplanation,
      reasons: isEligible ? [] : [ineligibleExplanation],
    };
  };

  // Map each credit
  const coloradoCTC = createCreditResult(
    'co_tax_credit_coctc',
    'Colorado Child Tax Credit',
    'You qualify for the Colorado Child Tax Credit based on your household information.',
    'You may not qualify for the Colorado Child Tax Credit based on your income and household size.'
  );

  const coloradoFATC = createCreditResult(
    'co_tax_credit_fatc',
    'Colorado Family Affordability Tax Credit',
    'You qualify for the Colorado Family Affordability Tax Credit!',
    'You may not qualify for the Colorado Family Affordability Tax Credit based on your household situation.'
  );

  const coloradoEITC = createCreditResult(
    'co_tax_credit_coeitc',
    'Colorado Earned Income Tax Credit',
    'You qualify for the Colorado EITC based on your earned income.',
    'You may not qualify for the Colorado EITC based on your income level.'
  );

  const coloradoCareWorker = createCreditResult(
    'co_tax_credit_care_worker',
    'Colorado Care Worker Tax Credit',
    'You qualify for the Colorado Care Worker Tax Credit!',
    'You may not qualify for the Colorado Care Worker Tax Credit. This credit is for those who regularly care for children under 6.'
  );

  const federalCTC = createCreditResult(
    'co_tax_credit_ctc',
    'Federal Child Tax Credit',
    'You qualify for the Federal Child Tax Credit based on your household.',
    'You may not qualify for the Federal Child Tax Credit based on your household information.'
  );

  const federalEITC = createCreditResult(
    'co_tax_credit_eitc',
    'Federal Earned Income Tax Credit',
    'You qualify for the Federal EITC based on your earned income and household size.',
    'You may not qualify for the Federal EITC based on your income and household information.'
  );

  // Calculate total
  const totalEstimatedBenefit = apiResults.reduce((sum, credit) => sum + credit.value, 0);

  return {
    coloradoCTC,
    coloradoFATC,
    coloradoEITC,
    coloradoCareWorker,
    federalCTC,
    federalEITC,
    totalEstimatedBenefit,
  };
}
