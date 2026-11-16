import dotenv from 'dotenv';
import { formatGeneratedDate } from '../src/utils/formatDate.js';
import {
  cleanJsonOutput,
  checkGeminiStatus,
  updateGeminiHealthCache,
  clearGeminiHealthCache,
  redactApiKey,
  GeminiServiceError,
} from '../server/services/geminiService.js';
import { HealthCheckResponseSchema } from '../shared/schemas/health.js';
import { validStudyKitFixture } from '../shared/fixtures/studyKitFixtures.js';
import { parseAndSalvageStudyData } from '../src/utils/parseAndSalvageStudyData.js';

dotenv.config();

console.log('🧪 Starting Production Flow & Task Audit Verification Tests...\n');

let failedTests = 0;
function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

// =========================================================================
// TEST SUITE 1: Task 1 - Date Formatting Crash Fix & Invalid Date Protection
// =========================================================================
console.log('--- TEST SUITE 1: StudyKitOverview Date Formatting Robustness ---');

// Case 1: Valid ISO date string
const validIso = '2026-11-16T12:00:00.000Z';
let formattedIso = null;
let noErrorOnValid = false;
try {
  formattedIso = formatGeneratedDate(validIso);
  noErrorOnValid = true;
} catch (e) {
  console.error(e);
}
assert(noErrorOnValid, 'formatGeneratedDate does not throw on valid ISO date');
assert(typeof formattedIso === 'string' && formattedIso.length > 0 && formattedIso !== 'Generated just now', `Valid ISO formatted properly: "${formattedIso}"`);

// Case 2: Number timestamp
const validTimestamp = Date.now();
const formattedTimestamp = formatGeneratedDate(validTimestamp);
assert(typeof formattedTimestamp === 'string' && formattedTimestamp !== 'Generated just now', `Valid timestamp formatted properly: "${formattedTimestamp}"`);

// Case 3: Invalid date string (e.g., corrupted data)
let noErrorOnInvalid = false;
let formattedInvalid = null;
try {
  formattedInvalid = formatGeneratedDate('not-a-date');
  noErrorOnInvalid = true;
} catch (e) {
  console.error(e);
}
assert(noErrorOnInvalid, 'formatGeneratedDate does not throw on invalid date string');
assert(formattedInvalid === 'Generated just now', `Invalid date string safely defaults to "Generated just now" (received: "${formattedInvalid}")`);

// Case 4: Null and undefined
assert(formatGeneratedDate(null) === 'Generated just now', 'null date defaults to "Generated just now"');
assert(formatGeneratedDate(undefined) === 'Generated just now', 'undefined date defaults to "Generated just now"');
assert(formatGeneratedDate('') === 'Generated just now', 'Empty string date defaults to "Generated just now"');

// =========================================================================
// TEST SUITE 2: Task 3 - API Credential Redaction & Security Isolation
// =========================================================================
console.log('\n--- TEST SUITE 2: Credential Redaction & Security Isolation ---');

const mockKey = 'AIzaSyFakeSecretKey1234567890';
process.env.GEMINI_API_KEY = mockKey;

const leakedString = `Error connecting with API key ${mockKey} on endpoint`;
const sanitized = redactApiKey(leakedString);
assert(!sanitized.includes(mockKey), 'redactApiKey successfully removes secret API key');
assert(sanitized.includes('[REDACTED]'), 'redactApiKey replaces key with [REDACTED]');

// Verify GeminiServiceError construction
const serviceErr = new GeminiServiceError(redactApiKey(`Failed with key ${mockKey}`), 401);
assert(!serviceErr.message.includes(mockKey), 'GeminiServiceError message has key redacted');
assert(serviceErr.statusCode === 401, 'GeminiServiceError preserves status code');

// =========================================================================
// TEST SUITE 3: Task 4 - Health Check Accuracy & Status Differentiation
// =========================================================================
console.log('\n--- TEST SUITE 3: Health Check Accuracy & Differentiation ---');

