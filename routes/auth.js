const router = require('express').Router();
const controller = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const userService = require('../services/userService');

router.post('/logout', controller.logout);
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', async (req, res) => {
    const token = req.cookies.refreshToken;

    if (!token) {
        return res.status(401).json({ success: false });
    }

    try {
        const decoded = jwt.verify(token, REFRESH_SECRET);

        const accessToken = jwt.sign(
            {
                id: decoded.id,
                role: decoded.role
            },
            ACCESS_SECRET,
            { expiresIn: '15m' }
        );

        res.json({
            success: true,
            accessToken
        });

    } catch (err) {
        return res.status(401).json({
            success: false,
            msg: "Refresh token invalid"
        });
    }
});
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