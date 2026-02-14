import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { QuestionLayout } from '@/components/ui/QuestionLayout';
import { IncomeInput } from './IncomeInput';
import type { Income } from '@/types/calculator.types';

interface IncomeDetailsQuestionProps {
  incomes: Income[];
  onAddIncome: () => void;
  onRemoveIncome: (id: string) => void;
  onUpdateIncome: (id: string, field: keyof Income, value: string) => void;
}

export const IncomeDetailsQuestion = memo(function IncomeDetailsQuestion({
  incomes,
  onAddIncome,
  onRemoveIncome,
  onUpdateIncome,
}: IncomeDetailsQuestionProps) {
  return (
    <QuestionLayout
      title="Tell us about your income"
      description="We'll ask about each income source separately. You can add multiple incomes if you have more than one job."
    >
      <div className="space-y-6">
        {incomes.map((income, index) => (
          <IncomeInput
            key={income.id}
            income={income}
            index={index}
            showRemove={incomes.length > 1}
            onUpdate={(field, value) => onUpdateIncome(income.id, field, value)}
            onRemove={() => onRemoveIncome(income.id)}
          />
        ))}

        {/* Add Income Button */}
        <Button
          type="button"
          variant="outline"
          onClick={onAddIncome}
          className="w-full border-[#304e5d] text-[#304e5d] hover:bg-[#304e5d]/10"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Income
        </Button>
      </div>
    </QuestionLayout>
  );
});
