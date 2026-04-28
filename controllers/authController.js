const service = require('../services/authService');

const accessCookieOptions = {
    httpOnly: true,
    secure: false,          // true на продакшене с HTTPS
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000  // 15 минут
};

const refreshCookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',        // можно 'strict', но 'lax' удобнее
    path: '/api/auth',      // только для маршрутов auth
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
};

// LOGOUT
async function logout(req, res) {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) {
            await service.logout(refreshToken);
        }
        // Только обязательные параметры
        res.clearCookie('accessToken', { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
        res.clearCookie('refreshToken', { httpOnly: true, secure: false, sameSite: 'lax', path: '/api/auth' });
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, msg: error.message });
    }
}

// REGISTER
async function register(req, res) {
    try {
        const user = await service.register(req.body);

        res.json({
            success: true,
            user
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            msg: error.message
        });
    }
}

// LOGIN
async function login(req, res) {
    try {
        const result = await service.login(req.body, req);

        // Устанавливаем access и refresh куки
        res.cookie('accessToken', result.accessToken, accessCookieOptions);
        res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

        return res.json({
            success: true,
            user: result.user
        });
    } catch (e) {
        return res.status(401).json({ success: false, msg: e.message });
    }
}

async function refresh(req, res) {
    try {
        const oldRefreshToken = req.cookies.refreshToken;
        if (!oldRefreshToken) {
            return res.status(401).json({ msg: "No refresh token" });
        }

        const tokens = await service.refresh(oldRefreshToken);

        res.cookie('accessToken', tokens.accessToken, accessCookieOptions);
        res.cookie('refreshToken', tokens.refreshToken, refreshCookieOptions);

        return res.json({ success: true });
    } catch (e) {
        console.log("❌ refresh error:", e.message);
        res.clearCookie('accessToken', accessCookieOptions);
        res.clearCookie('refreshToken', refreshCookieOptions);
        return res.status(401).json({ msg: "Refresh failed" });
    }
}

async function getSessions(req, res) {
    const sessions = await service.getUserSessions(req.user.id);
    res.json(sessions);
}

async function deleteSession(req, res) {
    await service.deleteSession(req.params.id, req.user.id);
    res.json({ success: true });
}

async function deleteAllSessions(req, res) {
    await service.deleteAllSessions(req.user.id);
    res.json({ success: true });
}


module.exports = {
    logout,
    register,
    login,
    refresh,
    getSessions,
    deleteSession,
    deleteAllSessions
};