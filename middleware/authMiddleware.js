const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

function authMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];
    console.log("AUTH HEADER:", req.headers.authorization);
    if (!authHeader) {
        return res.status(401).json({ msg: "Нет токена" });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ msg: 'Неверный формат токена' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        console.log("❌ JWT ошибка:", error.message);

        // 🔥 важно различать ошибки
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: "Токен истек" });
        }

        return res.status(403).json({ msg: "Неверный токен" });
    }
}

module.exports = authMiddleware;