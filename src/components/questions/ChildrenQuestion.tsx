import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { QuestionLayout } from '@/components/ui/QuestionLayout';

interface ChildrenQuestionProps {
  type: '0-5' | '6-16';
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const ChildrenQuestion = memo(function ChildrenQuestion({
  type,
  value,
  onChange,
  error,
}: ChildrenQuestionProps) {
  const { t } = useTranslation();

  const title = type === '0-5' ? t('questions.children0To5.title') : t('questions.children6To16.title');
  const description = type === '0-5' ? t('questions.children0To5.description') : t('questions.children6To16.description');

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text on focus (if value is "0", it will be selected and replaced on type)
    e.target.select();
  };

  return (
    <QuestionLayout title={title} description={description}>
      <div>
        <Input
          type="number"
          min="0"
          max="20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
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
