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

    const { teamId, startDate, endDate, userId } = data;
    
    if (!teamId || !startDate || !endDate) {
        throw new Error("Обязательные поля: teamId, startDate, endDate");
    }

    const items = await fs.readJSON(FILE);

    const newItem = {
        id: Date.now().toString(),
        teamId,
        startDate,
        endDate,
        userId, // уже из JWT
        createdAt: new Date().toISOString()
    };

    items.push(newItem);

    await fs.writeJSON(FILE, items, { spaces: 2 });

    return newItem;
}

module.exports = { getByTeam, create };