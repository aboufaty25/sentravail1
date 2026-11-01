const env = require('./config/env');
const { connectDb } = require('./db/connect');
const db = require('./db');
const { createApp } = require('./app');

async function main() {
  await connectDb();
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[http] SenTravail on ${env.baseUrl} (listening on ${env.port})`);
  });

  const shutdown = (signal) => {
    console.log(`[http] ${signal} received, shutting down`);
    server.close(() => Promise.resolve(db.close()).finally(() => process.exit(0)));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[fatal]', err.message);
  process.exit(1);
});
