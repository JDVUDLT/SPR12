const service = require('../services/absencesService');

async function getAbsences(req, res) {
    try {
        const data = await service.getByTeam(req.params.teamId);
        res.json(data);
    } catch (e) {
        res.status(500).json({ msg: e.message });
    }
}

async function createAbsence(req, res) {
    try {
        const userId = req.user.id; 

        const item = await service.create({
            ...req.body,
            userId
        });

        res.json(item);

    } catch (e) {
        res.status(400).json({ msg: e.message });
    }
}

module.exports = { getAbsences, createAbsence };