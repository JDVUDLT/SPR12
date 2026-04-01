const service = require('../services/teamsService');

async function getTeams(req, res) {
    const data = await service.getAll();
    res.json(data);
}

async function createTeam(req, res) {
    const team = await service.create(req.body, req.user.id);
    res.json(team);
}

module.exports = { getTeams, createTeam };