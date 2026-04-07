const service = require('../services/sprintService');

async function getSprints(req, res) {
    try {
        const data = await service.getByTeam(req.params.teamId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function generateSprints(req, res) {
    try {
        console.log("🔥 Controller: generateSprints");
        console.log("teamId:", req.params.teamId);
        console.log("body:", req.body);

        const teamId = req.params.teamId;
        const { duration, firstStart } = req.body;

        const result = await service.generateSprints({
            teamId,
            duration,
            firstStart
        });

        res.json(result);

    } catch (error) {
        console.error("❌ Controller error:", error.message);

        res.status(500).json({
            error: error.message
        });
    }
}

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
    copySprints,
    getSprints,  
    generateSprints 
};