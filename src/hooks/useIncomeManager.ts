import { useCallback } from 'react';
import type { Income } from '@/types/calculator.types';
import { generateIncomeId } from '@/lib/utils/calculations';

interface UseIncomeManagerProps {
  incomes: Income[];
  onChange: (incomes: Income[]) => void;
}

/**
 * Custom hook for managing income entries
 * Handles adding, removing, and updating income sources
 */
export function useIncomeManager({ incomes, onChange }: UseIncomeManagerProps) {
  const addIncome = useCallback(() => {
    const newIncome: Income = {
      id: generateIncomeId(),
      frequency: '',
      amount: '',
      hours: '',
    };
    onChange([...incomes, newIncome]);
  }, [incomes, onChange]);

  const removeIncome = useCallback((id: string) => {
    onChange(incomes.filter(income => income.id !== id));
  }, [incomes, onChange]);

  const updateIncome = useCallback((id: string, field: keyof Income, value: string) => {
    onChange(
      incomes.map(income =>
        income.id === id ? { ...income, [field]: value } : income
      )
    );
  }, [incomes, onChange]);

  return {
    addIncome,
    removeIncome,
    updateIncome,
  };
}
