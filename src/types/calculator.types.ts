export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'hourly';

export type QuestionKey =
  | 'married'
  | 'children-0-5'
  | 'children-6-16'
  | 'has-income'
  | 'income-details'
  | 'care-worker'
  | 'spouse-care-worker'
  | 'review';

export interface Income {
  id: string;
  frequency: PayFrequency | '';
  amount: string;
  hours: string;
}

export interface CalculatorFormData {
  isMarried: boolean;
  children0To5: string;
  children6To16: string;
  hasIncome: boolean;
  incomes: Income[];
  headIsCareWorker: boolean;
  spouseIsCareWorker: boolean;
}

export interface QuestionConfig {
  key: QuestionKey;
  title: string;
  description: string;
}

export interface CalculatorState {
  currentQuestion: QuestionKey;
  questionHistory: QuestionKey[];
  showWelcome: boolean;
  formData: CalculatorFormData;
}
