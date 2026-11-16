import { z } from 'zod';

// ==========================================
// 1. Core Enumerations & Primitives
// ==========================================

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const QuizQuestionTypeSchema = z.enum(['mcq', 'cloze']);

// Helper to generate deterministic or resilient fallback IDs if missing
export const generateStableId = (prefix = 'item') => 
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// ==========================================
// 2. Individual Item Schemas
// ==========================================

/**
 * Concept Checklist Item Schema
 */
export const ConceptChecklistItemSchema = z.object({
  id: z.string().min(1, 'Item ID is required'),
  title: z.string().min(1, 'Concept title cannot be empty'),
  description: z.string().default(''),
  completed: z.boolean().default(false),
});

/**
 * Flashcard Item Schema
 */
export const FlashcardItemSchema = z.object({
  id: z.string().min(1, 'Flashcard ID is required'),
  front: z.string().min(1, 'Flashcard front prompt cannot be empty'),
  back: z.string().min(1, 'Flashcard back answer cannot be empty'),
  mnemonic_hint: z.string().optional().default(''),
  difficulty: DifficultySchema,
});

/**
 * Multiple Choice Question (MCQ) Schema
 */
export const MCQQuestionBaseSchema = z.object({
  id: z.string().min(1, 'Quiz item ID is required'),
  type: z.literal('mcq'),
  question: z.string().min(1, 'Question text cannot be empty'),
  options: z.array(z.string().min(1, 'Option cannot be empty')).min(2, 'MCQ must provide at least 2 options'),
  correctAnswer: z.string().min(1, 'Correct answer must be specified'),
  explanation: z.string().default(''),
});

export const MCQQuestionSchema = MCQQuestionBaseSchema.superRefine((data, ctx) => {
  // Validate that the stated correct answer exists in options
  if (!data.options.includes(data.correctAnswer)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `MCQ correctAnswer "${data.correctAnswer}" is not present in available options: [${data.options.join(', ')}]`,
      path: ['correctAnswer'],
    });
  }
});

/**
 * Fill-in-the-Blank (Cloze) Question Schema
 */
export const ClozeQuestionSchema = z.object({
  id: z.string().min(1, 'Quiz item ID is required'),
  type: z.literal('cloze'),
  question: z.string().min(1, 'Cloze question text cannot be empty'),
  correctAnswer: z.string().min(1, 'Cloze correct answer cannot be empty'),
  explanation: z.string().default(''),
});

/**
 * Discriminated Union for Quiz Questions with contextual validation
 */
export const QuizQuestionSchema = z.discriminatedUnion('type', [
  MCQQuestionBaseSchema,
  ClozeQuestionSchema,
]).superRefine((data, ctx) => {
  if (data.type === 'mcq' && !data.options.includes(data.correctAnswer)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `MCQ correctAnswer "${data.correctAnswer}" is not present in available options: [${data.options.join(', ')}]`,
      path: ['correctAnswer'],
    });
  }
});

/**
 * Topic Breakdown Item Schema
 */
export const TopicBreakdownItemSchema = z.object({
  id: z.string().min(1, 'Topic item ID is required'),
  topic: z.string().min(1, 'Topic name cannot be empty'),
  coverage: z.number().min(0).max(100, 'Coverage percentage must be between 0 and 100'),
  difficulty: DifficultySchema,
});

// ==========================================
// 3. Complete StudyKit Schema
// ==========================================

export const StrictStudyKitSchema = z.object({
  id: z.string().min(1, 'StudyKit ID is required'),
  title: z.string().min(1, 'Study topic title is required'),
  sourceText: z.string().default(''),
  generatedAt: z.string().datetime({ message: 'Must be a valid ISO timestamp' }).or(z.string()),
  conceptChecklist: z.array(ConceptChecklistItemSchema),
  flashcards: z.array(FlashcardItemSchema),
  quizQuestions: z.array(QuizQuestionSchema),
  topicBreakdown: z.array(TopicBreakdownItemSchema),
});

/**
 * Surgical Refinement Response Schema
 */
export const StudyKitRefinementSchema = z.object({
  summary: z.string().min(1, 'Refinement summary is required'),
  refinedStudyKit: StrictStudyKitSchema,
  modifiedItemIds: z.array(z.string()).default([]),
  newItemIds: z.array(z.string()).default([]),
});

// ==========================================
// 4. Partial Recovery & Resilience Engine
// ==========================================

/**
 * Validates an array of items item-by-item using safeParse.
 * Preserves all valid items and gathers detailed diagnostic warnings for invalid items.
 * Strictly adheres to rule: Never fabricate or invent missing answers.
 *
 * @template T
 * @param {Array<any>} rawArray
 * @param {z.ZodType<T>} itemSchema
 * @param {string} arrayName
 * @returns {{ validItems: T[], warnings: Array<{ itemIndex: number, field: string, reason: string, rawSnippet: any }> }}
 */
