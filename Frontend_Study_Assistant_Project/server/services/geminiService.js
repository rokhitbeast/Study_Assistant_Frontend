import dotenv from 'dotenv';
import {
  STUDY_GENERATION_SYSTEM_PROMPT,
  SURGICAL_REFINEMENT_SYSTEM_PROMPT,
  buildStudyGenerationPrompt,
  buildSurgicalRefinementPrompt,
} from './prompts.js';
import {
  validateAndRecoverStudyKit,
  StudyKitRefinementSchema,
  StrictStudyKitSchema,
} from '../../shared/schemas/index.js';

dotenv.config();

const DEFAULT_TIMEOUT_MS = 60000; // 60 seconds

/**
 * Custom error class for Gemini service failures
 */
export class GeminiServiceError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'GeminiServiceError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Redacts the Gemini API key from any output, logs, or error messages.
 *
 * @param {string} text
 * @returns {string}
 */
export function redactApiKey(text) {
  if (!text || typeof text !== 'string') return '';
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.length > 5) {
    return text.replaceAll(apiKey, '[REDACTED]');
  }
  return text;
}

let cachedGeminiHealth = null;
let lastGeminiHealthCheckTime = 0;
const GEMINI_HEALTH_CACHE_TTL_MS = 30000; // 30-second TTL to avoid quota burn

/**
 * Updates internal health status cache for Gemini.
 *
 * @param {'ready'|'missing_config'|'error'} status
 * @param {string} message
 */
export function updateGeminiHealthCache(status, message) {
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const apiKey = process.env.GEMINI_API_KEY;
  const configured = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here');
  cachedGeminiHealth = {
    status,
    configured,
    model,
    message: redactApiKey(message),
  };
  lastGeminiHealthCheckTime = Date.now();
}

/**
 * Clears the Gemini health check cache (useful for testing).
 */
export function clearGeminiHealthCache() {
  cachedGeminiHealth = null;
  lastGeminiHealthCheckTime = 0;
}

/**
 * Checks the real-time operational status of the Gemini API without burning generation quota.
 *
 * Distinguishes:
 * 1. missing_config - GEMINI_API_KEY is not configured or dummy placeholder
 * 2. ready - Gemini API is configured and operational
 * 3. error - Gemini API credentials invalid, network failing, or rate limit hit
 *
 * @returns {Promise<{ status: 'ready'|'missing_config'|'error', configured: boolean, model: string, message: string }>}
 */
export async function checkGeminiStatus() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return {
      status: 'missing_config',
      configured: false,
      model,
      message: 'GEMINI_API_KEY is not configured on the server. Please set a valid key in .env',
    };
  }

  const now = Date.now();
  if (cachedGeminiHealth && (now - lastGeminiHealthCheckTime < GEMINI_HEALTH_CACHE_TTL_MS)) {
    return cachedGeminiHealth;
  }

  // Lightweight probe to models endpoint: consumes 0 tokens
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${apiKey}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      cachedGeminiHealth = {
        status: 'ready',
        configured: true,
        model,
        message: 'Gemini API online and operational',
      };
    } else {
      let detailMsg = `HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.error?.message) {
          detailMsg = errorJson.error.message;
        }
      } catch {
        // use default detailMsg
      }

      cachedGeminiHealth = {
        status: 'error',
        configured: true,
        model,
        message: redactApiKey(`Gemini API request failed (${response.status}): ${detailMsg}`),
      };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    cachedGeminiHealth = {
      status: 'error',
      configured: true,
      model,
      message: redactApiKey(
        isTimeout
          ? 'Gemini API request timed out (5s health probe)'
          : `Gemini API unreachable: ${err.message}`
      ),
    };
  }

  lastGeminiHealthCheckTime = Date.now();
  return cachedGeminiHealth;
}

/**
 * Strips potential markdown code blocks (e.g. ```json ... ```) from LLM output.
 *
 * @param {string} text
 * @returns {string}
 */
export function cleanJsonOutput(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.trim();

  // Remove ```json and closing ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
  }

  return cleaned.trim();
}

