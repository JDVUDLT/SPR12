const fs = require('fs-extra');
const FILE = 'teams.json';

async function ensure() {
    if (!await fs.pathExists(FILE)) {
        await fs.writeJSON(FILE, []);
    }
}

async function getAll() {
    await ensure();
    return fs.readJSON(FILE);
}

async function create(data, userId) {
    await ensure();
    const teams = await fs.readJSON(FILE);

    const team = {
        id: Date.now().toString(),
        name: data.name,
        ownerId: userId,
        createdAt: new Date().toISOString()
    };

    teams.push(team);
    await fs.writeJSON(FILE, teams);

    return team;
}

module.exports = { getAll, create };