const service = require('../services/employeesService');

async function getEmployees(req, res) {
    const data = await service.getByTeam(req.params.teamId);
    res.json(data);
}

async function createEmployee(req, res) {
    const emp = await service.create(req.body);
    res.json(emp);
}

async function deleteEmployee(req, res) {
    try {
        const deleted = await service.deleteById(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, msg: 'Сотрудник не найден' });
        }
        res.json({ success: true, msg: 'Сотрудник удалён' });
    } catch (error) {
        res.status(500).json({ success: false, msg: error.message });
    }
}

module.exports = { getEmployees, createEmployee, deleteEmployee };