const service = require('../services/sprintService');

async function calculateDays(req, res) {
    try {
        const data = await service.calculateDays(req.params.teamId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function copySprints(req, res) {
    try {
        const count = await service.copySprints(
            req.params.teamId,
            req.body.year
        );

        res.json({ success: true, count });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

module.exports = {
    calculateDays,
    copySprints
};