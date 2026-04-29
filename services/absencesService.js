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

async function deleteById(id) {
    await ensureFile();
    const items = await fs.readJSON(FILE);
    const index = items.findIndex(a => a.id === id);
    if (index === -1) return null;
    const deleted = items.splice(index, 1);
    await fs.writeJSON(FILE, items, { spaces: 2 });
    return deleted[0];
}

module.exports = { getByTeam, create, deleteById };