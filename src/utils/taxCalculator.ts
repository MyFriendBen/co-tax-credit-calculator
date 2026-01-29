/**
 * Colorado Tax Credit & Eligibility Estimator
 * 
 * Calculates eligibility and benefit estimates for:
 * - Colorado Child Tax Credit (COCTC)
 * - Colorado Family Affordability Tax Credit (FATC)
 * - Colorado Earned Income Tax Credit (EITC)
 * - Colorado Care Worker Credit
 * - Federal Child Tax Credit (CTC)
 * - Federal Earned Income Tax Credit (EITC)
 * 
 * NOTE: This is a simplified calculation for demonstration purposes.
 * Real calculations should use actual federal and Colorado tax law.
 */

export type FilingStatus = 'single' | 'head-of-household' | 'married-joint' | 'married-separate';
export type PayFrequency = 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly' | 'other';
export type ColoradoResidency = 'full-year' | 'part-year' | 'no';
export type ChildRelationship = 'biological' | 'step' | 'foster' | 'adopted' | 'other';
export type EligibilityStatus = 'eligible' | 'ineligible' | 'maybe';

export interface ChildInfo {
  age: number;
  livesWithYou: 'yes' | 'no' | 'not-sure';
  relationship: ChildRelationship;
  hasValidID: 'yes' | 'no' | 'not-sure';
}

export interface TaxCreditInput {
  filingStatus: FilingStatus;
  coloradoResident: ColoradoResidency;
  hasEarnedIncome: boolean;
  annualIncome: number;
  children: ChildInfo[];
  hasChildCareExpenses: boolean;
  childCareExpenses: number;
  isCareWorker?: boolean;
  careWorkerType?: 'childcare' | 'direct-care' | 'none';
  careWorkerHours?: number;
}

export interface CreditResult {
  status: EligibilityStatus;
  estimatedBenefit: number;
  explanation: string;
  reasons: string[];
}

export interface TaxCreditResults {
  coloradoCTC: CreditResult;
  coloradoFATC: CreditResult;
  coloradoEITC: CreditResult;
  coloradoCareWorker: CreditResult;
  federalCTC: CreditResult;
  federalEITC: CreditResult;
  totalEstimatedBenefit: number;
}

/**
 * Convert pay frequency and amount to annual income
 */
export function calculateAnnualIncome(frequency: PayFrequency, amount: number): number {
  const multipliers: Record<PayFrequency, number> = {
    'weekly': 52,
    'biweekly': 26,
    'semi-monthly': 24,
    'monthly': 12,
    'other': 12, // Default to monthly equivalent for "other"
  };
  
  return amount * multipliers[frequency];
}

/**
 * Check if child is a qualifying child for tax purposes
 */
function isQualifyingChild(child: ChildInfo): { 
  isQualifying: boolean; 
  status: EligibilityStatus;
  issues: string[];
} {
  const issues: string[] = [];
  let status: EligibilityStatus = 'eligible';
  
  // Check residency
  if (child.livesWithYou === 'no') {
    issues.push('Child does not live with you more than half the year');
    status = 'ineligible';
  } else if (child.livesWithYou === 'not-sure') {
    issues.push('Unclear if child lives with you more than half the year');
    status = 'maybe';
  }
  
  // Check relationship
  if (child.relationship === 'other') {
    issues.push('Relationship may not qualify - verify with tax professional');
    if (status !== 'ineligible') status = 'maybe';
  }
  
  // Check ID
  if (child.hasValidID === 'no') {
    issues.push('Child does not have valid SSN/TIN');
    status = 'ineligible';
  } else if (child.hasValidID === 'not-sure') {
    issues.push('Unclear if child has valid SSN/TIN');
    if (status !== 'ineligible') status = 'maybe';
  }
  
  return {
    isQualifying: status === 'eligible',
    status,
    issues,
  };
}

/**
 * Calculate Colorado Child Tax Credit (COCTC)
 * For children under age 6 in Colorado
 */
