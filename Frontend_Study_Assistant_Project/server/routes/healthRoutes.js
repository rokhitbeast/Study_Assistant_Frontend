import { Router } from 'express';
import { HealthCheckResponseSchema } from '../../shared/schemas/index.js';
import { checkGeminiStatus } from '../services/geminiService.js';

const router = Router();
const startTime = Date.now();

router.get('/health', async (_req, res) => {
  const geminiStatus = await checkGeminiStatus();

  const healthData = {
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    service: 'Adaptive Active-Recall Studio API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    gemini: geminiStatus,
  };

  // Validate response shape against shared schema
  const validation = HealthCheckResponseSchema.safeParse(healthData);
  if (!validation.success) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal health check validation failed',
      errors: validation.error.issues,
    });
  }

  res.status(200).json(validation.data);
});

export default router;

