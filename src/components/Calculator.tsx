import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Download, Printer } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { useCalculator } from '@/hooks/useCalculator';
import { useIncomeManager } from '@/hooks/useIncomeManager';
import { calculateHouseholdSize, validateIncomes } from '@/lib/utils/calculations';
import {
  MarriedQuestion,
  ChildrenQuestion,
  HasIncomeQuestion,
  IncomeDetailsQuestion,
  CareWorkerQuestion,
  ReviewQuestion,
} from './questions';
import { CreditCard } from './results/CreditCard';

const MAX_HOUSEHOLD_SIZE = 8;

/**
 * Modern, refactored Calculator component
 * Uses custom hooks for state management and small focused question components
 */
export function Calculator() {
  const { t } = useTranslation();
  const calculator = useCalculator();
  const incomeManager = useIncomeManager({
    incomes: calculator.formData.incomes,
    onChange: (incomes) => calculator.updateFormData({ incomes }),
  });

  // Track if user has attempted to continue (for showing validation errors)
  const [attemptedContinue, setAttemptedContinue] = useState(false);

  const householdSize = calculateHouseholdSize(
    calculator.formData.children0To5,
    calculator.formData.children6To16,
    calculator.formData.isMarried
  );

  const householdSizeError =
    householdSize > MAX_HOUSEHOLD_SIZE
      ? `The max household size is ${MAX_HOUSEHOLD_SIZE}`
      : undefined;

  // Only show validation error if user has attempted to continue
  const incomeValidationError =
    attemptedContinue &&
    calculator.currentQuestion === 'income-details' &&
    !validateIncomes(calculator.formData.incomes)
      ? t('errors.validation')
      : undefined;

  const handleContinue = () => {
    setAttemptedContinue(true);

    // Check income validation if on income-details page
    if (calculator.currentQuestion === 'income-details' && !validateIncomes(calculator.formData.incomes)) {
      return; // Don't proceed if validation fails
    }

    // Clear validation state when successfully moving to next question
    setAttemptedContinue(false);
    calculator.goToNextQuestion();
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    if (!calculator.result) return;

    const eligibleCredits = [
      calculator.result.coloradoCTC.status === 'eligible' &&
        `Colorado Child Tax Credit: Up to $${calculator.result.coloradoCTC.estimatedBenefit.toFixed(2)}`,
      calculator.result.coloradoFATC.status === 'eligible' &&
        `Colorado Family Affordability Tax Credit: Up to $${calculator.result.coloradoFATC.estimatedBenefit.toFixed(2)}`,
      calculator.result.federalCTC.status === 'eligible' &&
        `Federal Child Tax Credit: Up to $${calculator.result.federalCTC.estimatedBenefit.toFixed(2)}`,
      calculator.result.federalEITC.status === 'eligible' &&
        `Federal Earned Income Tax Credit: Up to $${calculator.result.federalEITC.estimatedBenefit.toFixed(2)}`,
    ].filter(Boolean);

    const content = `
Colorado Tax Credit & Eligibility Estimator - Results
======================================================
Date: ${new Date().toLocaleDateString()}

YOUR INFORMATION
Filing Status: ${calculator.formData.isMarried ? 'With a Spouse' : 'Single'}
Children under 6: ${calculator.formData.children0To5}
Children 6-16: ${calculator.formData.children6To16}

ELIGIBLE CREDITS
${eligibleCredits.length > 0 ? eligibleCredits.join('\n') : 'No eligible credits based on your inputs.'}

TOTAL ESTIMATED BENEFIT
$${calculator.result.totalEstimatedBenefit.toFixed(2)}

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

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* Welcome Screen */}
        {calculator.showWelcome && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Card className="max-w-[1200px] mx-auto border-0">
              <div className="space-y-6">
                <p className="text-gray-700 text-xl text-[16px] mt-[0px] mr-[0px] mb-[16px] ml-[0px] m-[0px]">
                  {t('welcome.description')}
                </p>

                <Button
                  onClick={calculator.handleStart}
                  className="bg-[#304e5d] hover:bg-[#263d48] text-base mt-8 rounded-[0px] mx-[0px] my-[16px]"
                >
                  {t('welcome.startButton')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <div className="bg-[rgba(167,203,201,0.42)] rounded-lg p-6 text-left space-y-4 mt-8">
                  <h3 className="text-[#304e5d] font-oswald text-xl font-bold">
                    {t('welcome.howItWorksTitle')}
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[#304e5d] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        {t('welcome.howItWorks.step1')}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[#304e5d] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        {t('welcome.howItWorks.step2')}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[#304e5d] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{t('welcome.howItWorks.step3')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[#304e5d] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        {t('welcome.howItWorks.step4')}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Questions Section */}
        {!calculator.showWelcome && !calculator.result && (
          <motion.div
            key="questions-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut', delay: 0.2 }}
            className="space-y-6"
          >
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  Question {calculator.currentIndex + 1} of {calculator.allQuestions.length}
                </span>
                <span>{Math.round(calculator.progress)}% complete</span>
              </div>
              <Progress value={calculator.progress} className="h-2" />
            </div>

            {/* Question Card */}
            <motion.div
              key={calculator.currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <Card className="bg-white max-w-[1200px] mx-auto border-0">
                <div className="space-y-6">
                  {/* Render appropriate question component */}
                  {calculator.currentQuestion === 'married' && (
                    <MarriedQuestion
                      value={calculator.formData.isMarried}
                      onChange={(value) => calculator.updateFormData({ isMarried: value })}
                    />
                  )}

                  {calculator.currentQuestion === 'children-0-5' && (
                    <ChildrenQuestion
                      type="0-5"
                      value={calculator.formData.children0To5}
                      onChange={(value) => calculator.updateFormData({ children0To5: value })}
                      error={householdSizeError}
                    />
                  )}

                  {calculator.currentQuestion === 'children-6-16' && (
                    <ChildrenQuestion
                      type="6-16"
                      value={calculator.formData.children6To16}
                      onChange={(value) => calculator.updateFormData({ children6To16: value })}
                      error={householdSizeError}
                    />
                  )}

                  {calculator.currentQuestion === 'has-income' && (
                    <HasIncomeQuestion
                      value={calculator.formData.hasIncome}
                      onChange={(value) => calculator.updateFormData({ hasIncome: value })}
                      isMarried={calculator.formData.isMarried}
                    />
                  )}

                  {calculator.currentQuestion === 'income-details' && (
                    <IncomeDetailsQuestion
                      incomes={calculator.formData.incomes}
                      onAddIncome={incomeManager.addIncome}
                      onRemoveIncome={incomeManager.removeIncome}
                      onUpdateIncome={incomeManager.updateIncome}
                    />
                  )}

                  {calculator.currentQuestion === 'care-worker' && (
                    <CareWorkerQuestion
                      value={calculator.formData.headIsCareWorker}
                      onChange={(value) => calculator.updateFormData({ headIsCareWorker: value })}
                    />
                  )}

                  {calculator.currentQuestion === 'spouse-care-worker' && (
                    <CareWorkerQuestion
                      value={calculator.formData.spouseIsCareWorker}
                      onChange={(value) =>
                        calculator.updateFormData({ spouseIsCareWorker: value })
                      }
                      isSpouse
                    />
                  )}

                  {calculator.currentQuestion === 'review' && (
                    <ReviewQuestion formData={calculator.formData} />
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between gap-4 pt-8 mt-auto">
                    {calculator.questionHistory.length > 0 && (
                      <Button
                        onClick={calculator.goToPreviousQuestion}
                        variant="outline"
                        className="px-6 text-base rounded-[0px]"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('navigation.back')}
                      </Button>
                    )}

                    {calculator.currentQuestion !== 'review' ? (
                      <Button
                        onClick={handleContinue}
                        className="bg-[#304e5d] hover:bg-[#263d48] ml-auto text-base rounded-[0px] text-[16px] p-[24px] px-[48px] py-[24px]"
                      >
                        {t('navigation.continue')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={calculator.handleCalculate}
                        disabled={calculator.isLoading}
                        className="px-8 bg-[#304e5d] hover:bg-[#263d48] ml-auto text-base"
                      >
                        {calculator.isLoading ? t('navigation.calculating') : t('navigation.showResults')}
                        {!calculator.isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    )}
                  </div>

                  {/* Error Messages */}
                  {calculator.error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">
                        <strong>Error:</strong> {calculator.error}
                      </p>
                      <p className="text-red-600 text-sm mt-2">
                        Please try again or contact support if the problem persists.
                      </p>
                    </div>
                  )}

                  {incomeValidationError && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-amber-800 text-sm">
                        <strong>Validation Error:</strong> {incomeValidationError}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Results Display */}
        {calculator.result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Summary Card */}
              <Card className="p-8 sm:p-12 bg-gradient-to-br from-[#a7cbc9] to-white border-2 border-[#304e5d] shadow-lg">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-[#304e5d] text-white rounded-full mb-2">
                    <Check className="h-10 w-10" />
                  </div>
                  <h2 className="text-[#304e5d] font-oswald text-4xl font-bold">
                    {t('results.summaryTitle')}
                  </h2>
                  <div className="text-6xl text-[#263d48] font-oswald">
                    ${calculator.result.totalEstimatedBenefit.toLocaleString()}
                  </div>
                  <p className="text-gray-700 text-lg max-w-xl mx-auto">
                    {t('results.summarySubtitle')}
                  </p>
                </div>
              </Card>

              {/* Call to Action */}
              <Card className="p-8 bg-[#304e5d] text-white">
                <h3 className="mb-4 font-oswald text-2xl font-bold">{t('results.nextStepsTitle')}</h3>
                <p className="mb-6 text-lg">
                  {t('results.title')} {calculator.result.totalEstimatedBenefit.toLocaleString()} {t('results.titleEnd')}
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('results.nextSteps.step1')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('results.nextSteps.step2')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('results.nextSteps.step3')}</span>
                  </li>
                </ul>

                <div className="space-y-6 mb-6">
                  <div>
                    <h4 className="text-white/90 mb-3 font-bold">{t('results.fileForFreeTitle')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button asChild className="bg-white text-[#304e5d] hover:bg-gray-100 text-base">
                        <a
                          href="https://myfreetaxes.com/?utm_source=online&utm_medium=calculator&utm_campaign=file_for_free_online&utm_id=get_ahead&utm_term=english&utm_content=myfreetaxes"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('results.buttons.fileOnlineDIY')}
                        </a>
                      </Button>
                      <Button asChild className="bg-white text-[#304e5d] hover:bg-gray-100 text-base">
                        <a
                          href="https://www.getaheadcolorado.org/fileinperson/?utm_source=online&utm_medium=calculator&utm_campaign=file_for_free_in_person&utm_id=get_ahead&utm_term=english&utm_content=gac_file_in_person"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('results.buttons.fileInPerson')}
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white/90 mb-3 font-bold">{t('results.otherFilingTitle')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button asChild className="bg-white text-[#304e5d] hover:bg-gray-100 text-base">
                        <a
                          href="https://co.myfriendben.org/paid-tax-filing-options/?utm_source=online&utm_medium=calculator&utm_campaign=paid_filing_options&utm_id=get_ahead&utm_term=english&utm_content=mfb_page"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('results.buttons.paidPreparers')}
                        </a>
                      </Button>
                      <Button asChild className="bg-white text-[#304e5d] hover:bg-gray-100 text-base">
                        <a
                          href="https://www.freetaxusa.com/?utm_source=get_ahead_colorado"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('results.buttons.fileOnlineSupport')}
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/30 pt-6">
                  <p className="mb-4 text-lg">
                    {t('results.mfbDescription')}
                  </p>
                  <Button asChild className="w-full bg-white text-[#304e5d] hover:bg-gray-100 text-base">
                    <a
                      href={`${import.meta.env.VITE_MFB_FRONTEND_DOMAIN}/co/step-1?referrer=gac`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('results.buttons.meetMFB')}
                    </a>
                  </Button>
                </div>

                <div className="border-t border-white/30 pt-6">
                  <p className="mb-4 text-lg">
                    {t('results.savingsDescription')}
                  </p>
                  <Button asChild className="w-full bg-white text-[#304e5d] hover:bg-gray-100 text-base">
                    <a
                      href="https://taxrefund.savingscollaborative.org/?lang=en"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('results.buttons.savingsCollaborative')}
                    </a>
                  </Button>
                </div>
              </Card>

              {/* Individual Credit Results */}
              <div className="space-y-4">
                <h3 className="text-gray-900 font-oswald text-2xl md:col-span-2 font-bold">
                  {t('results.breakdown')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sort credits by estimated benefit (highest first) */}
                  {[
                    {
                      title: t('results.credits.coloradoCTC'),
                      ...calculator.result.coloradoCTC,
                    },
                    {
                      title: t('results.credits.coloradoFATC'),
                      ...calculator.result.coloradoFATC,
                    },
                    {
                      title: t('results.credits.coloradoEITC'),
                      ...calculator.result.coloradoEITC,
                    },
                    {
                      title: t('results.credits.coloradoCareWorker'),
                      ...calculator.result.coloradoCareWorker,
                    },
                    {
                      title: t('results.credits.federalCTC'),
                      ...calculator.result.federalCTC,
                    },
                    {
                      title: t('results.credits.federalEITC'),
                      ...calculator.result.federalEITC,
                    },
                  ]
                    .sort((a, b) => b.estimatedBenefit - a.estimatedBenefit)
                    .map((credit) => (
                      <CreditCard
                        key={credit.title}
                        title={credit.title}
                        status={credit.status}
                        estimatedBenefit={credit.estimatedBenefit}
                        explanation={credit.explanation}
                        reasons={credit.reasons}
                      />
                    ))}
                </div>
              </div>

              {/* Disclaimer */}
              <Card className="p-6 bg-gray-50 border-gray-300">
                <p className="text-sm text-gray-600">
                  <strong>{t('results.disclaimerLabel')}</strong> {t('results.disclaimer')}
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
                  {t('results.printResults')}
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="flex-1 border-[#304e5d] text-[#304e5d] hover:bg-[#304e5d]/10 text-base"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('results.downloadText')}
                </Button>
                <Button
                  onClick={calculator.handleStartOver}
                  className="flex-1 bg-[#304e5d] hover:bg-[#263d48] text-base"
                >
                  {t('results.tryDifferent')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
