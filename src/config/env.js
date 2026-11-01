require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const env = {
  isProd,
  isTest,
  // Hostinger (Passenger) may pass a socket path instead of a number: keep it as-is.
  port: process.env.PORT || 3000,
  baseUrl: (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  db: {
    // On Hostinger use 127.0.0.1, not "localhost" (Node resolves it to IPv6 ::1, which is refused).
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sentravail',
  },
  sessionSecret: process.env.SESSION_SECRET,
};

if (!env.sessionSecret || env.sessionSecret === 'change-me') {
  if (isProd) {
    throw new Error('SESSION_SECRET must be set in production');
  }
  env.sessionSecret = 'dev-only-insecure-secret';
}

if (isProd) {
  for (const key of ['BASE_URL', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
    if (!process.env[key]) throw new Error(`${key} must be set in production`);
  }
}

module.exports = env;
