const router = require('express').Router();
const controller = require('../controllers/authController');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ msg: "Нет refresh токена" });
    }

    try {
        const user = jwt.verify(refreshToken, SECRET_KEY);

        const newAccessToken = jwt.sign(
            {
                id: user.id,
                log: user.log,
                role: user.role
            },
            SECRET_KEY,
            { expiresIn: '15m' }
        );

        res.json({ accessToken: newAccessToken });

    } catch (error) {
        return res.status(403).json({ msg: "Refresh токен невалиден" });
    }
});

module.exports = router;