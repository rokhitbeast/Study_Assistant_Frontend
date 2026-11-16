import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

export function AppLayout({
  darkMode,
  onToggleDarkMode,
  serverStatus,
  studyKit,
  currentView,
  onSelectView,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-150 flex flex-col ${darkMode ? 'dark' : ''}`}>
      <div className="flex flex-1 min-h-screen">
        {/* Responsive Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={onSelectView}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          studyKit={studyKit}
        />

        {/* Content Viewport */}
        <div className="flex flex-1 flex-col min-w-0">
          <TopNavbar
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            darkMode={darkMode}
            onToggleDarkMode={onToggleDarkMode}
            serverStatus={serverStatus}
            studyKit={studyKit}
            currentView={currentView}
            onSelectView={onSelectView}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>

          <footer className="border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
            Adaptive Active-Recall Studio &bull; Academic Pedagogical SaaS Architecture
          </footer>
        </div>
      </div>
    </div>
  );
}
