const fs = require('fs-extra');
const { calculateWorkingDays } = require('./dateService');

const SPRINTS_FILE = 'sprints.json';
const HOLIDAYS_FILE = 'holidays.json';

async function getByTeam(teamId) {
    const sprints = await fs.readJSON(SPRINTS_FILE);
    return sprints.filter(s => s.teamId === teamId);
}

module.exports = {
    calculateDays,
    copySprints,
    getByTeam
};

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
    copySprints
};