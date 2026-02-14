import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { QuestionLayout } from '@/components/ui/QuestionLayout';

interface ChildrenQuestionProps {
  type: '0-5' | '6-16';
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const QUESTION_CONFIG = {
  '0-5': {
    title: 'How many children under age 6 did you have at the end of 2025?',
    description: 'Count kids who are 5 years old or younger as of December 31, 2025.',
  },
  '6-16': {
    title: 'How many children between the ages of 6 and 16 did you have at the end of 2025?',
    description: 'Count kids who are 6 to 16 years old as of December 31, 2025.',
  },
};

export const ChildrenQuestion = memo(function ChildrenQuestion({
  type,
  value,
  onChange,
  error,
}: ChildrenQuestionProps) {
  const config = QUESTION_CONFIG[type];

  return (
    <QuestionLayout title={config.title} description={config.description}>
      <div>
        <Input
          type="number"
          min="0"
          max="20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-input-background border-gray-300 h-16 text-xl"
          placeholder="0"
        />
        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </div>
    </QuestionLayout>
  );
});
