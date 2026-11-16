import { Router } from 'express';

const router = Router();

/**
 * GET /api/chaos/race
 * Simulates variable latency to verify client-side race condition handling.
 */
router.get('/race', async (req, res) => {
  const delay = parseInt(req.query.delay || '1000', 10);
  const id = req.query.id || 'A';

  await new Promise((resolve) => setTimeout(resolve, delay));

  res.status(200).json({
    success: true,
    data: {
      id: `kit-race-${id}`,
      title: `Study Topic ${id} (Resolved after ${delay}ms)`,
      sourceText: `Simulated race condition payload for candidate ${id}`,
      generatedAt: new Date().toISOString(),
      conceptChecklist: [{ id: `chk-${id}`, title: `Concept ${id}`, description: 'Race test concept', completed: false }],
      flashcards: [{ id: `fc-${id}`, front: `Front ${id}`, back: `Back ${id}`, difficulty: 'easy', mnemonic_hint: '' }],
      quizQuestions: [{ id: `q-${id}`, type: 'cloze', question: `Test ${id} is ____.`, correctAnswer: id, explanation: '' }],
      topicBreakdown: [{ id: `tb-${id}`, topic: `Topic ${id}`, coverage: 80, difficulty: 'easy' }],
    },
  });
});

/**
 * GET /api/chaos/malformed
 * Returns truncated, unclosed JSON simulating an AI token limit cutoff.
 */
router.get('/malformed', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  const truncatedPayload = `
{
  "id": "kit-repaired-sample",
  "title": "Quantum Mechanics & Wave Functions",
  "sourceText": "Quantum mechanics describes physical properties at atomic scales.",
  "generatedAt": "2026-11-15T12:00:00.000Z",
  "conceptChecklist": [
    { "id": "chk-1", "title": "Wave-Particle Duality", "description": "Matter exhibits wave and particle behavior.", "completed": false }
  ],
  "flashcards": [
    { "id": "fc-1", "front": "What is Planck's constant?", "back": "6.626 x 10^-34 J s", "difficulty": "easy", "mnemonic_hint": "h for tiny constant" },
    { "id": "fc-2", "front": "What does the Schrödinger equation describe?", "back": "How quantum state changes over time", "difficulty": "medium", "mnemonic_hint": "Wave function evolution" },
    { "id": "fc-3", "front": "What is the Uncertainty Principle?", "back": "Cannot simultaneously know position and
  `.trim();

  res.status(200).send(truncatedPayload);
});

/**
 * GET /api/chaos/wrong-schema
 * Returns 5 flashcards where 2 are intentionally corrupted.
 */
router.get('/wrong-schema', (_req, res) => {
  res.status(200).json({
    id: 'kit-schema-chaos',
    title: 'Cellular Biochemistry (Chaos Test)',
    sourceText: 'Biochemistry notes with corrupted schema items.',
    generatedAt: new Date().toISOString(),
    conceptChecklist: [
      { id: 'chk-ok-1', title: 'Glycolysis', description: 'Glucose breakdown', completed: false },
    ],
    flashcards: [
      { id: 'fc-valid-1', front: 'Where does glycolysis occur?', back: 'In the cytoplasm.', difficulty: 'easy' },
      { id: 'fc-corrupt-1', front: 'What is the net ATP yield?', /* missing back answer! */ difficulty: 'medium' },
      { id: 'fc-valid-2', front: 'Does glycolysis require oxygen?', back: 'No, it is anaerobic.', difficulty: 'easy' },
      { id: 'fc-corrupt-2', front: 'What is pyruvate dehydrogenase?', back: 'An enzyme complex.', difficulty: 'super-extreme' /* invalid enum! */ },
      { id: 'fc-valid-3', front: 'What is the end product of glycolysis?', back: 'Two molecules of pyruvate.', difficulty: 'hard' },
    ],
    quizQuestions: [],
    topicBreakdown: [],
  });
});

/**
 * GET /api/chaos/failure
 * Simulates HTTP 500 error or hanging connection for timeout testing.
 */
router.get('/failure', async (req, res) => {
  const type = req.query.type || '500';

  if (type === 'timeout') {
    // Hangs for 15 seconds to trigger client-side AbortSignal.timeout
    await new Promise((resolve) => setTimeout(resolve, 15000));
    return res.status(200).json({ status: 'late' });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'SIMULATED_CHAOS_CRASH',
      message: 'Simulated 500 Internal Server Crash from Chaos Gateway.',
      status: 500,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;

