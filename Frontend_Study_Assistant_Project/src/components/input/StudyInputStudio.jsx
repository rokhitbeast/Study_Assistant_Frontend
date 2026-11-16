import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RotateCcw,
  Trash2,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { loadDraftNotes, saveDraftNotes, clearDraftNotes } from '../../services/storageService.js';

const SAMPLE_PRESETS = [
  {
    name: 'Cellular Respiration',
    title: 'Cellular Respiration & Mitochondria',
    text: `Mitochondria are double-membrane-bound organelles found in most eukaryotic organisms.
They generate most of the chemical energy needed to power the cell's biochemical reactions through cellular respiration.
Chemical energy produced by the mitochondria is stored in adenosine triphosphate (ATP).
The outer membrane contains large numbers of integral membrane proteins called porins.
The inner membrane is folded into cristae to expand the surface area for ATP synthase.
Mitochondria possess their own independent circular genome (mtDNA) and replicate via binary fission.`,
  },
  {
    name: 'React Hooks & Fiber',
    title: 'React Concurrent Mode & Hooks',
    text: `React hooks allow functional components to utilize local state and lifecycle features without writing ES6 class components.
useState declares reactive state variables and returns a pair with the current value and a dispatch updater.
useEffect runs side effects after layout paint. Its dependency array controls re-execution using shallow Object.is comparisons.
React Fiber is the reconciler architecture that enables incremental rendering and pause/resume capabilities for concurrent UI transitions.
Custom hooks encapsulate stateful domain logic while adhering to the top-level-only call rule.`,
  },
  {
    name: 'Event Loop & Concurrency',
    title: 'JavaScript Event Loop & Microtasks',
    text: `JavaScript runs in a single-threaded runtime driven by an event loop.
The Call Stack handles synchronous execution contexts in LIFO order.
Asynchronous completions are scheduled in task queues: the Microtask Queue (Promise reactions, queueMicrotask, MutationObserver) and the Macrotask Queue (setTimeout, setInterval, I/O events).
The microtask queue takes absolute precedence and must be completely exhausted before the event loop advances to the next macrotask turn.`,
  },
];

export function StudyInputStudio({
  onGenerate,
  loading,
  error,
  warnings = [],
  onRetry,
  onCancel,
  onClearError,
  studyKit,
  onViewStudyKit,
  serverStatus,
  serverHealth,
}) {
  // Restore draft notes if user reloads page
  const [sourceText, setSourceText] = useState(() => {
    return loadDraftNotes().text || '';
  });
  const [title, setTitle] = useState(() => {
    return loadDraftNotes().title || '';
  });

  // Automatically save draft to localStorage as user types
  useEffect(() => {
    saveDraftNotes(sourceText, title);
  }, [sourceText, title]);

  const charCount = sourceText.length;
  const isInputValid = charCount >= 10 && charCount <= 50000;
  const isTooShort = charCount > 0 && charCount < 10;
  const isTooLong = charCount > 50000;

  const handleClear = () => {
    setSourceText('');
    setTitle('');
    clearDraftNotes();
    if (onClearError) onClearError();
  };

  const handleApplyPreset = (preset) => {
    setTitle(preset.title);
    setSourceText(preset.text);
    if (onClearError) onClearError();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isInputValid || loading) return;
    onGenerate(sourceText, { title: title.trim() || undefined });
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Input Studio
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Paste your raw notes, lecture transcripts, or technical documentation. The AI will transform it into an active recall study kit.
        </p>
      </div>

      {/* Preset Pill Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
          Sample Notes:
        </span>
        {SAMPLE_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            disabled={loading}
            onClick={() => handleApplyPreset(preset)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400 disabled:opacity-50"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Configuration Status Notice */}
      {serverStatus === 'gemini_missing' && !error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Gemini API Configuration Missing
              </h3>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                The backend server is online, but <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">GEMINI_API_KEY</code> is not configured in the server environment. Please set a valid key in the server <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">.env</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gemini API Request Failing Notice */}
      {serverStatus === 'gemini_error' && !error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900/60 dark:bg-rose-950/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                Gemini API Request Failing
              </h3>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                {serverHealth?.gemini?.message || 'The backend server is online, but requests to the Gemini API are currently failing. Check your credentials or network connectivity.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner with Retry */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900/60 dark:bg-rose-950/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                  {error.code ? `Generation Failed (${error.code})` : 'Generation Failed'}
                </h3>
                <p className="mt-1 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  {error.message || 'An error occurred while generating the study kit.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 transition disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry
                </button>
              )}
              {onClearError && (
                <button
                  type="button"
                  onClick={onClearError}
                  className="rounded-lg p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                  aria-label="Dismiss error"
                >
                  <span className="text-sm font-bold">&times;</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warnings / Partial Recovery Notice */}
      {warnings && warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Resilience Notice: Partial Recovery Applied ({warnings.length} warning{warnings.length > 1 ? 's' : ''})
              </h3>
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                Some items failed strict validation and were safely excluded without halting generation.
              </p>
              <ul className="mt-2 space-y-1 text-[11px] text-amber-800 dark:text-amber-300/90 list-disc list-inside">
                {warnings.slice(0, 3).map((w, idx) => (
                  <li key={idx}>
                    {w.field ? `${w.field}: ` : ''}{w.reason}
                  </li>
                ))}
                {warnings.length > 3 && (
                  <li>...and {warnings.length - 3} more items in Resilience Inspector</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Successful Generation Quick Alert */}
      {studyKit && !loading && !error && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  StudyKit Ready: "{studyKit.title}"
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Generated {studyKit.conceptChecklist?.length || 0} concepts, {studyKit.flashcards?.length || 0} flashcards, and {studyKit.quizQuestions?.length || 0} questions.
                </p>
              </div>
            </div>
            {onViewStudyKit && (
              <button
                type="button"
                onClick={onViewStudyKit}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
              >
                View Overview
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5"
      >
        {/* Optional Title Field */}
        <div>
          <label
            htmlFor="topic-title"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            Topic Title (Optional)
          </label>
          <input
            id="topic-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            placeholder="e.g., Cellular Respiration & ATP Synthesis"
            maxLength={120}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-950 disabled:opacity-60"
          />
        </div>

        {/* Raw Study Notes Textarea */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="source-notes"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Raw Study Material / Notes <span className="text-rose-500">*</span>
            </label>
            <span
              className={`text-xs font-mono ${
                isTooShort
                  ? 'text-amber-500 font-semibold'
                  : isTooLong
                  ? 'text-rose-500 font-semibold'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {charCount.toLocaleString()} / 50,000 characters
            </span>
          </div>

          <textarea
            id="source-notes"
            rows={10}
            value={sourceText}
            onChange={(e) => {
              setSourceText(e.target.value);
              if (error && onClearError) onClearError();
            }}
            disabled={loading}
            placeholder="Paste your raw study notes, textbook excerpts, slide transcripts, or concepts here..."
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-950 disabled:opacity-60 font-sans leading-relaxed resize-y"
          />

          {isTooShort && (
            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
              Please enter at least 10 characters to give the model sufficient study context.
            </p>
          )}
          {isTooLong && (
            <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
              Input exceeds maximum size of 50,000 characters. Please shorten your excerpt.
            </p>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={handleClear}
            disabled={loading || charCount === 0}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Notes
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {loading && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:bg-slate-900 dark:text-rose-400 transition"
              >
                <XCircle className="h-4 w-4" />
                Cancel Generation
              </button>
            )}

            <button
              type="submit"
              disabled={!isInputValid || loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Synthesizing StudyKit...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Study Kit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

