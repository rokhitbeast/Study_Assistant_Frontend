import {
  parseAndSalvageStudyData,
  stripMarkdownFences,
  conservativeTruncatedJsonRepair,
} from '../src/utils/parseAndSalvageStudyData.js';
import { validStudyKitFixture } from '../shared/fixtures/studyKitFixtures.js';

console.log('🧪 Starting parseAndSalvageStudyData Utility Tests...\n');

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
// TEST 1: Valid JSON string
// ---------------------------------------------------------------------------
console.log('--- TEST 1: Valid JSON string ---');
const validJsonString = JSON.stringify(validStudyKitFixture);
const result1 = parseAndSalvageStudyData(validJsonString);

assert(result1.fatalError === null, 'No fatal error on valid JSON');
assert(result1.data !== null, 'Data is non-null');
assert(result1.data.flashcards.length === 3, 'Preserves all 3 valid flashcards');
assert(result1.recovered === false, 'Marked as not recovered (it was already 100% valid)');
assert(result1.warnings.length === 0, 'Zero warnings for fully valid JSON');

// ---------------------------------------------------------------------------
// TEST 2: Markdown-wrapped JSON
// ---------------------------------------------------------------------------
console.log('\n--- TEST 2: Markdown-wrapped JSON ---');
const markdownWrappedJson = `\`\`\`json\n${JSON.stringify(validStudyKitFixture, null, 2)}\n\`\`\``;
const result2 = parseAndSalvageStudyData(markdownWrappedJson);

assert(result2.fatalError === null, 'No fatal error on markdown-wrapped JSON');
assert(result2.data !== null, 'Successfully stripped markdown fences and parsed object');
assert(result2.data.title === validStudyKitFixture.title, 'Title parsed correctly');

// ---------------------------------------------------------------------------
// TEST 3: Truncated JSON repair
// ---------------------------------------------------------------------------
console.log('\n--- TEST 3: Truncated JSON Repair ---');
// Simulate an LLM stream cutting off abruptly inside flashcard 2
const truncatedJson = `
{
  "id": "kit-trunc-1",
  "title": "Truncated Topics",
  "sourceText": "Original source text here",
  "conceptChecklist": [
    { "id": "chk-1", "title": "Concept 1", "description": "Desc 1", "completed": false }
  ],
  "flashcards": [
    { "id": "fc-1", "front": "Q1", "back": "A1", "difficulty": "easy" },
    { "id": "fc-2", "front": "Q2", "back": "A2
`;
const result3 = parseAndSalvageStudyData(truncatedJson);

assert(result3.fatalError === null, 'Successfully avoided fatal error on truncated JSON');
assert(result3.data !== null, 'Successfully salvaged usable study kit from truncated stream');
assert(result3.data.flashcards.length >= 1, 'Preserved completed flashcard fc-1');
assert(result3.recovered === true, 'Marked as recovered because repair occurred');
assert(result3.warnings.some((w) => w.reason.includes('truncated')), 'Diagnostic warning recorded for truncation');

// ---------------------------------------------------------------------------
// TEST 4: Missing fields
// ---------------------------------------------------------------------------
console.log('\n--- TEST 4: Missing Fields Partial Recovery ---');
const missingFieldsPayload = {
  title: 'Partial Data Kit',
  // missing id, sourceText, generatedAt, checklist
  flashcards: [
    { id: 'fc-1', front: 'Valid Front', back: 'Valid Back', difficulty: 'medium' },
  ],
};
const result4 = parseAndSalvageStudyData(missingFieldsPayload);

assert(result4.fatalError === null, 'Missing non-critical top-level fields does not cause fatal crash');
assert(result4.data !== null, 'Data is non-null');
assert(typeof result4.data.id === 'string' && result4.data.id.length > 0, 'Assigned safe stable ID');
assert(result4.data.flashcards.length === 1, 'Valid card retained');

