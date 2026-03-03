import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { QuestionLayout } from '@/components/ui/QuestionLayout';

interface HasIncomeQuestionProps {
  value: boolean;
  onChange: (value: boolean) => void;
  isMarried: boolean;
}

export const HasIncomeQuestion = memo(function HasIncomeQuestion({
  value,
  onChange,
  isMarried,
}: HasIncomeQuestionProps) {
  const { t } = useTranslation();

  const title = isMarried
    ? t('questions.hasIncome.titleWithSpouse')
    : t('questions.hasIncome.title');

  return (
    <QuestionLayout
      title={title}
      description={t('questions.hasIncome.description')}
    >
      <div className="space-y-3">
        <RadioGroup
          value={value ? 'yes' : 'no'}
          onValueChange={(val) => onChange(val === 'yes')}
        >
          <Label htmlFor="income-yes" className="cursor-pointer block w-full">
            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
              <RadioGroupItem value="yes" id="income-yes" />
              <span className="flex-1">{t('questions.hasIncome.yes')}</span>
            </div>
          </Label>
          <Label htmlFor="income-no" className="cursor-pointer block w-full">
            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
              <RadioGroupItem value="no" id="income-no" />
              <span className="flex-1">{t('questions.hasIncome.no')}</span>
            </div>
          </Label>
        </RadioGroup>
      </div>
    </QuestionLayout>
  );
});
