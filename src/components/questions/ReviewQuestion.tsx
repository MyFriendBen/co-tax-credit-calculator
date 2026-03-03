import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { QuestionLayout } from '@/components/ui/QuestionLayout';
import type { CalculatorFormData } from '@/lib/schemas/calculator.schema';
import { calculateTotalAnnualIncome } from '@/lib/utils/calculations';

interface ReviewQuestionProps {
  formData: CalculatorFormData;
}

export const ReviewQuestion = memo(function ReviewQuestion({ formData }: ReviewQuestionProps) {
  const { t, i18n } = useTranslation();
  const annualIncome = formData.hasIncome ? calculateTotalAnnualIncome(formData.incomes) : 0;
  const formattedIncome = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(annualIncome);

  return (
    <QuestionLayout
      title={t('questions.review.title')}
      description={t('questions.review.description')}
    >
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-start">
          <span className="text-gray-600">{t('questions.review.filingStatus')}</span>
          <span className="text-right">
            {formData.isMarried ? t('questions.married.married') : t('questions.married.single')}
          </span>
        </div>

        <div className="flex justify-between items-start border-t border-gray-200 pt-4">
          <span className="text-gray-600">{t('questions.review.childrenUnder6')}</span>
          <span>{formData.children0To5}</span>
        </div>

        <div className="flex justify-between items-start border-t border-gray-200 pt-4">
          <span className="text-gray-600">{t('questions.review.children6To16')}</span>
          <span>{formData.children6To16}</span>
        </div>

        {formData.hasIncome && formData.incomes.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-600">{t('questions.review.incomeSources')}</span>
              <span>{formData.incomes.length}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-600 text-sm">{t('questions.review.estimatedYearlyIncome')}</span>
              <span className="font-medium">
                {formattedIncome}
              </span>
            </div>
          </div>
        )}

        {(formData.headIsCareWorker || formData.spouseIsCareWorker) && (
          <div className="flex justify-between items-start border-t border-gray-200 pt-4">
            <span className="text-gray-600">{t('questions.review.careWorker')}</span>
            <span>
              {formData.headIsCareWorker && formData.spouseIsCareWorker
                ? t('questions.review.careWorkerBoth')
                : formData.headIsCareWorker
                ? t('questions.review.careWorkerYou')
                : t('questions.review.careWorkerSpouse')}
            </span>
          </div>
        )}
      </div>
    </QuestionLayout>
  );
});
