import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { ArrowLeft, ArrowRight, Download, Printer, Check, Plus, AlertCircle, HelpCircle, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { calculateAllCredits, type FilingStatus, type PayFrequency, type ColoradoResidency, type ChildRelationship, calculateAnnualIncome } from '../utils/taxCalculator';
import { Progress } from './ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import type { TaxCreditResults } from '../utils/taxCalculator';

interface Income {
  id: string;
  frequency: PayFrequency | '';
  amount: string;
  hours: string; // only used when frequency is 'hourly'
}

type QuestionKey =
  | 'married'
  | 'children-0-5'
  | 'children-6-16'
  | 'has-income'
  | 'income-details'
  | 'care-worker'
  | 'spouse-care-worker'
  | 'review';

export function Calculator() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionKey>('married');
  const [questionHistory, setQuestionHistory] = useState<QuestionKey[]>([]);

  // Form data
  const [isMarried, setIsMarried] = useState(false);
  const [children0To5, setChildren0To5] = useState('0');
  const [children6To16, setChildren6To16] = useState('0');
  const [hasIncome, setHasIncome] = useState(false);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [headIsCareWorker, setHeadIsCareWorker] = useState(false);
  const [spouseIsCareWorker, setSpouseIsCareWorker] = useState(false);

  const [result, setResult] = useState<TaxCreditResults | null>(null);

  const MAX_HOUSEHOLD_SIZE = 8;

  // Calculate progress
  const getAllQuestions = (): QuestionKey[] => {
    const questions: QuestionKey[] = ['married', 'children-0-5', 'children-6-16', 'has-income'];

    if (hasIncome && incomes.length > 0) {
      questions.push('income-details');
    }

    questions.push('care-worker');

    if (isMarried) {
      questions.push('spouse-care-worker');
    }

    questions.push('review');

    return questions;
  };

  const allQuestions = getAllQuestions();
  const currentIndex = allQuestions.indexOf(currentQuestion);
  const progress = ((currentIndex + 1) / allQuestions.length) * 100;

  const goToNextQuestion = () => {
    const allQuestionsUpdated = getAllQuestions();
    const currentIdx = allQuestionsUpdated.indexOf(currentQuestion);
    const nextIndex = currentIdx + 1;
    
    if (nextIndex < allQuestionsUpdated.length) {
      setQuestionHistory([...questionHistory, currentQuestion]);
      setCurrentQuestion(allQuestionsUpdated[nextIndex] as QuestionKey);
    }
  };

  const goToPreviousQuestion = () => {
    if (questionHistory.length > 0) {
      const previous = questionHistory[questionHistory.length - 1];
      setQuestionHistory(questionHistory.slice(0, -1));
      setCurrentQuestion(previous);
      setResult(null);
    }
  };

  const addIncome = () => {
    setIncomes([...incomes, { id: crypto.randomUUID(), frequency: '', amount: '', hours: '' }]);
  };

  const removeIncome = (id: string) => {
    const updatedIncomes = incomes.filter(income => income.id !== id);
    setIncomes(updatedIncomes);
    if (updatedIncomes.length === 0) {
      setHasIncome(false);
    }
  };

  const updateIncome = (id: string, field: keyof Income, value: string) => {
    setIncomes(incomes.map(income =>
      income.id === id ? { ...income, [field]: value } : income
    ));
  };

  const calculateTotalAnnualIncome = (): number => {
    return incomes.reduce((total, income) => {
      const amount = parseFloat(income.amount) || 0;
      const hours = parseFloat(income.hours) || 0;

      if (!income.frequency || amount === 0) return total;

      let annualAmount = 0;
      if (income.frequency === 'hourly') {
        annualAmount = amount * hours * 52; // hourly rate * hours per week * 52 weeks
      } else {
        annualAmount = calculateAnnualIncome(income.frequency as PayFrequency, amount);
      }

      return total + annualAmount;
    }, 0);
  };

  const handleCalculate = () => {
    const annualIncome = hasIncome ? calculateTotalAnnualIncome() : 0;
    const totalChildren = (parseInt(children0To5) || 0) + (parseInt(children6To16) || 0);

    // Create child array with ages based on ranges
    const childAges: number[] = [
      ...Array(parseInt(children0To5) || 0).fill(4), // Use age 4 to represent 0-5 range
      ...Array(parseInt(children6To16) || 0).fill(10), // Use age 10 to represent 6-16 range
    ];

    // Determine filing status from married field
    const filingStatus: FilingStatus = isMarried ? 'married-joint' : 'single';

    const calculationResult = calculateAllCredits({
      filingStatus,
      coloradoResident: 'full-year', // Default to full-year for now
      hasEarnedIncome: hasIncome,
      annualIncome,
      children: childAges.map(age => ({
        age,
        livesWithYou: 'yes', // Assume yes for simplified flow
        relationship: 'biological', // Default relationship
        hasValidID: 'yes', // Assume yes for simplified flow
      })),
      hasChildCareExpenses: false, // Not asked in original
      childCareExpenses: 0,
      isCareWorker: headIsCareWorker || spouseIsCareWorker,
      careWorkerType: (headIsCareWorker || spouseIsCareWorker) ? 'childcare' : 'none',
      careWorkerHours: (headIsCareWorker || spouseIsCareWorker) ? 728 : 0, // 14 hours/week * 52 weeks
    });

    setResult(calculationResult);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!result) return;
    
    const eligibleCredits = [
      result.coloradoCTC.status === 'eligible' && `Colorado Child Tax Credit: Up to $${result.coloradoCTC.estimatedBenefit.toFixed(2)}`,
      result.coloradoFATC.status === 'eligible' && `Colorado Family Affordability Tax Credit: Up to $${result.coloradoFATC.estimatedBenefit.toFixed(2)}`,
      result.federalCTC.status === 'eligible' && `Federal Child Tax Credit: Up to $${result.federalCTC.estimatedBenefit.toFixed(2)}`,
      result.federalEITC.status === 'eligible' && `Federal Earned Income Tax Credit: Up to $${result.federalEITC.estimatedBenefit.toFixed(2)}`,
    ].filter(Boolean);
    
    const content = `
Colorado Tax Credit & Eligibility Estimator - Results
======================================================
Date: ${new Date().toLocaleDateString()}

YOUR INFORMATION
Filing Status: ${filingStatus}
Colorado Resident: ${coloradoResident}
Has Earned Income: ${hasEarnedIncome}
Number of Children: ${children.length}

ELIGIBLE CREDITS
${eligibleCredits.length > 0 ? eligibleCredits.join('\n') : 'No eligible credits based on your inputs.'}

TOTAL ESTIMATED BENEFIT
$${result.totalEstimatedBenefit.toFixed(2)}

Disclaimer: This is an estimate only — actual eligibility and amounts depend on final tax filing and documentation.
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'colorado-tax-credit-estimate.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStartOver = () => {
    setCurrentQuestion('married');
    setQuestionHistory([]);
    setResult(null);
    setIsMarried(false);
    setChildren0To5('0');
    setChildren6To16('0');
    setHasIncome(false);
    setIncomes([]);
    setHeadIsCareWorker(false);
    setSpouseIsCareWorker(false);
  };

  // Auto-add first income when hasIncome becomes true
  useEffect(() => {
    if (hasIncome && incomes.length === 0) {
      addIncome();
    }
  }, [hasIncome]);

  // Reset spouse care worker when not married
  useEffect(() => {
    if (!isMarried) {
      setSpouseIsCareWorker(false);
    }
  }, [isMarried]);

  const HelperTooltip = ({ content }: { content: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex ml-1 text-gray-400 hover:text-gray-600">
            <HelpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Calculate household size for validation
  const householdSize = (parseInt(children0To5) || 0) + (parseInt(children6To16) || 0) + (isMarried ? 2 : 1);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* Welcome Screen */}
        {showWelcome && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            
          >
            <Card className="max-w-[1200px] mx-auto border-0">
              <div className="space-y-6">
            
            
            <p className="text-gray-700 text-xl text-[16px] mt-[0px] mr-[0px] mb-[16px] ml-[0px] m-[0px]">
              Discover the tax credits you're eligible for by answering a few straightforward questions.
            </p>
            
            <Button
              onClick={() => setShowWelcome(false)}
              className="bg-[#304e5d] hover:bg-[#263d48] text-base mt-8 rounded-[0px] mx-[0px] my-[16px]"
            >
              Let's get started!
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <div className="bg-[rgba(167,203,201,0.42)] rounded-lg p-6 text-left space-y-4 mt-8">
              <h3 className="text-[#304e5d] font-oswald text-xl font-bold">Here's how this works:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#304e5d] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">We'll ask you simple questions about your family and income</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#304e5d] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">One question at a time — no confusing forms to fill out</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#304e5d] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">It takes about 5 minutes to complete</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#304e5d] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">You'll get an estimate of tax credits you could receive</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
          </motion.div>
        )}

        {/* Questions Section - wrapped with progress bar */}
        {!showWelcome && !result && (
          <motion.div
            key="questions-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut", delay: 0.2 }}
            className="space-y-6"
          >
            {/* Progress Bar */}
            <div className="">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Question {currentIndex + 1} of {allQuestions.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question Card with its own animation */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div>
                {/* Form Questions */}
                <Card className="bg-white max-w-[1200px] mx-auto border-0">
              <div className="space-y-6">
                
                {/* Question: Married */}
                {currentQuestion === 'married' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl text-left font-bold uppercase">Do you file taxes as single or jointly with a spouse?</h2>
                      <p className="text-gray-600 text-lg text-left">
                        This helps us understand which tax credits might work for you.
                      </p>
                    </div>

                    <div className="space-y-3 pt-4">
                      <RadioGroup value={isMarried ? 'married' : 'single'} onValueChange={(value) => setIsMarried(value === 'married')}>
                        <Label htmlFor="single" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="single" id="single" />
                            <span className="flex-1">Single</span>
                          </div>
                        </Label>
                        <Label htmlFor="married" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="married" id="married" />
                            <span className="flex-1">With a Spouse</span>
                          </div>
                        </Label>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Question: Children 0-5 */}
                {currentQuestion === 'children-0-5' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">How many children under age 6 did you have at the end of 2025?</h2>
                      <p className="text-gray-600 text-lg">
                        Count kids who are 5 years old or younger as of December 31, 2025.
                      </p>
                    </div>

                    <div className="pt-4">
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={children0To5}
                        onChange={(e) => setChildren0To5(e.target.value)}
                        className="bg-input-background border-gray-300 h-16 text-xl"
                        placeholder="0"
                      />
                      {householdSize > MAX_HOUSEHOLD_SIZE && (
                        <p className="text-sm text-red-600 mt-2">
                          The max household size is {MAX_HOUSEHOLD_SIZE}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Question: Children 6-16 */}
                {currentQuestion === 'children-6-16' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">How many children between the ages of 6 and 16 did you have at the end of 2025?</h2>
                      <p className="text-gray-600 text-lg">
                        Count kids who are 6 to 16 years old as of December 31, 2025.
                      </p>
                    </div>

                    <div className="pt-4">
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={children6To16}
                        onChange={(e) => setChildren6To16(e.target.value)}
                        className="bg-input-background border-gray-300 h-16 text-xl"
                        placeholder="0"
                      />
                      {householdSize > MAX_HOUSEHOLD_SIZE && (
                        <p className="text-sm text-red-600 mt-2">
                          The max household size is {MAX_HOUSEHOLD_SIZE}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Question: Has Income */}
                {currentQuestion === 'has-income' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">
                        {isMarried ? 'Do you or your spouse have an income?' : 'Do you have an income?'}
                      </h2>
                      <p className="text-gray-600 text-lg">
                        This includes wages from a job, self-employment, or gig work.
                      </p>
                    </div>

                    <div className="space-y-3 pt-4">
                      <RadioGroup value={hasIncome ? 'yes' : 'no'} onValueChange={(value) => setHasIncome(value === 'yes')}>
                        <Label htmlFor="income-yes" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="yes" id="income-yes" />
                            <span className="flex-1">Yes</span>
                          </div>
                        </Label>
                        <Label htmlFor="income-no" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="no" id="income-no" />
                            <span className="flex-1">No</span>
                          </div>
                        </Label>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Question: Income Details */}
                {currentQuestion === 'income-details' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl text-left font-bold uppercase">Tell us about your income</h2>
                      <p className="text-gray-600 text-lg text-left">
                        We'll ask about each income source separately. You can add multiple incomes if you have more than one job.
                      </p>
                    </div>

                    <div className="space-y-6 pt-4">
                      {incomes.map((income, index) => (
                        <div key={income.id} className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[#304e5d]">
                              Income {index + 1}
                            </h3>
                            {incomes.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeIncome(income.id)}
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
                              onValueChange={(value) => updateIncome(income.id, 'frequency', value)}
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
                                onChange={(e) => updateIncome(income.id, 'amount', e.target.value)}
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
                                onChange={(e) => updateIncome(income.id, 'hours', e.target.value)}
                                className="bg-input-background border-gray-300 h-14 text-lg"
                                placeholder="40"
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Income Button */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addIncome}
                        className="w-full border-[#304e5d] text-[#304e5d] hover:bg-[#304e5d]/10"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Income
                      </Button>
                    </div>
                  </div>
                )}

                {/* Question: Care Worker */}
                {currentQuestion === 'care-worker' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">Do you regularly care for kids under 6 years old other than your own?</h2>
                      <p className="text-gray-600 text-lg">
                        Care workers include <strong>family, friends and neighbors</strong> who regularly care for kids under 6 years old (about 14 hours per week) in addition to licensed childcare providers, home health aides, personal care aides, and nursing assistants.
                      </p>
                    </div>

                    <div className="space-y-3 pt-4">
                      <RadioGroup value={headIsCareWorker ? 'yes' : 'no'} onValueChange={(value) => setHeadIsCareWorker(value === 'yes')}>
                        <Label htmlFor="careworker-yes" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="yes" id="careworker-yes" />
                            <span className="flex-1">Yes</span>
                          </div>
                        </Label>
                        <Label htmlFor="careworker-no" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="no" id="careworker-no" />
                            <span className="flex-1">No</span>
                          </div>
                        </Label>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Question: Spouse Care Worker */}
                {currentQuestion === 'spouse-care-worker' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">Does your spouse regularly care for kids under 6 years old other than your own?</h2>
                      <p className="text-gray-600 text-lg">
                        Care workers include <strong>family, friends and neighbors</strong> who regularly care for kids under 6 years old (about 14 hours per week) in addition to licensed childcare providers, home health aides, personal care aides, and nursing assistants.
                      </p>
                    </div>

                    <div className="space-y-3 pt-4">
                      <RadioGroup value={spouseIsCareWorker ? 'yes' : 'no'} onValueChange={(value) => setSpouseIsCareWorker(value === 'yes')}>
                        <Label htmlFor="spouse-careworker-yes" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="yes" id="spouse-careworker-yes" />
                            <span className="flex-1">Yes</span>
                          </div>
                        </Label>
                        <Label htmlFor="spouse-careworker-no" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="no" id="spouse-careworker-no" />
                            <span className="flex-1">No</span>
                          </div>
                        </Label>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Review */}
                {currentQuestion === 'review' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">Let's review what you told us</h2>
                      <p className="text-gray-600 text-lg">
                        Take a quick look to make sure everything looks right. You can always go back and change something!
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6 space-y-4 mt-6">
                      <div className="flex justify-between items-start">
                        <span className="text-gray-600">Filing status:</span>
                        <span className="text-right">
                          {isMarried ? 'With a Spouse' : 'Single'}
                        </span>
                      </div>

                      <div className="flex justify-between items-start border-t border-gray-200 pt-4">
                        <span className="text-gray-600">Children under 6:</span>
                        <span>{children0To5}</span>
                      </div>

                      <div className="flex justify-between items-start border-t border-gray-200 pt-4">
                        <span className="text-gray-600">Children 6-16:</span>
                        <span>{children6To16}</span>
                      </div>

                      {hasIncome && incomes.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-600">Income sources:</span>
                            <span>{incomes.length}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-gray-600 text-sm">Estimated yearly income:</span>
                            <span className="font-medium">
                              ${calculateTotalAnnualIncome().toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}

                      {(headIsCareWorker || spouseIsCareWorker) && (
                        <div className="flex justify-between items-start border-t border-gray-200 pt-4">
                          <span className="text-gray-600">Care worker:</span>
                          <span>
                            {headIsCareWorker && spouseIsCareWorker ? 'You and your spouse' :
                             headIsCareWorker ? 'You' : 'Your spouse'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-4 pt-8 mt-auto">
                  {questionHistory.length > 0 && (
                    <Button
                      onClick={goToPreviousQuestion}
                      variant="outline"
                      className="px-6 text-base rounded-[0px]"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  )}
                  
                  {currentQuestion !== 'review' ? (
                    <Button
                      onClick={goToNextQuestion}
                      className="bg-[#304e5d] hover:bg-[#263d48] ml-auto text-base rounded-[0px] text-[16px] p-[24px] px-[48px] py-[24px]"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCalculate}
                      className="px-8 bg-[#304e5d] hover:bg-[#263d48] ml-auto text-base"
                    >
                      Show My Results
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Results Display */}
        {result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="space-y-6 max-w-4xl mx-auto">
          {/* Summary Card */}
          <Card className="p-8 sm:p-12 bg-gradient-to-br from-[#a7cbc9] to-white border-2 border-[#304e5d] shadow-lg">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#304e5d] text-white rounded-full mb-2">
                <Check className="h-10 w-10" />
              </div>
              <h2 className="text-[#304e5d] font-oswald text-4xl font-bold">You could receive up to</h2>
              <div className="text-6xl text-[#263d48] font-oswald">
                ${result.totalEstimatedBenefit.toLocaleString()}
              </div>
              <p className="text-gray-700 text-lg max-w-xl mx-auto">
                in tax credits based on what you told us
              </p>
            </div>
          </Card>

          {/* Call to Action */}
          <Card className="p-8 bg-[#304e5d] text-white">
            <h3 className="mb-4 font-oswald text-2xl font-bold">What's next?</h3>
            <p className="mb-6 text-lg">
              To get these tax credits, you'll need to file a tax return for 2025. Even if you don't owe any taxes, filing is how you claim these benefits!
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>File your taxes by April 15, 2026</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Gather your documents (Social Security cards, W-2 forms, receipts)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Look for free tax help if you qualify (VITA or Tax-Aide programs)</span>
              </li>
            </ul>
            
            <div className="space-y-6 mb-6">
              <div>
                <h4 className="text-white/90 mb-3 font-bold">File for free</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button className="bg-white text-[#304e5d] hover:bg-gray-100 text-base">
                    File online
                  </Button>
                  <Button className="bg-white text-[#304e5d] hover:bg-gray-100 text-base">
                    File in-person
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="text-white/90 mb-3 font-bold">Other filing options</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button className="bg-white text-[#304e5d] hover:bg-gray-100 text-base">
                    Paid filing options
                  </Button>
                  <Button className="bg-white text-[#304e5d] hover:bg-gray-100 text-base">
                    FreeTaxUSA online filing
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="border-t border-white/30 pt-6">
              <p className="mb-4 text-lg">
                To see what other benefits you may be eligible for, click the button below to visit MyFriendBen.
              </p>
              <Button className="w-full bg-white text-[#304e5d] hover:bg-gray-100 text-base">
                Meet MyFriendBen
              </Button>
            </div>
          </Card>

          {/* Individual Credit Results */}
          <div className="space-y-4">
            <h3 className="text-gray-900 font-oswald text-2xl md:col-span-2 font-bold">Here's the breakdown</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CreditCard
                title="Colorado Child Tax Credit"
                status={result.coloradoCTC.status}
                estimatedBenefit={result.coloradoCTC.estimatedBenefit}
                explanation={result.coloradoCTC.explanation}
                reasons={result.coloradoCTC.reasons}
              />

              <CreditCard
                title="Colorado Family Affordability Tax Credit"
                status={result.coloradoFATC.status}
                estimatedBenefit={result.coloradoFATC.estimatedBenefit}
                explanation={result.coloradoFATC.explanation}
                reasons={result.coloradoFATC.reasons}
              />

              <CreditCard
                title="Colorado Earned Income Tax Credit"
                status={result.coloradoEITC.status}
                estimatedBenefit={result.coloradoEITC.estimatedBenefit}
                explanation={result.coloradoEITC.explanation}
                reasons={result.coloradoEITC.reasons}
              />

              <CreditCard
                title="Colorado Care Worker Tax Credit"
                status={result.coloradoCareWorker.status}
                estimatedBenefit={result.coloradoCareWorker.estimatedBenefit}
                explanation={result.coloradoCareWorker.explanation}
                reasons={result.coloradoCareWorker.reasons}
              />

              <CreditCard
                title="Federal Child Tax Credit"
                status={result.federalCTC.status}
                estimatedBenefit={result.federalCTC.estimatedBenefit}
                explanation={result.federalCTC.explanation}
                reasons={result.federalCTC.reasons}
              />

              <CreditCard
                title="Federal Earned Income Tax Credit"
                status={result.federalEITC.status}
                estimatedBenefit={result.federalEITC.estimatedBenefit}
                explanation={result.federalEITC.explanation}
                reasons={result.federalEITC.reasons}
              />
            </div>
          </div>

          {/* Disclaimer */}
          <Card className="p-6 bg-gray-50 border-gray-300">
            <p className="text-sm text-gray-600">
              <strong>Important:</strong> These are estimates to help you plan. Your actual tax credits might be different based on your final tax return. 
              Tax situations can be complex, so we always recommend talking with a tax professional or using official IRS and Colorado Department of Revenue resources when you file.
            </p>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex-1 border-[#304e5d] text-[#304e5d] hover:bg-[#304e5d]/10 text-base"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print My Results
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1 border-[#304e5d] text-[#304e5d] hover:bg-[#304e5d]/10 text-base"
            >
              <Download className="mr-2 h-4 w-4" />
              Download as Text
            </Button>
            <Button
              onClick={handleStartOver}
              className="flex-1 bg-[#304e5d] hover:bg-[#263d48] text-base"
            >
              Try a Different Scenario
            </Button>
          </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Credit Card Component
function CreditCard({ 
  title, 
  status,
  estimatedBenefit, 
  explanation, 
  reasons 
}: { 
  title: string;
  status: 'eligible' | 'ineligible' | 'maybe';
  estimatedBenefit: number;
  explanation: string;
  reasons: string[];
}) {
  const statusConfig = {
    eligible: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      badge: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      label: 'You likely qualify',
    },
    ineligible: {
      bg: 'bg-gray-50',
      border: 'border-gray-300',
      badge: 'bg-gray-200 text-gray-700',
      icon: XCircle,
      label: 'Doesn\'t look like you qualify',
    },
    maybe: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      badge: 'bg-amber-100 text-amber-800',
      icon: AlertCircle,
      label: 'You might qualify — check details',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className={`p-6 ${config.bg} ${config.border}`}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <h4 className="text-gray-900 font-oswald text-xl font-bold">{title}</h4>
          <span className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded ${config.badge} whitespace-nowrap self-start`}>
            <StatusIcon className="h-4 w-4" />
            {config.label}
          </span>
        </div>

        {status === 'eligible' && estimatedBenefit > 0 && (
          <div className="text-3xl text-[#304e5d] font-oswald">
            Up to ${estimatedBenefit.toLocaleString()}
          </div>
        )}

        <p className="text-gray-700">
          {explanation}
        </p>

        {reasons.length > 0 && (
          <div className="pt-3 border-t border-gray-300">
            <ul className="space-y-2">
              {reasons.map((reason, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}