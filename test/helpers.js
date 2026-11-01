// Test harness: an in-memory SQLite database by default, or a real MySQL database when
// TEST_DB_NAME is set (with TEST_DB_HOST / TEST_DB_PORT / TEST_DB_USER / TEST_DB_PASSWORD).
// Tests only touch accounts whose phone starts with +22178999.
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';
process.env.DOTENV_CONFIG_QUIET = 'true';

const db = require('../src/db');
const { migrate } = require('../src/db/migrations');
const { createMysqlAdapter } = require('../src/db/mysql');
const { createSqliteAdapter } = require('./sqlite-adapter');

const realMysql = Boolean(process.env.TEST_DB_NAME);

async function setup() {
  if (realMysql) {
    db.use(createMysqlAdapter({
      host: process.env.TEST_DB_HOST || '127.0.0.1',
      port: Number(process.env.TEST_DB_PORT) || 3306,
      user: process.env.TEST_DB_USER || 'root',
      password: process.env.TEST_DB_PASSWORD || '',
      database: process.env.TEST_DB_NAME,
    }));
  } else {
    db.use(createSqliteAdapter());
  }
  await migrate(db, { log: () => {} });
  await db.run("DELETE FROM users WHERE phone LIKE '+22178999%'");
  // Required after db.use(): the session store depends on the dialect.
  const { createApp } = require('../src/app');
  return createApp();
}

async function teardown() {
  await db.run("DELETE FROM users WHERE phone LIKE '+22178999%'");
  await db.close();
}

// Extract the CSRF token from a rendered form.
function csrfFrom(html) {
  const m = html.match(/name="_csrf" value="([^"]+)"/);
  if (!m) throw new Error('No CSRF token in page');
  return m[1];
}

module.exports = { setup, teardown, csrfFrom, realMysql };
