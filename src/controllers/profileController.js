const User = require('../models/User');
const { profileSchema, parse } = require('../utils/validation');
const { TRADES } = require('../config/trades');
const { CITIES } = require('../config/cities');
const { formatSenegalPhone } = require('../utils/phone');

exports.show = async (req, res, next) => {
  const { id } = req.params;
  if (!/^\d{1,10}$/.test(id)) return next();
  const profile = await User.findById(id);
  if (!profile) return next(); // -> 404
  const isOwner = req.user && req.user.id === profile.id;
  res.render('pages/profile/show', {
    title: profile.name,
    profile,
    isOwner,
    description: profile.bio ? profile.bio.slice(0, 155) : `${profile.name} sur SenTravail`,
  });
};

function editLocals(user, overrides = {}) {
  return {
    title: 'Modifier mon profil',
    trades: TRADES,
    cities: CITIES,
    values: {
      name: user.name,
      bio: user.bio,
      trades: user.trades,
      city: user.city,
      neighborhood: user.neighborhood,
      whatsapp: formatSenegalPhone(user.whatsapp),
    },
    errors: {},
    noAds: true,
    ...overrides,
  };
}

exports.showEdit = (req, res) => {
  res.render('pages/profile/edit', editLocals(req.user));
};

exports.update = async (req, res) => {
  const { data, errors } = parse(profileSchema, req.body);
  if (errors) {
    const values = { ...req.body, trades: [].concat(req.body.trades || []) };
    return res.status(422).render('pages/profile/edit', editLocals(req.user, { values, errors }));
  }
  await User.updateProfile(req.user.id, {
    name: data.name,
    bio: data.bio,
    trades: data.trades,
    city: data.city,
    neighborhood: data.neighborhood,
    whatsapp: data.whatsapp || req.user.phone,
  });
  req.flash('success', 'Profil mis à jour.');
  res.redirect(`/@${req.user.id}`);
};
