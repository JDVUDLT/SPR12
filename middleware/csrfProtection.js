function csrfProtection(req, res, next) {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const origin = req.get('Origin');
        const referer = req.get('Referer');
        const allowedOrigin = 'http://localhost:3000'; 

        if (origin && origin !== allowedOrigin) {
            return res.status(403).json({ success: false, msg: 'CSRF blocked' });
        }

        if (!origin && referer) {
            try {
                const url = new URL(referer);
                if (url.origin !== allowedOrigin) {
                    return res.status(403).json({ success: false, msg: 'CSRF blocked' });
                }
            } catch {
                return res.status(403).json({ success: false, msg: 'Invalid referer' });
            }
        }
    }
    next();
}

module.exports = csrfProtection;