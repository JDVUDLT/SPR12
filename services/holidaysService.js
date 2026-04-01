const fs = require('fs-extra');

const FILE = 'data/holidays.json';

async function ensureFile() {
    if (!await fs.pathExists(FILE)) {
        await fs.writeJSON(FILE, []);
    }
}

// Получить праздники команды
async function getByTeam(teamId) {
    await ensureFile();
    const holidays = await fs.readJSON(FILE);
    return holidays.filter(h => h.teamId === teamId);
}

// Добавить праздник
async function create(teamId, data) {
    await ensureFile();

    if (!data.date) {
        throw new Error("Дата обязательна");
    }

    const holidays = await fs.readJSON(FILE);

    const newHoliday = {
        id: `${teamId}_holiday_${Date.now()}`,
        teamId,
        date: data.date,
        name: data.name || 'Праздник',
        createdAt: new Date().toISOString()
    };

    holidays.push(newHoliday);
    await fs.writeJSON(FILE, holidays);

    return newHoliday;
}

// Удалить праздник
async function remove(id) {
    await ensureFile();

    const holidays = await fs.readJSON(FILE);
    const filtered = holidays.filter(h => h.id !== id);

    if (filtered.length === holidays.length) {
        return null;
    }

    await fs.writeJSON(FILE, filtered);
    return true;
}

module.exports = {
    getByTeam,
    create,
    remove
};