import React, { useState } from 'react';
import { CheckCircle2, Circle, CheckSquare, Square, Filter, Sparkles, BookOpen } from 'lucide-react';

export function ConceptChecklistView({
  checklist = [],
  onToggleConcept,
  onMarkAll,
  onResetAll,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'remaining' | 'completed'

  if (!checklist || checklist.length === 0) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
        <CheckCircle2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          No Concepts Available
        </h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
          Generate a study kit from raw notes to populate the active concept checklist.
        </p>
      </div>
    );
  }

  const total = checklist.length;
  const completedCount = checklist.filter((item) => item.completed).length;
  const percentComplete = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const filteredItems = checklist.filter((item) => {
    if (filter === 'remaining') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Progress & Quick Actions Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Concept Mastery Progress
              </span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300">
                {percentComplete}%
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {completedCount} of {total} Concepts Mastered
            </h2>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {completedCount < total ? (
              <button
                type="button"
                onClick={onMarkAll}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition"
              >
                Mark All Complete
              </button>
            ) : (
              <button
                type="button"
                onClick={onResetAll}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition"
              >
                Reset Progress
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        {/* Filter Pills */}
        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800/80">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Filter:
          </span>
          {[
            { id: 'all', label: `All (${total})` },
            { id: 'remaining', label: `Remaining (${total - completedCount})` },
            { id: 'completed', label: `Completed (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                filter === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {filteredItems.map((item, index) => {
          const isCompleted = !!item.completed;
          return (
            <div
              key={item.id}
              onClick={() => onToggleConcept(item.id)}
              className={`group flex items-start gap-4 rounded-2xl border p-4 transition-all duration-150 cursor-pointer ${
                isCompleted
                  ? 'border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-950/50 dark:bg-emerald-950/10'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleConcept(item.id);
                }}
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-300 group-hover:border-indigo-500 dark:border-slate-600'
                }`}
                aria-label={`Mark ${item.title} as ${isCompleted ? 'incomplete' : 'completed'}`}
              >
                {isCompleted && <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                  <h3
                    className={`text-sm font-semibold transition-colors ${
                      isCompleted
                        ? 'text-emerald-900 dark:text-emerald-200 line-through opacity-80'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {item.title}
                  </h3>
                </div>
                {item.description && (
                  <p
                    className={`mt-1 text-xs leading-relaxed ${
                      isCompleted
                        ? 'text-emerald-700 dark:text-emerald-300/80'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No concepts match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}

