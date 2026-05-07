const allowedOrigins = [
    'http://localhost:3000',
    'https://spr12.onrender.com'
];

function csrfProtection(req, res, next) {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const origin = req.get('Origin');
        
        if (origin && !allowedOrigins.includes(origin)) {
            return res.status(403).json({ success: false, msg: 'CSRF blocked' });
        }
        
        if (!origin) {
            const referer = req.get('Referer');
            if (referer) {
                const isAllowed = allowedOrigins.some(o => referer.startsWith(o));
                if (!isAllowed) {
                    return res.status(403).json({ success: false, msg: 'CSRF blocked' });
                }
            }
        }
    }
    next();
}