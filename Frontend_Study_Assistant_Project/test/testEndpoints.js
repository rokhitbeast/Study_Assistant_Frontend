import dotenv from 'dotenv';
import { mergeStudyKitsById, cleanJsonOutput } from '../server/services/geminiService.js';
import { validStudyKitFixture } from '../shared/fixtures/studyKitFixtures.js';

dotenv.config();

console.log('🧪 Running Server & Gemini Integration Verification Tests...\n');

let failedTests = 0;
function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

// ----------------------------------------------------
// TEST 1: cleanJsonOutput Utility
// ----------------------------------------------------
console.log('--- TEST 1: Markdown JSON Sanitizer ---');
const rawMarkdownJson = '```json\n{"title": "Test"}\n```';
const cleaned = cleanJsonOutput(rawMarkdownJson);
assert(cleaned === '{"title": "Test"}', 'cleanJsonOutput correctly removes markdown fences');

// ----------------------------------------------------
// TEST 2: mergeStudyKitsById Non-destructive update
// ----------------------------------------------------
console.log('\n--- TEST 2: Surgical Non-Destructive Merge ---');
const baseKit = JSON.parse(JSON.stringify(validStudyKitFixture));
const refinedSubset = {
  flashcards: [
    {
      id: 'fc-1', // existing id
      front: 'Updated front for card 1?',
      back: 'Updated back for card 1.',
      mnemonic_hint: 'Updated hint',
      difficulty: 'hard',
    },
    {
      id: 'new_fc_99', // new id
      front: 'Brand new card front',
      back: 'Brand new card back',
      mnemonic_hint: 'New hint',
      difficulty: 'easy',
    },
  ],
};

const merged = mergeStudyKitsById(baseKit, refinedSubset);

// Checks
assert(merged.sourceText === baseKit.sourceText, 'Original sourceText preserved strictly');
assert(merged.id === baseKit.id, 'Original StudyKit id preserved');
assert(merged.flashcards.length === 4, 'Flashcards count incremented from 3 to 4');
assert(merged.flashcards[0].front === 'Updated front for card 1?', 'Target flashcard fc-1 successfully updated');
assert(merged.flashcards[1].id === 'fc-2', 'Untargeted flashcard fc-2 preserved untouched');
assert(merged.flashcards[2].id === 'fc-3', 'Untargeted flashcard fc-3 preserved untouched');
assert(merged.flashcards[3].id === 'new_fc_99', 'New flashcard new_fc_99 appended to the deck');
assert(merged.quizQuestions.length === baseKit.quizQuestions.length, 'Quiz questions completely preserved untouched');
assert(merged.conceptChecklist.length === baseKit.conceptChecklist.length, 'Checklist completely preserved untouched');

console.log('\n=========================================');
if (failedTests === 0) {
  console.log('🎉 ALL LOGICAL & MERGE TESTS PASSED!');
} else {
  console.error(`💥 ${failedTests} test(s) failed.`);
  process.exit(1);
}

