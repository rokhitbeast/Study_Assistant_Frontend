import React from 'react';
import { Sparkles, Moon, Sun, Activity, Zap } from 'lucide-react';

export function Header({ darkMode, onToggleDarkMode, serverStatus }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20 text-white">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                ActiveRecall<span className="text-indigo-600 dark:text-indigo-400">Studio</span>
              </span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Adaptive AI-Powered Active Recall & Retention Assistant
            </p>
          </div>
        </div>

        {/* Status indicator & Theme Toggle */}
        <div className="flex items-center gap-3">
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
                  ? 'bg-emerald-500 animate-pulse'
                  : serverStatus === 'gemini_missing'
                  ? 'bg-amber-500'
                  : serverStatus === 'gemini_error'
                  ? 'bg-rose-500 animate-pulse'
                  : serverStatus === 'checking'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-600'
              }`}
            />
            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Activity className="h-3 w-3" />
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

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}

