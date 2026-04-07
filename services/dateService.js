function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function calculateWorkingDays(startDate, endDate, holidays = []) {
    let workingDays = 0;

    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    const holidaySet = new Set(
        holidays
            .filter(h => h.date)
            .map(h => h.date)
    );

    while (currentDate <= end) {
        const dateStr = formatDateLocal(currentDate);
        const dayOfWeek = currentDate.getDay();

        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidaySet.has(dateStr);

        if (!isWeekend && !isHoliday) {
            workingDays++;
        }

        currentDate = new Date(currentDate);
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

    return formatDateLocal(date);
}

module.exports = {
    calculateWorkingDays,
    getDefaultStartDate
};