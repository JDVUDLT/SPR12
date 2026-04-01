function calculateWorkingDays(startDate, endDate, holidays) {
    let workingDays = 0;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    const holidaySet = new Set();
    holidays.forEach(h => {
        if (h.date) holidaySet.add(h.date);
    });

    while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay();

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
            workingDays++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
}

function getDefaultStartDate() {
    const date = new Date();
    const day = date.getDay();

    if (day !== 1) {
        const daysToAdd = day === 0 ? 1 : 8 - day;
        date.setDate(date.getDate() + daysToAdd);
    }

    return date.toISOString().split('T')[0];
}

module.exports = {
    calculateWorkingDays,
    getDefaultStartDate
};