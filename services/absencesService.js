const fs = require('fs-extra');
const FILE = 'absences.json';

async function getByTeam(teamId) {
    const data = await fs.readJSON(FILE);
    return data.filter(a => a.teamId === teamId);
}

async function create(data) {
    const items = await fs.readJSON(FILE);

    const newItem = {
        id: Date.now().toString(),
        ...data
    };

    items.push(newItem);
    await fs.writeJSON(FILE, items);

    return newItem;
}

module.exports = { getByTeam, create };