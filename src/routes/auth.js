const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/authController');
const { requireGuest } = require('../middlewares/auth');

const router = Router();

// Brute-force protection on credential endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).render('errors/error', {
      title: 'Trop de tentatives',
      message: 'Trop de tentatives. Réessaie dans 15 minutes.',
      noAds: true,
    }),
});

router.get('/inscription', requireGuest, ctrl.showRegister);
router.post('/inscription', requireGuest, authLimiter, ctrl.register);
router.get('/connexion', requireGuest, ctrl.showLogin);
router.post('/connexion', requireGuest, authLimiter, ctrl.login);
router.post('/deconnexion', ctrl.logout);

module.exports = router;
