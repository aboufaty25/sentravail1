const mysql = require('mysql2/promise');

const isDuplicate = (err) => err && err.code === 'ER_DUP_ENTRY';

function wrapError(err) {
  if (isDuplicate(err)) err.code = 'DUPLICATE';
  return err;
}

// Build an adapter around a pool or a single connection.
function adapterFor(conn, pool) {
  return {
    dialect: 'mysql',
    pool,
    async query(sql, params = []) {
      try {
        const [rows] = await conn.query(sql, params);
        return rows;
      } catch (err) {
        throw wrapError(err);
      }
    },
    async run(sql, params = []) {
      try {
        const [res] = await conn.query(sql, params);
        return { insertId: res.insertId, affectedRows: res.affectedRows };
      } catch (err) {
        throw wrapError(err);
      }
    },
    async exec(sql) {
      await conn.query(sql);
    },
  };
}

function createMysqlAdapter(config) {
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    charset: 'utf8mb4_unicode_ci',
    timezone: 'Z',
    decimalNumbers: true,
    // Shared hosting caps simultaneous connections per user: keep the pool small.
    connectionLimit: config.connectionLimit || 5,
    waitForConnections: true,
    enableKeepAlive: true,
  });

  const base = adapterFor(pool, pool);
  return {
    ...base,
    async transaction(fn) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const result = await fn(adapterFor(conn, pool));
        await conn.commit();
        return result;
      } catch (err) {
        await conn.rollback().catch(() => {});
        throw err;
      } finally {
        conn.release();
      }
    },
    async ping() {
      await pool.query('SELECT 1');
    },
    close: () => pool.end(),
  };
}

module.exports = { createMysqlAdapter };
