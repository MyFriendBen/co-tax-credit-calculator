import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { QuestionLayout } from '@/components/ui/QuestionLayout';

interface MarriedQuestionProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export const MarriedQuestion = memo(function MarriedQuestion({
  value,
  onChange,
}: MarriedQuestionProps) {
  const { t } = useTranslation();

  return (
    <QuestionLayout
      title={t('questions.married.title')}
    >
      <div className="space-y-3">
        <RadioGroup
          value={value ? 'married' : 'single'}
          onValueChange={(val) => onChange(val === 'married')}
        >
          <Label htmlFor="single" className="cursor-pointer block w-full">
            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
              <RadioGroupItem value="single" id="single" />
              <span className="flex-1">{t('questions.married.single')}</span>
            </div>
          </Label>
          <Label htmlFor="married" className="cursor-pointer block w-full">
            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
              <RadioGroupItem value="married" id="married" />
              <span className="flex-1">{t('questions.married.married')}</span>
            </div>
          </Label>
        </RadioGroup>
      </div>
    </QuestionLayout>
  );
});
