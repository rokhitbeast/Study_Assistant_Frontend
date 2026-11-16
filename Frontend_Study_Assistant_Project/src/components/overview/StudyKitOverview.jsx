import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { formatGeneratedDate } from '../../utils/formatDate.js';

export { formatGeneratedDate };

export function StudyKitOverview({
  studyKit,
  onNavigateToGenerate,
  onNavigateToResilience,
}) {
  const [showSourceText, setShowSourceText] = useState(false);

  // Empty State: when no study session is loaded
  if (!studyKit) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 mb-4 shadow-sm">
          <BookOpen className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          No Active Study Kit
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Transform your raw technical documentation, lecture notes, or study materials into an active-recall mastery system.
        </p>
        <button
          type="button"
          onClick={onNavigateToGenerate}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition"
        >
          <Sparkles className="h-4 w-4" />
          Open Input Studio
        </button>
      </div>
    );
  }

  // Count breakdowns
  const checklistCount = studyKit.conceptChecklist?.length || 0;
  const completedChecklist = studyKit.conceptChecklist?.filter((c) => c.completed).length || 0;

  const flashcardCount = studyKit.flashcards?.length || 0;
  const hardCards = studyKit.flashcards?.filter((f) => f.difficulty === 'hard').length || 0;
  const medCards = studyKit.flashcards?.filter((f) => f.difficulty === 'medium').length || 0;
  const easyCards = studyKit.flashcards?.filter((f) => f.difficulty === 'easy').length || 0;

  const quizCount = studyKit.quizQuestions?.length || 0;
  const mcqCount = studyKit.quizQuestions?.filter((q) => q.type === 'mcq').length || 0;
  const clozeCount = studyKit.quizQuestions?.filter((q) => q.type === 'cloze').length || 0;

  const topicCount = studyKit.topicBreakdown?.length || 0;

  return (
    <div className="space-y-6">
      {/* Kit Banner Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
              <Sparkles className="h-3 w-3" />
              Active Study Session
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {studyKit.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatGeneratedDate(studyKit.generatedAt)}
              </span>
              <span>&bull;</span>
              <span>ID: {studyKit.id || 'N/A'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToGenerate}
            className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Generate Another Kit
          </button>
        </div>

        {/* Collapsible Source Material Drawer */}
        {studyKit.sourceText && (
          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowSourceText((prev) => !prev)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>{showSourceText ? 'Hide Source Material' : 'View Source Material'}</span>
              <span className="text-slate-400 font-normal">({(studyKit.sourceText?.length || 0).toLocaleString()} chars)</span>
              {showSourceText ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showSourceText && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 max-h-60 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {studyKit.sourceText}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Structured Modules Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Module 1: Concept Checklist */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-3">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Checklist
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {checklistCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              concepts
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {completedChecklist} marked mastered
          </p>
        </div>

        {/* Module 2: Flashcards */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400 mb-3">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Flashcards
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {flashcardCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              retrieval cards
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{easyCards} easy</span>
            <span>&bull;</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">{medCards} med</span>
            <span>&bull;</span>
            <span className="text-rose-600 dark:text-rose-400 font-medium">{hardCards} hard</span>
          </div>
        </div>

        {/* Module 3: Quiz Questions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 mb-3">
            <HelpCircle className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Diagnostic Quizzes
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {quizCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              questions
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{mcqCount} MCQs</span>
            <span>&bull;</span>
            <span>{clozeCount} Cloze</span>
          </div>
        </div>

        {/* Module 4: Topic Coverage */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mb-3">
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Curriculum Coverage
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {topicCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              subtopics
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate">
            Mapped by depth & difficulty
          </p>
        </div>
      </div>

      {/* Topic Breakdown Preview */}
      {studyKit.topicBreakdown && studyKit.topicBreakdown.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Domain Coverage Breakdown
          </h3>
          <div className="space-y-3">
            {studyKit.topicBreakdown.map((t) => (
              <div key={t.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{t.topic}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`capitalize px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.difficulty === 'hard'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                          : t.difficulty === 'medium'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                      }`}
                    >
                      {t.difficulty}
                    </span>
                    <span className="font-mono text-slate-500">{t.coverage}%</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, t.coverage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

