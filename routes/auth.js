const router = require('express').Router();
const controller = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
router.post('/logout', controller.logout);
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.get('/me', authMiddleware, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});
module.exports = router;