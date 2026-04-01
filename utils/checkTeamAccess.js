const fs = require('fs-extra');

async function checkTeamAccess(teamId, userId) {
    const teams = await fs.readJSON('teams.json');
    const team = teams.find(t => t.id === teamId);
    return team && team.ownerId === userId;
}

module.exports = checkTeamAccess;