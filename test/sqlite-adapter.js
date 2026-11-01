// SQLite adapter (Node's built-in node:sqlite) implementing the same interface as src/db/mysql.js.
// Used by tests only: the app runs on MySQL in production.
const { DatabaseSync } = require('node:sqlite');

const toParam = (v) => (v === true ? 1 : v === false ? 0 : v === undefined ? null : v);

function wrapError(err) {
  if (/UNIQUE constraint failed/.test(err.message)) err.code = 'DUPLICATE';
  return err;
}

function createSqliteAdapter(file = ':memory:') {
  const conn = new DatabaseSync(file);
  conn.exec('PRAGMA foreign_keys = ON');
  let depth = 0;

  const adapter = {
    dialect: 'sqlite',
    pool: null,
    async query(sql, params = []) {
      try {
        return conn.prepare(sql).all(...params.map(toParam)).map((r) => ({ ...r }));
      } catch (err) {
        throw wrapError(err);
      }
    },
    async run(sql, params = []) {
      try {
        const res = conn.prepare(sql).run(...params.map(toParam));
        return { insertId: Number(res.lastInsertRowid), affectedRows: Number(res.changes) };
      } catch (err) {
        throw wrapError(err);
      }
    },
    async exec(sql) {
      conn.exec(sql);
    },
    // Single connection: nested calls simply join the outer transaction.
    async transaction(fn) {
      if (depth > 0) return fn(adapter);
      depth += 1;
      conn.exec('BEGIN');
      try {
        const result = await fn(adapter);
        conn.exec('COMMIT');
        return result;
      } catch (err) {
        conn.exec('ROLLBACK');
        throw err;
      } finally {
        depth -= 1;
      }
    },
    async ping() {
      conn.prepare('SELECT 1').get();
    },
    async close() {
      conn.close();
    },
  };
  return adapter;
}

module.exports = { createSqliteAdapter };
