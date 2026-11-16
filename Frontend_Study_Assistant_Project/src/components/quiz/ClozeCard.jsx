import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, CornerDownLeft } from 'lucide-react';

export function ClozeCard({
  question,
  progress,
  onSubmitAnswer,
  onNext,
  isLast,
}) {
  const [inputValue, setInputValue] = useState('');

  const isAnswered = progress?.selectedAnswer !== null && progress?.selectedAnswer !== undefined;
  const isCorrect = progress?.status === 'correct';

  // Sync input value when question changes or if previously answered
  useEffect(() => {
    if (isAnswered) {
      setInputValue(progress.selectedAnswer || '');
    } else {
      setInputValue('');
    }
  }, [question.id, isAnswered, progress?.selectedAnswer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isAnswered) return;
    onSubmitAnswer(inputValue.trim());
  };

  return (
    <div className="space-y-6">
      {/* Question Header & Prompt */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="rounded-md bg-sky-50 px-2.5 py-1 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            Fill-in-the-Blank (Cloze)
          </span>
          {isAnswered && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isCorrect
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" /> Incorrect
                </>
              )}
            </span>
          )}
        </div>

        {/* Cloze Sentence with Blank Highlight */}
        <h2 className="mt-4 text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed font-sans">
          {question.question}
        </h2>
      </div>

      {/* Answer Input Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
      >
        <label
          htmlFor="cloze-input"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          Your Answer
        </label>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              id="cloze-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isAnswered}
              autoFocus
              placeholder="Type the missing word or phrase..."
              className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 disabled:opacity-80 ${
                isAnswered
                  ? isCorrect
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100 font-semibold'
                    : 'border-rose-400 bg-rose-50/40 text-rose-900 dark:bg-rose-950/30 dark:text-rose-100 line-through'
                  : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:border-sky-500 focus:bg-white focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500'
              }`}
            />
          </div>

          {!isAnswered && (
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Submit</span>
              <CornerDownLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Explanation Box upon answering */}
      {isAnswered && (
        <div
          className={`rounded-2xl border p-5 transition-all duration-200 ${
            isCorrect
              ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-950/60 dark:bg-emerald-950/20'
              : 'border-rose-200 bg-rose-50/60 dark:border-rose-950/60 dark:bg-rose-950/20'
          }`}
        >
          <div className="flex items-start gap-3">
            {isCorrect ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1.5 flex-1">
              <h4
                className={`text-sm font-bold ${
                  isCorrect
                    ? 'text-emerald-900 dark:text-emerald-200'
                    : 'text-rose-900 dark:text-rose-200'
                }`}
              >
                {isCorrect
                  ? 'Correct Match'
                  : `Incorrect. Expected: "${question.correctAnswer}" (Your input: "${progress?.selectedAnswer}")`}
              </h4>
              {question.explanation && (
                <p
                  className={`text-xs leading-relaxed ${
                    isCorrect
                      ? 'text-emerald-800 dark:text-emerald-300/90'
                      : 'text-rose-800 dark:text-rose-300/90'
                  }`}
                >
                  {question.explanation}
                </p>
              )}
            </div>
          </div>

          {!isLast && onNext && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition"
              >
                Next Question
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

