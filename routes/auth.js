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

    if (!user) {
        return res.status(404).json({ success: false, msg: "User not found" });
    }

    res.json({
        success: true,
        user
    });
});
router.get('/sessions', authMiddleware, controller.getSessions);
router.delete('/sessions/:id', authMiddleware, controller.deleteSession);
router.delete('/sessions', authMiddleware, controller.deleteAllSessions);
module.exports = router;