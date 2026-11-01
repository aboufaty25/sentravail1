// Database facade. The app talks to `db`; the concrete adapter (MySQL in production,
// SQLite in tests) is plugged in at startup with `db.use(adapter)`.
//
// Adapter interface:
//   dialect             'mysql' | 'sqlite'
//   query(sql, params)  -> rows (SELECT)
//   run(sql, params)    -> { insertId, affectedRows } (INSERT/UPDATE/DELETE)
//   exec(sql)           -> run a raw statement without parameters (DDL)
//   transaction(fn)     -> runs fn(txAdapter) atomically
//   ping(), close()
// Unique-constraint violations are rethrown with err.code === 'DUPLICATE'.

let adapter = null;

const db = {
  use(a) {
    adapter = a;
    return db;
  },
  get adapter() {
    if (!adapter) throw new Error('Database adapter not initialised');
    return adapter;
  },
  get dialect() {
    return db.adapter.dialect;
  },
  query: (sql, params) => db.adapter.query(sql, params),
  one: async (sql, params) => (await db.adapter.query(sql, params))[0] || null,
  run: (sql, params) => db.adapter.run(sql, params),
  exec: (sql) => db.adapter.exec(sql),
  transaction: (fn) => db.adapter.transaction(fn),
  ping: () => db.adapter.ping(),
  close: () => (adapter ? adapter.close() : undefined),
};

module.exports = db;
