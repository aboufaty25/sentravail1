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
  if (await User.exists({ phone: data.phone })) {
    return res.status(422).render('pages/auth/register', {
      title: 'Créer un compte',
      values: req.body,
      errors: { phone: 'Ce numéro a déjà un compte. Connecte-toi.' },
      noAds: true,
    });
  }
  const user = new User({ name: data.name, phone: data.phone, role: data.role, whatsapp: data.phone });
  await user.setPassword(data.password);
  await user.save();
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
  const user = await User.findOne({ phone: data.phone }).select('+passwordHash');
  // Same message whether the phone or the password is wrong.
  if (!user || !(await user.checkPassword(data.password))) {
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
