const jwt = require('jsonwebtoken');
const { ACCESS_SECRET } = require('../utils/config');

function authMiddleware(req, res, next) {
    const token = req.cookies.accessToken; // <-- читаем из куки

    if (!token) {
        return res.status(401).json({ success: false, msg: "No token" });
    }

    try {
        const decoded = jwt.verify(token, ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, msg: "Token expired" });
    }
}

module.exports = authMiddleware;