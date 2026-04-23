const service = require('../services/authService');
const { safeReadJSON } = require('../utils/fileService');
console.log("🔥 LOGIN CONTROLLER HIT");
const cookieOptions = {
    httpOnly: true,
    secure: false, // dev
    sameSite: 'lax',
    path: '/'      // 💥 ВАЖНО
};

// LOGOUT
async function logout(req, res) {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken) {
            await service.logout(refreshToken);
        }

        res.clearCookie('refreshToken', cookieOptions);

        res.json({ success: true });

    } catch (error) {
        res.status(400).json({
            success: false,
            msg: error.message
        });
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

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            success: true,
            accessToken: result.accessToken,
            user: result.user
        });

    } catch (e) {
        return res.status(401).json({
            success: false,
            msg: e.message
        });
    }
}

// REFRESH
async function refresh(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ msg: "No refresh token" });
        }

        const tokens = await service.refresh(refreshToken);

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/'
        });

        return res.json({
            accessToken: tokens.accessToken
        });

    } catch (e) {
        console.log("❌ refresh error:", e.message);

        res.clearCookie("refreshToken", { path: "/" });

        return res.status(401).json({
            msg: "Refresh failed"
        });
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