function calculateColoradoCTC(input: TaxCreditInput): CreditResult {
  const { coloradoResident, annualIncome, children, filingStatus } = input;
  
  // Must be Colorado resident
  if (coloradoResident === 'no') {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'The Colorado Child Tax Credit is only available to Colorado residents.',
      reasons: ['Not a Colorado resident'],
    };
  }
  
  // Find qualifying children under 6
  const childrenUnder6 = children.filter(c => c.age < 6);
  
  if (childrenUnder6.length === 0) {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'The Colorado Child Tax Credit is only for children under age 6.',
      reasons: ['No children under age 6'],
    };
  }
  
  // Check income limits (approximate)
  const incomeLimit = filingStatus === 'married-joint' ? 85000 : 75000;
  
  if (annualIncome > incomeLimit) {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: `Your income exceeds the limit for the Colorado Child Tax Credit ($${incomeLimit.toLocaleString()} for your filing status).`,
      reasons: [`Income over $${incomeLimit.toLocaleString()} limit`],
    };
  }
  
  // Evaluate each child
  let qualifyingCount = 0;
  let status: EligibilityStatus = 'eligible';
  const allIssues: string[] = [];
  
  for (const child of childrenUnder6) {
    const childCheck = isQualifyingChild(child);
    if (childCheck.isQualifying) {
      qualifyingCount++;
    } else {
      if (childCheck.status === 'ineligible') {
        status = 'ineligible';
      } else if (status !== 'ineligible') {
        status = 'maybe';
      }
      allIssues.push(...childCheck.issues);
    }
  }
  
  if (qualifyingCount === 0 && status === 'ineligible') {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'None of your children under 6 meet the qualifying criteria.',
      reasons: allIssues,
    };
  }
  
  // Calculate benefit: $2,000 per qualifying child
  const benefit = qualifyingCount * 2000;
  
  const reasons: string[] = [];
  if (qualifyingCount > 0) {
    reasons.push(`${qualifyingCount} qualifying ${qualifyingCount === 1 ? 'child' : 'children'} under age 6`);
    reasons.push(`$2,000 per child`);
    reasons.push(`Income within $${incomeLimit.toLocaleString()} limit`);
  }
  if (coloradoResident === 'part-year') {
    reasons.push('Part-year resident - benefit may be prorated');
    status = 'maybe';
  }
  if (allIssues.length > 0) {
    reasons.push(...allIssues);
  }
  
  return {
    status,
    estimatedBenefit: benefit,
    explanation: status === 'eligible' 
      ? `The Colorado Child Tax Credit provides $2,000 for each qualifying child under age 6. You may receive up to $${benefit.toLocaleString()}.`
      : `You may qualify for the Colorado Child Tax Credit, but some details need verification. Potential benefit: up to $${benefit.toLocaleString()}.`,
    reasons,
  };
}

/**
 * Calculate Colorado Family Affordability Tax Credit (FATC)
 * Up to $3,200 per child under 6, $2,400 per child 6-16
 */
function calculateColoradoFATC(input: TaxCreditInput): CreditResult {
  const { coloradoResident, annualIncome, children, filingStatus } = input;
  
  // Must be Colorado resident
  if (coloradoResident === 'no') {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'The Colorado Family Affordability Tax Credit is only available to Colorado residents.',
      reasons: ['Not a Colorado resident'],
    };
  }
  
  const childrenUnder6 = children.filter(c => c.age < 6);
  const children6to16 = children.filter(c => c.age >= 6 && c.age < 17);
  
  if (childrenUnder6.length === 0 && children6to16.length === 0) {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'The Colorado Family Affordability Tax Credit requires at least one child under age 17.',
      reasons: ['No qualifying children under age 17'],
    };
  }
  
  // Check income phase-out
  const phaseOutStart: Record<FilingStatus, number> = {
    'single': 75000,
    'head-of-household': 85000,
    'married-joint': 85000,
    'married-separate': 75000,
  };
  
  const phaseOutEnd: Record<FilingStatus, number> = {
    'single': 100000,
    'head-of-household': 110000,
    'married-joint': 110000,
    'married-separate': 100000,
  };
  
  // Evaluate children
  let qualifyingUnder6 = 0;
  let qualifying6to16 = 0;
  let status: EligibilityStatus = 'eligible';
  const allIssues: string[] = [];
  
  for (const child of [...childrenUnder6, ...children6to16]) {
    const childCheck = isQualifyingChild(child);
    if (childCheck.isQualifying) {
      if (child.age < 6) qualifyingUnder6++;
      else qualifying6to16++;
    } else {
      if (childCheck.status === 'ineligible') {
        status = 'ineligible';
      } else if (status !== 'ineligible') {
        status = 'maybe';
      }
      allIssues.push(...childCheck.issues);
    }
  }
  
  if (qualifyingUnder6 === 0 && qualifying6to16 === 0 && status === 'ineligible') {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'None of your children meet the qualifying criteria for FATC.',
      reasons: allIssues,
    };
  }
  
  // Calculate base benefit
  let benefit = (qualifyingUnder6 * 3200) + (qualifying6to16 * 2400);
  
  const reasons: string[] = [];
  
  // Apply phase-out
  if (annualIncome > phaseOutStart[filingStatus]) {
    if (annualIncome >= phaseOutEnd[filingStatus]) {
      return {
        status: 'ineligible',
        estimatedBenefit: 0,
        explanation: `Your income exceeds the limit for the Colorado Family Affordability Tax Credit (phases out at $${phaseOutEnd[filingStatus].toLocaleString()} for your filing status).`,
        reasons: [`Income over $${phaseOutEnd[filingStatus].toLocaleString()}`],
      };
    }
    
    const phaseOutRange = phaseOutEnd[filingStatus] - phaseOutStart[filingStatus];
    const excessIncome = annualIncome - phaseOutStart[filingStatus];
    const phaseOutPercentage = excessIncome / phaseOutRange;
    benefit = benefit * (1 - phaseOutPercentage);
    reasons.push('Credit reduced due to income phase-out');
  }
  
  if (qualifyingUnder6 > 0) {
    reasons.push(`${qualifyingUnder6} qualifying ${qualifyingUnder6 === 1 ? 'child' : 'children'} under 6 ($3,200 each)`);
  }
  if (qualifying6to16 > 0) {
    reasons.push(`${qualifying6to16} qualifying ${qualifying6to16 === 1 ? 'child' : 'children'} age 6-16 ($2,400 each)`);
  }
  
  if (coloradoResident === 'part-year') {
    reasons.push('Part-year resident - benefit may be prorated');
    if (status !== 'ineligible') status = 'maybe';
  }
  
  if (allIssues.length > 0) {
    reasons.push(...allIssues);
  }
  
  return {
    status,
    estimatedBenefit: Math.round(benefit),
    explanation: status === 'eligible'
      ? `The Colorado FATC provides up to $3,200 per child under 6 and $2,400 per child age 6-16. You may receive approximately $${Math.round(benefit).toLocaleString()}.`
      : `You may qualify for the Colorado FATC, but some details need verification. Potential benefit: up to $${Math.round(benefit).toLocaleString()}.`,
    reasons,
  };
}

