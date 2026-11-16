import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Shuffle,
  Lightbulb,
  Sparkles,
  Layers,
  Keyboard,
} from 'lucide-react';

export function FlashcardEngine({
  flashcards = [],
  cardStats: externalCardStats = {},
  onCardStatsChange,
  onRefine,
  refining,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Per-card tracking dictionary: { [cardId]: { status: 'unseen'|'correct'|'wrong', userAttempts: number } }
  const [cardStats, setCardStats] = useState(() => {
    const initial = { ...externalCardStats };
    flashcards.forEach((card) => {
      if (!initial[card.id]) {
        initial[card.id] = { status: 'unseen', userAttempts: 0 };
      }
    });
    return initial;
  });

  const handleSimplifyReviewCards = async () => {
    if (!onRefine) return;
    const reviewCardIds = flashcards
      .filter((c) => cardStats[c.id]?.status === 'wrong')
      .map((c) => c.id);
    if (reviewCardIds.length === 0) return;

    await onRefine(
      'Add intuitive mnemonic anchors and simplify the answers for these challenging flashcards.',
      reviewCardIds
    );
  };

  // Sync cardStats when flashcards prop changes
  useEffect(() => {
    setCardStats((prev) => {
      const updated = { ...prev };
      flashcards.forEach((card) => {
        if (!updated[card.id]) {
          updated[card.id] = { status: 'unseen', userAttempts: 0 };
        }
      });
      return updated;
    });
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
        <Layers className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          No Flashcards in this StudyKit
        </h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
          Generate a study kit from raw notes to practice with active recall cards.
        </p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex] || flashcards[0];
  const currentCardStat = cardStats[currentCard.id] || { status: 'unseen', userAttempts: 0 };

  const total = flashcards.length;
  const masteredCount = Object.values(cardStats).filter((s) => s.status === 'correct').length;
  const needsReviewCount = Object.values(cardStats).filter((s) => s.status === 'wrong').length;
  const unseenCount = total - (masteredCount + needsReviewCount);

  // Navigation handlers
  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1 < total ? prev + 1 : 0));
  }, [total]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleMarkConfidence = useCallback(
    (status) => {
      setCardStats((prev) => {
        const existing = prev[currentCard.id] || { status: 'unseen', userAttempts: 0 };
        const updated = {
          ...prev,
          [currentCard.id]: {
            status,
            userAttempts: existing.userAttempts + 1,
          },
        };
        onCardStatsChange?.(updated);
        return updated;
      });

      // Automatically advance to next card after marking
      setTimeout(() => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev + 1 < total ? prev + 1 : 0));
      }, 250);
    },
    [currentCard.id, total, onCardStatsChange]
  );

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '1' || e.key === 'y') {
        e.preventDefault();
        handleMarkConfidence('correct');
      } else if (e.key === '2' || e.key === 'n') {
        e.preventDefault();
        handleMarkConfidence('wrong');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleMarkConfidence]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Deck Stats & Progress Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Recall Deck
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Card {currentIndex + 1} of {total}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Difficulty: {currentCard.difficulty}
              </span>
            </div>
          </div>

          {/* Mastery breakdown badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              {masteredCount} Got It
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 dark:bg-amber-950/70 dark:text-amber-300">
              <RotateCw className="h-3 w-3" />
              {needsReviewCount} Review
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {unseenCount} Unseen
            </span>

            {needsReviewCount > 0 && onRefine && (
              <button
                type="button"
                onClick={handleSimplifyReviewCards}
                disabled={refining}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-1 font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 transition disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3" />
                {refining ? 'Simplifying...' : `Simplify (${needsReviewCount})`}
              </button>
            )}
          </div>
        </div>

        {/* Deck Progress Bar */}
        <div className="mt-4 flex h-2 w-full gap-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          {flashcards.map((card, idx) => {
            const stat = cardStats[card.id]?.status || 'unseen';
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={card.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsFlipped(false);
                }}
                className={`h-full flex-1 transition-all cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-indigo-500 ring-offset-1 z-10'
                    : ''
                } ${
                  stat === 'correct'
                    ? 'bg-emerald-500'
                    : stat === 'wrong'
                    ? 'bg-amber-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
                title={`Card ${idx + 1} (${stat})`}
              />
            );
          })}
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div className="perspective-1000 w-full min-h-[320px] sm:min-h-[360px]">
        <div
          onClick={handleFlip}
          className={`relative w-full h-full min-h-[320px] sm:min-h-[360px] rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition-transform duration-500 transform-style-3d cursor-pointer select-none dark:border-slate-800 dark:bg-slate-900 ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Card Front */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 backface-hidden">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Front &bull; Question Prompt
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  currentCardStat.status === 'correct'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : currentCardStat.status === 'wrong'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {currentCardStat.status === 'correct'
                  ? 'Mastered ✓'
                  : currentCardStat.status === 'wrong'
                  ? 'Needs Review ↺'
                  : 'Unseen'}
              </span>
            </div>

            <div className="my-auto py-4">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed text-center">
                {currentCard.front}
              </h3>
            </div>

            <div className="flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 gap-1.5">
              <RotateCw className="h-3.5 w-3.5" />
              <span>Click card or press Space to flip</span>
            </div>
          </div>

          {/* Card Back */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 backface-hidden rotate-y-180 bg-slate-50/90 dark:bg-slate-950/90 rounded-2xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Back &bull; Definite Answer
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Attempts: {currentCardStat.userAttempts}
              </span>
            </div>

            <div className="my-auto py-4 space-y-4">
              <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed text-center">
                {currentCard.back}
              </p>

              {currentCard.mnemonic_hint && (
                <div className="mx-auto max-w-lg rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Mnemonic Anchor: </span>
                      <span>{currentCard.mnemonic_hint}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 gap-1.5">
              <RotateCw className="h-3.5 w-3.5" />
              <span>Click card or press Space to flip back</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Actions & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
            title="Previous card (Left Arrow)"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <button
            type="button"
            onClick={handleFlip}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
          >
            <RotateCw className="h-3.5 w-3.5 text-indigo-500" />
            Flip
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
            title="Next card (Right Arrow)"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Confidence Evaluation Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleMarkConfidence('wrong')}
            className="flex-1 sm:flex-none flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 transition"
            title="Press '2' or 'n'"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Needs Review (2)
          </button>
          <button
            type="button"
            onClick={() => handleMarkConfidence('correct')}
            className="flex-1 sm:flex-none flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
            title="Press '1' or 'y'"
          >
            <CheckCircle2 className="h-4 w-4" />
            Got It! (1)
          </button>
        </div>
      </div>

      {/* Keyboard Shortcut Hint Pill */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 pt-2">
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] font-mono dark:border-slate-800 dark:bg-slate-800">
            Space
          </kbd>
          Flip
        </span>
        <span>&bull;</span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] font-mono dark:border-slate-800 dark:bg-slate-800">
            &larr; / &rarr;
          </kbd>
          Navigate
        </span>
        <span>&bull;</span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] font-mono dark:border-slate-800 dark:bg-slate-800">
            1
          </kbd>
          Got It
        </span>
        <span>&bull;</span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] font-mono dark:border-slate-800 dark:bg-slate-800">
            2
          </kbd>
          Review
        </span>
      </div>
    </div>
  );
}

