import { useState, useRef, useCallback, useEffect } from 'react';
import { parseAndSalvageStudyData } from '../utils/parseAndSalvageStudyData.js';

const DEFAULT_TIMEOUT_MS = 60000; // 60 seconds

/**
 * Custom React Hook: useStudyGenerator
 *
 * Manages study generation and surgical refinement requests with:
 * - Race-condition prevention via monotonically incrementing request IDs
 * - In-flight cancellation via AbortController
 * - Configurable timeouts with distinct error classification
 * - Safe data salvaging and partial recovery
 * - Preservation of existing study state across failed operations
 * - Automatic unmount cleanup
 *
 * @param {object} [options]
 * @param {object} [options.initialStudyKit=null]
 * @param {number} [options.timeoutMs=DEFAULT_TIMEOUT_MS]
 * @returns {object} Hook state and control methods
 */
export function useStudyGenerator(options = {}) {
  const {
    initialStudyKit = null,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  // Primary States
  const [studyKit, setStudyKit] = useState(initialStudyKit);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [lastRequestId, setLastRequestId] = useState(0);

  // References for synchronization and race-condition prevention
  const activeAbortControllerRef = useRef(null);
  const latestRequestIdRef = useRef(0);
  const lastRequestParamsRef = useRef(null);
  const studyKitRef = useRef(studyKit);
  studyKitRef.current = studyKit; // Keep ref in sync for callbacks without stale closures

  /**
   * Cancels any active in-flight request.
   */
  const cancelRequest = useCallback(() => {
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort('USER_CANCELLED');
      activeAbortControllerRef.current = null;
    }
    setLoading(false);
    setRefining(false);
  }, []);

  /**
   * Clears the current error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Primary generator: transforms raw notes into a pedagogy-backed StudyKit.
   */
  const generateStudyKit = useCallback(
    async (sourceText, callOptions = {}) => {
      if (!sourceText || typeof sourceText !== 'string' || sourceText.trim().length < 10) {
        const validationErr = {
          message: 'Study notes must contain at least 10 characters',
          code: 'CLIENT_VALIDATION_ERROR',
        };
        setError(validationErr);
        return { success: false, error: validationErr };
      }

      // 1. Abort previous in-flight request
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort('SUPERSEDED_BY_NEW_REQUEST');
      }

      // 2. Increment request ID for race-condition protection
      const currentRequestId = ++latestRequestIdRef.current;
      setLastRequestId(currentRequestId);

      // 3. Store params for retry()
      lastRequestParamsRef.current = {
        type: 'generate',
        sourceText,
        options: callOptions,
      };

      // 4. Setup new AbortController and timeout
      const controller = new AbortController();
      activeAbortControllerRef.current = controller;

      let isTimeout = false;
      const requestTimeout = callOptions.timeoutMs || timeoutMs;
      const timeoutId = setTimeout(() => {
        isTimeout = true;
        controller.abort('TIMEOUT');
      }, requestTimeout);

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            sourceText,
            title: callOptions.title,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // 5. Stale check: discard if superseded while waiting
        if (currentRequestId !== latestRequestIdRef.current) {
          return { success: false, stale: true };
        }

        const rawJson = await response.json();

        // 6. Handle HTTP errors from API
        if (!response.ok || !rawJson.success) {
          const apiError = {
            message: rawJson.error?.message || `Generation failed with status ${response.status}`,
            code: rawJson.error?.code || 'API_ERROR',
            status: response.status,
          };

          setError(apiError);
          // Crucial: preserve existing studyKit on error
          return { success: false, error: apiError };
        }

        // 7. Data Recovery: Pass response through salvage utility
        const salvageResult = parseAndSalvageStudyData(rawJson.data, sourceText);

        if (salvageResult.fatalError) {
          const salvageError = {
            message: salvageResult.fatalError,
            code: 'SALVAGE_FATAL_ERROR',
          };
          setError(salvageError);
          setWarnings(salvageResult.warnings || []);
          return { success: false, error: salvageError };
        }

        // 8. Commit updated study kit to state
        setStudyKit(salvageResult.data);
        setWarnings(salvageResult.warnings || []);
        setError(null);

        return {
          success: true,
          data: salvageResult.data,
          recovered: salvageResult.recovered,
          warnings: salvageResult.warnings,
        };
      } catch (err) {
        clearTimeout(timeoutId);

        // Stale check
        if (currentRequestId !== latestRequestIdRef.current) {
          return { success: false, stale: true };
        }

        let structuredError;

        if (err.name === 'AbortError' || controller.signal.aborted) {
          if (isTimeout) {
            structuredError = {
              message: `Request timed out after ${requestTimeout / 1000} seconds`,
              code: 'TIMEOUT',
              isTimeout: true,
            };
          } else {
            // User-initiated or superseded abort
            structuredError = {
              message: 'Request was cancelled',
              code: 'CANCELLED',
              isCancelled: true,
            };
          }
        } else {
          structuredError = {
            message: err.message || 'An unexpected network error occurred',
            code: 'NETWORK_ERROR',
          };
        }

        // If cancelled by a newer request, do not display error in UI
        if (controller.signal.reason !== 'SUPERSEDED_BY_NEW_REQUEST') {
          setError(structuredError);
        }

        return { success: false, error: structuredError };
      } finally {
        if (currentRequestId === latestRequestIdRef.current) {
          setLoading(false);
          activeAbortControllerRef.current = null;
        }
      }
    },
    [timeoutMs]
  );

  /**
   * Surgical refinement: applies non-destructive updates to target items.
   */
  const refineStudyKit = useCallback(
    async (instruction, targetItemIds = [], callOptions = {}) => {
      const currentKit = studyKitRef.current;

      if (!currentKit) {
        const noKitErr = {
          message: 'Cannot refine: No active StudyKit loaded. Generate one first.',
          code: 'NO_ACTIVE_KIT',
        };
        setError(noKitErr);
        return { success: false, error: noKitErr };
      }

      if (!instruction || typeof instruction !== 'string' || instruction.trim().length < 3) {
        const valErr = {
          message: 'Refinement instruction must be at least 3 characters',
          code: 'CLIENT_VALIDATION_ERROR',
        };
        setError(valErr);
        return { success: false, error: valErr };
      }

      // Abort previous in-flight request
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort('SUPERSEDED_BY_NEW_REQUEST');
      }

      const currentRequestId = ++latestRequestIdRef.current;
      setLastRequestId(currentRequestId);

      lastRequestParamsRef.current = {
        type: 'refine',
        instruction,
        targetItemIds,
        options: callOptions,
      };

      const controller = new AbortController();
      activeAbortControllerRef.current = controller;

      let isTimeout = false;
      const requestTimeout = callOptions.timeoutMs || timeoutMs;
      const timeoutId = setTimeout(() => {
        isTimeout = true;
        controller.abort('TIMEOUT');
      }, requestTimeout);

      setRefining(true);
      setError(null);

      try {
        const response = await fetch('/api/refine', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            currentStudyKit: currentKit,
            instruction,
            targetItemIds,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (currentRequestId !== latestRequestIdRef.current) {
          return { success: false, stale: true };
        }

        const rawJson = await response.json();

        if (!response.ok || !rawJson.success) {
          const apiError = {
            message: rawJson.error?.message || `Refinement failed with status ${response.status}`,
            code: rawJson.error?.code || 'API_ERROR',
            status: response.status,
          };

          setError(apiError);
          // Preserve existing studyKit untouched
          return { success: false, error: apiError };
        }

        // Salvage and validate the merged study kit
        const salvageResult = parseAndSalvageStudyData(rawJson.data, currentKit.sourceText);

        if (salvageResult.fatalError) {
          const salvageErr = {
            message: salvageResult.fatalError,
            code: 'SALVAGE_FATAL_ERROR',
          };
          setError(salvageErr);
          return { success: false, error: salvageErr };
        }

        setStudyKit(salvageResult.data);
        setWarnings(salvageResult.warnings || []);
        setError(null);

        return {
          success: true,
          data: salvageResult.data,
          summary: rawJson.summary,
          modifiedItemIds: rawJson.modifiedItemIds,
          newItemIds: rawJson.newItemIds,
          warnings: salvageResult.warnings,
        };
      } catch (err) {
        clearTimeout(timeoutId);

        if (currentRequestId !== latestRequestIdRef.current) {
          return { success: false, stale: true };
        }

        let structuredError;

        if (err.name === 'AbortError' || controller.signal.aborted) {
          if (isTimeout) {
            structuredError = {
              message: `Refinement request timed out after ${requestTimeout / 1000} seconds`,
              code: 'TIMEOUT',
              isTimeout: true,
            };
          } else {
            structuredError = {
              message: 'Refinement request was cancelled',
              code: 'CANCELLED',
              isCancelled: true,
            };
          }
        } else {
          structuredError = {
            message: err.message || 'Network error during refinement',
            code: 'NETWORK_ERROR',
          };
        }

        if (controller.signal.reason !== 'SUPERSEDED_BY_NEW_REQUEST') {
          setError(structuredError);
        }

        return { success: false, error: structuredError };
      } finally {
        if (currentRequestId === latestRequestIdRef.current) {
          setRefining(false);
          activeAbortControllerRef.current = null;
        }
      }
    },
    [timeoutMs]
  );

  /**
   * Re-executes the most recent request (generation or refinement).
   */
  const retry = useCallback(() => {
    const lastParams = lastRequestParamsRef.current;
    if (!lastParams) {
      setError({
        message: 'No previous request available to retry',
        code: 'NO_PREVIOUS_REQUEST',
      });
      return;
    }

    if (lastParams.type === 'generate') {
      return generateStudyKit(lastParams.sourceText, lastParams.options);
    } else if (lastParams.type === 'refine') {
      return refineStudyKit(lastParams.instruction, lastParams.targetItemIds, lastParams.options);
    }
  }, [generateStudyKit, refineStudyKit]);

  /**
   * Cleanup on unmount: Abort any active in-flight request
   */
  useEffect(() => {
    return () => {
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort('COMPONENT_UNMOUNTED');
      }
    };
  }, []);

  return {
    studyKit,
    loading,
    refining,
    error,
    warnings,
    lastRequestId,
    generateStudyKit,
    refineStudyKit,
    retry,
    cancelRequest,
    clearError,
    setStudyKit, // Exposed for deterministic test fixtures or reset
  };
}