/**
 * Calculate Colorado Earned Income Tax Credit (EITC)
 * 50% of Federal EITC
 */
function calculateColoradoEITC(input: TaxCreditInput, federalEITCResult: CreditResult): CreditResult {
  const { coloradoResident } = input;
  
  // Must be Colorado resident
  if (coloradoResident === 'no') {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'The Colorado Earned Income Tax Credit is only available to Colorado residents.',
      reasons: ['Not a Colorado resident'],
    };
  }
  
  // Must qualify for Federal EITC first
  if (federalEITCResult.status === 'ineligible') {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'You must qualify for the Federal EITC to receive the Colorado EITC.',
      reasons: ['Not eligible for Federal EITC'],
    };
  }
  
  // Colorado EITC is 50% of Federal EITC
  const coloradoCredit = Math.round(federalEITCResult.estimatedBenefit * 0.5);
  
  const reasons: string[] = [
    '50% of Federal EITC',
    `Federal EITC: $${federalEITCResult.estimatedBenefit.toLocaleString()}`,
    'Colorado resident',
  ];
  
  if (coloradoResident === 'part-year') {
    reasons.push('Part-year resident - benefit may be prorated');
  }
  
  return {
    status: federalEITCResult.status,
    estimatedBenefit: coloradoCredit,
    explanation: federalEITCResult.status === 'eligible'
      ? `The Colorado EITC is 50% of your Federal EITC. You may receive approximately $${coloradoCredit.toLocaleString()}.`
      : `You may qualify for the Colorado EITC (50% of Federal EITC), but some details need verification. Potential benefit: up to $${coloradoCredit.toLocaleString()}.`,
    reasons,
  };
}

/**
 * Calculate Colorado Care Worker Credit
 * $1,200 flat credit for qualifying care workers
 */
