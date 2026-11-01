const env = require('../config/env');
const db = require('./index');
const { createMysqlAdapter } = require('./mysql');
const { migrate } = require('./migrations');

// Production/dev entry point: MySQL from env, then run pending migrations.
async function connectDb() {
  db.use(createMysqlAdapter(env.db));
  await db.ping();
  console.log(`[db] connected to mysql://${env.db.host}:${env.db.port}/${env.db.database}`);
  await migrate(db);
  return db;
}

module.exports = { connectDb };
