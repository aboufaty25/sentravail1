const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const env = require('./env');

function sessionMiddleware() {
  return session({
    name: 'st.sid',
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    // Tests without a database use the default in-memory store.
    store: env.useMemorySessions ? undefined : MongoStore.create({
      client: mongoose.connection.getClient(),
      collectionName: 'sessions',
      ttl: 60 * 60 * 24 * 30, // 30 days
      touchAfter: 60 * 60 * 24,
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProd,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  });
}

module.exports = { sessionMiddleware };
