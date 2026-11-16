import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  ArrowRight,
  Layers,
  CheckCircle2,
  HelpCircle,
  Trash2,
  RotateCcw,
  Download,
  AlertTriangle,
  X,
} from 'lucide-react';

export function StudySessionsView({
  studyKit,
  onSelectSession,
  onNavigateToGenerate,
  onClearSession,
  onResetProgress,
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExportJson = () => {
    if (!studyKit) return;
    const blob = new Blob([JSON.stringify(studyKit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(studyKit.title || 'study-kit').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!studyKit) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            My Study Sessions
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Saved study kits and active recall sessions persisted in local storage.
          </p>
        </div>

        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Saved Study Sessions
          </h2>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            Generate your first study kit to begin tracking your mastery and retention over time.
          </p>
          <button
            type="button"
            onClick={onNavigateToGenerate}
            className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            Create New Kit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          My Study Sessions
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Saved study kits and active recall sessions persisted in local storage.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Active Persistent Session
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
              {studyKit.title}
            </h2>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {(() => {
                  if (!studyKit.generatedAt) return 'Active';
                  try {
                    const d = new Date(studyKit.generatedAt);
                    return Number.isNaN(d.getTime()) ? 'Active' : d.toLocaleString();
                  } catch {
                    return 'Active';
                  }
                })()}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              title="Download StudyKit as JSON"
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={onSelectSession}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              <span>Open Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-indigo-500" />
            <span>{studyKit.conceptChecklist?.length || 0} Concepts</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Layers className="h-4 w-4 text-violet-500" />
            <span>{studyKit.flashcards?.length || 0} Cards</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <HelpCircle className="h-4 w-4 text-sky-500" />
            <span>{studyKit.quizQuestions?.length || 0} Questions</span>
          </div>
        </div>

        {/* Session Management Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Storage: Automatically saved in browser localStorage
          </span>
          <div className="flex items-center gap-2">
            {onResetProgress && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Progress
              </button>
            )}
            {onClearSession && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/60 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Clear Session */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Clear Saved Study Session?
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  This action will permanently delete the currently saved study kit, flashcards, checklist completion, and quiz progress from your browser.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  if (onClearSession) onClearSession();
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-rose-500 transition"
              >
                Yes, Clear Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset Progress */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reset Learning Progress?
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  This will reset all your quiz answers and flashcard confidence markers to &quot;unseen&quot; so you can practice again from scratch. The study materials themselves will be kept.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  if (onResetProgress) onResetProgress();
                }}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-amber-500 transition"
              >
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

