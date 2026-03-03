import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  determineFilingOutcome,
  createDefaultAnswers,
  type QuizAnswers,
  type FilingOutcome,
} from "@/lib/utils/filingEligibility";
import {
  getFileInPersonLink,
  getOnlineWithSupportLink,
  getDiyFilingLink,
  getFreeTaxUsaLink,
  getMyFreeTaxesLink,
  getPaidFilingOptionsLink,
} from "@/lib/utils/whiteLabelData";

interface FileInPersonQuizProps {
  onClose: () => void;
  yearlyIncome: number;
  caresForOtherChildren: boolean;
  whiteLabel?: string;
}

export function FileInPersonQuiz({
  onClose,
  yearlyIncome,
  caresForOtherChildren,
  whiteLabel,
}: FileInPersonQuizProps) {
  const { t, i18n } = useTranslation();
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Generate links using white label data
  const fileInPersonLink = getFileInPersonLink(whiteLabel);
  const onlineWithSupportLink = getOnlineWithSupportLink();
  const diyFilingLink = getDiyFilingLink();
  const freeTaxUsaLink = getFreeTaxUsaLink();
  const myFreeTaxesLink = getMyFreeTaxesLink();
  const paidFilingLink = getPaidFilingOptionsLink(i18n.language);
  const [answers, setAnswers] = useState<QuizAnswers>({
    ...createDefaultAnswers(),
    caresForOtherChildren, // Pre-populate from main form
  });
  const [outcome, setOutcome] = useState<FilingOutcome | null>(null);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const nextTimerRef = useRef<number | null>(null);

  const scheduleNext = () => {
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    nextTimerRef.current = window.setTimeout(() => handleNext(), 200);
  };

  useEffect(() => {
    return () => {
      if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    };
  }, []);

  // Calculate outcome when we reach the results
  const handleComplete = () => {
    const result = determineFilingOutcome(answers, yearlyIncome);
    setOutcome(result);
  };

  const handleBack = () => {
    if (outcome) {
      setDirection("backward");
      setOutcome(null);
    } else if (currentQuestion > 0) {
      setDirection("backward");
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Question 0: Computer Comfort (1-5 scale)
  const renderComputerComfort = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-[#304e5d] font-oswald text-xl font-bold mb-2">
          {t("filingQuiz.questions.computerComfort.title")}
        </h3>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            onClick={() => {
              setAnswers(prev => ({ ...prev, computerComfort: level }));
              scheduleNext();
            }}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
              answers.computerComfort === level
                ? "border-[#304e5d] bg-[#a7cbc9]/30 text-gray-900"
                : "border-gray-300 hover:border-[#304e5d] bg-white text-gray-900"
            }`}
          >
            <div className="font-semibold">
              {t(`filingQuiz.questions.computerComfort.levels.${level}.label`)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Question 1: Tax Comfort (1-5 scale)
  const renderTaxComfort = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-[#304e5d] font-oswald text-xl font-bold mb-2">
          {t("filingQuiz.questions.taxComfort.title")}
        </h3>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            onClick={() => {
              setAnswers(prev => ({ ...prev, taxComfort: level }));
              scheduleNext();
            }}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
              answers.taxComfort === level
                ? "border-[#304e5d] bg-[#a7cbc9]/30 text-gray-900"
                : "border-gray-300 hover:border-[#304e5d] bg-white text-gray-900"
            }`}
          >
            <div className="font-semibold">
              {t(`filingQuiz.questions.taxComfort.levels.${level}.label`)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Question 2: Life Events (checkboxes)
  const renderLifeEvents = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-[#304e5d] font-oswald text-xl font-bold mb-2">
          {t("filingQuiz.questions.lifeEvents.title")}
        </h3>
      </div>
      <div className="space-y-3">
        {[
          {
            key: "birthOrAdoption",
            label: t("filingQuiz.questions.lifeEvents.options.birthOrAdoption"),
          },
          {
            key: "married",
            label: t("filingQuiz.questions.lifeEvents.options.married"),
          },
          {
            key: "divorced",
            label: t("filingQuiz.questions.lifeEvents.options.divorced"),
          },
          {
            key: "spouseDeath",
            label: t("filingQuiz.questions.lifeEvents.options.spouseDeath"),
          },
        ].map((event) => (
          <label
            key={event.key}
            className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-300 hover:border-[#304e5d] bg-white cursor-pointer transition-all text-gray-900"
          >
            <input
              type="checkbox"
              checked={
                answers.lifeEvents[event.key as keyof typeof answers.lifeEvents]
              }
              onChange={(e) => {
                setAnswers(prev => ({
                  ...prev,
                  lifeEvents: {
                    ...prev.lifeEvents,
                    [event.key]: e.target.checked,
                  },
                }));
              }}
              className="w-5 h-5 flex-shrink-0 rounded border-gray-300 text-[#304e5d] focus:ring-[#304e5d] focus:ring-offset-0 accent-[#304e5d]"
              style={{ accentColor: "#304e5d" }}
            />
            <span className="font-medium">{event.label}</span>
          </label>
        ))}
      </div>
      <Button
        onClick={handleNext}
        className="w-full bg-[#304e5d] text-white hover:bg-[#263d48]"
      >
        {t("navigation.next")}
      </Button>
    </div>
  );

  // Question 3: Received 1099
  const renderReceived1099 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-[#304e5d] font-oswald text-xl font-bold mb-2">
          {t("filingQuiz.questions.received1099.title")}
        </h3>
      </div>
      <div className="space-y-3">
        <Button
          onClick={() => {
            setAnswers(prev => ({ ...prev, received1099: true }));
            scheduleNext();
          }}
          className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
        >
          {t("filingQuiz.questions.received1099.yes")}
        </Button>
        <Button
          onClick={() => {
            setAnswers(prev => ({ ...prev, received1099: false }));
            scheduleNext();
          }}
          className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
        >
          {t("filingQuiz.questions.received1099.no")}
        </Button>
      </div>
    </div>
  );

  // Question 4: Tax ID Type
  const renderTaxIdType = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-[#304e5d] font-oswald text-xl font-bold mb-2">
          {t("filingQuiz.questions.taxIdType.title")}
        </h3>
      </div>
      <div className="space-y-3">
        <Button
          onClick={() => {
            setAnswers(prev => ({ ...prev, taxIdType: "ssn" }));
            scheduleNext();
          }}
          className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
        >
          {t("filingQuiz.questions.taxIdType.ssn")}
        </Button>
        <Button
          onClick={() => {
            setAnswers(prev => ({ ...prev, taxIdType: "itin" }));
            scheduleNext();
          }}
          className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
        >
          {t("filingQuiz.questions.taxIdType.itin")}
        </Button>
      </div>
    </div>
  );

  // Question 5: Filing Year
  const renderFilingYear = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-[#304e5d] font-oswald text-xl font-bold mb-2">
          {t("filingQuiz.questions.filingYear.title")}
        </h3>
      </div>
      <div className="space-y-3">
        <Button
          onClick={() => {
            setAnswers(prev => ({ ...prev, filingYear: "2025_only" }));
            scheduleNext();
          }}
          className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
        >
          {t("filingQuiz.questions.filingYear.only2025")}
        </Button>
        <Button
          onClick={() => {
            setAnswers(prev => ({ ...prev, filingYear: "multiple_years" }));
            scheduleNext();
          }}
          className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
        >
          {t("filingQuiz.questions.filingYear.multipleYears")}
        </Button>
      </div>
    </div>
  );

  // Question 6: Language Assistance
  const renderLanguageAssistance = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-[#304e5d] font-oswald text-xl font-bold mb-2">
          {t("filingQuiz.questions.languageAssistance.title")}
        </h3>
      </div>
      <div className="space-y-3">
        <Button
          onClick={() => {
            setAnswers(prev => ({ ...prev, needsNonEnglishSpanishHelp: true }));
            scheduleNext();
          }}
          className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
        >
          {t("filingQuiz.questions.languageAssistance.yes")}
        </Button>
        <Button
          onClick={() => {
            setAnswers(prev => ({ ...prev, needsNonEnglishSpanishHelp: false }));
            scheduleNext();
          }}
          className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
        >
          {t("filingQuiz.questions.languageAssistance.no")}
        </Button>
      </div>
    </div>
  );

  const questions = [
    renderComputerComfort,
    renderTaxComfort,
    renderLifeEvents,
    renderReceived1099,
    renderTaxIdType,
    renderFilingYear,
    renderLanguageAssistance,
  ];

  const handleNext = () => {
    setDirection("forward");
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleComplete();
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Animation variants for slide transitions
  const slideVariants = {
    enter: (direction: "forward" | "backward") => ({
      x: direction === "forward" ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: "forward" | "backward") => ({
      x: direction === "forward" ? -300 : 300,
      opacity: 0,
    }),
  };

  // Results screen
  const renderOutcome = () => {
    if (!outcome) return null;

    return (
      <div className="space-y-6">
        {/* Outcome copy */}
        <div className="bg-[#faf9f9] p-6 rounded-lg">
          <p className="text-gray-900 text-lg leading-relaxed">
            {t(`filingQuiz.outcomes.${outcome}.copy`)}
          </p>
        </div>

        {/* Buttons based on outcome type */}
        {outcome === "in_person_good_fit" ||
        outcome === "in_person_still_suited" ? (
          <div className="space-y-3">
            <Button
              asChild
              className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
            >
              <a
                href={fileInPersonLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t(`filingQuiz.outcomes.${outcome}.button`)}
              </a>
            </Button>
          </div>
        ) : outcome === "online_with_support" ? (
          <div className="space-y-4">
            <Button
              asChild
              className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
            >
              <a
                href={onlineWithSupportLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("filingQuiz.outcomes.online_with_support.primaryButton")}
              </a>
            </Button>
            <div className="text-center pt-2">
              <a
                href={fileInPersonLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#304e5d] underline hover:no-underline text-sm"
              >
                {t("filingQuiz.outcomes.online_with_support.inPersonLink")}
              </a>
            </div>
          </div>
        ) : outcome === "optimized_diy" ? (
          <div className="space-y-4">
            <Button
              asChild
              className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
            >
              <a
                href={diyFilingLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("filingQuiz.outcomes.optimized_diy.buttons.diy")}
              </a>
            </Button>
            <Button
              asChild
              className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
            >
              <a
                href={freeTaxUsaLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("filingQuiz.outcomes.optimized_diy.buttons.support25")}
              </a>
            </Button>
            <Button
              asChild
              className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
            >
              <a
                href={paidFilingLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("filingQuiz.outcomes.optimized_diy.buttons.paid")}
              </a>
            </Button>
            <div className="text-center pt-2">
              <a
                href={fileInPersonLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#304e5d] underline hover:no-underline text-sm"
              >
                {t("filingQuiz.outcomes.optimized_diy.inPersonLink")}
              </a>
            </div>
          </div>
        ) : (
          // online_and_other
          <div className="space-y-4">
            <Button
              asChild
              className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
            >
              <a
                href={myFreeTaxesLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("filingQuiz.outcomes.online_and_other.buttons.freeOnline")}
              </a>
            </Button>
            <Button
              asChild
              className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
            >
              <a
                href={freeTaxUsaLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("filingQuiz.outcomes.online_and_other.buttons.support25")}
              </a>
            </Button>
            <Button
              asChild
              className="w-full h-auto py-4 bg-[#304e5d] text-white hover:bg-[#263d48]"
            >
              <a
                href={paidFilingLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("filingQuiz.outcomes.online_and_other.buttons.paid")}
              </a>
            </Button>
            <div className="text-center pt-2">
              <a
                href={fileInPersonLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#304e5d] underline hover:no-underline text-sm"
              >
                {t("filingQuiz.outcomes.online_and_other.inPersonLink")}
              </a>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-[#304e5d] font-oswald text-2xl font-bold mb-2">
            {t("filingQuiz.title")}
          </h2>
          <p className="text-gray-700">{t("filingQuiz.subtitle")}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={t("navigation.close")}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Intro text on first question */}
      {!outcome && currentQuestion === 0 && (
        <div className="mb-4">
          <p className="text-gray-700 text-lg leading-relaxed">
            {t("filingQuiz.intro")}
          </p>
        </div>
      )}

      {/* Progress bar */}
      {!outcome && (
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              {t("filingQuiz.progress", {
                current: currentQuestion + 1,
                total: questions.length,
              })}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Question content */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={outcome ? "outcome" : currentQuestion}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            {outcome ? renderOutcome() : questions[currentQuestion]()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {!outcome && currentQuestion > 0 && (
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={handleBack}
            className="border-[#304e5d] text-[#304e5d] hover:bg-[#304e5d]/10"
          >
            {t("navigation.back")}
          </Button>
        </div>
      )}
    </div>
  );
}
