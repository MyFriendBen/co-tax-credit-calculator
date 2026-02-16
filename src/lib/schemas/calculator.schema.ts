import * as z from 'zod';

export const incomeSchema = z.object({
  id: z.string(),
  frequency: z.enum(['weekly', 'biweekly', 'semimonthly', 'monthly', 'hourly', '']),
  amount: z.string(),
  hours: z.string(),
});

export const calculatorFormSchema = z.object({
  isMarried: z.boolean(),
  children0To5: z.string().refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 0;
  }, 'Must be a valid number'),
  children6To16: z.string().refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 0;
  }, 'Must be a valid number'),
  hasIncome: z.boolean(),
  incomes: z.array(incomeSchema),
  headIsCareWorker: z.boolean(),
  spouseIsCareWorker: z.boolean(),
}).refine((data) => {
  // Validate household size
  const householdSize = (parseInt(data.children0To5) || 0) +
                        (parseInt(data.children6To16) || 0) +
                        (data.isMarried ? 2 : 1);
  return householdSize <= 8;
}, {
  message: 'The max household size is 8',
  path: ['children0To5'],
});

export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;
