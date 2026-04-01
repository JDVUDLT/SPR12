const service = require('../services/authService');

// REGISTER
async function register(req, res) {
    try {
        const user = await service.register(req.body);

        res.json({
            success: true,
            user
        });

    } catch (error) {
        res.json({
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
        res.json({
            success: false,
            msg: error.message
        });
    }
}

module.exports = {
    register,
    login
};