// ---------------------------------------------------------------------------
// TEST 5: Wrong data types
// ---------------------------------------------------------------------------
console.log('\n--- TEST 5: Wrong Data Types ---');
const wrongDataTypesPayload = {
  id: 'kit-wrong-types',
  title: 'Type Errors',
  conceptChecklist: [
    { id: 'chk-1', title: 12345, description: true, completed: 'not-a-boolean' }, // wrong types
    { id: 'chk-2', title: 'Valid Concept', description: 'Valid desc', completed: false },
  ],
  topicBreakdown: [
    { id: 'tb-1', topic: 'Topic 1', coverage: 'eighty percent', difficulty: 'easy' }, // string instead of number
    { id: 'tb-2', topic: 'Topic 2', coverage: 80, difficulty: 'easy' }, // valid
  ],
};
const result5 = parseAndSalvageStudyData(wrongDataTypesPayload);

assert(result5.fatalError === null, 'Wrong data types in items handled safely without crash');
assert(result5.data.conceptChecklist.length === 1, 'Preserved only the valid concept (chk-2)');
assert(result5.data.conceptChecklist[0].id === 'chk-2', 'Retained valid concept ID');
assert(result5.data.topicBreakdown.length === 1, 'Preserved only the valid topic (tb-2)');
assert(result5.warnings.length >= 2, 'Warnings recorded for wrong type items');

// ---------------------------------------------------------------------------
// TEST 6: Invalid individual cards (5 cards: 2 broken, 3 valid)
// ---------------------------------------------------------------------------
console.log('\n--- TEST 6: 5 Flashcards: 2 broken, 3 valid ---');
const fiveCardsPayload = {
  id: 'kit-cards-test',
  title: 'Flashcard Filter Test',
  flashcards: [
    { id: 'card-1', front: 'Front 1', back: 'Back 1', difficulty: 'easy' },
    { id: 'card-2', front: 'Front 2', /* missing back */ difficulty: 'medium' },
    { id: 'card-3', front: 'Front 3', back: 'Back 3', difficulty: 'hard' },
    { id: 'card-4', front: 'Front 4', back: 'Back 4', difficulty: 'ultra-impossible' }, // invalid difficulty
    { id: 'card-5', front: 'Front 5', back: 'Back 5', difficulty: 'medium' },
  ],
};
const result6 = parseAndSalvageStudyData(fiveCardsPayload);

assert(result6.fatalError === null, 'Partial card rejection succeeds without fatal error');
assert(result6.data.flashcards.length === 3, 'Preserved exactly 3 valid cards');
assert(
  result6.data.flashcards.map((c) => c.id).join(',') === 'card-1,card-3,card-5',
  'Preserved exactly card-1, card-3, card-5'
);
assert(result6.recovered === true, 'Marked as recovered');
assert(result6.warnings.length === 2, 'Captured 2 specific warnings for the 2 bad cards');

// ---------------------------------------------------------------------------
// TEST 7: Empty response
// ---------------------------------------------------------------------------
console.log('\n--- TEST 7: Empty Response ---');
const result7a = parseAndSalvageStudyData('');
const result7b = parseAndSalvageStudyData('   \n\t   ');
const result7c = parseAndSalvageStudyData(null);

assert(result7a.fatalError !== null && result7a.data === null, 'Empty string returns fatal error');
assert(result7b.fatalError !== null && result7b.data === null, 'Whitespace string returns fatal error');
assert(result7c.fatalError !== null && result7c.data === null, 'Null returns fatal error');

// ---------------------------------------------------------------------------
// TEST 8: Completely invalid response (pure prose, no JSON)
// ---------------------------------------------------------------------------
console.log('\n--- TEST 8: Completely Invalid Response (Non-JSON Prose) ---');
const proseResponse = 'I am sorry, but as an AI language model I cannot answer this request right now.';
const result8 = parseAndSalvageStudyData(proseResponse);

assert(result8.fatalError !== null, 'Non-JSON prose produces fatalError');
assert(result8.data === null, 'Data is null for completely invalid non-JSON prose');
assert(result8.recovered === false, 'Marked as unrecovered');

console.log('\n=========================================');
if (failedTests === 0) {
  console.log('🎉 ALL 8 SALVAGE & RECOVERY TESTS PASSED!');
} else {
  console.error(`💥 ${failedTests} test(s) failed.`);
  process.exit(1);
}

