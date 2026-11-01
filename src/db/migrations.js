// Schema migrations, applied automatically at startup (Hostinger has no shell for npm scripts).
// Each migration gives the statements for both dialects; never edit a migration once deployed,
// add a new one instead.
const migrations = [
  {
    id: '001_users',
    mysql: [
      `CREATE TABLE users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(60) NOT NULL,
        phone VARCHAR(16) NOT NULL,
        password_hash VARCHAR(100) NOT NULL,
        role ENUM('worker','recruiter','admin') NOT NULL DEFAULT 'worker',
        bio VARCHAR(500) NOT NULL DEFAULT '',
        voice_intro_url VARCHAR(500) NULL,
        avatar_url VARCHAR(500) NULL,
        city VARCHAR(40) NOT NULL DEFAULT '',
        neighborhood VARCHAR(60) NOT NULL DEFAULT '',
        latitude DECIMAL(9,6) NULL,
        longitude DECIMAL(9,6) NULL,
        available_today TINYINT(1) NOT NULL DEFAULT 0,
        whatsapp VARCHAR(16) NULL,
        is_verified TINYINT(1) NOT NULL DEFAULT 0,
        is_boosted TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_users_phone (phone),
        KEY idx_users_city (city),
        KEY idx_users_geo (latitude, longitude)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE user_trades (
        user_id INT UNSIGNED NOT NULL,
        trade VARCHAR(30) NOT NULL,
        PRIMARY KEY (user_id, trade),
        KEY idx_user_trades_trade (trade),
        CONSTRAINT fk_user_trades_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    ],
    sqlite: [
      `CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('worker','recruiter','admin')),
        bio TEXT NOT NULL DEFAULT '',
        voice_intro_url TEXT NULL,
        avatar_url TEXT NULL,
        city TEXT NOT NULL DEFAULT '',
        neighborhood TEXT NOT NULL DEFAULT '',
        latitude REAL NULL,
        longitude REAL NULL,
        available_today INTEGER NOT NULL DEFAULT 0,
        whatsapp TEXT NULL,
        is_verified INTEGER NOT NULL DEFAULT 0,
        is_boosted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      'CREATE INDEX idx_users_city ON users (city)',
      `CREATE TABLE user_trades (
        user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        trade TEXT NOT NULL,
        PRIMARY KEY (user_id, trade)
      )`,
      'CREATE INDEX idx_user_trades_trade ON user_trades (trade)',
    ],
  },
];

async function migrate(db, { log = console.log } = {}) {
  await db.exec(
    db.dialect === 'mysql'
      ? 'CREATE TABLE IF NOT EXISTS schema_migrations (id VARCHAR(100) NOT NULL PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
      : 'CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'
  );
  const done = new Set((await db.query('SELECT id FROM schema_migrations')).map((r) => r.id));
  for (const m of migrations) {
    if (done.has(m.id)) continue;
    // MySQL DDL auto-commits, so statements are applied one by one; each migration is
    // recorded only once all its statements succeeded.
    for (const sql of m[db.dialect]) await db.exec(sql);
    await db.run('INSERT INTO schema_migrations (id) VALUES (?)', [m.id]);
    log(`[db] migration ${m.id} applied`);
  }
}

module.exports = { migrate, migrations };
