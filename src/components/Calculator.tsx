import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { ArrowLeft, ArrowRight, Download, Printer, Check, Plus, AlertCircle, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import { calculateAllCredits, type FilingStatus, type PayFrequency, type ColoradoResidency, type ChildRelationship, calculateAnnualIncome } from '../utils/taxCalculator';
import { Progress } from './ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import type { TaxCreditResults } from '../utils/taxCalculator';

interface Child {
  id: string;
  age: number;
  livesWithYou: 'yes' | 'no' | 'not-sure';
  relationship: ChildRelationship;
  hasValidID: 'yes' | 'no' | 'not-sure';
}

type QuestionKey = 
  | 'filing-status' 
  | 'colorado-resident' 
  | 'has-income'
  | 'pay-frequency'
  | 'pay-amount'
  | 'additional-income'
  | 'num-children'
  | `child-${string}-age`
  | `child-${string}-lives`
  | `child-${string}-relationship`
  | `child-${string}-id`
  | 'childcare-expenses'
  | 'childcare-amount'
  | 'care-worker'
  | 'review';

export function Calculator() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionKey>('filing-status');
  const [questionHistory, setQuestionHistory] = useState<QuestionKey[]>([]);
  
  // Form data
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single');
  const [coloradoResident, setColoradoResident] = useState<ColoradoResidency>('full-year');
  const [hasEarnedIncome, setHasEarnedIncome] = useState<'yes' | 'no'>('yes');
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('biweekly');
  const [payAmount, setPayAmount] = useState('');
  const [additionalIncome, setAdditionalIncome] = useState('');
  const [numChildren, setNumChildren] = useState('0');
  const [children, setChildren] = useState<Child[]>([]);
  const [hasChildCareExpenses, setHasChildCareExpenses] = useState<'yes' | 'no'>('no');
  const [childCareExpenses, setChildCareExpenses] = useState('');
  const [careWorkerExpenses, setCareWorkerExpenses] = useState('');
  
  const [result, setResult] = useState<TaxCreditResults | null>(null);

  // Calculate progress
  const getAllQuestions = (): QuestionKey[] => {
    const questions: QuestionKey[] = ['filing-status', 'colorado-resident', 'has-income'];
    
    if (hasEarnedIncome === 'yes') {
      questions.push('pay-frequency', 'pay-amount', 'additional-income');
    }
    
    questions.push('num-children');
    
    // Add child questions
    children.forEach((child) => {
      questions.push(
        `child-${child.id}-age`,
        `child-${child.id}-lives`,
        `child-${child.id}-relationship`,
        `child-${child.id}-id`
      );
    });
    
    questions.push('childcare-expenses');
    
    if (hasChildCareExpenses === 'yes') {
      questions.push('childcare-amount');
    }
    
    questions.push('care-worker');
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

  const handleCalculate = () => {
    const paymentAmount = parseFloat(payAmount) || 0;
    const additionalAmount = parseFloat(additionalIncome) || 0;
    const annualIncome = hasEarnedIncome === 'yes' 
      ? calculateAnnualIncome(payFrequency, paymentAmount) + additionalAmount 
      : 0;
    
    const calculationResult = calculateAllCredits({
      filingStatus,
      coloradoResident,
      hasEarnedIncome: hasEarnedIncome === 'yes',
      annualIncome,
      children: children.map(c => ({
        age: c.age,
        livesWithYou: c.livesWithYou,
        relationship: c.relationship,
        hasValidID: c.hasValidID,
      })),
      hasChildCareExpenses: hasChildCareExpenses === 'yes',
      childCareExpenses: parseFloat(childCareExpenses) || 0,
      isCareWorker: parseFloat(careWorkerExpenses) > 0,
      careWorkerType: parseFloat(careWorkerExpenses) > 0 ? 'childcare' : 'none',
      careWorkerHours: parseFloat(careWorkerExpenses) || 0,
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
    setCurrentQuestion('filing-status');
    setQuestionHistory([]);
    setResult(null);
    setFilingStatus('single');
    setColoradoResident('full-year');
    setHasEarnedIncome('yes');
    setPayFrequency('biweekly');
    setPayAmount('');
    setAdditionalIncome('');
    setNumChildren('0');
    setChildren([]);
    setHasChildCareExpenses('no');
    setChildCareExpenses('');
    setCareWorkerExpenses('');
  };

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

  // Get current child being edited
  const getCurrentChild = (): Child | null => {
    if (currentQuestion.startsWith('child-')) {
      // Extract the child ID and question type
      // Format: child-{uuid}-{type} where uuid can contain hyphens
      const match = currentQuestion.match(/^child-(.+?)-(age|lives|relationship|id)$/);
      if (match) {
        const childId = match[1];
        return children.find(c => c.id === childId) || null;
      }
    }
    return null;
  };

  const currentChild = getCurrentChild();
  const currentChildIndex = currentChild ? children.findIndex(c => c.id === currentChild.id) : -1;

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
                
                {/* Question: Filing Status */}
                {currentQuestion === 'filing-status' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl text-left font-bold uppercase">What's your family situation?</h2>
                      <p className="text-gray-600 text-lg text-left">
                        This helps us understand which tax credits might work for you.
                      </p>
                    </div>

                    <div className="space-y-3 pt-4">
                      <RadioGroup value={filingStatus} onValueChange={(value) => setFilingStatus(value as FilingStatus)}>
                        <Label htmlFor="single" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="single" id="single" />
                            <span className="flex-1">I'm single</span>
                          </div>
                        </Label>
                        <Label htmlFor="head-of-household" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="head-of-household" id="head-of-household" />
                            <span className="flex-1">I'm single and supporting my family</span>
                          </div>
                        </Label>
                        <Label htmlFor="married-joint" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="married-joint" id="married-joint" />
                            <span className="flex-1">I'm married and filing together with my spouse</span>
                          </div>
                        </Label>
                        <Label htmlFor="married-separate" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="married-separate" id="married-separate" />
                            <span className="flex-1">I'm married but filing separately</span>
                          </div>
                        </Label>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Question: Colorado Resident */}
                {currentQuestion === 'colorado-resident' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">Do you live in Colorado?</h2>
                      <p className="text-gray-600 text-lg">
                        Some tax credits are only for Colorado residents. We need to know if you've lived here this year.
                      </p>
                    </div>

                    <div className="space-y-3 pt-4">
                      <RadioGroup value={coloradoResident} onValueChange={(value) => setColoradoResident(value as ColoradoResidency)}>
                        <Label htmlFor="full-year" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="full-year" id="full-year" />
                            <span className="flex-1">Yes, I've lived in Colorado all year</span>
                          </div>
                        </Label>
                        <Label htmlFor="part-year" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="part-year" id="part-year" />
                            <span className="flex-1">Yes, but I moved here (or away) during the year</span>
                          </div>
                        </Label>
                        <Label htmlFor="no-resident" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="no" id="no-resident" />
                            <span className="flex-1">No, I don't live in Colorado</span>
                          </div>
                        </Label>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Question: Has Income */}
                {currentQuestion === 'has-income' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">Do you have a job or earn money from working?</h2>
                      <p className="text-gray-600 text-lg">
                        This includes wages from a job, self-employment, or gig work. Some credits require that you earn income from working.
                      </p>
                    </div>

                    <div className="space-y-3 pt-4">
                      <RadioGroup value={hasEarnedIncome} onValueChange={(value) => setHasEarnedIncome(value as 'yes' | 'no')}>
                        <Label htmlFor="income-yes" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="yes" id="income-yes" />
                            <span className="flex-1">Yes, I work and earn money</span>
                          </div>
                        </Label>
                        <Label htmlFor="income-no" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="no" id="income-no" />
                            <span className="flex-1">No, I don't currently work</span>
                          </div>
                        </Label>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Question: Pay Frequency */}
                {currentQuestion === 'pay-frequency' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">How often do you get paid?</h2>
                      <p className="text-gray-600 text-lg">
                        Think about your paycheck or how often money comes in from your work.
                      </p>
                    </div>

                    <div className="space-y-2 pt-4">
                      <Select value={payFrequency} onValueChange={(value) => setPayFrequency(value as PayFrequency)}>
                        <SelectTrigger className="bg-input-background border-gray-300 h-14 text-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Every week</SelectItem>
                          <SelectItem value="biweekly">Every two weeks</SelectItem>
                          <SelectItem value="semi-monthly">Twice a month (like the 1st and 15th)</SelectItem>
                          <SelectItem value="monthly">Once a month</SelectItem>
                          <SelectItem value="other">It varies / I'm not sure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Question: Pay Amount */}
                {currentQuestion === 'pay-amount' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold">How much do you typically get paid each time?</h2>
                      <p className="text-gray-600 text-lg">
                        Look at your paycheck and enter the total amount <strong>before</strong> taxes are taken out. Don't worry about being exact — your best estimate is fine!
                      </p>
                    </div>

                    <div className="pt-4">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          className="pl-10 bg-input-background border-gray-300 h-16 text-xl"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Question: Additional Income */}
                {currentQuestion === 'additional-income' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">Do you have any extra income?</h2>
                      <p className="text-gray-600 text-lg">
                        This could be from a side job, tips, bonuses, or other work. If you don't have any extra income, just leave this blank or enter 0.
                      </p>
                    </div>

                    <div className="pt-4">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={additionalIncome}
                          onChange={(e) => setAdditionalIncome(e.target.value)}
                          className="pl-10 bg-input-background border-gray-300 h-16 text-xl"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Total additional yearly income from all other sources
                      </p>
                    </div>
                  </div>
                )}

                {/* Question: Number of Children */}
                {currentQuestion === 'num-children' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">How many children or dependents do you have?</h2>
                      <p className="text-gray-600 text-lg">
                        Count kids who live with you and who you're supporting. They can be your own children, stepchildren, foster kids, or others you take care of.
                      </p>
                    </div>

                    <div className="pt-4">
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={numChildren}
                        onChange={(e) => {
                          const count = parseInt(e.target.value) || 0;
                          setNumChildren(e.target.value);
                          
                          // Update children array
                          const currentCount = children.length;
                          if (count > currentCount) {
                            const newChildren = [...children];
                            for (let i = currentCount; i < count; i++) {
                              newChildren.push({
                                id: crypto.randomUUID(),
                                age: 0,
                                livesWithYou: 'yes',
                                relationship: 'biological',
                                hasValidID: 'yes',
                              });
                            }
                            setChildren(newChildren);
                          } else if (count < currentCount) {
                            setChildren(children.slice(0, count));
                          }
                        }}
                        className="bg-input-background border-gray-300 h-16 text-xl"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {/* Questions: Child Details */}
                {currentChild && (
                  <>
                    {currentQuestion === `child-${currentChild.id}-age` && (
                      <div className="space-y-6 flex-1">
                        <div className="space-y-3">
                          <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">How old is child #{currentChildIndex + 1}?</h2>
                          <p className="text-gray-600 text-lg">
                            Tell us their age as of December 31, 2025. If they'll have a birthday before the end of the year, use their age on that date.
                          </p>
                        </div>

                        <div className="pt-4">
                          <Input
                            type="number"
                            min="0"
                            max="18"
                            value={currentChild.age || ''}
                            onChange={(e) => {
                              const updatedChildren = children.map(c =>
                                c.id === currentChild.id ? { ...c, age: parseInt(e.target.value) || 0 } : c
                              );
                              setChildren(updatedChildren);
                            }}
                            className="bg-input-background border-gray-300 h-16 text-xl"
                            placeholder="Age"
                          />
                          <p className="text-sm text-gray-500 mt-2">
                            Enter age as of December 31, 2025
                          </p>
                        </div>
                      </div>
                    )}

                    {currentQuestion === `child-${currentChild.id}-lives` && (
                      <div className="space-y-6 flex-1">
                        <div className="space-y-3">
                          <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">Does child #{currentChildIndex + 1} live with you most of the time?</h2>
                          <p className="text-gray-600 text-lg">
                            For tax purposes, "most of the time" means more than half the year — that's at least 6 months.
                          </p>
                        </div>

                        <div className="space-y-3 pt-4">
                          <RadioGroup 
                            value={currentChild.livesWithYou} 
                            onValueChange={(value) => {
                              const updatedChildren = children.map(c =>
                                c.id === currentChild.id ? { ...c, livesWithYou: value as 'yes' | 'no' | 'not-sure' } : c
                              );
                              setChildren(updatedChildren);
                            }}
                          >
                            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                              <RadioGroupItem value="yes" id="lives-yes" />
                              <Label htmlFor="lives-yes" className="cursor-pointer flex-1">Yes, they live with me</Label>
                            </div>
                            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                              <RadioGroupItem value="no" id="lives-no" />
                              <Label htmlFor="lives-no" className="cursor-pointer flex-1">No, they live somewhere else</Label>
                            </div>
                            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                              <RadioGroupItem value="not-sure" id="lives-notsure" />
                              <Label htmlFor="lives-notsure" className="cursor-pointer flex-1">I'm not sure</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    )}

                    {currentQuestion === `child-${currentChild.id}-relationship` && (
                      <div className="space-y-6 flex-1">
                        <div className="space-y-3">
                          <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">What's your relationship to child #{currentChildIndex + 1}?</h2>
                          <p className="text-gray-600 text-lg">
                            This helps us understand if they qualify as your dependent.
                          </p>
                        </div>

                        <div className="space-y-2 pt-4">
                          <Select 
                            value={currentChild.relationship} 
                            onValueChange={(value) => {
                              const updatedChildren = children.map(c =>
                                c.id === currentChild.id ? { ...c, relationship: value as ChildRelationship } : c
                              );
                              setChildren(updatedChildren);
                            }}
                          >
                            <SelectTrigger className="bg-input-background border-gray-300 h-14 text-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="biological">My biological child</SelectItem>
                              <SelectItem value="step">My stepchild</SelectItem>
                              <SelectItem value="foster">My foster child</SelectItem>
                              <SelectItem value="adopted">My adopted child</SelectItem>
                              <SelectItem value="other">Another relationship (grandchild, niece, nephew, etc.)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {currentQuestion === `child-${currentChild.id}-id` && (
                      <div className="space-y-6 flex-1">
                        <div className="space-y-3">
                          <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">Does child #{currentChildIndex + 1} have a Social Security Number?</h2>
                          <p className="text-gray-600 text-lg">
                            Most tax credits require kids to have a Social Security Number (SSN) or Taxpayer ID (TIN). It's okay if you're not sure — just let us know!
                          </p>
                        </div>

                        <div className="space-y-3 pt-4">
                          <RadioGroup 
                            value={currentChild.hasValidID} 
                            onValueChange={(value) => {
                              const updatedChildren = children.map(c =>
                                c.id === currentChild.id ? { ...c, hasValidID: value as 'yes' | 'no' | 'not-sure' } : c
                              );
                              setChildren(updatedChildren);
                            }}
                          >
                            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                              <RadioGroupItem value="yes" id="id-yes" />
                              <Label htmlFor="id-yes" className="cursor-pointer flex-1">Yes, they have an SSN or TIN</Label>
                            </div>
                            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                              <RadioGroupItem value="no" id="id-no" />
                              <Label htmlFor="id-no" className="cursor-pointer flex-1">No, they don't have one</Label>
                            </div>
                            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                              <RadioGroupItem value="not-sure" id="id-notsure" />
                              <Label htmlFor="id-notsure" className="cursor-pointer flex-1">I'm not sure</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Question: Childcare Expenses */}
                {currentQuestion === 'childcare-expenses' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">Do you pay for childcare?</h2>
                      <p className="text-gray-600 text-lg">
                        This includes daycare, preschool, after-school programs, or paying someone to watch your kids while you work. If you don't pay for care, that's totally fine!
                      </p>
                    </div>

                    <div className="space-y-3 pt-4">
                      <RadioGroup value={hasChildCareExpenses} onValueChange={(value) => setHasChildCareExpenses(value as 'yes' | 'no')}>
                        <Label htmlFor="childcare-yes" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="yes" id="childcare-yes" />
                            <span className="flex-1">Yes, I pay for childcare</span>
                          </div>
                        </Label>
                        <Label htmlFor="childcare-no" className="cursor-pointer block w-full">
                          <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] hover:bg-[#a7cbc9] transition-all cursor-pointer">
                            <RadioGroupItem value="no" id="childcare-no" />
                            <span className="flex-1">No, I don't pay for childcare</span>
                          </div>
                        </Label>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Question: Childcare Amount */}
                {currentQuestion === 'childcare-amount' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">About how much do you spend on childcare in a year?</h2>
                      <p className="text-gray-600 text-lg">
                        Add up what you pay for daycare, babysitters, or programs throughout the year. A rough estimate is perfectly fine!
                      </p>
                    </div>

                    <div className="pt-4">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={childCareExpenses}
                          onChange={(e) => setChildCareExpenses(e.target.value)}
                          className="pl-10 bg-input-background border-gray-300 h-16 text-xl"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Total childcare expenses for the year
                      </p>
                    </div>
                  </div>
                )}

                {/* Question: Care Worker */}
                {currentQuestion === 'care-worker' && (
                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <h2 className="text-[#304e5d] font-oswald text-3xl font-bold uppercase">Do you regularly care for young children other than your own?</h2>
                      <p className="text-gray-600 text-lg">
                        Care workers include family, friends and neighbors who regularly care for young children (about 14 hours per week) in addition to licensed childcare providers, home health aides, personal care aides, and nursing assistants.
                      </p>
                    </div>

                    <div className="space-y-3 pt-4">
                      <RadioGroup value={careWorkerExpenses ? 'yes' : 'no'} onValueChange={(value) => setCareWorkerExpenses(value === 'yes' ? '728' : '0')}>
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
                        <span className="text-gray-600">Your situation:</span>
                        <span className="text-right">
                          {filingStatus === 'single' ? 'Single' : 
                           filingStatus === 'head-of-household' ? 'Single, supporting family' :
                           filingStatus === 'married-joint' ? 'Married, filing together' : 
                           'Married, filing separately'}
                        </span>
                      </div>

                      <div className="flex justify-between items-start border-t border-gray-200 pt-4">
                        <span className="text-gray-600">Colorado resident:</span>
                        <span>
                          {coloradoResident === 'full-year' ? 'All year' :
                           coloradoResident === 'part-year' ? 'Part of the year' : 'No'}
                        </span>
                      </div>

                      {hasEarnedIncome === 'yes' && (
                        <>
                          <div className="flex justify-between items-start border-t border-gray-200 pt-4">
                            <span className="text-gray-600">Your income:</span>
                            <span className="text-right">
                              ${parseFloat(payAmount || '0').toLocaleString()} {payFrequency === 'weekly' ? 'weekly' : payFrequency === 'biweekly' ? 'biweekly' : payFrequency === 'semi-monthly' ? 'semi-monthly' : payFrequency === 'monthly' ? 'monthly' : 'per period'}
                            </span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-gray-600 text-sm">Estimated yearly:</span>
                            <span className="font-medium">
                              ${(calculateAnnualIncome(payFrequency, parseFloat(payAmount || '0')) + parseFloat(additionalIncome || '0')).toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between items-start border-t border-gray-200 pt-4">
                        <span className="text-gray-600">Children/dependents:</span>
                        <span>{children.length}</span>
                      </div>

                      {hasChildCareExpenses === 'yes' && parseFloat(childCareExpenses || '0') > 0 && (
                        <div className="flex justify-between items-start border-t border-gray-200 pt-4">
                          <span className="text-gray-600">Childcare expenses:</span>
                          <span>${parseFloat(childCareExpenses || '0').toLocaleString()}/year</span>
                        </div>
                      )}

                      {parseFloat(careWorkerExpenses || '0') > 0 && (
                        <div className="flex justify-between items-start border-t border-gray-200 pt-4">
                          <span className="text-gray-600">Care worker:</span>
                          <span>Yes, regularly care for young children</span>
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