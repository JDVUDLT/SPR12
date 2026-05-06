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

async function deleteAbsence(req, res) {
    try {
        const deleted = await service.deleteById(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, msg: 'Отсутствие не найдено' });
        }
        res.json({ success: true, msg: 'Отсутствие удалено' });
    } catch (e) {
        res.status(500).json({ success: false, msg: e.message });
    }
}

async function updateAbsence(req, res) {
    try {
        const updated = await service.updateById(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ success: false, msg: 'Отсутствие не найдено' });
        }
        res.json({ success: true, item: updated });
    } catch (e) {
        res.status(400).json({ success: false, msg: e.message });
    }
}

module.exports = { getAbsences, createAbsence, deleteAbsence, updateAbsence };