export type FilingOutcome =
  | 'in_person_good_fit'
  | 'in_person_still_suited'
  | 'online_with_support'
  | 'optimized_diy'
  | 'online_and_other';

export type QuizAnswers = {
  computerComfort: number; // 1-5
  taxComfort: number; // 1-5
  lifeEvents: {
    birthOrAdoption: boolean;
    married: boolean;
    divorced: boolean;
    spouseDeath: boolean;
  };
  caresForOtherChildren: boolean;
  received1099: boolean;
  taxIdType: 'ssn' | 'itin';
  filingYear: '2025_only' | 'multiple_years';
  needsNonEnglishSpanishHelp: boolean;
};

const INCOME_THRESHOLD_LOW = 69000;
const INCOME_THRESHOLD_HIGH = 89000;

/**
 * Count qualifying factors that indicate complexity or need for support
 */
function countQualifyingFactors(answers: QuizAnswers): number {
  let count = 0;

  // Computer comfort = 1 (least comfortable)
  if (answers.computerComfort === 1) count++;

  // Tax comfort = 1 (least comfortable)
  if (answers.taxComfort === 1) count++;

  // Any life-changing event
  if (
    answers.lifeEvents.birthOrAdoption ||
    answers.lifeEvents.married ||
    answers.lifeEvents.divorced ||
    answers.lifeEvents.spouseDeath
  ) {
    count++;
  }

  // Cares for non-own children (child care providers)
  if (answers.caresForOtherChildren) count++;

  // Received 1099 (gig workers, FFN providers)
  if (answers.received1099) count++;

  // Filing with ITIN
  if (answers.taxIdType === 'itin') count++;

  // Filing for multiple years
  if (answers.filingYear === 'multiple_years') count++;

  return count;
}

/**
 * Determine the best filing outcome based on quiz answers and income
 */
export function determineFilingOutcome(answers: QuizAnswers, yearlyIncome: number): FilingOutcome {
  const qualifyingFactors = countQualifyingFactors(answers);
  const hasAtLeastTwoFactors = qualifyingFactors >= 2;
  const speaksEnglishOrSpanish = !answers.needsNonEnglishSpanishHelp;
  const hasLowComputerComfort = answers.computerComfort === 1;
  const hasLowTaxComfort = answers.taxComfort === 1;
  const hasModerateComputerComfort = answers.computerComfort >= 2;

  // Priority 1: Non-English/Spanish speaker with income < $69k → still suited for in-person
  if (yearlyIncome < INCOME_THRESHOLD_LOW && !speaksEnglishOrSpanish) {
    return 'in_person_still_suited';
  }

  // Priority 2: Low computer OR tax comfort with income < $69k and 2+ factors → good fit for in-person
  if (
    yearlyIncome < INCOME_THRESHOLD_LOW &&
    hasAtLeastTwoFactors &&
    (hasLowComputerComfort || hasLowTaxComfort)
  ) {
    return 'in_person_good_fit';
  }

  // Priority 3: Moderate computer comfort, income < $69k, 2+ factors, English/Spanish → online with support
  if (
    yearlyIncome < INCOME_THRESHOLD_LOW &&
    hasModerateComputerComfort &&
    hasAtLeastTwoFactors &&
    speaksEnglishOrSpanish
  ) {
    return 'online_with_support';
  }

  // Priority 4: Moderate computer comfort, income < $89k, 2+ factors, English/Spanish → optimized DIY
  if (
    yearlyIncome < INCOME_THRESHOLD_HIGH &&
    hasModerateComputerComfort &&
    hasAtLeastTwoFactors &&
    speaksEnglishOrSpanish
  ) {
    return 'optimized_diy';
  }

  // Default: Online filing and other options
  return 'online_and_other';
}

/**
 * Create default/initial quiz answers
 */
export function createDefaultAnswers(): QuizAnswers {
  return {
    computerComfort: 3,
    taxComfort: 3,
    lifeEvents: {
      birthOrAdoption: false,
      married: false,
      divorced: false,
      spouseDeath: false,
    },
    caresForOtherChildren: false,
    received1099: false,
    taxIdType: 'ssn',
    filingYear: '2025_only',
    needsNonEnglishSpanishHelp: false,
  };
}
