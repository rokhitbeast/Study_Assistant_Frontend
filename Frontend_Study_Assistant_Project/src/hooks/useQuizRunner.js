import { useState, useMemo, useCallback } from 'react';

/**
 * Custom Hook: useQuizRunner
 * 
 * Manages all quiz state transitions, answers evaluation, attempts tracking,
 * and seamless Retest Mode without mutating the underlying StudyKit.
 *
 * @param {Array<object>} quizQuestions - Full array of MCQ & Cloze questions
 */
export function useQuizRunner(quizQuestions = [], initialProgress = {}, onProgressChange = null) {
  // Question tracking dictionary:
  // { [questionId]: { status: 'unseen' | 'correct' | 'wrong', userAttempts: number, selectedAnswer: string | null } }
  const [questionProgress, setQuestionProgress] = useState(() => {
    const initial = { ...initialProgress };
    quizQuestions.forEach((q) => {
      if (!initial[q.id]) {
        initial[q.id] = {
          status: 'unseen',
          userAttempts: 0,
          selectedAnswer: null,
        };
      }
    });
    return initial;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRetestMode, setIsRetestMode] = useState(false);

  // Sync if quizQuestions prop changes
  useMemo(() => {
    setQuestionProgress((prev) => {
      const updated = { ...prev };
      quizQuestions.forEach((q) => {
        if (!updated[q.id]) {
          updated[q.id] = {
            status: 'unseen',
            userAttempts: 0,
            selectedAnswer: null,
          };
        }
      });
      return updated;
    });
  }, [quizQuestions]);

  // Active question pool: either full quiz or filtered to wrong questions
  const activeQuestions = useMemo(() => {
    if (!isRetestMode) {
      return quizQuestions;
    }
    return quizQuestions.filter((q) => questionProgress[q.id]?.status === 'wrong');
  }, [quizQuestions, isRetestMode, questionProgress]);

  const currentQuestion = activeQuestions[currentIndex] || activeQuestions[0] || null;
  const currentProgress = currentQuestion
    ? questionProgress[currentQuestion.id] || { status: 'unseen', userAttempts: 0, selectedAnswer: null }
    : null;

  // Stats across the entire quiz deck
  const stats = useMemo(() => {
    const total = quizQuestions.length;
    let attempted = 0;
    let correct = 0;
    let wrong = 0;

    quizQuestions.forEach((q) => {
      const p = questionProgress[q.id];
      if (p) {
        if (p.status !== 'unseen') attempted++;
        if (p.status === 'correct') correct++;
        if (p.status === 'wrong') wrong++;
      }
    });

    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const percentCompleted = total > 0 ? Math.round((attempted / total) * 100) : 0;

    return {
      total,
      attempted,
      correct,
      wrong,
      accuracy,
      percentCompleted,
    };
  }, [quizQuestions, questionProgress]);

  // Active pool completion state
  const isCurrentPoolComplete = useMemo(() => {
    if (activeQuestions.length === 0) return true;
    return activeQuestions.every((q) => questionProgress[q.id]?.status !== 'unseen');
  }, [activeQuestions, questionProgress]);

  /**
   * Submit answer for a question with normalization and immediate checking.
   */
  const submitAnswer = useCallback(
    (questionId, rawAnswer) => {
      const targetQuestion = quizQuestions.find((q) => q.id === questionId);
      if (!targetQuestion) return;

      const existing = questionProgress[questionId] || {
        status: 'unseen',
        userAttempts: 0,
        selectedAnswer: null,
      };

      // Prevent accidental re-submission if already answered in this view session
      // (Unless user explicitly requested a retest)
      if (existing.selectedAnswer !== null && !isRetestMode) {
        return;
      }

      let isCorrect = false;

      if (targetQuestion.type === 'mcq') {
        isCorrect = String(rawAnswer).trim() === String(targetQuestion.correctAnswer).trim();
      } else if (targetQuestion.type === 'cloze') {
        // Normalize case and surrounding whitespace
        const normalizedInput = String(rawAnswer).trim().toLowerCase();
        const normalizedTarget = String(targetQuestion.correctAnswer).trim().toLowerCase();
        isCorrect = normalizedInput === normalizedTarget;
      }

      const newStatus = isCorrect ? 'correct' : 'wrong';

      setQuestionProgress((prev) => {
        const updated = {
          ...prev,
          [questionId]: {
            status: newStatus,
            userAttempts: (prev[questionId]?.userAttempts || 0) + 1,
            selectedAnswer: rawAnswer,
          },
        };
        onProgressChange?.(updated);
        return updated;
      });

      return { isCorrect, newStatus };
    },
    [quizQuestions, questionProgress, isRetestMode, onProgressChange]
  );

  const nextQuestion = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1 < activeQuestions.length ? prev + 1 : prev));
  }, [activeQuestions.length]);

  const prevQuestion = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : 0));
  }, []);

  const goToQuestion = useCallback(
    (index) => {
      if (index >= 0 && index < activeQuestions.length) {
        setCurrentIndex(index);
      }
    },
    [activeQuestions.length]
  );

  /**
   * Enters Retest Mode: focuses exclusively on questions marked 'wrong'.
   */
  const startRetestMode = useCallback(() => {
    const wrongQuestions = quizQuestions.filter((q) => questionProgress[q.id]?.status === 'wrong');
    if (wrongQuestions.length === 0) return;

    // Reset selectedAnswer for wrong questions so they can be re-attempted
    setQuestionProgress((prev) => {
      const updated = { ...prev };
      wrongQuestions.forEach((q) => {
        updated[q.id] = {
          ...updated[q.id],
          selectedAnswer: null, // clear previous selection for fresh retest attempt
        };
      });
      return updated;
    });

    setIsRetestMode(true);
    setCurrentIndex(0);
  }, [quizQuestions, questionProgress]);

  /**
   * Exits Retest Mode back to full quiz view without losing progress.
   */
  const exitRetestMode = useCallback(() => {
    setIsRetestMode(false);
    setCurrentIndex(0);
  }, []);

  /**
   * Resets the entire quiz back to unseen state.
   */
  const resetQuiz = useCallback(() => {
    const fresh = {};
    quizQuestions.forEach((q) => {
      fresh[q.id] = {
        status: 'unseen',
        userAttempts: 0,
        selectedAnswer: null,
      };
    });
    setQuestionProgress(fresh);
    onProgressChange?.(fresh);
    setIsRetestMode(false);
    setCurrentIndex(0);
  }, [quizQuestions, onProgressChange]);

  return {
    activeQuestions,
    currentQuestion,
    currentProgress,
    currentIndex,
    isRetestMode,
    isCurrentPoolComplete,
    stats,
    questionProgress,
    submitAnswer,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    startRetestMode,
    exitRetestMode,
    resetQuiz,
  };
}

