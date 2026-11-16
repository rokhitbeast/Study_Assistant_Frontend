import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes.js';
import studyRoutes from './routes/studyRoutes.js';
import chaosRoutes from './routes/chaosRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendPath = path.join(__dirname, '..', 'dist');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging in development
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Routes
app.use('/api', healthRoutes);
app.use('/api', studyRoutes);
app.use('/api/chaos', chaosRoutes);

// Fallback 404 for unmatched /api routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: {
      message: `Route ${req.originalUrl} not found`,
      status: 404,
    },
  });
});

// Serve React frontend in production
app.use(express.static(frontendPath));

// Handle React client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Express server running on http://127.0.0.1:${PORT}`);
  console.log(`📡 Health check available at http://127.0.0.1:${PORT}/api/health`);
});