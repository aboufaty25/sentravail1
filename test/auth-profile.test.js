const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setup, teardown, csrfFrom } = require('./helpers');

let app;
test.before(async () => { app = await setup(); });
test.after(teardown);

const PHONE = '78 999 00 01';

async function registered(agent, overrides = {}) {
  const page = await agent.get('/inscription').expect(200);
  return agent.post('/inscription').type('form').send({
    _csrf: csrfFrom(page.text), name: 'Moussa Test', phone: PHONE, password: 'secret123', role: 'worker', ...overrides,
  });
}

test('public pages render', async () => {
  for (const url of ['/', '/connexion', '/inscription', '/a-propos', '/confidentialite', '/conditions', '/contact']) {
    const res = await request(app).get(url);
    assert.equal(res.status, 200, url);
    assert.match(res.text, /SenTravail/);
  }
  await request(app).get('/nexiste-pas').expect(404);
  await request(app).get('/@not-an-id').expect(404);
  await request(app).get('/@000000000000000000000000').expect(404);
});

test('anonymous homepage does not create a session cookie', async () => {
  const res = await request(app).get('/').expect(200);
  assert.equal(res.headers['set-cookie'], undefined);
});

test('security headers are set', async () => {
  const res = await request(app).get('/');
  assert.ok(res.headers['content-security-policy']);
  assert.equal(res.headers['x-powered-by'], undefined);
});

test('POST without CSRF token is rejected', async () => {
  const res = await request(app).post('/connexion').type('form').send({ phone: PHONE, password: 'x' });
  assert.equal(res.status, 403);
});

test('registration validates input', async () => {
  const agent = request.agent(app);
  const res = await registered(agent, { phone: '12', password: '1', name: 'A' });
  assert.equal(res.status, 422);
  assert.match(res.text, /Numéro sénégalais invalide/);
  assert.match(res.text, /Au moins 6 caractères/);
  assert.match(res.text, /Nom trop court/);
});

test('register → edit profile → logout → login', async () => {
  const agent = request.agent(app);
  const reg = await registered(agent);
  assert.equal(reg.status, 302);
  assert.equal(reg.headers.location, '/profil/modifier');

  // Duplicate phone is refused.
  const dup = await registered(request.agent(app));
  assert.equal(dup.status, 422);
  assert.match(dup.text, /déjà un compte/);

  const edit = await agent.get('/profil/modifier').expect(200);
  assert.match(edit.text, /Bienvenue sur SenTravail/);

  // Invalid profile update: too many trades.
  const bad = await agent.post('/profil/modifier').type('form').send({
    _csrf: csrfFrom(edit.text), name: 'Moussa Diop', trades: ['macon', 'plombier', 'electricien', 'menuisier'],
  });
  assert.equal(bad.status, 422);
  assert.match(bad.text, /3 métiers maximum/);

  const upd = await agent.post('/profil/modifier').type('form').send({
    _csrf: csrfFrom(edit.text), name: 'Moussa Diop', bio: 'Maçon depuis 10 ans', trades: ['macon', 'plombier'],
    city: 'pikine', neighborhood: 'Thiaroye', whatsapp: '76 555 44 33',
  });
  assert.equal(upd.status, 302);
  const profileUrl = upd.headers.location;
  assert.match(profileUrl, /^\/@[a-f0-9]{24}$/);

  const own = await agent.get(profileUrl).expect(200);
  assert.match(own.text, /Moussa Diop/);
  assert.match(own.text, /Modifier mon profil/);
  assert.match(own.text, /Pikine, Thiaroye/);

  // A visitor sees the WhatsApp button pointing to the WhatsApp number, and escaped content.
  const pub = await request(app).get(profileUrl).expect(200);
  assert.match(pub.text, /https:\/\/wa\.me\/221765554433\?text=/);
  assert.doesNotMatch(pub.text, /Modifier mon profil/);

  const logoutPage = await agent.get(profileUrl);
  await agent.post('/deconnexion').type('form').send({ _csrf: csrfFrom(logoutPage.text) }).expect(302);
  await agent.get('/profil/modifier').expect(302).expect('location', '/connexion');

  const loginPage = await agent.get('/connexion').expect(200);
  const wrong = await agent.post('/connexion').type('form').send({ _csrf: csrfFrom(loginPage.text), phone: PHONE, password: 'nope-nope' });
  assert.equal(wrong.status, 422);
  assert.match(wrong.text, /Numéro ou mot de passe incorrect/);

  // After the failed attempt, returnTo (/profil/modifier) is honoured.
  const ok = await agent.post('/connexion').type('form').send({ _csrf: csrfFrom(wrong.text), phone: '+221 78 999 00 01', password: 'secret123' });
  assert.equal(ok.status, 302);
  assert.equal(ok.headers.location, '/profil/modifier');
});

test('user content is HTML-escaped', async () => {
  const agent = request.agent(app);
  const page = await agent.get('/inscription');
  const reg = await agent.post('/inscription').type('form').send({
    _csrf: csrfFrom(page.text), name: '<script>x</script>', phone: '78 999 00 02', password: 'secret123', role: 'recruiter',
  });
  assert.equal(reg.status, 302);
  const edit = await agent.get('/profil/modifier');
  const upd = await agent.post('/profil/modifier').type('form').send({ _csrf: csrfFrom(edit.text), name: '<script>x</script>' });
  const prof = await agent.get(upd.headers.location);
  assert.doesNotMatch(prof.text, /<script>x<\/script>/);
  assert.match(prof.text, /&lt;script&gt;/);
  assert.match(prof.text, /Recruteur/);
});

test('health check responds without a session', async () => {
  const res = await request(app).get('/healthz').expect(200);
  assert.equal(res.body.status, 'ok');
  assert.equal(res.headers['set-cookie'], undefined);
});
