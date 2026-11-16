import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { StudyWorkspace } from './components/workspace/StudyWorkspace';
import { StudyInputStudio } from './components/input/StudyInputStudio';
import { StudySessionsView } from './components/sessions/StudySessionsView';
import { ResilienceInspector } from './components/resilience/ResilienceInspector';
import { SettingsView } from './components/settings/SettingsView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useStudyGenerator } from './hooks/useStudyGenerator';
import { checkServerHealth } from './services/apiClient';
import {
  loadStudySession,
  saveStudySession,
  clearStudySession,
} from './services/storageService';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem('activeRecall_theme') === 'dark' ||
      (!('activeRecall_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  // Restore saved session from localStorage on initial render
  const [savedSession] = useState(() => loadStudySession());

  // Navigation state
  const [currentView, setCurrentView] = useState('overview');

  // Server health state: 'connected' | 'checking' | 'disconnected' | 'gemini_missing' | 'gemini_error'
  const [serverStatus, setServerStatus] = useState('checking');
  const [serverHealth, setServerHealth] = useState(null);

  // Study generation hook initialized with persisted StudyKit
  const {
    studyKit,
    setStudyKit,
    loading,
    refining,
    error,
    warnings,
    generateStudyKit,
    refineStudyKit,
    retry,
    cancelRequest,
    clearError,
  } = useStudyGenerator({
    initialStudyKit: savedSession?.studyKit || null,
  });

  // Persisted Flashcard and Quiz attempt states
  const [flashcardStats, setFlashcardStats] = useState(
    () => savedSession?.flashcardStats || {}
  );
  const [quizProgress, setQuizProgress] = useState(
    () => savedSession?.quizProgress || {}
  );

  // Automatically persist session changes to localStorage
  // Safe guard: Never overwrite existing valid saved session with null
  useEffect(() => {
    if (studyKit) {
      saveStudySession({
        studyKit,
        flashcardStats,
        quizProgress,
      });
    }
  }, [studyKit, flashcardStats, quizProgress]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('activeRecall_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('activeRecall_theme', 'light');
    }
  }, [darkMode]);

  // Server health polling
  useEffect(() => {
    const controller = new AbortController();

    async function verifyConnection() {
      try {
        setServerStatus('checking');
        const health = await checkServerHealth(controller.signal);
        setServerHealth(health);

        if (health?.gemini?.status === 'missing_config') {
          setServerStatus('gemini_missing');
        } else if (health?.gemini?.status === 'error') {
          setServerStatus('gemini_error');
        } else {
          setServerStatus('connected');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[Health Check Failed]:', err);
          setServerStatus('disconnected');
          setServerHealth(null);
        }
      }
    }

    verifyConnection();
    const interval = setInterval(verifyConnection, 30000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleGenerate = async (sourceText, options) => {
    // Fresh generation resets flashcard and quiz progress
    setFlashcardStats({});
    setQuizProgress({});
    const result = await generateStudyKit(sourceText, options);
    if (result.success) {
      setCurrentView('overview');
    }
  };

  const handleClearSession = () => {
    clearStudySession();
    setStudyKit(null);
    setFlashcardStats({});
    setQuizProgress({});
  };

  const handleResetProgress = () => {
    setFlashcardStats({});
    setQuizProgress({});
  };

  return (
    <AppLayout
      darkMode={darkMode}
      onToggleDarkMode={toggleDarkMode}
      serverStatus={serverStatus}
      studyKit={studyKit}
      currentView={currentView}
      onSelectView={setCurrentView}
    >
      <ErrorBoundary key={currentView}>
        {currentView === 'overview' && (
          <StudyWorkspace
            studyKit={studyKit}
            onUpdateStudyKit={setStudyKit}
            onNavigateToGenerate={() => setCurrentView('generate')}
            onNavigateToResilience={() => setCurrentView('resilience')}
            onRefine={refineStudyKit}
            refining={refining}
            flashcardStats={flashcardStats}
            onCardStatsChange={setFlashcardStats}
            quizProgress={quizProgress}
            onQuizProgressChange={setQuizProgress}
          />
        )}

        {currentView === 'generate' && (
          <StudyInputStudio
            onGenerate={handleGenerate}
            loading={loading}
            error={error}
            warnings={warnings}
            onRetry={retry}
            onCancel={cancelRequest}
            onClearError={clearError}
            studyKit={studyKit}
            onViewStudyKit={() => setCurrentView('overview')}
            serverStatus={serverStatus}
            serverHealth={serverHealth}
          />
        )}

        {currentView === 'sessions' && (
          <StudySessionsView
            studyKit={studyKit}
            onSelectSession={() => setCurrentView('overview')}
            onNavigateToGenerate={() => setCurrentView('generate')}
            onClearSession={handleClearSession}
            onResetProgress={handleResetProgress}
          />
        )}

        {currentView === 'resilience' && (
          <ResilienceInspector
            serverStatus={serverStatus}
            warnings={warnings}
            studyKit={studyKit}
            onApplyKitToSession={setStudyKit}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        )}
      </ErrorBoundary>
    </AppLayout>
  );
}
