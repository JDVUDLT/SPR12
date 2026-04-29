const router = require('express').Router();
const c = require('../controllers/employeesController');
const auth = require('../middleware/authMiddleware');

router.use(auth);

router.get('/:teamId', c.getEmployees);
router.post('/', c.createEmployee);
router.delete('/:id', c.deleteEmployee);

module.exports = router;