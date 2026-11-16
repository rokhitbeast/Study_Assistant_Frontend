import {
  StrictStudyKitSchema,
  validateAndRecoverStudyKit,
} from '../shared/schemas/index.js';
import {
  validStudyKitFixture,
  corruptedStudyKitFixture,
} from '../shared/fixtures/studyKitFixtures.js';

console.log('🧪 Starting StudyKit Zod Schema & Partial Recovery Tests...\n');

let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedTests++;
  }
}

// ----------------------------------------------------
// TEST SUITE 1: Valid StudyKit Schema Parsing
// ----------------------------------------------------
console.log('--- TEST SUITE 1: Strict Validation of Valid Fixture ---');
const validParseResult = StrictStudyKitSchema.safeParse(validStudyKitFixture);
assert(validParseResult.success === true, 'StrictStudyKitSchema accepts validStudyKitFixture');
assert(validParseResult.data?.flashcards.length === 3, 'All 3 flashcards parsed successfully');
assert(validParseResult.data?.quizQuestions.length === 2, 'All 2 quiz questions parsed successfully');
assert(validParseResult.data?.conceptChecklist.length === 3, 'All 3 checklist items parsed successfully');
assert(validParseResult.data?.topicBreakdown.length === 3, 'All 3 topic breakdown items parsed successfully');

// ----------------------------------------------------
// TEST SUITE 2: Strict Schema Fails on Corrupted Fixture
// ----------------------------------------------------
console.log('\n--- TEST SUITE 2: Strict Schema Correctly Flags Corrupted Fixture ---');
const corruptedStrictResult = StrictStudyKitSchema.safeParse(corruptedStudyKitFixture);
assert(
  corruptedStrictResult.success === false,
  'StrictStudyKitSchema rejects corrupted fixture containing invalid items'
);

// ----------------------------------------------------
// TEST SUITE 3: Partial Recovery Engine Resilience
// ----------------------------------------------------
console.log('\n--- TEST SUITE 3: Partial Recovery Resilience Engine ---');
const recoveryResult = validateAndRecoverStudyKit(corruptedStudyKitFixture);

assert(recoveryResult.stats.isFullyValid === false, 'Recovery engine correctly flags that payload had warnings');
assert(recoveryResult.stats.flashcardsTotal === 5, 'Detected 5 initial flashcards');
assert(recoveryResult.stats.flashcardsValid === 3, 'Preserved exactly 3 valid flashcards (discarded 2 broken)');
assert(recoveryResult.stats.quizQuestionsTotal === 4, 'Detected 4 initial quiz questions');
assert(recoveryResult.stats.quizQuestionsValid === 2, 'Preserved exactly 2 valid quiz questions (1 MCQ, 1 Cloze)');
assert(recoveryResult.stats.conceptChecklistTotal === 2, 'Detected 2 initial checklist items');
assert(recoveryResult.stats.conceptChecklistValid === 1, 'Preserved 1 valid checklist item');
assert(recoveryResult.stats.topicBreakdownTotal === 2, 'Detected 2 initial topic breakdown items');
assert(recoveryResult.stats.topicBreakdownValid === 1, 'Preserved 1 valid topic item (rejected coverage > 100)');

// Verify specific warnings
console.log('\n--- DIAGNOSTIC WARNINGS COLLECTED ---');
recoveryResult.warnings.forEach((w, idx) => {
  console.log(`  [Warning ${idx + 1}] Field: ${w.field} (Index ${w.itemIndex}) -> Reason: ${w.reason}`);
});

assert(recoveryResult.warnings.length === 6, 'Exactly 6 granular warnings were captured for the 6 corrupted items');

// Verify that valid flashcards in recovered dataset are genuinely intact
const recoveredFlashcardIds = recoveryResult.data.flashcards.map((f) => f.id);
assert(
  recoveredFlashcardIds.includes('fc-valid-1') &&
  recoveredFlashcardIds.includes('fc-valid-2') &&
  recoveredFlashcardIds.includes('fc-valid-3'),
  'All valid flashcard IDs are intact'
);
assert(
  !recoveredFlashcardIds.includes('fc-broken-1') &&
  !recoveredFlashcardIds.includes('fc-broken-2'),
  'Broken flashcard IDs were safely excluded'
);

// Verify MCQ option constraint: correctAnswer must be in options
const recoveredQuizTypes = recoveryResult.data.quizQuestions.map((q) => q.id);
assert(
  recoveredQuizTypes.includes('q-valid-mcq') &&
  recoveredQuizTypes.includes('q-valid-cloze'),
  'Only valid quiz items retained'
);
assert(
  !recoveredQuizTypes.includes('q-broken-mcq') &&
  !recoveredQuizTypes.includes('q-broken-cloze'),
  'Broken MCQ (orphan answer) and Cloze (missing answer) were discarded without hallucinating defaults'
);

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n=========================================');
if (failedTests === 0) {
  console.log('🎉 ALL TESTS PASSED! Schema & Partial Recovery are 100% resilient.');
  process.exit(0);
} else {
  console.error(`💥 ${failedTests} test(s) failed.`);
  process.exit(1);
}

