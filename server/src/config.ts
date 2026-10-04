import dotenv from 'dotenv';
import path from 'path';

// Load from project root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEFAULT_JWT_SECRET = 'security_jeopardy_jwt_default_secret_key_2026';

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  adminEmail: process.env.ADMIN_EMAIL || 'admin@cyberguardian.club',
  adminPassword: process.env.ADMIN_PASSWORD || 'AdminJeopardy2026!',
  nodeEnv: process.env.NODE_ENV || 'development',
  // Comma-separated list of allowed origins; empty = reflect any origin
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  // Number of reverse-proxy hops in front of the app (1 on Render/Railway)
  trustProxy: parseInt(process.env.TRUST_PROXY || (process.env.NODE_ENV === 'production' ? '1' : '0'), 10),
};

if (config.nodeEnv === 'production' && config.jwtSecret === DEFAULT_JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production.');
}
