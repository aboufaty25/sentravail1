const { Router } = require('express');
const ctrl = require('../controllers/profileController');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

router.get('/profil/modifier', requireAuth, ctrl.showEdit);
router.post('/profil/modifier', requireAuth, ctrl.update);
router.get('/profil', requireAuth, (req, res) => res.redirect(`/@${req.user.id}`));
router.get('/@:id', ctrl.show);

module.exports = router;
