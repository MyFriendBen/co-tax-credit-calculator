import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { QuestionLayout } from '@/components/ui/QuestionLayout';

interface CareWorkerQuestionProps {
  value: boolean;
  onChange: (value: boolean) => void;
  isSpouse?: boolean;
}

export const CareWorkerQuestion = memo(function CareWorkerQuestion({
  value,
  onChange,
  isSpouse = false,
}: CareWorkerQuestionProps) {
  const { t } = useTranslation();

  const title = isSpouse
    ? t('questions.spouseCareWorker.title')
    : t('questions.careWorker.title');

  const description = isSpouse
    ? t('questions.spouseCareWorker.description')
    : t('questions.careWorker.description');

  return (
    <QuestionLayout
      title={title}
      description={description}
    >
      <div className="space-y-3">
        <RadioGroup
          value={value ? 'yes' : 'no'}
          onValueChange={(val) => onChange(val === 'yes')}
        >
          <Label
            htmlFor={`${isSpouse ? 'spouse-' : ''}careworker-yes`}
            className="cursor-pointer block w-full"
          >
            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
              <RadioGroupItem
                value="yes"
                id={`${isSpouse ? 'spouse-' : ''}careworker-yes`}
              />
              <span className="flex-1">{isSpouse ? t('questions.spouseCareWorker.yes') : t('questions.careWorker.yes')}</span>
            </div>
          </Label>
          <Label
            htmlFor={`${isSpouse ? 'spouse-' : ''}careworker-no`}
            className="cursor-pointer block w-full"
          >
            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
              <RadioGroupItem
                value="no"
                id={`${isSpouse ? 'spouse-' : ''}careworker-no`}
              />
              <span className="flex-1">{isSpouse ? t('questions.spouseCareWorker.no') : t('questions.careWorker.no')}</span>
            </div>
          </Label>
        </RadioGroup>
      </div>
    </QuestionLayout>
  );
});
