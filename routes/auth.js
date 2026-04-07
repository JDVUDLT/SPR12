const router = require('express').Router();
const controller = require('../controllers/authController');
router.post('/logout', controller.logout);
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
module.exports = router;