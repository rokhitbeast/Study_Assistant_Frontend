import React from 'react';
import { Menu, Sun, Moon, Activity, Sparkles, BookOpen, Zap } from 'lucide-react';

export function TopNavbar({
  onToggleSidebar,
  darkMode,
  onToggleDarkMode,
  serverStatus,
  studyKit,
  currentView,
  onSelectView,
}) {
  const getViewTitle = () => {
    switch (currentView) {
      case 'generate':
        return 'Input Studio';
      case 'sessions':
        return 'Study Sessions';
      case 'resilience':
        return 'Resilience Inspector';
      case 'settings':
        return 'Settings & Model Config';
      case 'overview':
      default:
        return 'Overview';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      {/* Left section: mobile toggle + page breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
          aria-label="Toggle navigation sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {getViewTitle()}
          </span>
          {studyKit && currentView === 'overview' && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
              <BookOpen className="h-3 w-3 text-indigo-500" />
              {studyKit.title}
            </span>
          )}
        </div>
      </div>

      {/* Right section: System health + Theme toggle */}
      <div className="flex items-center gap-2.5">
        {/* Quick Toggle: Test AI Resilience */}
        <button
          type="button"
          onClick={() => onSelectView(currentView === 'resilience' ? 'overview' : 'resilience')}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
            currentView === 'resilience'
              ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
              : 'border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/60 dark:text-indigo-300'
          }`}
          title="Toggle AI Resilience Inspector"
        >
          <Zap className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Test AI Resilience</span>
        </button>

        {/* Server Connection Badge */}
        <div
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium dark:border-slate-800 dark:bg-slate-800/60"
          title={
            serverStatus === 'connected'
              ? 'Backend server online and Gemini API operational'
              : serverStatus === 'gemini_missing'
              ? 'Backend online, but GEMINI_API_KEY is not configured in server .env'
              : serverStatus === 'gemini_error'
              ? 'Backend online, but Gemini API requests are failing'
              : serverStatus === 'checking'
              ? 'Checking backend connection...'
              : 'Backend server is unreachable'
          }
        >
          <span
            className={`h-2 w-2 rounded-full ${
              serverStatus === 'connected'
                ? 'bg-emerald-500'
                : serverStatus === 'gemini_missing'
                ? 'bg-amber-500'
                : serverStatus === 'gemini_error'
                ? 'bg-rose-500 animate-pulse'
                : serverStatus === 'checking'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-600'
            }`}
          />
          <span className="hidden sm:inline text-slate-600 dark:text-slate-300">
            {serverStatus === 'connected'
              ? 'API Online'
              : serverStatus === 'gemini_missing'
              ? 'Gemini Key Missing'
              : serverStatus === 'gemini_error'
              ? 'Gemini Failing'
              : serverStatus === 'checking'
              ? 'Connecting...'
              : 'Server Offline'}
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Toggle color theme"
          title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}

