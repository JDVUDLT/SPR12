const router = require('express').Router();
const controller = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const userService = require('../services/userService');

router.post('/logout', controller.logout);
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.get('/me', authMiddleware, async (req, res) => {
    const user = await userService.getById(req.user.id);

    res.json({
        success: true,
        user
    });
});
module.exports = router;