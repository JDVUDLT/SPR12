const router = require('express').Router();
const controller = require('../controllers/holidaysController');
const auth = require('../middleware/authMiddleware');

// 🔒 защита всех роутов
router.use(auth);

router.get('/:teamId', controller.getHolidays);
router.post('/:teamId', controller.createHoliday);
router.delete('/:id', controller.deleteHoliday);

module.exports = router;