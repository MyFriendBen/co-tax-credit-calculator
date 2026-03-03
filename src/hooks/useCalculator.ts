import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuestionKey } from '@/types/calculator.types';
import type { CalculatorFormData } from '@/lib/schemas/calculator.schema';
import { mfbApi, type TaxCredit } from '@/services/mfbApi';
import { mapApiResultsToTaxCreditResults } from '@/lib/utils/apiMapper';
import type { TaxCreditResults } from '@/utils/taxCalculator';

const INITIAL_FORM_DATA: CalculatorFormData = {
  isMarried: false,
  children0To5: '0',
  children6To16: '0',
  hasIncome: true,
  incomes: [],
  headIsCareWorker: false,
  spouseIsCareWorker: false,
};

/**
 * Main calculator hook managing wizard flow and form state with API integration
 */
export function useCalculator() {
  const { t } = useTranslation();
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionKey>('married');
  const [questionHistory, setQuestionHistory] = useState<QuestionKey[]>([]);
  const [formData, setFormData] = useState<CalculatorFormData>(INITIAL_FORM_DATA);
  const [result, setResult] = useState<TaxCreditResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-add first income when hasIncome becomes true
  useEffect(() => {
    if (formData.hasIncome && formData.incomes.length === 0) {
      setFormData(prev => ({
        ...prev,
        incomes: [{
          id: crypto.randomUUID(),
          frequency: '',
          amount: '',
          hours: '',
        }],
      }));
    }
  }, [formData.hasIncome, formData.incomes.length]);


  // Calculate all possible questions based on current form state
  const allQuestions = useMemo((): QuestionKey[] => {
    const questions: QuestionKey[] = [
      'married',
      'children-0-5',
      'children-6-16',
      'has-income',
    ];

    if (formData.hasIncome && formData.incomes.length > 0) {
      questions.push('income-details');
    }

    questions.push('care-worker');

    if (formData.isMarried) {
      questions.push('spouse-care-worker');
    }

    questions.push('review');

    return questions;
  }, [formData.hasIncome, formData.incomes.length, formData.isMarried]);

  // Calculate progress
  const currentIndex = allQuestions.indexOf(currentQuestion);
  const progress = ((currentIndex + 1) / allQuestions.length) * 100;

  // Navigation handlers
  const goToNextQuestion = useCallback(() => {
    const currentIdx = allQuestions.indexOf(currentQuestion);
    const nextIndex = currentIdx + 1;

    if (nextIndex < allQuestions.length) {
      setQuestionHistory(prev => [...prev, currentQuestion]);
      setCurrentQuestion(allQuestions[nextIndex]);
    }
  }, [allQuestions, currentQuestion]);

  const goToPreviousQuestion = useCallback(() => {
    if (questionHistory.length > 0) {
      const previous = questionHistory[questionHistory.length - 1];
      setQuestionHistory(prev => prev.slice(0, -1));
      setCurrentQuestion(previous);
      setResult(null);
    }
  }, [questionHistory]);

  // Form data update handler
  const updateFormData = useCallback((updates: Partial<CalculatorFormData>) => {
    setFormData(prev => {
      const next = { ...prev, ...updates };
      if (!next.isMarried) next.spouseIsCareWorker = false;
      if (updates.hasIncome === false) next.incomes = [];
      return next;
    });
  }, []);

  // Calculate results via API
  const handleCalculate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create/update screen with household data
      await mfbApi.updateScreen(formData);

      // Step 2: Get tax credit results
      const apiResults = await mfbApi.getResults();

      // Step 3: Map API results to our format
      const mappedResults = mapApiResultsToTaxCreditResults(apiResults, formData, t);

      setResult(mappedResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error calculating tax credits:', err);
    } finally {
      setIsLoading(false);
    }
  }, [formData, t]);

  // Reset everything
  const handleStartOver = useCallback(() => {
    setCurrentQuestion('married');
    setQuestionHistory([]);
    setResult(null);
    setError(null);
    setFormData(INITIAL_FORM_DATA);
    mfbApi.reset(); // Reset API state
  }, []);

  // Start calculator (hide welcome)
  const handleStart = useCallback(() => {
    setShowWelcome(false);
  }, []);

  return {
    // State
    showWelcome,
    currentQuestion,
    questionHistory,
    formData,
    result,
    allQuestions,
    currentIndex,
    progress,
    isLoading,
    error,

    // Actions
    updateFormData,
    goToNextQuestion,
    goToPreviousQuestion,
    handleCalculate,
    handleStartOver,
    handleStart,
  };
}