export function validateArrayWithPartialRecovery(rawArray, itemSchema, arrayName) {
  if (rawArray === undefined || rawArray === null) {
    return {
      validItems: [],
      warnings: [],
    };
  }

  if (!Array.isArray(rawArray)) {
    return {
      validItems: [],
      warnings: [
        {
          itemIndex: -1,
          field: arrayName,
          reason: `Expected an array for "${arrayName}", received ${typeof rawArray}`,
          rawSnippet: rawArray,
        },
      ],
    };
  }

  const validItems = [];
  const warnings = [];

  rawArray.forEach((item, index) => {
    // If item lacks an ID, attach a stable fallback ID before parsing if ID was the only missing field
    const normalizedItem = (item && typeof item === 'object') ? { ...item } : item;
    if (normalizedItem && typeof normalizedItem === 'object' && !normalizedItem.id) {
      normalizedItem.id = generateStableId(`${arrayName.slice(0, 4)}_${index}`);
    }

    const result = itemSchema.safeParse(normalizedItem);

    if (result.success) {
      validItems.push(result.data);
    } else {
      const errorDetails = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ');

      warnings.push({
        itemIndex: index,
        field: arrayName,
        reason: errorDetails,
        rawSnippet: item,
      });
    }
  });

  return { validItems, warnings };
}

/**
 * Parse and partially recover a complete StudyKit payload from potentially malformed or partial LLM output.
 * Ensures the app never crashes from partial failures, preserving all valid components.
 *
 * @param {any} rawData
 * @param {string} [fallbackSourceText='']
 * @returns {{
 *   data: z.infer<typeof StrictStudyKitSchema>,
 *   warnings: Array<{ itemIndex: number, field: string, reason: string, rawSnippet: any }>,
 *   stats: {
 *     conceptChecklistTotal: number,
 *     conceptChecklistValid: number,
 *     flashcardsTotal: number,
 *     flashcardsValid: number,
 *     quizQuestionsTotal: number,
 *     quizQuestionsValid: number,
 *     topicBreakdownTotal: number,
 *     topicBreakdownValid: number,
 *     isFullyValid: boolean
 *   }
 * }}
 */
export function validateAndRecoverStudyKit(rawData, fallbackSourceText = '') {
  const warnings = [];

  if (!rawData || typeof rawData !== 'object') {
    throw new Error('StudyKit payload must be a non-null JSON object');
  }

  // Top-level meta recovery
  const id = typeof rawData.id === 'string' && rawData.id.trim().length > 0 
    ? rawData.id 
    : generateStableId('kit');
    
  const title = typeof rawData.title === 'string' && rawData.title.trim().length > 0
    ? rawData.title
    : 'Untitled Study Topic';

  const sourceText = typeof rawData.sourceText === 'string' && rawData.sourceText.length > 0
    ? rawData.sourceText
    : fallbackSourceText;

  const generatedAt = typeof rawData.generatedAt === 'string' && rawData.generatedAt.length > 0
    ? rawData.generatedAt
    : new Date().toISOString();

  // Item-level resilience recovery
  const checklistResult = validateArrayWithPartialRecovery(
    rawData.conceptChecklist,
    ConceptChecklistItemSchema,
    'conceptChecklist'
  );
  warnings.push(...checklistResult.warnings);

  const flashcardsResult = validateArrayWithPartialRecovery(
    rawData.flashcards,
    FlashcardItemSchema,
    'flashcards'
  );
  warnings.push(...flashcardsResult.warnings);

  const quizResult = validateArrayWithPartialRecovery(
    rawData.quizQuestions,
    QuizQuestionSchema,
    'quizQuestions'
  );
  warnings.push(...quizResult.warnings);

  const breakdownResult = validateArrayWithPartialRecovery(
    rawData.topicBreakdown,
    TopicBreakdownItemSchema,
    'topicBreakdown'
  );
  warnings.push(...breakdownResult.warnings);

  const conceptChecklistTotal = Array.isArray(rawData.conceptChecklist) ? rawData.conceptChecklist.length : 0;
  const flashcardsTotal = Array.isArray(rawData.flashcards) ? rawData.flashcards.length : 0;
  const quizQuestionsTotal = Array.isArray(rawData.quizQuestions) ? rawData.quizQuestions.length : 0;
  const topicBreakdownTotal = Array.isArray(rawData.topicBreakdown) ? rawData.topicBreakdown.length : 0;

  const recoveredKit = {
    id,
    title,
    sourceText,
    generatedAt,
    conceptChecklist: checklistResult.validItems,
    flashcards: flashcardsResult.validItems,
    quizQuestions: quizResult.validItems,
    topicBreakdown: breakdownResult.validItems,
  };

  const isFullyValid = warnings.length === 0;

  return {
    data: recoveredKit,
    warnings,
    stats: {
      conceptChecklistTotal,
      conceptChecklistValid: checklistResult.validItems.length,
      flashcardsTotal,
      flashcardsValid: flashcardsResult.validItems.length,
      quizQuestionsTotal,
      quizQuestionsValid: quizResult.validItems.length,
      topicBreakdownTotal,
      topicBreakdownValid: breakdownResult.validItems.length,
      isFullyValid,
    },
  };
}
