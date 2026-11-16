import { HealthCheckResponseSchema } from '@shared/schemas/index.js';

export async function checkServerHealth(signal) {
  const response = await fetch('/api/health', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }

  const rawData = await response.json();
  const parsed = HealthCheckResponseSchema.safeParse(rawData);

  if (!parsed.success) {
    console.warn('[Zod Warning] Server response does not match HealthCheckResponseSchema:', parsed.error);
    return rawData; // Gracefully return raw data while flagging warning
  }

  return parsed.data;
}

