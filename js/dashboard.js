// ======================================
// dashboard.js - Логика страницы дашборда (расчет трудоемкости)
// ======================================

console.log("📁 dashboard.js загружен");

let currentTeamId = null;
let currentYear = new Date().getFullYear();

// Проверка авторизации при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    // Проверяем, что мы не на странице логина
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        if (!auth.isAuthenticated()) {
            console.log("⚠️ Не авторизован, редирект на /login");
            window.location.href = '/login';
            return;
        }
    }

    console.log("✅ DOM загружен");
    
    // Проверяем зависимости
    console.log("📦 Проверка зависимостей:");
    console.log("   - api:", typeof api !== 'undefined' ? '✅' : '❌');
    console.log("   - auth:", typeof auth !== 'undefined' ? '✅' : '❌');
    console.log("   - utils:", typeof utils !== 'undefined' ? '✅' : '❌');
    
    // Проверяем авторизацию
    if (!auth.requireAuth()) {
        return;
    }
    
    // Загружаем команды пользователя
    await loadUserTeams();
    
    // Навешиваем обработчики
    setupEventListeners();
    
    // Инициализируем год
    initYearSelector();
});

// Инициализация выбора года
function initYearSelector() {
    const yearSelect = document.getElementById('yearSelect');
    if (!yearSelect) return;
    
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    
    // Добавляем годы (последние 2 и следующие 2)
    for (let i = currentYear - 1; i <= currentYear + 2; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} год`;
        if (i === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    console.log("🔧 Настройка обработчиков событий");
    
    // Выход
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
        });
    }
    
    // Выбор команды
    const teamSelect = document.getElementById('teamSelect');
    if (teamSelect) {
        teamSelect.addEventListener('change', () => {
            currentTeamId = teamSelect.value;
            if (currentTeamId) {
                localStorage.setItem('lastTeamId', currentTeamId);
                loadCapacityData();
            } else {
                document.getElementById('capacitySection').style.display = 'none';
            }
        });
    }
    
    // Выбор года
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) {
        yearSelect.addEventListener('change', () => {
            currentYear = parseInt(yearSelect.value);
            if (currentTeamId) {
                loadCapacityData();
            }
        });
    }
    
    // Кнопка обновления
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (currentTeamId) {
                loadCapacityData();
            }
        });
    }
    
    // Экспорт в Excel
    const exportBtn = document.getElementById('exportExcelBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }

    // Печать
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printReport);
    }
}

// Загрузить команды пользователя
async function loadUserTeams() {
    try {
        console.log("📋 Загрузка команд пользователя");
        
        const userId = auth.getUserId();
        const teams = await api.getTeams();
        
        // Фильтруем команды пользователя
        const userTeams = teams.filter(t => t.ownerId === userId);
        
        console.log(`📋 Загружено команд: ${userTeams.length}`);
        
        const select = document.getElementById('teamSelect');
        select.innerHTML = '<option value="">-- Выберите команду --</option>';
        
        userTeams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            select.appendChild(option);
        });
        
        // Если есть сохраненная команда, выбираем её
        const lastTeamId = localStorage.getItem('lastTeamId');
        if (lastTeamId && userTeams.some(t => t.id === lastTeamId)) {
            select.value = lastTeamId;
            currentTeamId = lastTeamId;
            await loadCapacityData();
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки команд:', error);
        utils.showMessage('message', 'Ошибка загрузки команд', 'error');
    }
}

// Загрузить данные для расчета трудоемкости
async function loadCapacityData() {
    if (!currentTeamId) {
        document.getElementById('capacitySection').style.display = 'none';
        return;
    }
    
    console.log(`📋 Загрузка данных трудоемкости для команды ${currentTeamId} за ${currentYear} год`);
    
    document.getElementById('capacitySection').style.display = 'block';
    utils.showMessage('message', 'Расчет трудоемкости...', 'info');
    
    try {
        // Получаем все необходимые данные
        const [employees, sprints, absences, holidays] = await Promise.all([
            api.getEmployees(currentTeamId),
            api.getSprints(currentTeamId),
            api.getAbsences(currentTeamId),
            api.getHolidays(currentTeamId)
        ]);
        
        console.log(`📊 Данные: сотрудников ${employees ? employees.length : 0}, спринтов ${sprints ? sprints.length : 0}, отсутствий ${absences ? absences.length : 0}, праздников ${holidays ? holidays.length : 0}`);
        
        // Проверяем, есть ли спринты
        if (!sprints || sprints.length === 0) {
            showNoSprintsMessage();
            return;
        }
        
        // Фильтруем спринты за выбранный год
        const yearSprints = sprints.filter(s => {
            if (!s || !s.startDate) return false;
            try {
                return new Date(s.startDate).getFullYear() === currentYear;
            } catch (e) {
                console.error("Ошибка парсинга даты:", s.startDate);
                return false;
            }
        });
        
        console.log(`📅 Спринтов за ${currentYear} год: ${yearSprints.length}`);
        
        if (yearSprints.length === 0) {
            showNoSprintsMessage();
            return;
        }
        
        // Рассчитываем трудоемкость
        const capacityData = calculateCapacity(employees || [], yearSprints, absences || [], holidays || []);
        
        // Отображаем результаты
        displayCapacityData(capacityData);
        displaySummaryStats(capacityData, employees || []);
        
        utils.showMessage('message', '', 'info');
        
    } catch (error) {
        console.error('❌ Ошибка расчета:', error);
        utils.showMessage('message', 'Ошибка расчета трудоемкости: ' + error.message, 'error');
    }
}

// Расчет трудоемкости
function calculateCapacity(employees, sprints, absences, holidays) {
    // Защита от пустых данных
    if (!employees) employees = [];
    if (!sprints) sprints = [];
    if (!absences) absences = [];
    if (!holidays) holidays = [];
    
    // Создаем Set с праздничными датами для быстрого поиска
    const holidaySet = new Set();
    holidays.forEach(h => {
        if (h && h.date) holidaySet.add(h.date);
    });
    
    // Создаем карту отсутствий по сотрудникам
    const absencesMap = {};
    absences.forEach(absence => {
        if (absence && absence.employeeId) {
            if (!absencesMap[absence.employeeId]) {
                absencesMap[absence.employeeId] = [];
            }
            absencesMap[absence.employeeId].push(absence);
        }
    });
    
    // Для каждого спринта рассчитываем доступные человеко-дни
    const sprintCapacity = sprints.map(sprint => {
        if (!sprint) return null;
        
        let totalDays = 0;
        let employeeDetails = [];
        
        employees.forEach(employee => {
            if (!employee) return;
            
            // Проверяем, работал ли сотрудник в этот период
            const hireDate = employee.hireDate ? new Date(employee.hireDate) : null;
            const fireDate = employee.fireDate ? new Date(employee.fireDate) : null;
            const sprintStart = new Date(sprint.startDate);
            const sprintEnd = new Date(sprint.endDate);
            
            // Проверяем, что сотрудник работал в этот период
            if ((!hireDate || hireDate <= sprintEnd) && (!fireDate || fireDate >= sprintStart)) {
                // Считаем рабочие дни сотрудника в спринте
                let workingDays = 0;
                let current = new Date(sprintStart);
                
                while (current <= sprintEnd) {
                    const dateStr = current.toISOString().split('T')[0];
                    const dayOfWeek = current.getDay();
                    
                    // Проверяем, что день рабочий (не выходной и не праздник)
                    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
                        workingDays++;
                    }
                    current.setDate(current.getDate() + 1);
                }
                
                // Вычитаем дни отсутствия
                const employeeAbsences = absencesMap[employee.id] || [];
                let absenceDays = 0;
                
                employeeAbsences.forEach(absence => {
                    if (!absence) return;
                    
                    const absenceStart = new Date(absence.startDate);
                    const absenceEnd = new Date(absence.endDate);
                    
                    // Находим пересечение отсутствия со спринтом
                    if (absenceEnd >= sprintStart && absenceStart <= sprintEnd) {
                        const overlapStart = absenceStart < sprintStart ? sprintStart : absenceStart;
                        const overlapEnd = absenceEnd > sprintEnd ? sprintEnd : absenceEnd;
                        
                        let checkDate = new Date(overlapStart);
                        while (checkDate <= overlapEnd) {
                            const dateStr = checkDate.toISOString().split('T')[0];
                            const dayOfWeek = checkDate.getDay();
                            
                            if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
                                absenceDays++;
                            }
                            checkDate.setDate(checkDate.getDate() + 1);
                        }
                    }
                });
                
                const employeeWorkingDays = Math.max(0, workingDays - absenceDays);
                
                employeeDetails.push({
                    id: employee.id,
                    name: employee.fullName || 'Неизвестно',
                    workingDays: employeeWorkingDays,
                    capacity: employeeWorkingDays
                });
                
                totalDays += employeeWorkingDays;
            }
        });
        
        return {
            id: sprint.id || '',
            name: sprint.name || `Спринт`,
            startDate: sprint.startDate || '',
            endDate: sprint.endDate || '',
            workingDays: calculateWorkingDaysInSprint(sprint, holidaySet),
            totalCapacity: Math.round(totalDays * 100) / 100,
            employeeDetails: employeeDetails
        };
    }).filter(s => s !== null); // Удаляем null значения
    
    const total = sprintCapacity.reduce((sum, s) => sum + (s.totalCapacity || 0), 0);
    
    return { sprints: sprintCapacity, total: total };
}

// Рассчитать рабочие дни в спринте (без учета сотрудников)
function calculateWorkingDaysInSprint(sprint, holidaySet) {
    let workingDays = 0;
    let current = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    
    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const dayOfWeek = current.getDay();
        
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
            workingDays++;
        }
        current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
}

// Отобразить данные трудоемкости
function displayCapacityData(capacityData) {
    const tbody = document.getElementById('capacityTableBody');
    
    // Проверяем, есть ли данные
    if (!capacityData || !capacityData.sprints || capacityData.sprints.length === 0) {
        tbody.innerHTML = '躬<td colspan="5" class="text-center">Нет спринтов за выбранный год. Перейдите в раздел "Спринты" для генерации</td></tr>';
        return;
    }
    
    // Фильтруем спринты, чтобы убрать пустые
    const validSprints = capacityData.sprints.filter(sprint => {
        return sprint && sprint.name && sprint.name !== '' && sprint.name !== 'undefined';
    });
    
    if (validSprints.length === 0) {
        tbody.innerHTML = '躬<td colspan="5" class="text-center">Нет спринтов за выбранный год. Перейдите в раздел "Спринты" для генерации</td></tr>';
        return;
    }
    
    // Находим максимальную емкость для масштабирования графика
    const maxCapacity = Math.max(...validSprints.map(s => s.totalCapacity || 0), 1);
    
    let html = '';
    validSprints.forEach(sprint => {
        const totalCapacity = sprint.totalCapacity || 0;
        const workingDays = sprint.workingDays || 0;
        const percent = maxCapacity > 0 ? (totalCapacity / maxCapacity * 100) : 0;
        
        html += `
            <tr class="sprint-row" data-sprint-id="${sprint.id || ''}">
                <td><strong>${sprint.name || 'Спринт'}</strong></td>
                <td>${utils.formatDate(sprint.startDate)} - ${utils.formatDate(sprint.endDate)}</td>
                <td class="text-center">${workingDays}</td>
                <td class="text-center"><strong>${totalCapacity}</strong></td>
                <td class="capacity-cell">
                    <div class="capacity-bar" style="width: ${percent}%"></div>
                    <span class="capacity-value">${Math.round(percent)}%</span>
                </td>
            </tr>
        `;
        
        // Добавляем детали по сотрудникам, если есть
        if (sprint.employeeDetails && sprint.employeeDetails.length > 0) {
            html += `
                <tr class="employee-details-row" style="display: none;" data-sprint-id="${sprint.id || ''}">
                    <td colspan="5">
                        <div class="employee-details">
                            <table class="table-small">
                                <thead>
                                    <tr>
                                        <th>Сотрудник</th>
                                        <th>Рабочих дней</th>
                                        <th>Вклад (чел-дней)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sprint.employeeDetails.map(emp => `
                                        <tr>
                                            <td>${emp.name || 'Неизвестно'}</td>
                                            <td>${emp.workingDays || 0}</td>
                                            <td>${emp.capacity || 0}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
            `;
        }
    });
    
    tbody.innerHTML = html;
    
    // ===== ВАЖНО: ОТРИСОВЫВАЕМ ГРАФИК =====
    drawCapacityChart(capacityData);
    
    // Добавляем обработчики для раскрытия деталей
    document.querySelectorAll('.sprint-row').forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') return;
            const sprintId = row.dataset.sprintId;
            const detailsRow = document.querySelector(`.employee-details-row[data-sprint-id="${sprintId}"]`);
            if (detailsRow) {
                const isVisible = detailsRow.style.display === 'table-row';
                detailsRow.style.display = isVisible ? 'none' : 'table-row';
            }
        });
    });
}

