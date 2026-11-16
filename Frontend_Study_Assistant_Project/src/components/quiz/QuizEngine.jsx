import React, { useState } from 'react';
import { useQuizRunner } from '../../hooks/useQuizRunner';
import { MCQCard } from './MCQCard';
import { ClozeCard } from './ClozeCard';
import { QuizCompletionScreen } from './QuizCompletionScreen';
import {
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

export function QuizEngine({
  quizQuestions = [],
  quizProgress = {},
  onQuizProgressChange,
  onRefine,
  refining,
}) {
  const {
    activeQuestions,
    currentQuestion,
    currentProgress,
    currentIndex,
    isRetestMode,
    isCurrentPoolComplete,
    stats,
    questionProgress,
    submitAnswer,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    startRetestMode,
    exitRetestMode,
    resetQuiz,
  } = useQuizRunner(quizQuestions, quizProgress, onQuizProgressChange);

  const [viewMode, setViewMode] = useState('quiz'); // 'quiz' | 'completion'

  const handleSimplifyWrongQuestions = async () => {
    if (!onRefine) return;
    const wrongIds = quizQuestions
      .filter((q) => questionProgress[q.id]?.status === 'wrong')
      .map((q) => q.id);
    if (wrongIds.length === 0) return;

    await onRefine(
      'Simplify explanations and add intuitive pedagogical hints for these missed questions to resolve misconceptions.',
      wrongIds
    );
  };

  if (!quizQuestions || quizQuestions.length === 0) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
        <HelpCircle className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          No Quiz Questions in this StudyKit
        </h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
          Generate a study kit from raw notes to practice with adaptive MCQs and cloze questions.
        </p>
      </div>
    );
  }

  const { total, attempted, correct, wrong, accuracy, percentCompleted } = stats;
  const isLastQuestion = currentIndex === activeQuestions.length - 1;

  // Render completion view if finished and user hasn't explicitly clicked "Review"
  if (isCurrentPoolComplete && viewMode === 'completion') {
    return (
      <QuizCompletionScreen
        stats={stats}
        isRetestMode={isRetestMode}
        onStartRetest={() => {
          startRetestMode();
          setViewMode('quiz');
        }}
        onExitRetest={() => {
          exitRetestMode();
          setViewMode('quiz');
        }}
        onResetQuiz={() => {
          resetQuiz();
          setViewMode('quiz');
        }}
        onReviewQuestions={() => setViewMode('quiz')}
        onSimplifyWrongItems={handleSimplifyWrongQuestions}
        refining={refining}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Quiz Dashboard Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isRetestMode ? 'Surgical Retest Mode' : 'Adaptive Diagnostic Quiz'}
              </span>
              {isRetestMode && (
                <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  Targeting Missed Questions
                </span>
              )}
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Question {currentIndex + 1} of {activeQuestions.length}
              </h2>
              <span className="text-xs text-slate-400">
                ({attempted}/{total} answered)
              </span>
            </div>
          </div>

          {/* Retest & Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {wrong > 0 && !isRetestMode && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    startRetestMode();
                    setViewMode('quiz');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retest ({wrong})
                </button>

                {onRefine && (
                  <button
                    type="button"
                    onClick={handleSimplifyWrongQuestions}
                    disabled={refining}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 transition disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {refining ? 'Simplifying...' : `Simplify (${wrong})`}
                  </button>
                )}
              </>
            )}

            {isRetestMode && (
              <button
                type="button"
                onClick={exitRetestMode}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition"
              >
                Exit Retest Mode
              </button>
            )}

            {isCurrentPoolComplete && (
              <button
                type="button"
                onClick={() => setViewMode('completion')}
                className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
              >
                View Results
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Metrics Row */}
        <div className="mt-4 grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950/60">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Answered</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{attempted}/{total}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950/60">
            <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">Correct</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{correct}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950/60">
            <span className="text-[10px] uppercase font-semibold text-rose-600 dark:text-rose-400">Wrong</span>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{wrong}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950/60">
            <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400">Accuracy</span>
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{accuracy}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${percentCompleted}%` }}
          />
        </div>

        {/* Segmented Question Pager Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-2">
          {activeQuestions.map((q, idx) => {
            const status = questionProgress[q.id]?.status || 'unseen';
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => goToQuestion(idx)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition ${
                  isCurrent
                    ? 'ring-2 ring-indigo-500 ring-offset-1 z-10'
                    : ''
                } ${
                  status === 'correct'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : status === 'wrong'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
                title={`Question ${idx + 1} (${status})`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Question Render (MCQ vs Cloze) */}
      {currentQuestion && (
        <div>
          {currentQuestion.type === 'mcq' ? (
            <MCQCard
              key={currentQuestion.id}
              question={currentQuestion}
              progress={currentProgress}
              onSelectOption={(option) => submitAnswer(currentQuestion.id, option)}
              onNext={nextQuestion}
              isLast={isLastQuestion}
            />
          ) : (
            <ClozeCard
              key={currentQuestion.id}
              question={currentQuestion}
              progress={currentProgress}
              onSubmitAnswer={(answer) => submitAnswer(currentQuestion.id, answer)}
              onNext={nextQuestion}
              isLast={isLastQuestion}
            />
          )}
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="text-xs text-slate-400 font-mono">
          {currentIndex + 1} / {activeQuestions.length}
        </div>

        <button
          type="button"
          onClick={isLastQuestion ? () => setViewMode('completion') : nextQuestion}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition"
        >
          <span>{isLastQuestion ? 'View Summary' : 'Next'}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

