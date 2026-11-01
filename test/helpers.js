// Test harness. With TEST_MONGODB_URI set, tests hit a real MongoDB.
// Otherwise the User model's persistence methods are replaced by an in-memory store,
// so the HTTP flows (routes, validation, CSRF, sessions, views) can still be exercised.
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';
if (process.env.TEST_MONGODB_URI) process.env.MONGODB_URI = process.env.TEST_MONGODB_URI;

const mongoose = require('mongoose');
const User = require('../src/models/User');
const { createApp } = require('../src/app');

const realDb = Boolean(process.env.TEST_MONGODB_URI);
const store = new Map();

function matches(doc, filter) {
  return Object.entries(filter).every(([k, v]) => (v instanceof RegExp ? v.test(doc[k]) : doc[k] === v));
}

function installMemoryStore() {
  const hydrate = (raw) => (raw ? User.hydrate(raw) : null);
  const query = (raw) => {
    const p = Promise.resolve(hydrate(raw));
    p.select = () => p;
    return p;
  };
  User.findById = (id) => query(store.get(String(id)));
  User.findOne = (filter) => query([...store.values()].find((d) => matches(d, filter)));
  User.exists = async (filter) => ([...store.values()].some((d) => matches(d, filter)) ? { _id: 1 } : null);
  User.prototype.save = async function save() {
    await this.validate();
    const raw = this.toObject({ virtuals: false });
    const clash = [...store.values()].find((d) => d.phone === raw.phone && String(d._id) !== String(raw._id));
    if (clash) throw Object.assign(new Error('duplicate key'), { code: 11000 });
    store.set(String(raw._id), raw);
    this.isNew = false;
    return this;
  };
}

async function setup() {
  if (realDb) {
    await mongoose.connect(process.env.MONGODB_URI);
    await User.deleteMany({ phone: /^\+22178999/ });
  } else {
    installMemoryStore();
  }
  return createApp();
}

async function teardown() {
  if (realDb) {
    await User.deleteMany({ phone: /^\+22178999/ });
    await mongoose.disconnect();
  }
  store.clear();
}

// Extract the CSRF token from a rendered form.
function csrfFrom(html) {
  const m = html.match(/name="_csrf" value="([^"]+)"/);
  if (!m) throw new Error('No CSRF token in page');
  return m[1];
}

module.exports = { setup, teardown, csrfFrom, realDb };
