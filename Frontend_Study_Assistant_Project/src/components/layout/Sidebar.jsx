import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Settings,
  Zap,
  Layers,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'generate', label: 'Generate Study Kit', icon: Sparkles, badge: 'AI' },
  { id: 'sessions', label: 'My Study Sessions', icon: BookOpen },
  { id: 'resilience', label: 'Resilience Inspector', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  currentView,
  onSelectView,
  isOpen,
  onClose,
  studyKit,
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-6 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              <span>ActiveRecall</span>
              <span className="text-indigo-600 dark:text-indigo-400">Studio</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Academic AI Assistant</p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Workspace
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    if (onClose) onClose();
                  }}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Active Study Session Indicator Badge */}
        <div className="border-t border-slate-200/80 p-4 dark:border-slate-800">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Active Kit</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  studyKit ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </div>
            {studyKit ? (
              <div className="mt-2">
                <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200" title={studyKit.title}>
                  {studyKit.title}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-0.5">
                    <CheckCircle2 className="h-3 w-3 text-indigo-500" />
                    {studyKit.conceptChecklist?.length || 0}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-0.5">
                    <Layers className="h-3 w-3 text-violet-500" />
                    {studyKit.flashcards?.length || 0}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-0.5">
                    <HelpCircle className="h-3 w-3 text-sky-500" />
                    {studyKit.quizQuestions?.length || 0}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 italic">
                No active study session. Generate a kit to start.
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

