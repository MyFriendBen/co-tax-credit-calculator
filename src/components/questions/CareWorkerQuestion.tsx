import { memo } from 'react';
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
  const title = isSpouse
    ? 'Does your spouse regularly care for kids under 6 years old other than your own?'
    : 'Do you regularly care for kids under 6 years old other than your own?';

  return (
    <QuestionLayout
      title={title}
      description={
        <>
          Care workers include <strong>family, friends and neighbors</strong> who regularly care for kids under 6 years old (about 14 hours per week) in addition to licensed childcare providers, home health aides, personal care aides, and nursing assistants.
        </>
      }
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
              <span className="flex-1">Yes</span>
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
              <span className="flex-1">No</span>
            </div>
          </Label>
        </RadioGroup>
      </div>
    </QuestionLayout>
  );
});