function calculateColoradoCareWorker(input: TaxCreditInput): CreditResult {
  const { isCareWorker, careWorkerType, careWorkerHours, annualIncome, filingStatus, coloradoResident } = input;
  
  // Must be a care worker
  if (!isCareWorker || careWorkerType === 'none' || !careWorkerType) {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'The Colorado Care Worker Tax Credit is for childcare workers (caring for children 5 and under) and direct care workers in long-term care.',
      reasons: ['Not a care worker'],
    };
  }
  
  // Must be Colorado resident
  if (coloradoResident === 'no') {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'The Colorado Care Worker Tax Credit is only available to Colorado residents.',
      reasons: ['Not a Colorado resident'],
    };
  }
  
  // Must have worked at least 720 hours
  if (!careWorkerHours || careWorkerHours < 720) {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'You must have worked at least 720 hours in 2025 to qualify for the Care Worker Tax Credit.',
      reasons: ['Less than 720 hours worked'],
    };
  }
  
  // Check income limits
  const incomeLimit = filingStatus === 'married-joint' ? 100000 : 75000;
  
  if (annualIncome > incomeLimit) {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: `Your income exceeds the limit for the Colorado Care Worker Tax Credit ($${incomeLimit.toLocaleString()} for your filing status).`,
      reasons: [`Income over $${incomeLimit.toLocaleString()} limit`],
    };
  }
  
  // Flat $1,200 credit for all qualifying care workers
  const creditAmount = 1200;
  
  const careTypeLabel = careWorkerType === 'childcare' 
    ? 'Childcare worker (children age 5 and under)' 
    : 'Direct care worker (long-term care)';
  
  const reasons: string[] = [
    careTypeLabel,
    `Worked ${careWorkerHours} hours (minimum 720 required)`,
    `Income within $${incomeLimit.toLocaleString()} limit`,
    'Colorado resident',
  ];
  
  let status: EligibilityStatus = 'eligible';
  if (coloradoResident === 'part-year') {
    reasons.push('Part-year resident - benefit may be prorated');
    status = 'maybe';
  }
  
  return {
    status,
    estimatedBenefit: creditAmount,
    explanation: status === 'eligible'
      ? `The Colorado Care Worker Tax Credit provides $1,200 for qualifying care workers. You may receive $${creditAmount.toLocaleString()}.`
      : `You may qualify for the Colorado Care Worker Tax Credit ($1,200), but some details need verification.`,
    reasons,
  };
}

/**
 * Calculate Federal Child Tax Credit (CTC)
 * Up to $2,000 per child under 17
 */
function calculateFederalCTC(input: TaxCreditInput): CreditResult {
  const { hasEarnedIncome, annualIncome, children, filingStatus } = input;
  
  const childrenUnder17 = children.filter(c => c.age < 17);
  
  if (childrenUnder17.length === 0) {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'The Federal Child Tax Credit requires at least one child under age 17.',
      reasons: ['No children under age 17'],
    };
  }
  
  if (!hasEarnedIncome) {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'You must have earned income to qualify for the Federal Child Tax Credit.',
      reasons: ['No earned income'],
    };
  }
  
  // Evaluate children
  let qualifyingCount = 0;
  let status: EligibilityStatus = 'eligible';
  const allIssues: string[] = [];
  
  for (const child of childrenUnder17) {
    const childCheck = isQualifyingChild(child);
    if (childCheck.isQualifying) {
      qualifyingCount++;
    } else {
      if (childCheck.status === 'ineligible') {
        status = 'ineligible';
      } else if (status !== 'ineligible') {
        status = 'maybe';
      }
      allIssues.push(...childCheck.issues);
    }
  }
  
  if (qualifyingCount === 0 && status === 'ineligible') {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'None of your children meet the federal qualifying criteria.',
      reasons: allIssues,
    };
  }
  
  // Calculate benefit with phase-out
  let benefit = qualifyingCount * 2000;
  
  const phaseOutThreshold = filingStatus === 'married-joint' ? 400000 : 200000;
  
  if (annualIncome > phaseOutThreshold) {
    const excessIncome = annualIncome - phaseOutThreshold;
    const reduction = Math.ceil(excessIncome / 1000) * 50;
    benefit = Math.max(0, benefit - reduction);
  }
  
  const reasons: string[] = [];
  if (qualifyingCount > 0) {
    reasons.push(`${qualifyingCount} qualifying ${qualifyingCount === 1 ? 'child' : 'children'} under 17`);
    reasons.push(`$2,000 per child`);
    reasons.push('Have earned income');
  }
  if (annualIncome > phaseOutThreshold) {
    reasons.push('Credit reduced due to income phase-out');
  }
  if (allIssues.length > 0) {
    reasons.push(...allIssues);
  }
  
  return {
    status,
    estimatedBenefit: benefit,
    explanation: status === 'eligible'
      ? `The Federal Child Tax Credit provides up to $2,000 per qualifying child under 17. You may receive up to $${benefit.toLocaleString()}.`
      : `You may qualify for the Federal CTC, but some details need verification. Potential benefit: up to $${benefit.toLocaleString()}.`,
    reasons,
  };
}

/**
 * Calculate Federal Earned Income Tax Credit (EITC)
 */
