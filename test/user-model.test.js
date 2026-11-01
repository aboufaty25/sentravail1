const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, teardown } = require('./helpers');
const User = require('../src/models/User');
const db = require('../src/db');

test.before(setup);
test.after(teardown);

test('create, find, update and trades', async () => {
  const u = await User.create({ name: 'Awa Ndiaye', phone: '+221789990101', password: 'secret123', trades: ['couturier'] });
  assert.equal(typeof u.id, 'number');
  assert.equal(u.role, 'worker');
  assert.deepEqual(u.trades, ['couturier']);
  assert.equal(u.initials, 'AN');
  assert.equal(u.contactNumber, '+221789990101');
  assert.equal(u.availableToday, false);
  assert.ok(u.createdAt instanceof Date && !Number.isNaN(u.createdAt.getTime()));
  assert.equal(JSON.stringify(u).includes('password'), false, 'hash must not be enumerable');

  const byPhone = await User.findByPhone('+221789990101');
  assert.equal(await User.checkPassword(byPhone, 'secret123'), true);
  assert.equal(await User.checkPassword(byPhone, 'wrong'), false);

  const up = await User.updateProfile(u.id, {
    name: 'Awa N.', bio: 'Couture', trades: ['coiffeur', 'couturier', 'coiffeur'], city: 'dakar', neighborhood: 'Médina', whatsapp: '+221765554433',
  });
  assert.deepEqual(up.trades, ['coiffeur', 'couturier']);
  assert.equal(up.contactNumber, '+221765554433');
  assert.equal(up.neighborhood, 'Médina');
});

test('duplicate phone is reported as DUPLICATE and rolled back', async () => {
  await assert.rejects(
    User.create({ name: 'Copie', phone: '+221789990101', password: 'secret123', trades: ['macon'] }),
    (err) => err.code === 'DUPLICATE'
  );
  const rows = await db.query("SELECT COUNT(*) AS n FROM users WHERE phone = '+221789990101'");
  assert.equal(Number(rows[0].n), 1);
});

test('findById rejects junk ids', async () => {
  for (const id of ['abc', '-1', '0', '1.5', '99999999999999999999']) {
    assert.equal(await User.findById(id), null, id);
  }
});

test('deleting a user cascades to trades', async () => {
  const u = await User.findByPhone('+221789990101');
  await db.run('DELETE FROM users WHERE id = ?', [u.id]);
  const rows = await db.query('SELECT COUNT(*) AS n FROM user_trades WHERE user_id = ?', [u.id]);
  assert.equal(Number(rows[0].n), 0);
});

test('migrations are idempotent', async () => {
  const { migrate } = require('../src/db/migrations');
  await migrate(db, { log: () => {} });
});
