import { validateAndRecoverStudyKit } from '../../shared/schemas/index.js';

const STORAGE_KEY = 'activeRecall_studio_session_v1';
const DRAFT_KEY = 'activeRecall_studio_draft_v1';

/**
 * Safely saves the current study session to localStorage.
 *
 * @param {object} session
 * @param {object} session.studyKit
 * @param {object} [session.flashcardStats]
 * @param {object} [session.quizProgress]
 */
export function saveStudySession(session) {
  if (!session || !session.studyKit) return false;

  try {
    const payload = {
      studyKit: session.studyKit,
      flashcardStats: session.flashcardStats || {},
      quizProgress: session.quizProgress || {},
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('[StorageService] Failed to persist study session to localStorage:', err);
    return false;
  }
}

/**
 * Safely loads and validates the stored study session from localStorage.
 * Enforces Zod schema recovery to prevent corrupt data from crashing the app.
 *
 * @returns {{ studyKit: object, flashcardStats: object, quizProgress: object } | null}
 */
export function loadStudySession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[StorageService] Corrupt JSON detected in localStorage session. Discarding safely.');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.studyKit) {
      return null;
    }

    // Validate StudyKit with resilience recovery
    const recoveryResult = validateAndRecoverStudyKit(parsed.studyKit);
    if (recoveryResult.data) {
      return {
        studyKit: recoveryResult.data,
        flashcardStats: parsed.flashcardStats || {},
        quizProgress: parsed.quizProgress || {},
        savedAt: parsed.savedAt,
      };
    }

    return null;
  } catch (err) {
    console.warn('[StorageService] Error loading saved session:', err);
    return null;
  }
}

/**
 * Clears the saved study session from localStorage.
 */
export function clearStudySession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Saves draft notes input so user never loses un-generated work across reloads.
 */
export function saveDraftNotes(text, title = '') {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ text, title, updatedAt: Date.now() }));
  } catch {
    // Graceful no-op
  }
}

/**
 * Loads draft notes input.
 */
export function loadDraftNotes() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { text: '', title: '' };
    return JSON.parse(raw);
  } catch {
    return { text: '', title: '' };
  }
}

/**
 * Clears draft notes input.
 */
export function clearDraftNotes() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Graceful no-op
  }
}

