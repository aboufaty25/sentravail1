const bcrypt = require('bcryptjs');
const db = require('../db');

const BCRYPT_ROUNDS = 11;
const ROLES = ['worker', 'recruiter', 'admin'];

// SQLite returns "YYYY-MM-DD HH:MM:SS" (UTC) strings, MySQL returns Date objects.
function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  return new Date(`${String(v).replace(' ', 'T')}Z`);
}

function initialsOf(name) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

// Row (snake_case) -> plain user object used by controllers and views.
function fromRow(row, trades = []) {
  if (!row) return null;
  const user = {
    id: Number(row.id),
    name: row.name,
    phone: row.phone,
    role: row.role,
    trades,
    bio: row.bio || '',
    voiceIntroUrl: row.voice_intro_url || null,
    avatarUrl: row.avatar_url || null,
    city: row.city || '',
    neighborhood: row.neighborhood || '',
    location:
      row.latitude != null && row.longitude != null
        ? { lat: Number(row.latitude), lng: Number(row.longitude) }
        : null,
    availableToday: Boolean(row.available_today),
    whatsapp: row.whatsapp || null,
    isVerified: Boolean(row.is_verified),
    isBoosted: Boolean(row.is_boosted),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
  user.initials = initialsOf(user.name);
  user.contactNumber = user.whatsapp || user.phone; // WhatsApp number, falls back to login phone
  // Kept out of enumerable props so it never leaks into views by accident.
  Object.defineProperty(user, 'passwordHash', { value: row.password_hash, enumerable: false });
  return user;
}

const COLUMNS = `id, name, phone, role, bio, voice_intro_url, avatar_url, city, neighborhood,
  latitude, longitude, available_today, whatsapp, is_verified, is_boosted, created_at, updated_at`;

async function tradesOf(conn, userId) {
  const rows = await conn.query('SELECT trade FROM user_trades WHERE user_id = ? ORDER BY trade', [userId]);
  return rows.map((r) => r.trade);
}

async function setTrades(conn, userId, trades) {
  await conn.run('DELETE FROM user_trades WHERE user_id = ?', [userId]);
  for (const trade of [...new Set(trades)]) {
    await conn.run('INSERT INTO user_trades (user_id, trade) VALUES (?, ?)', [userId, trade]);
  }
}

const User = {
  ROLES,

  async findById(id) {
    const n = Number(id);
    if (!Number.isSafeInteger(n) || n <= 0) return null;
    const row = await db.one(`SELECT ${COLUMNS} FROM users WHERE id = ?`, [n]);
    return row ? fromRow(row, await tradesOf(db, n)) : null;
  },

  // Includes the password hash (needed to log in).
  async findByPhone(phone) {
    const row = await db.one(`SELECT ${COLUMNS}, password_hash FROM users WHERE phone = ?`, [phone]);
    return row ? fromRow(row, await tradesOf(db, row.id)) : null;
  },

  async existsByPhone(phone) {
    return Boolean(await db.one('SELECT 1 AS found FROM users WHERE phone = ?', [phone]));
  },

  // Throws err.code === 'DUPLICATE' if the phone is already taken.
  async create({ name, phone, password, role = 'worker', whatsapp = null, trades = [], bio = '',
    city = '', neighborhood = '', location = null, availableToday = false, isVerified = false }) {
    if (!ROLES.includes(role)) throw new Error(`Invalid role: ${role}`);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const id = await db.transaction(async (tx) => {
      const res = await tx.run(
        `INSERT INTO users (name, phone, password_hash, role, whatsapp, bio, city, neighborhood,
          latitude, longitude, available_today, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, phone, passwordHash, role, whatsapp, bio, city, neighborhood,
          location ? location.lat : null, location ? location.lng : null,
          availableToday ? 1 : 0, isVerified ? 1 : 0]
      );
      await setTrades(tx, res.insertId, trades);
      return res.insertId;
    });
    return User.findById(id);
  },

  // Editable profile fields only.
  async updateProfile(id, { name, bio, trades, city, neighborhood, whatsapp }) {
    await db.transaction(async (tx) => {
      await tx.run(
        `UPDATE users SET name = ?, bio = ?, city = ?, neighborhood = ?, whatsapp = ?,
          updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name, bio, city, neighborhood, whatsapp, id]
      );
      await setTrades(tx, id, trades);
    });
    return User.findById(id);
  },

  checkPassword(user, plain) {
    if (!user || !user.passwordHash) return Promise.resolve(false);
    return bcrypt.compare(plain, user.passwordHash);
  },
};

module.exports = User;