function calculateFederalEITC(input: TaxCreditInput): CreditResult {
  const { hasEarnedIncome, annualIncome, children, filingStatus } = input;
  
  if (!hasEarnedIncome || annualIncome === 0) {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: 'You must have earned income to qualify for the Federal Earned Income Tax Credit.',
      reasons: ['No earned income'],
    };
  }
  
  // Count qualifying children
  let qualifyingChildren = 0;
  let status: EligibilityStatus = 'eligible';
  const allIssues: string[] = [];
  
  for (const child of children) {
    const childCheck = isQualifyingChild(child);
    if (childCheck.isQualifying) {
      qualifyingChildren++;
    } else if (childCheck.status === 'maybe') {
      if (status !== 'ineligible') status = 'maybe';
      allIssues.push(...childCheck.issues);
    }
  }
  
  // 2024 EITC income limits (approximate)
  const incomeLimits: Record<FilingStatus, { [key: number]: number }> = {
    'single': { 0: 18591, 1: 49084, 2: 55768, 3: 59899 },
    'head-of-household': { 0: 18591, 1: 49084, 2: 55768, 3: 59899 },
    'married-joint': { 0: 25511, 1: 56004, 2: 62688, 3: 66819 },
    'married-separate': { 0: 18591, 1: 49084, 2: 55768, 3: 59899 },
  };
  
  const maxCredits: { [key: number]: number } = {
    0: 632,
    1: 4213,
    2: 6960,
    3: 7830,
  };
  
  const childCount = Math.min(qualifyingChildren, 3);
  const incomeLimit = incomeLimits[filingStatus][childCount];
  const maxCredit = maxCredits[childCount];
  
  if (annualIncome > incomeLimit) {
    return {
      status: 'ineligible',
      estimatedBenefit: 0,
      explanation: `Your income exceeds the limit for the Federal EITC ($${incomeLimit.toLocaleString()} for your situation).`,
      reasons: [`Income over $${incomeLimit.toLocaleString()} limit`],
    };
  }
  
  // Simplified EITC calculation
  let creditAmount = maxCredit;
  const phaseInEnd = incomeLimit * 0.2;
  const phaseOutStart = incomeLimit * 0.5;
  
  if (annualIncome < phaseInEnd) {
    creditAmount = maxCredit * (annualIncome / phaseInEnd);
  } else if (annualIncome > phaseOutStart) {
    const phaseOutRange = incomeLimit - phaseOutStart;
    const excessIncome = annualIncome - phaseOutStart;
    creditAmount = maxCredit * (1 - (excessIncome / phaseOutRange));
  }
  
  const reasons: string[] = [
    'Have earned income',
    `${qualifyingChildren} qualifying ${qualifyingChildren === 1 ? 'child' : 'children'}`,
    'Income within eligible range',
  ];
  
  if (allIssues.length > 0) {
    reasons.push(...allIssues);
  }
  
  return {
    status,
    estimatedBenefit: Math.round(creditAmount),
    explanation: status === 'eligible'
      ? `The Federal EITC helps workers with lower to moderate income. Based on your income and ${qualifyingChildren} ${qualifyingChildren === 1 ? 'child' : 'children'}, you may receive approximately $${Math.round(creditAmount).toLocaleString()}.`
      : `You may qualify for the Federal EITC, but some details need verification. Potential benefit: up to $${Math.round(creditAmount).toLocaleString()}.`,
    reasons,
  };
}

/**
 * Calculate all tax credits
 */
export function calculateAllCredits(input: TaxCreditInput): TaxCreditResults {
  const coloradoCTC = calculateColoradoCTC(input);
  const coloradoFATC = calculateColoradoFATC(input);
  const federalEITC = calculateFederalEITC(input);
  const coloradoEITC = calculateColoradoEITC(input, federalEITC);
  const coloradoCareWorker = calculateColoradoCareWorker(input);
  const federalCTC = calculateFederalCTC(input);
  
  const totalEstimatedBenefit = 
    (coloradoCTC.status === 'eligible' ? coloradoCTC.estimatedBenefit : 0) +
    (coloradoFATC.status === 'eligible' ? coloradoFATC.estimatedBenefit : 0) +
    (coloradoEITC.status === 'eligible' ? coloradoEITC.estimatedBenefit : 0) +
    (coloradoCareWorker.status === 'eligible' ? coloradoCareWorker.estimatedBenefit : 0) +
    (federalCTC.status === 'eligible' ? federalCTC.estimatedBenefit : 0) +
    (federalEITC.status === 'eligible' ? federalEITC.estimatedBenefit : 0);
  
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