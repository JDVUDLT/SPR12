const jwt = require('jsonwebtoken');
const { ACCESS_SECRET } = require('../utils/config');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, msg: "No token" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            msg: "Invalid or expired token"
        });
    }
}

module.exports = authMiddleware;