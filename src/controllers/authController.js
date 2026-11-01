const User = require('../models/User');
const { registerSchema, loginSchema, parse } = require('../utils/validation');

function render(res, view, locals = {}) {
  res.render(view, { values: {}, errors: {}, noAds: true, ...locals });
}

// Regenerate the session id on login to prevent session fixation.
function logIn(req, user) {
  const returnTo = req.session.returnTo;
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.id;
      req.session.save((err2) => (err2 ? reject(err2) : resolve(returnTo)));
    });
  });
}

exports.showRegister = (req, res) => {
  render(res, 'pages/auth/register', { title: 'Créer un compte', values: { role: req.query.role || 'worker' } });
};

exports.register = async (req, res) => {
  const { data, errors } = parse(registerSchema, req.body);
  if (errors) {
    return res.status(422).render('pages/auth/register', {
      title: 'Créer un compte', values: req.body, errors, noAds: true,
    });
  }
  const duplicate = () =>
    res.status(422).render('pages/auth/register', {
      title: 'Créer un compte',
      values: req.body,
      errors: { phone: 'Ce numéro a déjà un compte. Connecte-toi.' },
      noAds: true,
    });
  if (await User.existsByPhone(data.phone)) return duplicate();
  let user;
  try {
    user = await User.create({ name: data.name, phone: data.phone, password: data.password, role: data.role, whatsapp: data.phone });
  } catch (err) {
    if (err.code === 'DUPLICATE') return duplicate(); // lost a race with a concurrent sign-up
    throw err;
  }
  await logIn(req, user);
  req.flash('success', 'Bienvenue sur SenTravail ! Complète ton profil.');
  res.redirect('/profil/modifier');
};

exports.showLogin = (req, res) => {
  render(res, 'pages/auth/login', { title: 'Connexion' });
};

exports.login = async (req, res) => {
  const { data, errors } = parse(loginSchema, req.body);
  const fail = (msg) =>
    res.status(422).render('pages/auth/login', {
      title: 'Connexion', values: { phone: req.body.phone }, errors: { _form: msg, ...(errors || {}) }, noAds: true,
    });
  if (errors) return fail('Vérifie les champs.');
  const user = await User.findByPhone(data.phone);
  // Same message whether the phone or the password is wrong.
  if (!user || !(await User.checkPassword(user, data.password))) {
    return fail('Numéro ou mot de passe incorrect.');
  }
  const returnTo = await logIn(req, user);
  req.flash('success', `Bon retour, ${user.name.split(' ')[0]} !`);
  res.redirect(returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : `/@${user.id}`);
};

exports.logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('st.sid');
    res.redirect('/');
  });
};
