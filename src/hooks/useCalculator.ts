import { useState, useEffect, useCallback, useMemo } from 'react';
import type { QuestionKey } from '@/types/calculator.types';
import type { CalculatorFormData } from '@/lib/schemas/calculator.schema';
import { calculateAllCredits, type FilingStatus } from '@/utils/taxCalculator';
import { calculateTotalAnnualIncome } from '@/lib/utils/calculations';
import type { TaxCreditResults } from '@/utils/taxCalculator';

const INITIAL_FORM_DATA: CalculatorFormData = {
  isMarried: false,
  children0To5: '0',
  children6To16: '0',
  hasIncome: false,
  incomes: [],
  headIsCareWorker: false,
  spouseIsCareWorker: false,
};

/**
 * Main calculator hook managing wizard flow and form state
 */
export function useCalculator() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionKey>('married');
  const [questionHistory, setQuestionHistory] = useState<QuestionKey[]>([]);
  const [formData, setFormData] = useState<CalculatorFormData>(INITIAL_FORM_DATA);
  const [result, setResult] = useState<TaxCreditResults | null>(null);

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

  // Reset spouse care worker when not married
  useEffect(() => {
    if (!formData.isMarried && formData.spouseIsCareWorker) {
      setFormData(prev => ({ ...prev, spouseIsCareWorker: false }));
    }
  }, [formData.isMarried, formData.spouseIsCareWorker]);

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
    const allQuestionsUpdated = allQuestions;
    const currentIdx = allQuestionsUpdated.indexOf(currentQuestion);
    const nextIndex = currentIdx + 1;

    if (nextIndex < allQuestionsUpdated.length) {
      setQuestionHistory(prev => [...prev, currentQuestion]);
      setCurrentQuestion(allQuestionsUpdated[nextIndex]);
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
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Calculate results
  const handleCalculate = useCallback(() => {
    const annualIncome = formData.hasIncome ? calculateTotalAnnualIncome(formData.incomes) : 0;

    // Create child array with ages based on ranges
    const childAges: number[] = [
      ...Array(parseInt(formData.children0To5) || 0).fill(4),
      ...Array(parseInt(formData.children6To16) || 0).fill(10),
    ];

    const filingStatus: FilingStatus = formData.isMarried ? 'married-joint' : 'single';

    const calculationResult = calculateAllCredits({
      filingStatus,
      coloradoResident: 'full-year',
      hasEarnedIncome: formData.hasIncome,
      annualIncome,
      children: childAges.map(age => ({
        age,
        livesWithYou: 'yes',
        relationship: 'biological',
        hasValidID: 'yes',
      })),
      hasChildCareExpenses: false,
      childCareExpenses: 0,
      isCareWorker: formData.headIsCareWorker || formData.spouseIsCareWorker,
      careWorkerType: (formData.headIsCareWorker || formData.spouseIsCareWorker) ? 'childcare' : 'none',
      careWorkerHours: (formData.headIsCareWorker || formData.spouseIsCareWorker) ? 728 : 0,
    });

    setResult(calculationResult);
  }, [formData]);

  // Reset everything
  const handleStartOver = useCallback(() => {
    setCurrentQuestion('married');
    setQuestionHistory([]);
    setResult(null);
    setFormData(INITIAL_FORM_DATA);
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

    // Actions
    updateFormData,
    goToNextQuestion,
    goToPreviousQuestion,
    handleCalculate,
    handleStartOver,
    handleStart,
  };
}
