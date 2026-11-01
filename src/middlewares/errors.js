const env = require('../config/env');

function notFound(req, res) {
  res.status(404).render('errors/404', { title: 'Page introuvable', noAds: true });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // csrf-sync error
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403);
    return res.render('errors/error', {
      title: 'Session expirée',
      message: 'Le formulaire a expiré. Recharge la page et réessaie.',
      noAds: true,
    });
  }
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).render('errors/error', {
    title: status === 403 ? 'Accès refusé' : 'Erreur',
    message: status >= 500 ? 'Une erreur est survenue. Réessaie dans un instant.' : err.message,
    stack: env.isProd ? null : err.stack,
    noAds: true,
  });
}

module.exports = { notFound, errorHandler };
