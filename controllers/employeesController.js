const service = require('../services/employeesService');

async function getEmployees(req, res) {
    const data = await service.getByTeam(req.params.teamId);
    res.json(data);
}

async function createEmployee(req, res) {
    const emp = await service.create(req.body);
    res.json(emp);
}

module.exports = { getEmployees, createEmployee };