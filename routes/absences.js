const router = require('express').Router();
const createAbsence = require('../controllers/absencesController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/:teamId', createAbsence.getAbsences);
router.post('/', createAbsence.createAbsence);
router.put('/:id', createAbsence.updateAbsence);
router.delete('/:id', createAbsence.deleteAbsence);

module.exports = router;