import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, Keyboard } from 'lucide-react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function MCQCard({
  question,
  progress,
  onSelectOption,
  onNext,
  isLast,
}) {
  const isAnswered = progress?.selectedAnswer !== null && progress?.selectedAnswer !== undefined;
  const isCorrect = progress?.status === 'correct';
  const selectedAnswer = progress?.selectedAnswer;

  // Keyboard shortcut support: Keys 1–4 to select options
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Do not trigger shortcuts while typing in inputs or textareas
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.isComposing ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey
      ) {
        return;
      }

      if (!isAnswered) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (question.options && question.options[idx]) {
            e.preventDefault();
            onSelectOption(question.options[idx]);
          }
        }
      } else if (isAnswered && !isLast && onNext) {
        if (e.key === 'Enter' || e.key === 'ArrowRight') {
          e.preventDefault();
          onNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isLast, onNext, onSelectOption, question.options]);

  return (
    <div className="space-y-6">
      {/* Question Header & Badge */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            Multiple Choice Question
          </span>
          <div className="flex items-center gap-2">
            {!isAnswered && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                <Keyboard className="h-3 w-3" />
                Press keys 1–4 to answer
              </span>
            )}
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
        </div>

        {/* Question Prompt */}
        <h2 className="mt-4 text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
          {question.question}
        </h2>
      </div>

      {/* Options Grid */}
      <div className="space-y-3">
        {question.options.map((option, idx) => {
          const letter = OPTION_LABELS[idx] || String(idx + 1);
          const isSelected = selectedAnswer === option;
          const isTargetCorrect = option === question.correctAnswer;

          let optionStyle =
            'border-slate-200/80 bg-white hover:border-indigo-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700';

          if (isAnswered) {
            if (isTargetCorrect) {
              // Highlight the correct answer in green
              optionStyle =
                'border-emerald-500 bg-emerald-50/70 text-emerald-950 dark:border-emerald-500/80 dark:bg-emerald-950/40 dark:text-emerald-100 font-semibold ring-1 ring-emerald-500/30';
            } else if (isSelected && !isCorrect) {
              // Highlight the selected wrong answer in red
              optionStyle =
                'border-rose-400 bg-rose-50/70 text-rose-950 dark:border-rose-500/80 dark:bg-rose-950/40 dark:text-rose-100 line-through ring-1 ring-rose-400/30';
            } else {
              // Dim unselected wrong options
              optionStyle =
                'border-slate-200/50 bg-slate-50/40 text-slate-400 dark:border-slate-800/50 dark:bg-slate-950/40 dark:text-slate-500 opacity-60';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => onSelectOption(option)}
              className={`group flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-all ${optionStyle} disabled:cursor-default`}
            >
              {/* Option Letter Indicator */}
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  isAnswered && isTargetCorrect
                    ? 'bg-emerald-600 text-white'
                    : isAnswered && isSelected && !isCorrect
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {isAnswered && isTargetCorrect ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isAnswered && isSelected && !isCorrect ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  letter
                )}
              </span>

              {/* Option Text */}
              <span className="flex-1 text-sm font-medium leading-relaxed">
                {option}
              </span>

              {/* Keyboard Shortcut Hint Pill */}
              {!isAnswered && (
                <span className="hidden sm:inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  [{idx + 1}]
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Immediate Explanation Card (Reveals upon answer) */}
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
                  ? 'Correct Analysis'
                  : `Incorrect. The correct answer is: "${question.correctAnswer}"`}
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

          {/* Quick Continue Button */}
          {!isLast && onNext && (
            <div className="mt-4 flex items-center justify-between">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                <Keyboard className="h-3 w-3" />
                Press <kbd className="px-1 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 font-mono text-[10px]">Enter</kbd> or <kbd className="px-1 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 font-mono text-[10px]">→</kbd> for next
              </span>
              <button
                type="button"
                onClick={onNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition ml-auto"
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

