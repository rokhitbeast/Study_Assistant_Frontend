export function errorHandler(err, req, res, _next) {
  const statusCode = err.status || err.statusCode || 500;
  const apiKey = process.env.GEMINI_API_KEY;

  // Sanitize message to prevent any potential credential leaks
  let safeMessage = err.message || 'An unexpected server error occurred';
  if (apiKey && apiKey.length > 5) {
    safeMessage = safeMessage.replaceAll(apiKey, '[REDACTED]');
  }

  // Log on server for observability
  console.error(`[API Error] ${req.method} ${req.originalUrl} (${statusCode}):`, safeMessage);

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.name || 'SERVER_ERROR',
      message: safeMessage,
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    },
  });
}
