const router = require('express').Router();
const createAbsence = require('../controllers/absencesController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/:teamId', createAbsence.getAbsences);
router.post('/', createAbsence.createAbsence);

module.exports = router;