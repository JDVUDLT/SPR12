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
        const item = await service.create({
            teamId: req.body.teamId,
            employeeId: req.body.employeeId,
            type: req.body.type,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            note: req.body.note
            // userId больше не принудительно вставляется из JWT
        });

        res.json(item);
    } catch (e) {
        res.status(400).json({ msg: e.message });
    }
}

module.exports = { getAbsences, createAbsence };