const service = require('../services/authService');

async function logout(req, res) {
    try {
        const { refreshToken } = req.body;

        const result = await authService.logout(refreshToken);

        res.json(result);

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
        const result = await service.login(req.body);

        res.json({
            success: true,
            msg: "Вы успешно вошли",
            ...result
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            msg: error.message
        });
    }
}

async function refresh(req, res) {
    try {
        const { refreshToken } = req.body;

        const tokens = await service.refresh(refreshToken);

        res.json(tokens);
    } catch (e) {
        res.status(401).json({ message: e.message });
    }
}

module.exports = {
    logout,
    register,
    login,
    refresh
};