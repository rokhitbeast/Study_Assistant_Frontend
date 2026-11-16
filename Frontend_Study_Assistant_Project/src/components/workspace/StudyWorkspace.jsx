import React, { useState } from 'react';
import {
  LayoutDashboard,
  CheckCircle2,
  Layers,
  HelpCircle,
  BarChart3,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { StudyKitOverview } from '../overview/StudyKitOverview';
import { ConceptChecklistView } from '../checklist/ConceptChecklistView';
import { FlashcardEngine } from '../flashcards/FlashcardEngine';
import { TopicBreakdownChart } from '../breakdown/TopicBreakdownChart';
import { QuizEngine } from '../quiz/QuizEngine';
import { RefinementBar } from '../refinement/RefinementBar';

const WORKSPACE_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'checklist', label: 'Checklist', icon: CheckCircle2 },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle },
];

export function StudyWorkspace({
  studyKit,
  onUpdateStudyKit,
  onNavigateToGenerate,
  onNavigateToResilience,
  onRefine,
  refining,
  flashcardStats,
  onCardStatsChange,
  quizProgress,
  onQuizProgressChange,
}) {
  const [activeTab, setActiveTab] = useState('overview');

  // Handle concept completion state toggle
  const handleToggleConcept = (conceptId) => {
    if (!studyKit || !onUpdateStudyKit) return;

    const updatedChecklist = (studyKit.conceptChecklist || []).map((item) => {
      if (item.id === conceptId) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });

    onUpdateStudyKit({
      ...studyKit,
      conceptChecklist: updatedChecklist,
    });
  };

  const handleMarkAllConcepts = () => {
    if (!studyKit || !onUpdateStudyKit) return;
    const updated = (studyKit.conceptChecklist || []).map((item) => ({ ...item, completed: true }));
    onUpdateStudyKit({ ...studyKit, conceptChecklist: updated });
  };

  const handleResetAllConcepts = () => {
    if (!studyKit || !onUpdateStudyKit) return;
    const updated = (studyKit.conceptChecklist || []).map((item) => ({ ...item, completed: false }));
    onUpdateStudyKit({ ...studyKit, conceptChecklist: updated });
  };

  if (!studyKit) {
    return (
      <StudyKitOverview
        studyKit={null}
        onNavigateToGenerate={onNavigateToGenerate}
        onNavigateToResilience={onNavigateToResilience}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Segmented Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Study Workspace
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
            {studyKit.title}
          </h1>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {WORKSPACE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Surgical AI Refinement Bar */}
      <RefinementBar onRefine={onRefine} refining={refining} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <StudyKitOverview
            studyKit={studyKit}
            onNavigateToGenerate={onNavigateToGenerate}
            onNavigateToResilience={onNavigateToResilience}
          />
          {/* Visual Topic Breakdown Chart with Recharts */}
          <TopicBreakdownChart topicBreakdown={studyKit.topicBreakdown} />
        </div>
      )}

      {/* Tab 2: Concept Checklist */}
      {activeTab === 'checklist' && (
        <ConceptChecklistView
          checklist={studyKit.conceptChecklist}
          onToggleConcept={handleToggleConcept}
          onMarkAll={handleMarkAllConcepts}
          onResetAll={handleResetAllConcepts}
        />
      )}

      {/* Tab 3: Flashcards */}
      {activeTab === 'flashcards' && (
        <FlashcardEngine
          flashcards={studyKit.flashcards}
          cardStats={flashcardStats}
          onCardStatsChange={onCardStatsChange}
          onRefine={onRefine}
          refining={refining}
        />
      )}

      {/* Tab 4: Interactive Quiz Engine */}
      {activeTab === 'quiz' && (
        <QuizEngine
          quizQuestions={studyKit.quizQuestions}
          quizProgress={quizProgress}
          onQuizProgressChange={onQuizProgressChange}
          onRefine={onRefine}
          refining={refining}
        />
      )}
    </div>
  );
}

