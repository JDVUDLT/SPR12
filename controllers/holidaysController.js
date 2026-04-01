const service = require('../services/holidaysService');

// GET
async function getHolidays(req, res) {
    try {
        const data = await service.getByTeam(req.params.teamId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// POST
async function createHoliday(req, res) {
    try {
        const holiday = await service.create(req.params.teamId, req.body);
        res.json(holiday);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// DELETE
async function deleteHoliday(req, res) {
    try {
        const result = await service.remove(req.params.id);

        if (!result) {
            return res.status(404).json({ error: "Праздник не найден" });
        }

        res.json({ success: true });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getHolidays,
    createHoliday,
    deleteHoliday
};