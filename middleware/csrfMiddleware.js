function csrfProtection(req, res, next) {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const origin = req.get('Origin');
        const allowed = 'http://localhost:3000'; // твой домен

        if (origin && origin !== allowed) {
            return res.status(403).json({ success: false, msg: 'CSRF blocked' });
        }
        
        // fallback: если origin отсутствует (старые браузеры), можно проверить Referer
        if (!origin) {
            const referer = req.get('Referer');
            if (referer && !referer.startsWith(allowed)) {
                return res.status(403).json({ success: false, msg: 'CSRF blocked' });
            }
        }
    }
    next();
}