import React from 'react';
import {
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Eye,
  AlertTriangle,
} from 'lucide-react';

export function QuizCompletionScreen({
  stats,
  isRetestMode,
  onStartRetest,
  onResetQuiz,
  onReviewQuestions,
  onExitRetest,
  onSimplifyWrongItems,
  refining,
}) {
  const { total, correct, wrong, accuracy } = stats;

  const isPerfect = wrong === 0 && total > 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 max-w-xl mx-auto space-y-6">
      {/* Trophy Badge */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
        <Trophy className="h-8 w-8" />
      </div>

      <div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
          {isRetestMode ? 'Retest Complete' : 'Quiz Diagnostic Complete'}
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {isPerfect ? 'Flawless Mastery!' : 'Knowledge Diagnostic Complete'}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {isPerfect
            ? 'You answered every diagnostic question correctly on your first attempt.'
            : 'Review your missed concepts below or request surgical AI simplification to anchor memory retrieval.'}
        </p>
      </div>

      {/* Score Grid */}
      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/60">
        <div>
          <span className="text-[11px] font-semibold uppercase text-slate-400">Accuracy</span>
          <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {accuracy}%
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">Correct</span>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {correct}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase text-rose-600 dark:text-rose-400">Missed</span>
          <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
            {wrong}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {wrong > 0 && !isRetestMode && (
          <button
            type="button"
            onClick={onStartRetest}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-500 transition"
          >
            <RotateCcw className="h-4 w-4" />
            Retest Wrong Answers ({wrong})
          </button>
        )}

        {wrong > 0 && onSimplifyWrongItems && (
          <button
            type="button"
            onClick={onSimplifyWrongItems}
            disabled={refining}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {refining ? 'Simplifying...' : `Simplify Missed Items with AI (${wrong})`}
          </button>
        )}

        {isRetestMode && (
          <button
            type="button"
            onClick={onExitRetest}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition"
          >
            Return to Full Quiz
          </button>
        )}

        <button
          type="button"
          onClick={onReviewQuestions}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
        >
          <Eye className="h-4 w-4" />
          Review All Answers
        </button>

        <button
          type="button"
          onClick={onResetQuiz}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <RotateCcw className="h-3 w-3" />
          Reset Quiz
        </button>
      </div>
    </div>
  );
}

