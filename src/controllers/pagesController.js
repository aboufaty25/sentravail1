const { TRADES } = require('../config/trades');

exports.home = (req, res) => {
  res.render('pages/home', { title: null, trades: TRADES });
};

const LEGAL = {
  'a-propos': { view: 'about', title: 'À propos' },
  confidentialite: { view: 'privacy', title: 'Politique de confidentialité' },
  conditions: { view: 'terms', title: "Conditions d'utilisation" },
  contact: { view: 'contact', title: 'Contact' },
};

exports.legal = (req, res, next) => {
  const page = LEGAL[req.params.page];
  if (!page) return next();
  res.render(`pages/legal/${page.view}`, { title: page.title });
};