/**
 * Executes a call to the Gemini 2.5 Flash API with strict JSON mode, system instruction, and timeout.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {number} [timeoutMs=DEFAULT_TIMEOUT_MS]
 * @returns {Promise<string>} Raw JSON response text from Gemini
 */
export async function callGemini(systemPrompt, userPrompt, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const apiKey = process.env.GEMINI_API_KEY;
  let model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    throw new GeminiServiceError(
      'GEMINI_API_KEY is not configured on the server. Please set a valid key in .env',
      503
    );
  }

  const executeRequest = async (targetModel) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError = null;
        try {
          parsedError = JSON.parse(errorText);
        } catch {
          parsedError = errorText;
        }

        // Handle upstream deprecation of older flash snapshot gracefully
        if (response.status === 404 && targetModel === 'gemini-2.5-flash') {
          console.warn('[Gemini Migration] gemini-2.5-flash is retired upstream. Retrying with active gemini-3.5-flash...');
          return executeRequest('gemini-3.5-flash');
        }

        if (response.status === 429) {
          const safeMsg = 'Gemini API rate limit exceeded. Please wait a moment and try again.';
          updateGeminiHealthCache('error', safeMsg);
          throw new GeminiServiceError(
            safeMsg,
            429,
            parsedError
          );
        }

        if (response.status === 400 || response.status === 403) {
          const detailMsg = parsedError?.error?.message || (typeof parsedError === 'string' ? parsedError : '');
          const isAuthError =
            response.status === 403 ||
            detailMsg.toLowerCase().includes('api key') ||
            detailMsg.toLowerCase().includes('credential') ||
            detailMsg.toLowerCase().includes('invalid_argument');

          const safeMsg = redactApiKey(
            isAuthError
              ? `Invalid or unauthorized Gemini API key: ${detailMsg || 'Please verify your GEMINI_API_KEY in the server environment.'}`
              : `Gemini API request error (Status ${response.status}): ${detailMsg || 'Bad Request'}`
          );
          updateGeminiHealthCache('error', safeMsg);
          throw new GeminiServiceError(
            safeMsg,
            isAuthError ? 401 : 400,
            parsedError
          );
        }

        const safeStatusMsg = redactApiKey(
          `Gemini API returned status ${response.status}: ${parsedError?.error?.message || response.statusText}`
        );
        updateGeminiHealthCache('error', safeStatusMsg);
        throw new GeminiServiceError(
          safeStatusMsg,
          502,
          parsedError
        );
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];

      if (!candidate || !candidate.content?.parts?.[0]?.text) {
        const emptyMsg = 'Gemini returned an empty response or candidate was filtered.';
        updateGeminiHealthCache('error', emptyMsg);
        throw new GeminiServiceError(
          emptyMsg,
          502,
          data
        );
      }

      updateGeminiHealthCache('ready', 'Gemini API online and operational');
      return candidate.content.parts[0].text;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        const timeoutMsg = `Gemini API request timed out after ${timeoutMs / 1000} seconds.`;
        updateGeminiHealthCache('error', timeoutMsg);
        throw new GeminiServiceError(
          timeoutMsg,
          504
        );
      }

      if (err instanceof GeminiServiceError) {
        updateGeminiHealthCache('error', redactApiKey(err.message));
        throw err;
      }

      const netMsg = redactApiKey(`Network or unexpected error while communicating with Gemini API: ${err.message}`);
      updateGeminiHealthCache('error', netMsg);
      throw new GeminiServiceError(
        netMsg,
        500,
        err.message
      );
    }
  };

  return executeRequest(model);
}

/**
 * Generates a full StudyKit from raw text notes using Gemini 2.5 Flash.
 *
 * @param {string} sourceText
 * @param {object} [options]
 * @returns {Promise<{ data: object, warnings: Array, stats: object }>}
 */
export async function generateStudyKit(sourceText, options = {}) {
  const userPrompt = buildStudyGenerationPrompt(sourceText, options);
  const rawResponse = await callGemini(STUDY_GENERATION_SYSTEM_PROMPT, userPrompt);
  const cleanedJson = cleanJsonOutput(rawResponse);

  let parsed;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch (parseErr) {
    throw new GeminiServiceError(
      `Failed to parse JSON response from Gemini: ${parseErr.message}`,
      502,
      cleanedJson.slice(0, 500)
    );
  }

  // Validate and recover items item-by-item with zero fabricated placeholders
  const recoveryResult = validateAndRecoverStudyKit(parsed, sourceText);
  return recoveryResult;
}

