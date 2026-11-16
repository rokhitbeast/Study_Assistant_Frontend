import { validateAndRecoverStudyKit } from '../../shared/schemas/index.js';

/**
 * Strips Markdown code fences and extracts raw JSON from AI output.
 * Handles cases where LLM wraps output in ```json ... ``` or includes conversational prose.
 *
 * @param {string} text - Raw LLM string
 * @returns {string} Stripped text
 */
export function stripMarkdownFences(text) {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text.trim();

  // 1. Direct code block strip
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
    cleaned = cleaned.trim();
  }

  // 2. If conversational prose wraps a JSON block (e.g. "Here is your JSON: { ... }"),
  // locate outermost balanced '{' and '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    // If there is preamble before firstBrace or text after lastBrace
    if (firstBrace > 0 || lastBrace < cleaned.length - 1) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1).trim();
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        // Fall back to original cleaned string
      }
    }
  }

  return cleaned;
}

/**
 * Attempts conservative repair of truncated JSON (e.g., when LLM hits token limit mid-generation).
 *
 * Algorithm:
 * 1. Closes unclosed quotes if truncated mid-string.
 * 2. Backtracks past trailing commas or incomplete key-value fragments.
 * 3. Balances unclosed brackets '[' and braces '{' using a FIFO stack.
 *
 * Never uses eval(). Never fabricates arbitrary fake objects.
 *
 * @param {string} jsonStr
 * @returns {any | null} Parsed object if repaired, or null if unrepairable
 */
export function conservativeTruncatedJsonRepair(jsonStr) {
  if (!jsonStr || typeof jsonStr !== 'string') return null;

  let text = jsonStr.trim();

  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Continue to repair attempts
  }

  // Attempt 1: Handle truncated mid-string or mid-property
  const stack = [];
  let inString = false;
  let escapeNext = false;
  let lastGoodIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char === '{' ? '}' : ']');
      } else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
          lastGoodIndex = i + 1;
        }
      }
    }
  }

  // Strategy A: If inside string, close the quote and close remaining containers
  let candidateA = text;
  if (inString) {
    candidateA += '"';
  }
  // Remove any dangling trailing comma
  candidateA = candidateA.replace(/,\s*$/, '');
  const closingCharsA = stack.slice().reverse().join('');
  try {
    return JSON.parse(candidateA + closingCharsA);
  } catch {
    // Strategy A failed, continue to Strategy B
  }

  // Strategy B: Backtrack to the last completed item boundary (comma, brace, or bracket)
  const lastComma = text.lastIndexOf(',');
  const lastClose = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  const cutPoint = Math.max(lastComma, lastClose);

  if (cutPoint > 0) {
    let truncated = text.slice(0, cutPoint);
    truncated = truncated.replace(/,\s*$/, '').trim();

    // Recompute stack for the trimmed string
    const stackB = [];
    let inStrB = false;
    let escB = false;

    for (let j = 0; j < truncated.length; j++) {
      const c = truncated[j];
      if (escB) {
        escB = false;
        continue;
      }
      if (c === '\\' && inStrB) {
        escB = true;
        continue;
      }
      if (c === '"') {
        inStrB = !inStrB;
        continue;
      }
      if (!inStrB) {
        if (c === '{') stackB.push('}');
        else if (c === '[') stackB.push(']');
        else if (c === '}' || c === ']') stackB.pop();
      }
    }

    if (!inStrB) {
      const closingCharsB = stackB.reverse().join('');
      try {
        return JSON.parse(truncated + closingCharsB);
      } catch {
        // Strategy B failed
      }
    }
  }

  return null;
}

/**
 * Master parser and resilience salvage utility for AI responses.
 * Guarantees that invalid items do not crash the application, preserving all valid items.
 *
 * @param {string | object} rawResponse - Raw string or already-parsed JSON object
 * @param {string} [fallbackSourceText=''] - Original source text for recovery anchoring
 * @returns {{
 *   data: object | null,
 *   warnings: Array<{ field?: string, itemIndex?: number, reason: string, rawSnippet?: any }>,
 *   recovered: boolean,
 *   fatalError: string | null
 * }}
 */
export function parseAndSalvageStudyData(rawResponse, fallbackSourceText = '') {
  const warnings = [];
  let wasRepaired = false;

  // 1. Guard against empty responses
  if (rawResponse === null || rawResponse === undefined || (typeof rawResponse === 'string' && rawResponse.trim() === '')) {
    return {
      data: null,
      warnings: [],
      recovered: false,
      fatalError: 'AI response was empty or null',
    };
  }

  let parsedObject = null;

  // 2. Parse if input is string
  if (typeof rawResponse === 'object') {
    parsedObject = rawResponse;
  } else {
    const stripped = stripMarkdownFences(rawResponse);

    try {
      parsedObject = JSON.parse(stripped);
    } catch (parseError) {
      // Attempt conservative repair for truncated JSON
      const repaired = conservativeTruncatedJsonRepair(stripped);
      if (repaired && typeof repaired === 'object') {
        parsedObject = repaired;
        wasRepaired = true;
        warnings.push({
          reason: 'JSON payload was truncated and conservatively repaired (partial objects closed)',
          rawSnippet: stripped.slice(-100),
        });
      } else {
        return {
          data: null,
          warnings: [],
          recovered: false,
          fatalError: `Malformed JSON could not be parsed or safely repaired: ${parseError.message}`,
        };
      }
    }
  }

  // 3. Ensure top-level payload is an object
  if (!parsedObject || typeof parsedObject !== 'object' || Array.isArray(parsedObject)) {
    return {
      data: null,
      warnings: [],
      recovered: false,
      fatalError: `Expected a JSON object root for StudyKit, received ${Array.isArray(parsedObject) ? 'array' : typeof parsedObject}`,
    };
  }

  // 4. Perform item-level partial recovery using shared Zod contracts
  try {
    const recoveryResult = validateAndRecoverStudyKit(parsedObject, fallbackSourceText);
    warnings.push(...recoveryResult.warnings);

    const recoveredKit = recoveryResult.data;

    // 5. Check if ANY usable study items survived
    const totalUsableItems =
      recoveredKit.conceptChecklist.length +
      recoveredKit.flashcards.length +
      recoveredKit.quizQuestions.length +
      recoveredKit.topicBreakdown.length;

    if (totalUsableItems === 0) {
      return {
        data: null,
        warnings,
        recovered: false,
        fatalError: 'No usable study items (flashcards, questions, or concepts) survived schema validation',
      };
    }

    const isRecovered = wasRepaired || warnings.length > 0;

    return {
      data: recoveredKit,
      warnings,
      recovered: isRecovered,
      fatalError: null,
    };
  } catch (err) {
    return {
      data: null,
      warnings,
      recovered: false,
      fatalError: `Fatal recovery error: ${err.message}`,
    };
  }
}

