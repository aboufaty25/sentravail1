const { Router } = require('express');
const ctrl = require('../controllers/pagesController');

const router = Router();

router.get('/', ctrl.home);
router.get('/:page', ctrl.legal); // /a-propos, /confidentialite, /conditions, /contact

module.exports = router;