/**
 * Merges refined items into an existing StudyKit by ID, preserving unaffected items.
 *
 * @param {object} currentKit - Valid existing StudyKit
 * @param {object} refinedKit - Kit returned from LLM
 * @returns {object} Merged StudyKit
 */
export function mergeStudyKitsById(currentKit, refinedKit) {
  if (!refinedKit || typeof refinedKit !== 'object') {
    return currentKit;
  }

  const mergeArray = (currentArr = [], refinedArr = []) => {
    if (!Array.isArray(refinedArr) || refinedArr.length === 0) {
      return [...currentArr];
    }

    const currentMap = new Map(currentArr.map((item) => [item.id, item]));
    const refinedMap = new Map(refinedArr.map((item) => [item.id, item]));

    // Update existing items or preserve them
    const merged = currentArr.map((item) => {
      if (refinedMap.has(item.id)) {
        return { ...item, ...refinedMap.get(item.id) };
      }
      return item;
    });

    // Append newly added items (items in refined that weren't in current)
    refinedArr.forEach((item) => {
      if (!currentMap.has(item.id)) {
        merged.push(item);
      }
    });

    return merged;
  };

  return {
    id: currentKit.id,
    title: refinedKit.title || currentKit.title,
    sourceText: currentKit.sourceText, // strictly preserve original source text
    generatedAt: new Date().toISOString(),
    conceptChecklist: mergeArray(currentKit.conceptChecklist, refinedKit.conceptChecklist),
    flashcards: mergeArray(currentKit.flashcards, refinedKit.flashcards),
    quizQuestions: mergeArray(currentKit.quizQuestions, refinedKit.quizQuestions),
    topicBreakdown: mergeArray(currentKit.topicBreakdown, refinedKit.topicBreakdown),
  };
}

/**
 * Performs surgical refinement of an existing StudyKit using Gemini 2.5 Flash.
 *
 * @param {object} currentStudyKit
 * @param {string} instruction
 * @param {string[]} [targetItemIds=[]]
 * @returns {Promise<{
 *   data: object,
 *   summary: string,
 *   modifiedItemIds: string[],
 *   newItemIds: string[],
 *   warnings: Array,
 *   stats: object
 * }>}
 */
export async function refineStudyKit(currentStudyKit, instruction, targetItemIds = []) {
  // First, ensure the incoming currentStudyKit is structurally valid
  const currentValidation = validateAndRecoverStudyKit(currentStudyKit);
  const safeCurrentKit = currentValidation.data;

  const userPrompt = buildSurgicalRefinementPrompt(safeCurrentKit, instruction, targetItemIds);
  const rawResponse = await callGemini(SURGICAL_REFINEMENT_SYSTEM_PROMPT, userPrompt);
  const cleanedJson = cleanJsonOutput(rawResponse);

  let parsed;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch (parseErr) {
    throw new GeminiServiceError(
      `Failed to parse JSON refinement response from Gemini: ${parseErr.message}`,
      502,
      cleanedJson.slice(0, 500)
    );
  }

  // Extract metadata and refined kit structure
  const summary = typeof parsed.summary === 'string' ? parsed.summary : 'Surgical refinement applied';
  const modifiedItemIds = Array.isArray(parsed.modifiedItemIds) ? parsed.modifiedItemIds : [];
  const newItemIds = Array.isArray(parsed.newItemIds) ? parsed.newItemIds : [];
  const rawRefinedKit = parsed.refinedStudyKit || parsed;

  // Merge updates non-destructively by ID
  const mergedRawKit = mergeStudyKitsById(safeCurrentKit, rawRefinedKit);

  // Run final validation on merged result
  const finalValidation = validateAndRecoverStudyKit(mergedRawKit, safeCurrentKit.sourceText);

  return {
    data: finalValidation.data,
    summary,
    modifiedItemIds,
    newItemIds,
    warnings: finalValidation.warnings,
    stats: finalValidation.stats,
  };
}
