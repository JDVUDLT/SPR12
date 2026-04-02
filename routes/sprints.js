const router = require('express').Router();
const controller = require('../controllers/sprintController');
const auth = require('../middleware/authMiddleware');
router.use(auth);
console.log('CONTROLLER:', controller);

router.get('/:teamId', controller.getSprints);
router.post('/calculate-days/:teamId', controller.calculateDays);
router.post('/copy/:teamId', controller.copySprints);

module.exports = router;