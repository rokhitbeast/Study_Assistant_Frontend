import React from 'react';
import { Settings, Cpu, HardDrive, KeyRound, Palette } from 'lucide-react';

export function SettingsView({ darkMode, onToggleDarkMode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Settings & Environment
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Application configuration, model targets, and system parameters.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Engine Configuration
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Primary LLM for structured JSON pedagogical synthesis.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-semibold">
                gemini-2.5-flash
              </span>
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Active Gateway Bridge
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 dark:border-slate-800 flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              API Security Isolation
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Credentials reside strictly in the server environment (.env). The client never accesses or stores API keys.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 dark:border-slate-800 flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
            <Palette className="h-5 w-5" />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Color Theme
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Currently using {darkMode ? 'Dark' : 'Light'} theme.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800 transition"
            >
              Toggle Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

