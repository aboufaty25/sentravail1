const User = require('../models/User');

// Attach the logged-in user (if any) to req.user and res.locals.currentUser.
async function loadUser(req, res, next) {
  res.locals.currentUser = null;
  const id = req.session && req.session.userId;
  if (!id) return next();
  const user = await User.findById(id);
  if (!user) {
    delete req.session.userId;
    return next();
  }
  req.user = user;
  res.locals.currentUser = user;
  next();
}

function requireAuth(req, res, next) {
  if (req.user) return next();
  req.session.returnTo = req.originalUrl;
  req.flash('info', 'Connecte-toi pour continuer.');
  res.redirect('/connexion');
}

function requireGuest(req, res, next) {
  if (!req.user) return next();
  res.redirect(`/@${req.user.id}`);
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    const err = new Error('Accès refusé');
    err.status = 403;
    next(err);
  };
}

module.exports = { loadUser, requireAuth, requireGuest, requireRole };
