const service = require('../services/absencesService');

async function getAbsences(req, res) {
    const data = await service.getByTeam(req.params.teamId);
    res.json(data);
}

async function createAbsence(req, res) {
    const item = await service.create(req.body);
    res.json(item);
}

module.exports = { getAbsences, createAbsence };