// Отобразить сводную статистику
function displaySummaryStats(capacityData, employees) {
    const totalCapacity = capacityData.total;
    const avgCapacity = capacityData.sprints.length ? 
        Math.round(totalCapacity / capacityData.sprints.length * 100) / 100 : 0;
    const totalEmployees = employees.filter(e => !e.fireDate).length;
    
    document.getElementById('statTotalCapacity').textContent = totalCapacity;
    document.getElementById('statAvgCapacity').textContent = avgCapacity;
    document.getElementById('statEmployees').textContent = totalEmployees;
    document.getElementById('statSprints').textContent = capacityData.sprints.length;
}

// Показать сообщение о отсутствии спринтов
function showNoSprintsMessage() {
    const tbody = document.getElementById('capacityTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Нет спринтов за выбранный год. Перейдите в раздел "Спринты" для генерации</td></tr>';
    }
    
    // Обнуляем статистику
    document.getElementById('statTotalCapacity').textContent = '0';
    document.getElementById('statAvgCapacity').textContent = '0';
    document.getElementById('statEmployees').textContent = '0';
    document.getElementById('statSprints').textContent = '0';
}

// Экспорт в CSV
function exportToCSV() {
    const table = document.getElementById('capacityTable');
    if (!table) return;
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const rowData = [];
        const cells = row.querySelectorAll('th, td');
        cells.forEach(cell => {
            rowData.push('"' + cell.textContent.replace(/"/g, '""') + '"');
        });
        csv.push(rowData.join(','));
    });
    
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `capacity_${currentTeamId}_${currentYear}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Отрисовать график трудоемкости
function drawCapacityChart(capacityData) {
    console.log("📊 Отрисовка графика трудоемкости");
    
    const container = document.getElementById('chartContainer');
    if (!container) {
        console.log("❌ Контейнер для графика не найден");
        return;
    }
    
    if (!capacityData || !capacityData.sprints || capacityData.sprints.length === 0) {
        container.innerHTML = '<div class="text-center">Нет данных для отображения графика</div>';
        return;
    }
    
    // Находим максимальное значение для масштабирования
    const maxCapacity = Math.max(...capacityData.sprints.map(s => s.totalCapacity), 1);
    
    let html = '<div class="chart-bars">';
    
    // Показываем первые 20 спринтов для наглядности
    const sprintsToShow = capacityData.sprints.slice(0, 20);
    
    sprintsToShow.forEach(sprint => {
        const percent = (sprint.totalCapacity / maxCapacity) * 100;
        const barColor = sprint.totalCapacity > 10 ? '#3498db' : '#e74c3c';
        
        html += `
            <div class="chart-item">
                <div class="chart-label" title="${sprint.startDate} - ${sprint.endDate}">
                    ${sprint.name}
                </div>
                <div class="chart-bar-container">
                    <div class="chart-bar" style="width: ${percent}%; background: linear-gradient(90deg, ${barColor}, ${barColor}dd);">
                        <span class="chart-value">${sprint.totalCapacity}</span>
                    </div>
                </div>
                <div class="chart-percent">${Math.round(percent)}%</div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Добавляем легенду
    html += `
        <div class="chart-legend">
            <div class="legend-item">
                <div class="legend-color" style="background: #3498db;"></div>
                <span>Высокая загрузка (>10 чел-дней)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #e74c3c;"></div>
                <span>Низкая загрузка (≤10 чел-дней)</span>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    console.log("✅ График отрисован");
}

// ===== ЭКСПОРТ В EXCEL =====
async function exportToExcel() {
    console.log("📊 Экспорт в Excel");
    
    try {
        const capacityData = await getCurrentCapacityData();
        if (!capacityData || !capacityData.sprints) {
            alert("Нет данных для экспорта");
            return;
        }
        
        // Создаем CSV данные
        let csv = [];
        
        // Заголовки
        csv.push(['Спринт', 'Дата начала', 'Дата окончания', 'Рабочих дней', 'Доступно чел-дней', 'Загрузка %']);
        
        // Данные по спринтам
        capacityData.sprints.forEach(sprint => {
            const maxCapacity = Math.max(...capacityData.sprints.map(s => s.totalCapacity), 1);
            const percent = Math.round((sprint.totalCapacity / maxCapacity) * 100);
            
            csv.push([
                sprint.name,
                utils.formatDate(sprint.startDate),
                utils.formatDate(sprint.endDate),
                sprint.workingDays,
                sprint.totalCapacity,
                `${percent}%`
            ]);
        });
        
        // Пустая строка
        csv.push([]);
        csv.push(['Детализация по сотрудникам']);
        csv.push(['Спринт', 'Сотрудник', 'Рабочих дней', 'Вклад']);
        
        // Детализация по сотрудникам
        capacityData.sprints.forEach(sprint => {
            if (sprint.employeeDetails && sprint.employeeDetails.length > 0) {
                sprint.employeeDetails.forEach(emp => {
                    csv.push([
                        sprint.name,
                        emp.name,
                        emp.workingDays,
                        emp.capacity
                    ]);
                });
            }
        });
        
        // Конвертируем в строку
        const csvString = csv.map(row => 
            row.map(cell => `"${cell || ''}"`).join(',')
        ).join('\n');
        
        // Создаем и скачиваем файл
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `capacity_${currentTeamId}_${currentYear}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('Экспорт выполнен успешно!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка экспорта:', error);
        showNotification('Ошибка экспорта', 'error');
    }
}

