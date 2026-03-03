import type { Income, PayFrequency } from '@/types/calculator.types';

/**
 * Calculate total annual income from all income sources
 */
export function calculateTotalAnnualIncome(incomes: Income[]): number {
  return incomes.reduce((total, income) => {
    const amount = parseFloat(income.amount) || 0;
    const hours = parseFloat(income.hours) || 0;

    if (!income.frequency || amount === 0) return total;

    let annualAmount = 0;
    if (income.frequency === 'hourly') {
      // hourly rate * hours per week * 52 weeks
      annualAmount = amount * hours * 52;
    } else {
      // Calculate annual income based on frequency
      const multipliers: Record<Exclude<PayFrequency, 'hourly'>, number> = {
        'weekly': 52,
        'biweekly': 26,
        'semimonthly': 24,
        'monthly': 12,
      };

      annualAmount = amount * (multipliers[income.frequency as Exclude<PayFrequency, 'hourly'>] || 12);
    }

    return total + annualAmount;
  }, 0);
}

/**
 * Calculate household size for validation
 */
export function calculateHouseholdSize(
  children0To5: string,
  children6To16: string,
  isMarried: boolean
): number {
  return (parseInt(children0To5) || 0) +
         (parseInt(children6To16) || 0) +
         (isMarried ? 2 : 1);
}

/**
 * Check if all income sources are valid
 */
export function validateIncomes(incomes: Income[]): boolean {
  return incomes.every(income => {
    if (!income.frequency || !income.amount) return false;
    if (income.frequency === 'hourly' && !income.hours) return false;
    return true;
  });
}

/**
 * Generate unique ID for income entries
 */
export function generateIncomeId(): string {
  return crypto.randomUUID();
}
