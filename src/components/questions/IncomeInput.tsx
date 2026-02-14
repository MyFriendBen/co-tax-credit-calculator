import { memo } from 'react';
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
  return (
    <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#304e5d]">
          Income {index + 1}
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
            Remove
          </Button>
        )}
      </div>

      {/* Frequency */}
      <div className="space-y-2">
        <Label className="text-base">How often are you paid this income?</Label>
        <Select
          value={income.frequency}
          onValueChange={(value) => onUpdate('frequency', value)}
        >
          <SelectTrigger className="bg-input-background border-gray-300 h-14 text-lg">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="biweekly">2 Weeks</SelectItem>
            <SelectItem value="semi-monthly">Twice a Month</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="hourly">Hourly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label className="text-base">
          {income.frequency === 'hourly'
            ? 'What is your hourly rate?'
            : 'How much do you receive before taxes each pay period for this income?'}
        </Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={income.amount}
            onChange={(e) => onUpdate('amount', e.target.value)}
            className="pl-10 bg-input-background border-gray-300 h-14 text-lg"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Hours (only for hourly) */}
      {income.frequency === 'hourly' && (
        <div className="space-y-2">
          <Label className="text-base">How many hours per week do you work?</Label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={income.hours}
            onChange={(e) => onUpdate('hours', e.target.value)}
            className="bg-input-background border-gray-300 h-14 text-lg"
            placeholder="40"
          />
        </div>
      )}
    </div>
  );
});
