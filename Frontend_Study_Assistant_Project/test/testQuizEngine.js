import { validStudyKitFixture } from '../shared/fixtures/studyKitFixtures.js';

console.log('🧪 Starting Quiz Engine State Transition Tests...\n');

let failedTests = 0;
function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

// Extract questions from fixture
const sampleQuestions = validStudyKitFixture.quizQuestions; // 1 MCQ (q-1), 1 Cloze (q-2)

// In-memory simulation of useQuizRunner logic
class MockQuizRunner {
  constructor(questions) {
    this.questions = questions;
    this.progress = {};
    questions.forEach((q) => {
      this.progress[q.id] = { status: 'unseen', userAttempts: 0, selectedAnswer: null };
    });
    this.isRetestMode = false;
  }

  getActiveQuestions() {
    if (!this.isRetestMode) return this.questions;
    return this.questions.filter((q) => this.progress[q.id]?.status === 'wrong');
  }

  submit(questionId, rawAnswer) {
    const q = this.questions.find((item) => item.id === questionId);
    if (!q) return;

    // Prevent repeated submission if already answered and not in retest
    if (this.progress[questionId].selectedAnswer !== null && !this.isRetestMode) {
      return { ignored: true };
    }

    let isCorrect = false;
    if (q.type === 'mcq') {
      isCorrect = String(rawAnswer).trim() === String(q.correctAnswer).trim();
    } else if (q.type === 'cloze') {
      isCorrect = String(rawAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
    }

    this.progress[questionId] = {
      status: isCorrect ? 'correct' : 'wrong',
      userAttempts: this.progress[questionId].userAttempts + 1,
      selectedAnswer: rawAnswer,
    };

    return { isCorrect };
  }

  startRetest() {
    const wrong = this.questions.filter((q) => this.progress[q.id]?.status === 'wrong');
    if (wrong.length === 0) return false;

    // Clear previous selectedAnswer for wrong questions to allow fresh attempt
    wrong.forEach((q) => {
      this.progress[q.id].selectedAnswer = null;
    });

    this.isRetestMode = true;
    return true;
  }

  exitRetest() {
    this.isRetestMode = false;
  }

  getStats() {
    let attempted = 0;
    let correct = 0;
    let wrong = 0;
    this.questions.forEach((q) => {
      const p = this.progress[q.id];
      if (p.status !== 'unseen') attempted++;
      if (p.status === 'correct') correct++;
      if (p.status === 'wrong') wrong++;
    });
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    return { total: this.questions.length, attempted, correct, wrong, accuracy };
  }
}

// ---------------------------------------------------------------------------
// TEST 1: MCQ Evaluation & State Transition
// ---------------------------------------------------------------------------
console.log('--- TEST 1: MCQ Answer Evaluation ---');
const runner = new MockQuizRunner(sampleQuestions);

// Submit correct answer to q-1 ("useMemo")
const res1 = runner.submit('q-1', 'useMemo');
assert(res1.isCorrect === true, 'Correct option evaluates to isCorrect: true');
assert(runner.progress['q-1'].status === 'correct', 'Question status set to "correct"');
assert(runner.progress['q-1'].userAttempts === 1, 'userAttempts incremented to 1');
assert(runner.progress['q-1'].selectedAnswer === 'useMemo', 'selectedAnswer recorded');

// Attempt duplicate submission
const dupRes = runner.submit('q-1', 'useEffect');
assert(dupRes.ignored === true, 'Duplicate submission ignored once answered');
assert(runner.progress['q-1'].selectedAnswer === 'useMemo', 'Original answer preserved against overwrite');

// ---------------------------------------------------------------------------
// TEST 2: Cloze Normalization & Case Insensitivity
// ---------------------------------------------------------------------------
console.log('\n--- TEST 2: Cloze Case & Whitespace Normalization ---');
// q-2 correctAnswer is "re-render"
const clozeCorrect = runner.submit('q-2', '  Re-Render  ');
assert(clozeCorrect.isCorrect === true, 'Cloze successfully matches with leading/trailing spaces and mixed case');
assert(runner.progress['q-2'].status === 'correct', 'Cloze status marked "correct"');

// ---------------------------------------------------------------------------
// TEST 3: Retest Wrong Answers Flow
// ---------------------------------------------------------------------------
console.log('\n--- TEST 3: Retest Wrong Answers Lifecycle ---');
const retestRunner = new MockQuizRunner([
  { id: 'q-mcq-1', type: 'mcq', question: '2+2=?', options: ['3', '4', '5'], correctAnswer: '4' },
  { id: 'q-cloze-2', type: 'cloze', question: 'Water is ____.', correctAnswer: 'liquid' },
  { id: 'q-mcq-3', type: 'mcq', question: 'Capital of Japan?', options: ['Tokyo', 'Kyoto'], correctAnswer: 'Tokyo' },
]);

// Answer 1 correct, 2 wrong
retestRunner.submit('q-mcq-1', '4'); // correct
retestRunner.submit('q-cloze-2', 'gas'); // WRONG
retestRunner.submit('q-mcq-3', 'Kyoto'); // WRONG

const preStats = retestRunner.getStats();
assert(preStats.correct === 1, 'Pre-retest correct count is 1');
assert(preStats.wrong === 2, 'Pre-retest wrong count is 2');
assert(preStats.accuracy === 33, 'Pre-retest accuracy is 33%');

// Enter Retest Mode
const entered = retestRunner.startRetest();
assert(entered === true, 'Successfully entered Retest Mode');
assert(retestRunner.isRetestMode === true, 'isRetestMode flag is active');

const retestPool = retestRunner.getActiveQuestions();
assert(retestPool.length === 2, 'Retest pool filtered strictly to the 2 wrong questions');
assert(retestPool.map((q) => q.id).includes('q-cloze-2'), 'Preserved original ID q-cloze-2');
assert(retestPool.map((q) => q.id).includes('q-mcq-3'), 'Preserved original ID q-mcq-3');
assert(!retestPool.map((q) => q.id).includes('q-mcq-1'), 'Correct question excluded from retest pool');

// Attempt retest on q-cloze-2 with correct answer
const retestAns = retestRunner.submit('q-cloze-2', 'Liquid');
assert(retestAns.isCorrect === true, 'Retested question evaluated correctly');
assert(retestRunner.progress['q-cloze-2'].status === 'correct', 'Status updated from wrong to correct');
assert(retestRunner.progress['q-cloze-2'].userAttempts === 2, 'Attempts incremented to 2');

// Exit Retest Mode
retestRunner.exitRetest();
assert(retestRunner.isRetestMode === false, 'Exited retest mode');
const restoredPool = retestRunner.getActiveQuestions();
assert(restoredPool.length === 3, 'Full 3-question quiz deck completely restored upon exit');

const postStats = retestRunner.getStats();
assert(postStats.correct === 2, 'Post-retest correct count updated to 2');
assert(postStats.wrong === 1, 'Post-retest wrong count reduced to 1');
assert(postStats.accuracy === 67, 'Post-retest accuracy updated to 67%');

console.log('\n=========================================');
if (failedTests === 0) {
  console.log('🎉 ALL QUIZ ENGINE TRANSITION TESTS PASSED!');
  process.exit(0);
} else {
  console.error(`💥 ${failedTests} test(s) failed.`);
  process.exit(1);
}

