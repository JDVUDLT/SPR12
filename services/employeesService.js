const fs = require('fs-extra');
const FILE = 'employees.json';

async function ensure() {
    if (!await fs.pathExists(FILE)) {
        await fs.writeJSON(FILE, []);
    }
}

async function getByTeam(teamId) {
    await ensure();
    const data = await fs.readJSON(FILE);
    return data.filter(e => e.teamId === teamId);
}

async function create(data) {
    const employees = await fs.readJSON(FILE);

    const emp = {
        id: Date.now().toString(),
        ...data
    };

    employees.push(emp);
    await fs.writeJSON(FILE, employees);

    return emp;
}

module.exports = { getByTeam, create };