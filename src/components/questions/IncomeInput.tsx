import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import type { Income } from '@/types/calculator.types';

interface IncomeInputProps {
  income: Income;
  index: number;
  showRemove: boolean;
  onUpdate: (field: keyof Income, value: string) => void;
  onRemove: () => void;
}

export const IncomeInput = memo(function IncomeInput({
  income,
  index,
  showRemove,
  onUpdate,
  onRemove,
}: IncomeInputProps) {
  const { t } = useTranslation();

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text on focus for easy replacement
    e.target.select();
  };

  return (
    <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#304e5d]">
          {t('questions.incomeDetails.incomeLabel')} {index + 1}
        </h3>
        {showRemove && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('questions.incomeDetails.remove')}
          </Button>
        )}
      </div>

      {/* Frequency */}
      <div className="space-y-2">
        <Label className="text-base">{t('questions.incomeDetails.frequencyLabel')}</Label>
        <Select
          value={income.frequency}
          onValueChange={(value) => onUpdate('frequency', value)}
        >
          <SelectTrigger className="bg-input-background border-gray-300 h-14 text-lg">
            <SelectValue placeholder={t('questions.incomeDetails.placeholders.selectFrequency')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">{t('questions.incomeDetails.frequencies.weekly')}</SelectItem>
            <SelectItem value="biweekly">{t('questions.incomeDetails.frequencies.biweekly')}</SelectItem>
            <SelectItem value="semimonthly">{t('questions.incomeDetails.frequencies.semimonthly')}</SelectItem>
            <SelectItem value="monthly">{t('questions.incomeDetails.frequencies.monthly')}</SelectItem>
            <SelectItem value="hourly">{t('questions.incomeDetails.frequencies.hourly')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label className="text-base">
          {income.frequency === 'hourly'
            ? t('questions.incomeDetails.hourlyRateLabel')
            : t('questions.incomeDetails.amountLabel')}
        </Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={income.amount}
            onChange={(e) => onUpdate('amount', e.target.value)}
            onFocus={handleFocus}
            className="pl-10 bg-input-background border-gray-300 h-14 text-lg"
            placeholder={t('questions.incomeDetails.placeholders.amount')}
          />
        </div>
      </div>

      {/* Hours (only for hourly) */}
      {income.frequency === 'hourly' && (
        <div className="space-y-2">
          <Label className="text-base">{t('questions.incomeDetails.hoursLabel')}</Label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={income.hours}
            onChange={(e) => onUpdate('hours', e.target.value)}
            onFocus={handleFocus}
            className="bg-input-background border-gray-300 h-14 text-lg"
            placeholder={t('questions.incomeDetails.placeholders.hours')}
          />
        </div>
      )}
    </div>
  );
});
