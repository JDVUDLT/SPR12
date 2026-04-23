const crypto = require('crypto');

function generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
}

// выдача токена
function setCSRF(req, res, next) {
    if (!req.cookies.csrfToken) {
        const token = generateCSRFToken();

        res.cookie('csrfToken', token, {
            httpOnly: false, // ❗ важно
            secure: true,
            sameSite: 'strict'
        });
    }

    next();
}

// проверка
function verifyCSRF(req, res, next) {
    const cookieToken = req.cookies.csrfToken;
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({
            success: false,
            msg: 'CSRF token invalid'
        });
    }

    next();
}

module.exports = {
    setCSRF,
    verifyCSRF
};