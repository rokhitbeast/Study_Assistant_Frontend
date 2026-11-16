import {
  saveStudySession,
  loadStudySession,
  clearStudySession,
  saveDraftNotes,
  loadDraftNotes,
  clearDraftNotes,
} from '../src/services/storageService.js';
import { validStudyKitFixture, corruptedStudyKitFixture } from '../shared/fixtures/studyKitFixtures.js';

// Setup Mock localStorage for Node.js test environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

console.log('🧪 Starting localStorage Persistence & Recovery Unit Tests...\n');

let failedTests = 0;
function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedTests++;
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Save & Load Valid Session
// ---------------------------------------------------------------------------
console.log('--- TEST 1: Save & Load Valid Study Session ---');
localStorage.clear();

const sessionData = {
  studyKit: validStudyKitFixture,
  flashcardStats: {
    'fc-1': { status: 'correct', userAttempts: 2 },
    'fc-2': { status: 'wrong', userAttempts: 1 },
  },
  quizProgress: {
    'q-mcq-1': { status: 'correct', userAttempts: 1, selectedAnswer: 'Option A' },
  },
};

const saveResult = saveStudySession(sessionData);
assert(saveResult === true, 'saveStudySession returns true on valid session');

const loaded = loadStudySession();
assert(loaded !== null, 'loadStudySession returns non-null data');
assert(loaded.studyKit.id === validStudyKitFixture.id, 'Preserves StudyKit ID');
assert(loaded.studyKit.title === validStudyKitFixture.title, 'Preserves StudyKit title');
assert(loaded.studyKit.flashcards.length === 3, 'Preserves all 3 flashcards');
assert(loaded.flashcardStats['fc-1'].status === 'correct', 'Preserves flashcard confidence stat');
assert(loaded.flashcardStats['fc-1'].userAttempts === 2, 'Preserves flashcard attempts');
assert(loaded.quizProgress['q-mcq-1'].status === 'correct', 'Preserves quiz question progress');

// ---------------------------------------------------------------------------
// TEST 2: Guard Against Corrupt JSON String
// ---------------------------------------------------------------------------
console.log('\n--- TEST 2: Corrupted JSON String in localStorage ---');
localStorage.setItem('activeRecall_studio_session_v1', '{"studyKit": { title: MALFORMED_JSON_WITHOUT_QUOTES');

const loadedCorrupt = loadStudySession();
assert(loadedCorrupt === null, 'loadStudySession returns null on malformed JSON without crashing');
assert(localStorage.getItem('activeRecall_studio_session_v1') === null, 'Safely cleans up corrupt localStorage item');

// ---------------------------------------------------------------------------
// TEST 3: Invalid Payload Structure (Non-Object or Missing studyKit)
// ---------------------------------------------------------------------------
console.log('\n--- TEST 3: Invalid Session Schema Payload ---');
localStorage.setItem('activeRecall_studio_session_v1', JSON.stringify({ randomKey: 'no_study_kit_here' }));
const loadedInvalid = loadStudySession();
assert(loadedInvalid === null, 'loadStudySession returns null when payload lacks studyKit');

localStorage.setItem('activeRecall_studio_session_v1', JSON.stringify(null));
const loadedNull = loadStudySession();
assert(loadedNull === null, 'loadStudySession returns null for null string in storage');

// ---------------------------------------------------------------------------
// TEST 4: Partial Recovery of Damaged Items from Stored Session
// ---------------------------------------------------------------------------
console.log('\n--- TEST 4: Partial Recovery of Damaged Items from Stored Session ---');
// Save a session where studyKit contains 5 flashcards (3 valid, 2 corrupted)
const damagedSessionPayload = {
  studyKit: corruptedStudyKitFixture,
  flashcardStats: {
    'fc-1': { status: 'correct', userAttempts: 1 },
  },
  quizProgress: {},
  savedAt: new Date().toISOString(),
};
localStorage.setItem('activeRecall_studio_session_v1', JSON.stringify(damagedSessionPayload));

const recoveredSession = loadStudySession();
assert(recoveredSession !== null, 'loadStudySession returns recovered session');
assert(recoveredSession.studyKit !== null, 'Recovered studyKit is non-null');
assert(recoveredSession.studyKit.flashcards.length === 3, 'Safely filtered out the 2 broken flashcards, keeping 3 valid');
assert(recoveredSession.studyKit.quizQuestions.length === 2, 'Safely recovered 2 valid quiz questions');
assert(recoveredSession.flashcardStats['fc-1'].status === 'correct', 'Retains flashcard stats during recovery');

// ---------------------------------------------------------------------------
// TEST 5: Clear Session
// ---------------------------------------------------------------------------
console.log('\n--- TEST 5: Clear Study Session ---');
const clearResult = clearStudySession();
assert(clearResult === true, 'clearStudySession returns true');
assert(loadStudySession() === null, 'Storage is completely empty after clearStudySession');

// ---------------------------------------------------------------------------
// TEST 6: Save and Load Draft Notes
// ---------------------------------------------------------------------------
console.log('\n--- TEST 6: Draft Notes Persistence ---');
saveDraftNotes('These are my un-generated draft notes for biology class.', 'Biology Exam');
const draft = loadDraftNotes();
assert(draft.text === 'These are my un-generated draft notes for biology class.', 'Preserves draft notes text across reloads');
assert(draft.title === 'Biology Exam', 'Preserves draft notes title');

clearDraftNotes();
const clearedDraft = loadDraftNotes();
assert(clearedDraft.text === '', 'Draft text is empty after clearDraftNotes');
assert(clearedDraft.title === '', 'Draft title is empty after clearDraftNotes');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n=========================================');
if (failedTests > 0) {
  console.error(`💥 ${failedTests} TEST(S) FAILED!`);
  process.exit(1);
} else {
  console.log('🎉 ALL LOCALSTORAGE PERSISTENCE & RECOVERY TESTS PASSED!');
  process.exit(0);
}

