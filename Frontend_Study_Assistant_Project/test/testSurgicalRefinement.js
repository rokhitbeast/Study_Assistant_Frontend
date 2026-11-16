import { mergeStudyKitsById } from '../server/services/geminiService.js';
import { validStudyKitFixture } from '../shared/fixtures/studyKitFixtures.js';

console.log('🧪 Starting Surgical AI Refinement & Merge Tests...\n');

let failedTests = 0;
function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Modifying Existing Items Preserving Original IDs
// ---------------------------------------------------------------------------
console.log('--- TEST 1: Modifying Target Items with ID Preservation ---');
const originalKit = JSON.parse(JSON.stringify(validStudyKitFixture));

// Target modifying q-1 explanation and fc-2 mnemonic hint
const refinedPayload = {
  summary: 'Simplified explanation for q-1 and enhanced mnemonic for fc-2',
  quizQuestions: [
    {
      id: 'q-1', // existing ID
      type: 'mcq',
      question: 'Which hook should you use to cache the calculated result of an expensive function?',
      options: ['useEffect', 'useMemo', 'useCallback', 'useRef'],
      correctAnswer: 'useMemo',
      explanation: 'SIMPLIFIED: useMemo remembers values like a cached sticky note.',
    },
  ],
  flashcards: [
    {
      id: 'fc-2', // existing ID
      front: 'Can React Hooks be invoked inside loops or conditions?',
      back: 'No. Hooks must always be called at the top level to preserve consistent hook call order across renders.',
      mnemonic_hint: 'NEW MNEMONIC: Top of the morning = Top of the component.',
      difficulty: 'easy',
    },
  ],
};

const mergedKit1 = mergeStudyKitsById(originalKit, refinedPayload);

assert(mergedKit1.id === originalKit.id, 'Root studyKit ID preserved');
assert(mergedKit1.sourceText === originalKit.sourceText, 'Original source text preserved');
assert(mergedKit1.quizQuestions.length === 2, 'Quiz questions length remains 2');
assert(
  mergedKit1.quizQuestions[0].explanation === 'SIMPLIFIED: useMemo remembers values like a cached sticky note.',
  'Target question q-1 explanation updated successfully'
);
assert(mergedKit1.quizQuestions[1].id === 'q-2', 'Untargeted question q-2 completely preserved untouched');
assert(mergedKit1.flashcards.length === 3, 'Flashcards length remains 3');
assert(
  mergedKit1.flashcards[1].mnemonic_hint === 'NEW MNEMONIC: Top of the morning = Top of the component.',
  'Target flashcard fc-2 updated successfully'
);
assert(mergedKit1.flashcards[0].id === 'fc-1', 'Untargeted flashcard fc-1 preserved untouched');
assert(mergedKit1.conceptChecklist.length === 3, 'Checklist untouched');

// ---------------------------------------------------------------------------
// TEST 2: Appending Newly Generated Items Without Discarding Existing
// ---------------------------------------------------------------------------
console.log('\n--- TEST 2: Appending Newly Generated Items ---');
const addCardsPayload = {
  summary: 'Added 2 hard flashcards on fiber reconciler',
  flashcards: [
    {
      id: 'new_fc_101',
      front: 'What is a workInProgress fiber tree?',
      back: 'An alternate fiber tree constructed during concurrent render phases.',
      mnemonic_hint: 'Double buffering architecture like video game graphics.',
      difficulty: 'hard',
    },
    {
      id: 'new_fc_102',
      front: 'What does lanes represent in React 18+?',
      back: 'A bitmask representing task update priorities.',
      mnemonic_hint: 'Highway express lanes.',
      difficulty: 'hard',
    },
  ],
};

const mergedKit2 = mergeStudyKitsById(originalKit, addCardsPayload);

assert(mergedKit2.flashcards.length === 5, 'Flashcard deck expanded from 3 to 5 cards');
assert(mergedKit2.flashcards[3].id === 'new_fc_101', 'First new flashcard appended at index 3');
assert(mergedKit2.flashcards[4].id === 'new_fc_102', 'Second new flashcard appended at index 4');
assert(mergedKit2.flashcards[0].id === 'fc-1', 'Card 0 preserved');
assert(mergedKit2.flashcards[1].id === 'fc-2', 'Card 1 preserved');
assert(mergedKit2.flashcards[2].id === 'fc-3', 'Card 2 preserved');

// ---------------------------------------------------------------------------
// TEST 3: User Progress Preservation Across Refinement
// ---------------------------------------------------------------------------
console.log('\n--- TEST 3: User Progress & Attempt History Preservation ---');

// Simulated user progress dictionary mapped by stable ID
const userProgress = {
  'q-1': { status: 'wrong', userAttempts: 2, selectedAnswer: 'useCallback' },
  'q-2': { status: 'correct', userAttempts: 1, selectedAnswer: 're-render' },
};

// Check that because original IDs are strictly preserved in mergedKit1,
// the user progress mapping is still 100% valid!
assert(userProgress[mergedKit1.quizQuestions[0].id].status === 'wrong', 'User progress for q-1 retained');
assert(userProgress[mergedKit1.quizQuestions[0].id].userAttempts === 2, 'User attempts for q-1 retained');
assert(userProgress[mergedKit1.quizQuestions[1].id].status === 'correct', 'User progress for q-2 retained');

console.log('\n=========================================');
if (failedTests === 0) {
  console.log('🎉 ALL SURGICAL REFINEMENT & MERGE TESTS PASSED!');
  process.exit(0);
} else {
  console.error(`💥 ${failedTests} test(s) failed.`);
  process.exit(1);
}