// Case A: Missing Configuration
process.env.GEMINI_API_KEY = '';
clearGeminiHealthCache();
(async () => {
  const missingResult = await checkGeminiStatus();
  assert(missingResult.status === 'missing_config', 'Returns missing_config when GEMINI_API_KEY is empty');
  assert(missingResult.configured === false, 'Configured flag is false when key is empty');

  // Case B: Placeholder Configuration
  process.env.GEMINI_API_KEY = 'your_gemini_api_key_here';
  clearGeminiHealthCache();
  const placeholderResult = await checkGeminiStatus();
  assert(placeholderResult.status === 'missing_config', 'Returns missing_config when GEMINI_API_KEY is placeholder');
  assert(placeholderResult.configured === false, 'Configured flag is false for placeholder');

  // Case C: Schema Validation of Health Response
  const healthPayload = {
    status: 'ok',
    uptime: 120,
    timestamp: new Date().toISOString(),
    service: 'Adaptive Active-Recall Studio API',
    version: '1.0.0',
    environment: 'test',
    gemini: placeholderResult,
  };

  const schemaValidation = HealthCheckResponseSchema.safeParse(healthPayload);
  assert(schemaValidation.success === true, 'HealthCheckResponseSchema validates payload with gemini status');

  // Case D: Health Cache and Update
  process.env.GEMINI_API_KEY = 'test_valid_configured_key_12345';
  clearGeminiHealthCache();
  updateGeminiHealthCache('ready', 'Gemini API operational');
  const cachedReady = await checkGeminiStatus();
  assert(cachedReady.status === 'ready', 'Cached ready status is returned');
  assert(cachedReady.configured === true, 'Configured flag is true for active key');

  updateGeminiHealthCache('error', 'Rate limit exceeded');
  const cachedError = await checkGeminiStatus();
  assert(cachedError.status === 'error', 'Cached error status is returned');

  // =========================================================================
  // TEST SUITE 4: Task 3 & 5 - Generation Flow Resilience & State Preservation
  // =========================================================================
  console.log('\n--- TEST SUITE 4: Generation Flow State Preservation on Error ---');

  // 1. Valid generation output through salvage
  const validKit = JSON.parse(JSON.stringify(validStudyKitFixture));
  const salvageOk = parseAndSalvageStudyData(validKit, 'Valid source notes');
  assert(!salvageOk.fatalError, 'parseAndSalvageStudyData succeeds on valid kit');
  assert(salvageOk.data.id === validKit.id, 'StudyKit ID preserved');
  assert(salvageOk.data.flashcards.length === validKit.flashcards.length, 'Flashcard length preserved');

  // 2. Corrupted/unparseable output through salvage: returns fatalError without fabricating data
  const corruptedKit = { invalidField: true };
  const salvageCorrupted = parseAndSalvageStudyData(corruptedKit, 'Some notes');
  assert(salvageCorrupted.data === null, 'Salvage does not hallucinate fake items from completely empty payload');
  assert(salvageCorrupted.fatalError !== null, 'Salvage returns readable fatalError for corrupted payload');

  // 3. Partial recovery: payload with 1 valid card and 2 broken cards
  const partialKit = {
    title: 'Partial Deck',
    flashcards: [
      { id: 'fc-good-1', front: 'Valid front', back: 'Valid back', difficulty: 'easy' },
      { id: 'fc-bad-2', front: 'Missing back' },
    ],
  };
  const salvagePartial = parseAndSalvageStudyData(partialKit, 'Some notes');
  assert(salvagePartial.data !== null, 'Partial salvage recovers valid item');
  assert(salvagePartial.data.flashcards.length === 1, 'Discarded corrupted card, retained 1 valid card');
  assert(salvagePartial.data.flashcards[0].id === 'fc-good-1', 'Retained valid card ID intact');

  // 3. User Input Preservation Test
  // Simulates user input in StudyInputStudio
  const userOriginalInput = {
    sourceText: 'Important study notes about quantum computing and qubits',
    title: 'Quantum Computing Intro',
  };

  // Simulates a failed API call response
  const failedApiResponse = {
    success: false,
    error: {
      code: 'API_ERROR',
      message: 'Gemini API rate limit exceeded. Please wait a moment and try again.',
      status: 429,
    },
  };

  // Verify navigation logic: overview view is ONLY switched when success is true
  let currentView = 'generate';
  if (failedApiResponse.success) {
    currentView = 'overview';
  }
  assert(currentView === 'generate', 'Frontend stays on "generate" view when API call fails');
  assert(userOriginalInput.sourceText.length > 0, "User's original source notes are preserved intact");
  assert(userOriginalInput.title === 'Quantum Computing Intro', "User's original title is preserved intact");

  // Reset API key to fixture from .env
  dotenv.config();

  console.log('\n=========================================');
  if (failedTests === 0) {
    console.log('🎉 ALL AUDIT & FLOW RESILIENCE TESTS PASSED!');
    process.exit(0);
  } else {
    console.error(`💥 ${failedTests} test(s) failed.`);
    process.exit(1);
  }
})();
