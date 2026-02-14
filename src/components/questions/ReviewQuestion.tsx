import { memo } from 'react';
import { QuestionLayout } from '@/components/ui/QuestionLayout';
import type { CalculatorFormData } from '@/lib/schemas/calculator.schema';
import { calculateTotalAnnualIncome } from '@/lib/utils/calculations';

interface ReviewQuestionProps {
  formData: CalculatorFormData;
}

export const ReviewQuestion = memo(function ReviewQuestion({ formData }: ReviewQuestionProps) {
  const annualIncome = formData.hasIncome ? calculateTotalAnnualIncome(formData.incomes) : 0;

  return (
    <QuestionLayout
      title="Let's review what you told us"
      description="Take a quick look to make sure everything looks right. You can always go back and change something!"
    >
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-start">
          <span className="text-gray-600">Filing status:</span>
          <span className="text-right">
            {formData.isMarried ? 'With a Spouse' : 'Single'}
          </span>
        </div>

        <div className="flex justify-between items-start border-t border-gray-200 pt-4">
          <span className="text-gray-600">Children under 6:</span>
          <span>{formData.children0To5}</span>
        </div>

        <div className="flex justify-between items-start border-t border-gray-200 pt-4">
          <span className="text-gray-600">Children 6-16:</span>
          <span>{formData.children6To16}</span>
        </div>

        {formData.hasIncome && formData.incomes.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-600">Income sources:</span>
              <span>{formData.incomes.length}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-600 text-sm">Estimated yearly income:</span>
              <span className="font-medium">
                ${annualIncome.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {(formData.headIsCareWorker || formData.spouseIsCareWorker) && (
          <div className="flex justify-between items-start border-t border-gray-200 pt-4">
            <span className="text-gray-600">Care worker:</span>
            <span>
              {formData.headIsCareWorker && formData.spouseIsCareWorker
                ? 'You and your spouse'
                : formData.headIsCareWorker
                ? 'You'
                : 'Your spouse'}
            </span>
          </div>
        )}
      </div>
    </QuestionLayout>
  );
});
