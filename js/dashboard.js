console.log("📁 dashboard.js загружен");

let currentTeamId = null;
let currentYear = new Date().getFullYear();

// Проверка авторизации при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    console.log("✅ DOM загружен");
    
    if (!auth.requireAuth()) return;
    
    await loadUserTeams();
    setupEventListeners();
    initYearSelector();
});

// Инициализация выбора года
function initYearSelector() {
    const yearSelect = document.getElementById('yearSelect');
    if (!yearSelect) return;
    
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    
    for (let i = currentYear - 1; i <= currentYear + 2; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} год`;
        if (i === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }
}

// Загрузить команды пользователя
async function loadUserTeams() {
    try {
        const userId = auth.getUserId();
        const teams = await api.getTeams();
        const userTeams = teams.filter(t => t.ownerId === userId);
        
        const select = document.getElementById('teamSelect');
        select.innerHTML = '<option value="">-- Выберите команду --</option>';
        
        userTeams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            select.appendChild(option);
        });
        
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

// Настройка обработчиков событий
function setupEventListeners() {
    console.log("🔧 Настройка обработчиков");
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
        });
    }
    
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
    
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) {
        yearSelect.addEventListener('change', () => {
            currentYear = parseInt(yearSelect.value);
            if (currentTeamId) {
                loadCapacityData();
            }
        });
    }
    
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (currentTeamId) loadCapacityData();
        });
    }
    
    const exportBtn = document.getElementById('exportExcelBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }
    
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printReport);
    }
    
    const refreshChartBtn = document.getElementById('refreshChartBtn');
    if (refreshChartBtn) {
        refreshChartBtn.addEventListener('click', () => {
            if (currentTeamId) loadCapacityData();
        });
    }
}

// Загрузить данные для расчета трудоемкости
async function loadCapacityData() {
    if (!currentTeamId) {
        document.getElementById('capacitySection').style.display = 'none';
        return;
    }
    
    console.log(`📋 Загрузка данных для команды ${currentTeamId} за ${currentYear}`);
    
    document.getElementById('capacitySection').style.display = 'block';
    utils.showMessage('message', 'Расчет трудоемкости...', 'info');
    
    try {
        const [employees, sprints, absences, holidays] = await Promise.all([
            api.getEmployees(currentTeamId),
            api.getSprints(currentTeamId),
            api.getAbsences(currentTeamId),
            api.getHolidays(currentTeamId)
        ]);
        
        console.log(`📊 Данные: сотрудников ${employees?.length || 0}, спринтов ${sprints?.length || 0}`);
        
        if (!sprints || sprints.length === 0) {
            showNoSprintsMessage();
            drawEmptyChart();
            return;
        }
        
        const yearSprints = sprints.filter(s => {
            if (!s || !s.startDate) return false;
            return new Date(s.startDate).getFullYear() === currentYear;
        });
        
        console.log(`📅 Спринтов за ${currentYear}: ${yearSprints.length}`);
        
        if (yearSprints.length === 0) {
            showNoSprintsMessage();
            drawEmptyChart();
            return;
        }
        
        const capacityData = calculateCapacity(employees || [], yearSprints, absences || [], holidays || []);
        
        displayCapacityData(capacityData);
        displaySummaryStats(capacityData, employees || []);
        
        utils.showMessage('message', '', 'info');
        
    } catch (error) {
        console.error('❌ Ошибка расчета:', error);
        utils.showMessage('message', 'Ошибка расчета: ' + error.message, 'error');
        drawEmptyChart();
    }
}

// Расчет трудоемкости
function calculateCapacity(employees, sprints, absences, holidays) {
    const holidaySet = new Set();
    holidays.forEach(h => { if (h && h.date) holidaySet.add(h.date); });
    
    const absencesMap = {};
    absences.forEach(absence => {
        if (absence && absence.employeeId) {
            if (!absencesMap[absence.employeeId]) absencesMap[absence.employeeId] = [];
            absencesMap[absence.employeeId].push(absence);
        }
    });
    
    const sprintCapacity = sprints.map(sprint => {
        let totalDays = 0;
        let employeeDetails = [];
        
        employees.forEach(employee => {
            if (!employee) return;
            
            const hireDate = employee.hireDate ? new Date(employee.hireDate) : null;
            const fireDate = employee.fireDate ? new Date(employee.fireDate) : null;
            const sprintStart = new Date(sprint.startDate);
            const sprintEnd = new Date(sprint.endDate);
            
            if ((!hireDate || hireDate <= sprintEnd) && (!fireDate || fireDate >= sprintStart)) {
                let workingDays = 0;
                let current = new Date(sprintStart);
                
                while (current <= sprintEnd) {
                    const dateStr = current.toISOString().split('T')[0];
                    const dayOfWeek = current.getDay();
                    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
                        workingDays++;
                    }
                    current.setDate(current.getDate() + 1);
                }
                
                const employeeAbsences = absencesMap[employee.id] || [];
                let absenceDays = 0;
                
                employeeAbsences.forEach(absence => {
                    if (!absence) return;
                    const absenceStart = new Date(absence.startDate);
                    const absenceEnd = new Date(absence.endDate);
                    
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
            name: sprint.name || 'Спринт',
            startDate: sprint.startDate || '',
            endDate: sprint.endDate || '',
            workingDays: calculateWorkingDaysInSprint(sprint, holidaySet),
            totalCapacity: Math.round(totalDays * 100) / 100,
            employeeDetails: employeeDetails
        };
    }).filter(s => s !== null);
    
    const total = sprintCapacity.reduce((sum, s) => sum + (s.totalCapacity || 0), 0);
    
    return { sprints: sprintCapacity, total: total };
}

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

// ===== ФУНКЦИЯ ОТОБРАЖЕНИЯ ТАБЛИЦЫ =====
function displayCapacityData(capacityData) {
    console.log("📊 displayCapacityData вызвана");
    
    const tbody = document.getElementById('capacityTableBody');
    if (!tbody) {
        console.error("❌ capacityTableBody не найден");
        return;
    }
    
    // Проверка на пустые данные
    if (!capacityData || !capacityData.sprints || capacityData.sprints.length === 0) {
        showNoSprintsMessage();
        return;
    }
    
    const validSprints = capacityData.sprints.filter(s => s && s.name);
    
    if (validSprints.length === 0) {
        showNoSprintsMessage();
        return;
    }
    
    const maxCapacity = Math.max(...validSprints.map(s => s.totalCapacity || 0), 1);
    
    let html = '';
    validSprints.forEach(sprint => {
        const totalCapacity = sprint.totalCapacity || 0;
        const workingDays = sprint.workingDays || 0;
        const percent = maxCapacity > 0 ? (totalCapacity / maxCapacity * 100) : 0;
        
        html += `
            <tr class="sprint-row" data-sprint-id="${sprint.id || ''}">
                <td style="font-weight: 500;">${sprint.name || 'Спринт'}</td>
                <td>${utils.formatDate(sprint.startDate)} - ${utils.formatDate(sprint.endDate)}</td>
                <td class="text-center">${workingDays}</td>
                <td class="text-center"><strong>${totalCapacity}</strong></td>
                <td class="capacity-cell">
                    <div class="capacity-bar" style="width: ${percent}%"></div>
                    <span class="capacity-value">${Math.round(percent)}%</span>
                </td>
            </tr>
        `;
        
        if (sprint.employeeDetails && sprint.employeeDetails.length > 0) {
            html += `
                <tr class="employee-details-row" style="display: none;" data-sprint-id="${sprint.id || ''}">
                    <td colspan="5">
                        <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin: 5px 0;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #e9ecef;">
                                        <th style="padding: 8px; text-align: left;">Сотрудник</th>
                                        <th style="padding: 8px; text-align: left;">Рабочих дней</th>
                                        <th style="padding: 8px; text-align: left;">Вклад (чел-дней)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sprint.employeeDetails.map(emp => `
                                        <tr style="border-bottom: 1px solid #e9ecef;">
                                            <td style="padding: 8px;">${emp.name || 'Неизвестно'}</td>
                                            <td style="padding: 8px;">${emp.workingDays || 0}</td>
                                            <td style="padding: 8px;">${emp.capacity || 0}</td>
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
    
    // Обработчики для раскрытия деталей
    document.querySelectorAll('.sprint-row').forEach(row => {
        row.style.cursor = 'pointer';
        row.onclick = () => {
            const sprintId = row.dataset.sprintId;
            const detailsRow = document.querySelector(`.employee-details-row[data-sprint-id="${sprintId}"]`);
            if (detailsRow) {
                detailsRow.style.display = detailsRow.style.display === 'table-row' ? 'none' : 'table-row';
            }
        };
    });
    
    drawCapacityChart(capacityData);
}

function displaySummaryStats(capacityData, employees) {
    const totalCapacity = capacityData?.total || 0;
    const avgCapacity = capacityData?.sprints?.length ? 
        Math.round(totalCapacity / capacityData.sprints.length * 100) / 100 : 0;
    const totalEmployees = employees?.filter(e => !e.fireDate).length || 0;
    const totalSprints = capacityData?.sprints?.length || 0;
    
    document.getElementById('statTotalCapacity').textContent = totalCapacity;
    document.getElementById('statAvgCapacity').textContent = avgCapacity;
    document.getElementById('statEmployees').textContent = totalEmployees;
    document.getElementById('statSprints').textContent = totalSprints;
}

function showNoSprintsMessage() {
    const tbody = document.getElementById('capacityTableBody');
    if (tbody) {
        // Очищаем таблицу и показываем сообщение на всю ширину
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center" style="padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
                    <div style="font-size: 16px; color: #7f8c8d;">Нет спринтов за выбранный год</div>
                    <div style="font-size: 13px; color: #95a5a6; margin-top: 8px;">
                        Перейдите в раздел <a href="/sprints" style="color: #3498db;">"Спринты"</a> для генерации
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Обнуляем статистику
    const statTotalCapacity = document.getElementById('statTotalCapacity');
    const statAvgCapacity = document.getElementById('statAvgCapacity');
    const statEmployees = document.getElementById('statEmployees');
    const statSprints = document.getElementById('statSprints');
    
    if (statTotalCapacity) statTotalCapacity.textContent = '0';
    if (statAvgCapacity) statAvgCapacity.textContent = '0';
    if (statEmployees) statEmployees.textContent = '0';
    if (statSprints) statSprints.textContent = '0';
    
    // Очищаем график
    drawEmptyChart();
}

function drawEmptyChart() {
    const container = document.getElementById('chartContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: #f8f9fa; border-radius: 12px;">
            <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
            <div style="font-size: 16px; color: #7f8c8d;">Нет данных для отображения графика</div>
            <div style="font-size: 13px; color: #95a5a6; margin-top: 8px;">
                Сгенерируйте спринты в разделе <a href="/sprints" style="color: #3498db;">"Спринты"</a>
            </div>
        </div>
    `;
}

function drawCapacityChart(capacityData) {
    const container = document.getElementById('chartContainer');
    if (!container) return;
    
    if (!capacityData?.sprints?.length) {
        drawEmptyChart();
        return;
    }
    
    const validSprints = capacityData.sprints.slice(0, 20);
    const maxCapacity = Math.max(...validSprints.map(s => s.totalCapacity), 1);
    
    let html = '<div class="chart-bars">';
    validSprints.forEach(sprint => {
        const percent = (sprint.totalCapacity / maxCapacity) * 100;
        html += `
            <div class="chart-item">
                <div class="chart-label">${sprint.name}</div>
                <div class="chart-bar-container">
                    <div class="chart-bar" style="width: ${Math.max(percent, 5)}%">
                        <span class="chart-value">${sprint.totalCapacity}</span>
                    </div>
                </div>
                <div class="chart-percent">${Math.round(percent)}%</div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// Экспорт в CSV
async function exportToExcel() {
    alert("Экспорт в разработке");
}

function printReport() {
    window.print();
}

function displaySummaryStats(capacityData, employees) {
    // Получаем значения с защитой от undefined
    const totalCapacity = capacityData?.total || 0;
    const totalSprints = capacityData?.sprints?.length || 0;
    const avgCapacity = totalSprints > 0 ? 
        Math.round(totalCapacity / totalSprints * 100) / 100 : 0;
    const totalEmployees = employees?.filter(e => !e.fireDate).length || 0;
    
    // Обновляем элементы с проверкой существования
    const statTotalCapacity = document.getElementById('statTotalCapacity');
    const statAvgCapacity = document.getElementById('statAvgCapacity');
    const statEmployees = document.getElementById('statEmployees');
    const statSprints = document.getElementById('statSprints');
    
    if (statTotalCapacity) statTotalCapacity.textContent = totalCapacity;
    if (statAvgCapacity) statAvgCapacity.textContent = avgCapacity;
    if (statEmployees) statEmployees.textContent = totalEmployees;
    if (statSprints) statSprints.textContent = totalSprints;
    
    console.log(`📊 Статистика: всего=${totalCapacity}, среднее=${avgCapacity}, сотрудников=${totalEmployees}, спринтов=${totalSprints}`);
}

async function getCurrentCapacityData() {
    if (!currentTeamId) return null;
    
    try {
        const [employees, sprints, absences, holidays] = await Promise.all([
            api.getEmployees(currentTeamId),
            api.getSprints(currentTeamId),
            api.getAbsences(currentTeamId),
            api.getHolidays(currentTeamId)
        ]);
        
        const yearSprints = sprints.filter(s => new Date(s.startDate).getFullYear() === currentYear);
        
        if (yearSprints.length === 0) return null;
        
        return calculateCapacity(employees || [], yearSprints, absences || [], holidays || []);
        
    } catch (error) {
        console.error("❌ Ошибка получения данных:", error);
        return null;
    }
}

async function exportToExcel() {
    if (!currentTeamId) {
        utils.showMessage('message', 'Выберите команду', 'error');
        return;
    }
    
    try {
        const capacityData = await getCurrentCapacityData();
        
        if (!capacityData || !capacityData.sprints || capacityData.sprints.length === 0) {
            utils.showMessage('message', 'Нет данных для экспорта', 'error');
            return;
        }
        
        // Создаем CSV
        let csv = [];
        
        // Заголовок
        csv.push(['Отчет по трудоемкости']);
        csv.push([`Команда: ${document.getElementById('teamSelect').options[document.getElementById('teamSelect').selectedIndex]?.text || ''}`]);
        csv.push([`Год: ${currentYear}`]);
        csv.push([`Дата: ${new Date().toLocaleDateString('ru-RU')}`]);
        csv.push([]);
        
        // Статистика
        const totalCapacity = capacityData.total;
        const avgCapacity = capacityData.sprints.length ? Math.round(totalCapacity / capacityData.sprints.length * 100) / 100 : 0;
        
        csv.push(['Сводная статистика']);
        csv.push(['Всего человеко-дней', totalCapacity]);
        csv.push(['Среднее на спринт', avgCapacity]);
        csv.push(['Всего спринтов', capacityData.sprints.length]);
        csv.push([]);
        
        // Таблица спринтов
        csv.push(['Детализация по спринтам']);
        csv.push(['Спринт', 'Дата начала', 'Дата окончания', 'Рабочих дней', 'Доступно чел-дней', 'Загрузка %']);
        
        const maxCapacity = Math.max(...capacityData.sprints.map(s => s.totalCapacity), 1);
        
        capacityData.sprints.forEach(sprint => {
            const percent = Math.round((sprint.totalCapacity / maxCapacity) * 100);
            csv.push([
                sprint.name,
                utils.formatDate(sprint.startDate),
                utils.formatDate(sprint.endDate),
                sprint.workingDays || 0,
                sprint.totalCapacity,
                `${percent}%`
            ]);
        });
        
        // Детализация по сотрудникам
        csv.push([]);
        csv.push(['Детализация по сотрудникам']);
        csv.push(['Спринт', 'Сотрудник', 'Рабочих дней', 'Вклад']);
        
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
        
        // Конвертируем в CSV
        const csvString = csv.map(row => 
            row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        // Скачиваем
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
        
        utils.showMessage('message', '✅ Отчет экспортирован!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка экспорта:', error);
        utils.showMessage('message', 'Ошибка экспорта', 'error');
    }
}