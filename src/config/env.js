require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const env = {
  isProd,
  port: Number(process.env.PORT) || 3000,
  baseUrl: (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sentravail',
  sessionSecret: process.env.SESSION_SECRET,
  useMemorySessions: process.env.NODE_ENV === 'test' && !process.env.TEST_MONGODB_URI,
};

if (!env.sessionSecret || env.sessionSecret === 'change-me') {
  if (isProd) {
    throw new Error('SESSION_SECRET must be set in production');
  }
  env.sessionSecret = 'dev-only-insecure-secret';
}

module.exports = env;
