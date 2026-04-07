const jwt = require('jsonwebtoken');
const { ACCESS_SECRET } = require('../utils/config');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ msg: "Нет токена" });
    }

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: "Неверный формат авторизации" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, ACCESS_SECRET);
        req.user = decoded; 

        next();
    } catch (error) {
        console.log("❌ JWT ошибка:", error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: "Токен истек" });
        }

        return res.status(401).json({ msg: "Неверный токен" });
    }
}

module.exports = authMiddleware;