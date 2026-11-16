import React, { useState } from 'react';
import { Sparkles, Loader2, Send, Wand2, X, CheckCircle2, AlertCircle } from 'lucide-react';

const SUGGESTIONS = [
  'Make the quiz harder with nuanced distractors',
  'Simplify all explanations with plain-language definitions',
  'Add 3 advanced flashcards on edge cases',
  'Add real-world analogies to complex concepts',
  'Strengthen explanations for tricky concepts',
];

export function RefinementBar({
  onRefine,
  refining,
  targetItemIds = [],
  onClearTargets,
}) {
  const [instruction, setInstruction] = useState('');
  const [notification, setNotification] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!instruction.trim() || refining) return;

    setNotification(null);
    const result = await onRefine(instruction.trim(), targetItemIds);

    if (result?.success) {
      setNotification({
        type: 'success',
        message: result.summary || 'Surgical refinement applied successfully.',
      });
      setInstruction('');
      if (onClearTargets) onClearTargets();
    } else if (result?.error) {
      setNotification({
        type: 'error',
        message: result.error.message || 'Surgical refinement failed. Your existing study kit remains unchanged.',
      });
    }
  };

  const handleApplySuggestion = (suggestion) => {
    setInstruction(suggestion);
  };

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm dark:border-indigo-950/60 dark:bg-slate-900 space-y-4">
      {/* Header and Scope Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Wand2 className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Surgical AI Refinement
          </span>
        </div>

        {targetItemIds.length > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/70 dark:text-amber-300">
            <span>Targeting {targetItemIds.length} item{targetItemIds.length > 1 ? 's' : ''}</span>
            {onClearTargets && (
              <button
                type="button"
                onClick={onClearTargets}
                className="hover:text-amber-900 dark:hover:text-amber-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Input Field & Submit */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={refining}
            placeholder="e.g. 'Make the quiz harder', 'Add analogies to card #2', 'Add 3 flashcards'..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:border-indigo-500 disabled:opacity-60"
          />
          {instruction && !refining && (
            <button
              type="button"
              onClick={() => setInstruction('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!instruction.trim() || refining}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {refining ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Refining...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Apply Refinement</span>
            </>
          )}
        </button>
      </form>

      {/* Suggestions Row */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
          Suggestions:
        </span>
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            disabled={refining}
            onClick={() => handleApplySuggestion(s)}
            className="rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-indigo-500/60 dark:hover:text-indigo-300 transition disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl p-3 text-xs ${
            notification.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-950/70 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'border border-rose-200 bg-rose-50/70 text-rose-900 dark:border-rose-950/70 dark:bg-rose-950/40 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>

          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

