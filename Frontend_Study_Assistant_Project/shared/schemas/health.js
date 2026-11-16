import { z } from 'zod';

export const GeminiHealthSchema = z.object({
  status: z.enum(['ready', 'missing_config', 'error']),
  configured: z.boolean(),
  model: z.string().optional(),
  message: z.string().optional(),
});

export const HealthCheckResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  uptime: z.number(),
  timestamp: z.string(),
  service: z.string(),
  version: z.string(),
  environment: z.string(),
  gemini: GeminiHealthSchema.optional(),
});
