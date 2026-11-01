const session = require('express-session');
const MySQLStoreFactory = require('express-mysql-session');
const env = require('./env');
const db = require('../db');

const MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

function createStore() {
  // Sessions live in MySQL so that restarts don't log anyone out.
  // Without a MySQL pool (tests on SQLite) fall back to the in-memory store.
  if (db.dialect !== 'mysql') return undefined;
  const MySQLStore = MySQLStoreFactory(session);
  return new MySQLStore(
    {
      createDatabaseTable: true,
      clearExpired: true,
      checkExpirationInterval: 15 * 60 * 1000,
      expiration: MAX_AGE,
      endConnectionOnClose: false,
    },
    db.adapter.pool
  );
}

function sessionMiddleware() {
  return session({
    name: 'st.sid',
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: createStore(),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProd,
      maxAge: MAX_AGE,
    },
  });
}

module.exports = { sessionMiddleware };
