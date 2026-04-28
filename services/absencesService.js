const fs = require('fs-extra');

const FILE = 'absences.json';

async function ensureFile() {
    if (!await fs.pathExists(FILE)) {
        await fs.writeJSON(FILE, []);
    }
}

// ===== GET BY TEAM =====
async function getByTeam(teamId) {
    await ensureFile();

    const data = await fs.readJSON(FILE);

    return data.filter(a => String(a.teamId) === String(teamId));
}

// ===== CREATE =====
async function create(data) {
    await ensureFile();

    const { teamId, employeeId, type, startDate, endDate, note } = data;

    if (!teamId || !employeeId || !startDate || !endDate) {
        throw new Error("Обязательные поля: teamId, employeeId, startDate, endDate");
    }

    const items = await fs.readJSON(FILE);

    const newItem = {
        id: Date.now().toString(),
        teamId,
        employeeId,
        type: type || 'vacation',
        startDate,
        endDate,
        note: note || '',
        createdAt: new Date().toISOString()
    };

    items.push(newItem);
    await fs.writeJSON(FILE, items, { spaces: 2 });

    return newItem;
}

module.exports = { getByTeam, create };