// Получить текущие данные
async function getCurrentCapacityData() {
    const [employees, sprints, absences, holidays] = await Promise.all([
        api.getEmployees(currentTeamId),
        api.getSprints(currentTeamId),
        api.getAbsences(currentTeamId),
        api.getHolidays(currentTeamId)
    ]);
    
    const yearSprints = sprints.filter(s => new Date(s.startDate).getFullYear() === currentYear);
    return calculateCapacity(employees || [], yearSprints, absences || [], holidays || []);
}


// ===== ПЕЧАТЬ =====
function printReport() {
    console.log("🖨️ Печать отчета");
    
    // Получаем данные для печати
    const stats = document.querySelector('.stats-grid');
    const table = document.getElementById('capacityTable');
    const chart = document.getElementById('chartContainer');
    
    if (!table) return;
    
    // Создаем окно для печати
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Отчет по трудоемкости</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 40px;
                }
                h1 {
                    color: #2c3e50;
                    text-align: center;
                }
                h2 {
                    color: #3498db;
                    margin-top: 30px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                .stats {
                    display: flex;
                    justify-content: space-around;
                    margin: 30px 0;
                }
                .stat-card {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    width: 200px;
                }
                .stat-number {
                    font-size: 24px;
                    font-weight: bold;
                    color: #3498db;
                }
                .footer {
                    text-align: center;
                    margin-top: 50px;
                    color: #7f8c8d;
                    font-size: 12px;
                }
                @media print {
                    body {
                        margin: 0;
                        padding: 20px;
                    }
                }
            </style>
        </head>
        <body>
            <h1>Отчет по трудоемкости команды</h1>
            <p style="text-align: center;">Дата: ${new Date().toLocaleDateString('ru-RU')}</p>
            
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">${document.getElementById('statTotalCapacity').textContent}</div>
                    <div>Всего человеко-дней</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${document.getElementById('statAvgCapacity').textContent}</div>
                    <div>Среднее на спринт</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${document.getElementById('statEmployees').textContent}</div>
                    <div>Сотрудников</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${document.getElementById('statSprints').textContent}</div>
                    <div>Спринтов</div>
                </div>
            </div>
            
            <h2>Трудоемкость по спринтам</h2>
            ${table.outerHTML}
            
            <div class="footer">
                Отчет сгенерирован автоматически в системе SprintPlanner
            </div>
            
            <script>
                window.onload = () => {
                    window.print();
                    setTimeout(() => window.close(), 1000);
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

