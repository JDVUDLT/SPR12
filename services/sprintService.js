const fs = require('fs-extra');
const { calculateWorkingDays } = require('./dateService');

const SPRINTS_FILE = 'sprints.json';
const HOLIDAYS_FILE = 'holidays.json';

async function safeReadJSON(file) {
    try {
        if (await fs.pathExists(file)) {
            return await fs.readJSON(file);
        }
        return [];
    } catch (e) {
        console.log(`⚠️ Ошибка чтения ${file}`, e.message);
        return [];
    }
}

async function ensureFile(file) {
    const fs = require('fs-extra');

    try {
        if (!(await fs.pathExists(file))) {
            console.log(`📁 Создаём файл: ${file}`);
            await fs.writeJSON(file, [], { spaces: 4 });
        }
    } catch (e) {
        console.error(`❌ Ошибка создания файла ${file}:`, e);
    }
}

async function getByTeam(teamId) {
    const sprints = await fs.readJSON(SPRINTS_FILE);
    return sprints.filter(s => s.teamId === teamId);
}

async function generateSprints({ teamId, duration, firstStart }) {
    await ensureFile(SPRINTS_FILE);
    await ensureFile(HOLIDAYS_FILE);

    if (!teamId || !duration || !firstStart) {
        throw new Error("teamId, duration и firstStart обязательны");
    }

    const startDate = new Date(firstStart);
    if (isNaN(startDate)) throw new Error("Некорректная дата firstStart");

    await ensureFile(SPRINTS_FILE);
    const endOfYear = new Date(startDate.getFullYear(), 11, 31);
    const sprints = await safeReadJSON(SPRINTS_FILE);
    const holidays = await safeReadJSON(HOLIDAYS_FILE);
    const teamHolidays = holidays.filter(h => h.teamId === teamId);

    let newSprints = [];
    let currentStart = new Date(startDate);
    let sprintNumber = 1;

    while (currentStart <= endOfYear && sprintNumber <= 52) {
        let currentEnd = new Date(currentStart);
        currentEnd.setDate(currentEnd.getDate() + duration - 1);
        if (currentEnd > endOfYear) currentEnd = new Date(endOfYear);

        const workingDays = calculateWorkingDays(
            currentStart.toISOString().split('T')[0],
            currentEnd.toISOString().split('T')[0],
            teamHolidays
        );

        newSprints.push({
            id: `${teamId}_sprint_${Date.now()}_${Math.random().toString(36).substring(2,8)}`,
            teamId,
            name: `Спринт ${sprintNumber}`,
            startDate: currentStart.toISOString().split('T')[0],
            endDate: currentEnd.toISOString().split('T')[0],
            workingDays
        });

        currentStart = new Date(currentEnd);
        currentStart.setDate(currentStart.getDate() + 1);
        sprintNumber++;
    }

    const otherSprints = sprints.filter(s => s.teamId !== teamId);
    await fs.writeJSON(SPRINTS_FILE, [...otherSprints, ...newSprints], { spaces: 4 });

    return newSprints;
}

async function calculateDays(teamId) {
    const sprints = await fs.readJSON(SPRINTS_FILE);
    const holidays = await fs.readJSON(HOLIDAYS_FILE);

    const teamSprints = sprints.filter(s => s.teamId === teamId);
    const teamHolidays = holidays.filter(h => h.teamId === teamId);

    teamSprints.forEach(sprint => {
        sprint.workingDays = calculateWorkingDays(
            sprint.startDate,
            sprint.endDate,
            teamHolidays
        );
    });

    const other = sprints.filter(s => s.teamId !== teamId);
    const updated = [...other, ...teamSprints];

    await fs.writeJSON(SPRINTS_FILE, updated, { spaces: 4 });

    return teamSprints;
}

// Копирование спринтов
async function copySprints(teamId, year) {
    const sprints = await fs.readJSON(SPRINTS_FILE);

    const lastYearSprints = sprints.filter(s =>
        s.teamId === teamId &&
        new Date(s.startDate).getFullYear() === year
    );

    if (!lastYearSprints.length) {
        throw new Error(`Нет спринтов за ${year} год`);
    }

    const currentYear = new Date().getFullYear();

    const other = sprints.filter(s =>
        !(s.teamId === teamId &&
          new Date(s.startDate).getFullYear() === currentYear)
    );

    const newSprints = lastYearSprints.map(sprint => {
        const newStart = new Date(sprint.startDate);
        const newEnd = new Date(sprint.endDate);

        newStart.setFullYear(currentYear);
        newEnd.setFullYear(currentYear);

        return {
            ...sprint,
            id: `${teamId}_sprint_${Date.now()}_${Math.random()}`,
            startDate: newStart.toISOString().split('T')[0],
            endDate: newEnd.toISOString().split('T')[0],
            workingDays: 0
        };
    });

    const updated = [...other, ...newSprints];

    await fs.writeJSON(SPRINTS_FILE, updated, { spaces: 4 });

    return newSprints.length;
}

module.exports = {
    calculateDays,
    copySprints,
    getByTeam,
    generateSprints
};