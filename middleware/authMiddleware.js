const jwt = require('jsonwebtoken');
const { ACCESS_SECRET } = require('../utils/config');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    // ❌ Нет токена
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            msg: "Нет токена"
        });
    }

    // ❌ Неверный формат
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            msg: "Неверный формат авторизации"
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, ACCESS_SECRET);

        // 🔥 КЛЮЧЕВОЕ: кладем пользователя в req
        req.user = decoded;

        next();

    } catch (error) {
        console.log("❌ JWT ошибка:", error.message);

        // ⏰ Токен истёк (ВАЖНО ДЛЯ FRONT)
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                msg: "Токен истек",
                tokenExpired: true   // 🔥 фронт может понять, что делать refresh
            });
        }

        // ❌ Любая другая ошибка
        return res.status(401).json({
            success: false,
            msg: "Неверный токен"
        });
    }
}

module.exports = authMiddleware;