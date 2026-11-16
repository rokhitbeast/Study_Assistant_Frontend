/**
 * Fully compliant, valid StudyKit fixture
 */
export const validStudyKitFixture = {
  id: "kit-react-hooks-101",
  title: "React Hooks & Functional Components Architecture",
  sourceText: "React hooks let you use state and other React features without writing a class. useEffect handles side effects. useState declares state variables. Custom hooks extract component logic into reusable functions.",
  generatedAt: "2026-11-15T12:00:00.000Z",
  conceptChecklist: [
    {
      id: "chk-1",
      title: "State with useState",
      description: "Declare reactive component state variables and setter functions.",
      completed: false,
    },
    {
      id: "chk-2",
      title: "Side Effects with useEffect",
      description: "Manage component lifecycles, subscriptions, and DOM updates.",
      completed: true,
    },
    {
      id: "chk-3",
      title: "Custom Hooks Reusability",
      description: "Encapsulate cross-cutting component logic without duplicating state.",
      completed: false,
    },
  ],
  flashcards: [
    {
      id: "fc-1",
      front: "What is the primary role of the dependency array in useEffect?",
      back: "It tells React when to re-execute the effect based on shallow comparison of previous and current dependency values.",
      mnemonic_hint: "Empty array runs once on mount; missing array runs every render.",
      difficulty: "medium",
    },
    {
      id: "fc-2",
      front: "Can React Hooks be invoked inside loops or conditions?",
      back: "No. Hooks must always be called at the top level to preserve consistent hook call order across renders.",
      mnemonic_hint: "Top-level only rule preserves index in React fiber tree.",
      difficulty: "easy",
    },
    {
      id: "fc-3",
      front: "How does React detect state updates when using useState?",
      back: "React uses Object.is comparison. If the new state matches the previous state reference, the render cycle is skipped.",
      mnemonic_hint: "Immutable updates create new references to trigger renders.",
      difficulty: "hard",
    },
  ],
  quizQuestions: [
    {
      id: "q-1",
      type: "mcq",
      question: "Which hook should you use to cache the calculated result of an expensive function?",
      options: ["useEffect", "useMemo", "useCallback", "useRef"],
      correctAnswer: "useMemo",
      explanation: "useMemo memoizes values, whereas useCallback memoizes callback function definitions.",
    },
    {
      id: "q-2",
      type: "cloze",
      question: "In React, modifying state via a setter triggers a component ____.",
      correctAnswer: "re-render",
      explanation: "State updates schedule a re-render of the component and its children.",
    },
  ],
  topicBreakdown: [
    {
      id: "tb-1",
      topic: "Lifecycle & Effects",
      coverage: 85,
      difficulty: "medium",
    },
    {
      id: "tb-2",
      topic: "State Synchronization",
      coverage: 90,
      difficulty: "easy",
    },
    {
      id: "tb-3",
      topic: "Performance & Memoization",
      coverage: 60,
      difficulty: "hard",
    },
  ],
};

/**
 * Corrupted StudyKit fixture containing real-world AI failures:
 * - 5 flashcards sent: 3 valid, 1 missing `back`, 1 with invalid difficulty 'extreme'
 * - Quiz: 1 valid MCQ, 1 corrupted MCQ where correctAnswer is missing from options, 1 valid Cloze, 1 corrupted Cloze with missing correctAnswer
 * - Checklist: 1 valid, 1 with empty title
 * - Breakdown: 1 valid, 1 with coverage > 100
 */
export const corruptedStudyKitFixture = {
  id: "kit-corrupted-sample",
  title: "Advanced JavaScript Concurrency",
  sourceText: "JavaScript uses an event loop with a call stack, microtask queue, and macrotask queue...",
  generatedAt: "2026-11-15T12:30:00.000Z",
  conceptChecklist: [
    {
      id: "chk-valid-1",
      title: "Call Stack Execution",
      description: "LIFO execution of synchronous execution contexts.",
      completed: false,
    },
    {
      id: "chk-broken-1",
      title: "", // INVALID: empty title
      description: "Missing concept title",
      completed: false,
    },
  ],
  flashcards: [
    {
      id: "fc-valid-1",
      front: "What queue do Promise resolutions go to?",
      back: "The microtask queue.",
      mnemonic_hint: "Micro before Macro.",
      difficulty: "medium",
    },
    {
      id: "fc-broken-1",
      front: "What is the purpose of setTimeout(fn, 0)?",
      // INVALID: missing 'back' answer
      mnemonic_hint: "Defer to next macrotask turn.",
      difficulty: "easy",
    },
    {
      id: "fc-valid-2",
      front: "Which task queue takes priority: microtask or macrotask?",
      back: "The microtask queue is completely drained after every macrotask.",
      mnemonic_hint: "Microtasks starve macrotasks if queued indefinitely.",
      difficulty: "hard",
    },
    {
      id: "fc-broken-2",
      front: "Can web workers access DOM nodes directly?",
      back: "No, web workers run on background threads without DOM access.",
      mnemonic_hint: "PostMessage for communication.",
      difficulty: "extreme", // INVALID: 'extreme' is not 'easy' | 'medium' | 'hard'
    },
    {
      id: "fc-valid-3",
      front: "What API is used to execute scripts right before browser repaint?",
      back: "requestAnimationFrame",
      mnemonic_hint: "rAF syncs with monitor refresh rate.",
      difficulty: "medium",
    },
  ],
  quizQuestions: [
    {
      id: "q-valid-mcq",
      type: "mcq",
      question: "Where are setTimeout callbacks placed?",
      options: ["Call Stack", "Microtask Queue", "Macrotask (Task) Queue", "Heap"],
      correctAnswer: "Macrotask (Task) Queue",
      explanation: "Timers and I/O callbacks are scheduled on the macrotask queue.",
    },
    {
      id: "q-broken-mcq",
      type: "mcq",
      question: "Which of the following creates a microtask?",
      options: ["setTimeout", "setInterval", "setImmediate"],
      correctAnswer: "queueMicrotask", // INVALID: 'queueMicrotask' is not in the options array!
      explanation: "queueMicrotask explicitly enqueues microtasks.",
    },
    {
      id: "q-valid-cloze",
      type: "cloze",
      question: "Promises and MutationObserver callbacks belong to the ____ queue.",
      correctAnswer: "microtask",
      explanation: "Microtasks execute before the next macrotask.",
    },
    {
      id: "q-broken-cloze",
      type: "cloze",
      question: "The single-threaded execution model is powered by the ____.",
      // INVALID: missing correctAnswer
      explanation: "The event loop orchestrates asynchronous non-blocking I/O.",
    },
  ],
  topicBreakdown: [
    {
      id: "tb-valid-1",
      topic: "Event Loop Fundamentals",
      coverage: 95,
      difficulty: "easy",
    },
    {
      id: "tb-broken-1",
      topic: "Web Workers",
      coverage: 150, // INVALID: coverage > 100
      difficulty: "hard",
    },
  ],
};

