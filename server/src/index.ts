import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { config } from './config';
import authRoutes from './routes/auth';
import eventRoutes from './routes/event';
import challengesRoutes from './routes/challenges';
import physicalRoutes from './routes/physical';
import leaderboardRoutes from './routes/leaderboard';
import adminRoutes from './routes/admin';

const app = express();

// Hosting platforms (Render, Railway, Fly...) sit behind a reverse proxy.
// Without this every request appears to come from the proxy's IP.
app.set('trust proxy', config.trustProxy);

// Middleware
app.use(
  cors({
    origin: config.corsOrigins.length ? config.corsOrigins : true,
  })
);
app.use(express.json({ limit: '100kb' }));

// Rate-limit per team when authenticated (teams on the same campus Wi-Fi share
// a public IP), falling back to IP for anonymous requests.
function rateLimitKey(req: Request): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(auth.slice(7), config.jwtSecret) as { id?: string };
      if (payload?.id) return `user:${payload.id}`;
    } catch {
      // invalid token -> fall through to IP
    }
  }
  return `ip:${req.ip}`;
}

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  keyGenerator: rateLimitKey,
  message: { success: false, error: 'Too many requests, please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// Specific rate limiter for submissions to prevent automated brute-forcing
const submitLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 15, // max 15 submissions per 10s per team
  keyGenerator: rateLimitKey,
  message: { success: false, error: 'Too many answer submissions. Please wait a few seconds.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/challenges/:id/submit', submitLimiter);
app.use('/api/physical/:id/submit-riddle', submitLimiter);
app.use('/api/physical/:id/submit-flag', submitLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/physical', physicalRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve the built React client (single-service deployment)
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api\/).*/, (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'development' ? err.message : 'Internal Server Error',
  });
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`🛡️  SECURITY JEOPARDY - SERVER STARTED`);
    console.log(`🌐 Port: http://localhost:${config.port}`);
    console.log(`🚀 Environment: ${config.nodeEnv}`);
    console.log(`=======================================================`);
  });
}

export default app;
