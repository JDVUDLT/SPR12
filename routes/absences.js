const router = require('express').Router();
const c = require('../controllers/absencesController');
const auth = require('../middleware/authMiddleware');

router.use(auth);

router.get('/:teamId', c.getAbsences);
router.post('/', c.createAbsence);

module.exports = router;