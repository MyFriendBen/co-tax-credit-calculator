import type { TaxCredit, TaxCreditId } from '@/services/mfbApi';
import type { TaxCreditResults, CreditResult } from '@/utils/taxCalculator';
import type { CalculatorFormData } from '@/lib/schemas/calculator.schema';

type TranslationFunction = (key: string) => string;

/**
 * Maps API tax credit results to the UI format
 */
export function mapApiResultsToTaxCreditResults(
  apiResults: TaxCredit[],
  formData: CalculatorFormData,
  t: TranslationFunction
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
      reasons: [],
    };
  };

  // Map each credit
  const coloradoCTC = createCreditResult(
    'co_tax_credit_coctc',
    'Colorado Child Tax Credit',
    t('results.explanations.coloradoCTC.eligible'),
    t('results.explanations.coloradoCTC.ineligible')
  );

  const coloradoFATC = createCreditResult(
    'co_tax_credit_fatc',
    'Colorado Family Affordability Tax Credit',
    t('results.explanations.coloradoFATC.eligible'),
    t('results.explanations.coloradoFATC.ineligible')
  );

  const coloradoEITC = createCreditResult(
    'co_tax_credit_coeitc',
    'Colorado Earned Income Tax Credit',
    t('results.explanations.coloradoEITC.eligible'),
    t('results.explanations.coloradoEITC.ineligible')
  );

  const coloradoCareWorker = createCreditResult(
    'co_tax_credit_care_worker',
    'Colorado Care Worker Tax Credit',
    t('results.explanations.coloradoCareWorker.eligible'),
    t('results.explanations.coloradoCareWorker.ineligible')
  );

  const federalCTC = createCreditResult(
    'co_tax_credit_ctc',
    'Federal Child Tax Credit',
    t('results.explanations.federalCTC.eligible'),
    t('results.explanations.federalCTC.ineligible')
  );

  const federalEITC = createCreditResult(
    'co_tax_credit_eitc',
    'Federal Earned Income Tax Credit',
    t('results.explanations.federalEITC.eligible'),
    t('results.explanations.federalEITC.ineligible')
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
