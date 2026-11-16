import { Router } from 'express';
import { z } from 'zod';
import { generateStudyKit, refineStudyKit, GeminiServiceError } from '../services/geminiService.js';

const router = Router();

// Validation schema for /api/generate
const GenerateRequestSchema = z.object({
  sourceText: z
    .string({ required_error: 'sourceText is required' })
    .trim()
    .min(10, 'Study notes must contain at least 10 characters')
    .max(50000, 'Study notes cannot exceed 50,000 characters'),
  title: z.string().trim().max(120).optional(),
});

// Validation schema for /api/refine
const RefineRequestSchema = z.object({
  currentStudyKit: z.object(
    {
      id: z.string().min(1),
      title: z.string().min(1),
      conceptChecklist: z.array(z.any()),
      flashcards: z.array(z.any()),
      quizQuestions: z.array(z.any()),
      topicBreakdown: z.array(z.any()),
    },
    { required_error: 'currentStudyKit must be a valid StudyKit object' }
  ),
  instruction: z
    .string({ required_error: 'instruction is required' })
    .trim()
    .min(3, 'Refinement instruction must contain at least 3 characters')
    .max(1000, 'Refinement instruction cannot exceed 1000 characters'),
  targetItemIds: z.array(z.string()).optional().default([]),
});

/**
 * POST /api/generate
 * Generates a pedagogy-backed StudyKit from raw text notes.
 */
router.post('/generate', async (req, res, next) => {
  try {
    const parsedBody = GenerateRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parsedBody.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
      });
    }

    const { sourceText, title } = parsedBody.data;
    const result = await generateStudyKit(sourceText, { title });

    return res.status(200).json({
      success: true,
      data: result.data,
      warnings: result.warnings,
      stats: result.stats,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/refine
 * Surgically refines an existing StudyKit without destroying unaffected items.
 */
router.post('/refine', async (req, res, next) => {
  try {
    const parsedBody = RefineRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parsedBody.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
      });
    }

    const { currentStudyKit, instruction, targetItemIds } = parsedBody.data;
    const result = await refineStudyKit(currentStudyKit, instruction, targetItemIds);

    return res.status(200).json({
      success: true,
      data: result.data,
      summary: result.summary,
      modifiedItemIds: result.modifiedItemIds,
      newItemIds: result.newItemIds,
      warnings: result.warnings,
      stats: result.stats,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

