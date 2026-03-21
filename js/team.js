// ======================================
// team.js - Логика главной страницы
// ======================================

console.log("📁 team.js загружен");

// Текущая выбранная команда
let currentTeamId = null;

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
        return; // auth.requireAuth() сам перенаправит на /login
    }
    
    // Загружаем команды
    await loadTeams();
    
    // Навешиваем обработчики
    setupEventListeners();
});

// Настройка обработчиков событий
function setupEventListeners() {
    console.log("🔧 Настройка обработчиков событий");
    
    // ===== ВЫХОД =====
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        console.log("✅ Найден logoutBtn, навешиваем обработчик");
        
        // Удаляем все предыдущие обработчики
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        // Добавляем новый обработчик
        newLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("🔴 Нажата кнопка выхода");
            auth.logout();
        });
    } else {
        console.log("❌ logoutBtn не найден!");
    }
    
    // Показать форму создания команды
    const showCreateTeamBtn = document.getElementById('showCreateTeamBtn');
    if (showCreateTeamBtn) {
        showCreateTeamBtn.addEventListener('click', showCreateTeamForm);
    }
    
    // Отмена создания команды
    const cancelCreateTeamBtn = document.getElementById('cancelCreateTeamBtn');
    if (cancelCreateTeamBtn) {
        cancelCreateTeamBtn.addEventListener('click', hideCreateTeamForm);
    }
    
    // Создание команды
    const createTeamBtn = document.getElementById('createTeamBtn');
    if (createTeamBtn) {
        createTeamBtn.addEventListener('click', createTeam);
    }
    
    // Выбор команды
    const teamSelect = document.getElementById('teamSelect');
    if (teamSelect) {
        teamSelect.addEventListener('change', loadTeamData);
    }
    
    // Показать форму добавления сотрудника
    const showAddEmployeeBtn = document.getElementById('showAddEmployeeBtn');
    if (showAddEmployeeBtn) {
        showAddEmployeeBtn.addEventListener('click', showAddEmployeeForm);
    }
    
    // Отмена добавления сотрудника
    const cancelAddEmployeeBtn = document.getElementById('cancelAddEmployeeBtn');
    if (cancelAddEmployeeBtn) {
        cancelAddEmployeeBtn.addEventListener('click', hideAddEmployeeForm);
    }
    
    // Добавление сотрудника
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', addEmployee);
    }
    const showAddAbsenceBtn = document.getElementById('showAddAbsenceBtn');
    if (showAddAbsenceBtn) {
        showAddAbsenceBtn.addEventListener('click', showAddAbsenceForm);
    }

    // Отмена добавления отсутствия
    const cancelAddAbsenceBtn = document.getElementById('cancelAddAbsenceBtn');
    if (cancelAddAbsenceBtn) {
        cancelAddAbsenceBtn.addEventListener('click', hideAddAbsenceForm);
        }

    // Добавление отсутствия
    const addAbsenceBtn = document.getElementById('addAbsenceBtn');
    if (addAbsenceBtn) {
        addAbsenceBtn.addEventListener('click', addAbsence);
    }

    setupFilterListeners();
    
    }

// ===== РАБОТА С КОМАНДАМИ =====

// Загрузить список команд пользователя
async function loadTeams() {
    try {
        console.log("📋 Загрузка команд...");
        utils.showMessage('message', 'Загрузка команд...', 'info');
        
        const userId = auth.getUserId();
        const teams = await api.getTeams();
        
        // Фильтруем команды пользователя (если нужно)
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
            await loadTeamData();
        }
        
        utils.showMessage('message', '', 'info'); // Очищаем сообщение
        
    } catch (error) {
        console.error('❌ Ошибка загрузки команд:', error);
        utils.showMessage('message', 'Ошибка загрузки команд', 'error');
    }
}

// Показать форму создания команды
function showCreateTeamForm() {
    console.log("📋 Показ формы создания команды");
    document.getElementById('createTeamForm').style.display = 'block';
    document.getElementById('teamName').focus();
}

// Скрыть форму создания команды
function hideCreateTeamForm() {
    console.log("📋 Скрытие формы создания команды");
    document.getElementById('createTeamForm').style.display = 'none';
    document.getElementById('teamName').value = '';
}

// Создать новую команду
async function createTeam() {
    const teamName = document.getElementById('teamName').value.trim();
    
    if (!teamName) {
        utils.showMessage('message', 'Введите название команды', 'error');
        return;
    }
    
    try {
        console.log("📋 Создание команды:", teamName);
        utils.showMessage('message', 'Создание команды...', 'info');
        
        const userId = auth.getUserId();
        const newTeam = await api.createTeam({
            name: teamName,
            userId: userId
        });
        
        console.log("✅ Команда создана:", newTeam);
        
        hideCreateTeamForm();
        await loadTeams();
        
        // Выбираем новую команду
        const select = document.getElementById('teamSelect');
        select.value = newTeam.id;
        await loadTeamData();
        
        utils.showMessage('message', 'Команда создана!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка создания команды:', error);
        utils.showMessage('message', 'Ошибка создания команды', 'error');
    }
}

// Обновить информацию о выбранной команде
async function updateTeamInfo() {
    if (!currentTeamId) {
        document.getElementById('selectedTeamInfo').style.display = 'none';
        return;
    }
    
    try {
        // Получаем данные о команде
        const teams = await api.getTeams();
        const team = teams.find(t => t.id === currentTeamId);
        
        if (!team) return;
        
        // Получаем сотрудников и отсутствия
        const employees = await api.getEmployees(currentTeamId);
        const absences = await api.getAbsences(currentTeamId);
        
        // Обновляем отображение
        document.getElementById('selectedTeamName').textContent = team.name;
        document.getElementById('teamEmployeesCount').textContent = employees.length;
        document.getElementById('teamAbsencesCount').textContent = absences.length;
        document.getElementById('selectedTeamInfo').style.display = 'block';
        
    } catch (error) {
        console.error('Ошибка обновления информации о команде:', error);
    }
}

// ===== РАБОТА С СОТРУДНИКАМИ =====

// Загрузить данные выбранной команды
async function loadTeamData() {
    const select = document.getElementById('teamSelect');
    currentTeamId = select.value;
    
    if (!currentTeamId) {
        document.getElementById('employeeSection').style.display = 'none';
        document.getElementById('selectedTeamInfo').style.display = 'none';
        return;
    }
    
    console.log(`📋 Загрузка данных команды: ${currentTeamId}`);
    
    localStorage.setItem('lastTeamId', currentTeamId);
    document.getElementById('employeeSection').style.display = 'block';
    
    // Обновляем информацию о команде
    await updateTeamInfo();    
    await loadEmployees();
    await loadAbsences();
}

// Загрузить сотрудников команды
async function loadEmployees() {
    if (!currentTeamId) return;
    
    try {
        console.log(`📋 Загрузка сотрудников команды ${currentTeamId}`);
        
        const employees = await api.getEmployees(currentTeamId);
        allEmployees = employees; // Сохраняем всех сотрудников
        console.log(`📋 Загружено сотрудников: ${employees.length}`);
        
        // Применяем фильтры (если есть)
        applyFiltersAndSearch();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки сотрудников:', error);
        utils.showMessage('message', 'Ошибка загрузки сотрудников', 'error');
    }
}

// Отобразить сотрудников в таблице
function displayEmployeesTable(employees) {
    const tbody = document.getElementById('employeesList');
    
    if (!employees || employees.length === 0) {
        tbody.innerHTML = `躬<td colspan="5" class="text-center">Нет сотрудников</td> </table>`;
        return;
    }
    
    let html = '';
    employees.forEach(emp => {
        const status = getEmployeeCurrentStatus(emp);
        
        let actionsHtml = '';
        
        if (emp.fireDate) {
            // Уволенный сотрудник
            actionsHtml = `
                <button class="btn btn-small btn-success" onclick="restoreEmployee('${emp.id}')" title="Восстановить сотрудника">
                    🔄
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteEmployee('${emp.id}')" title="Удалить сотрудника">
                    🗑️
                </button>
            `;
        } else {
            // Работающий сотрудник
            actionsHtml = `
                <button class="btn btn-small btn-edit" onclick="editEmployee('${emp.id}')" title="Редактировать сотрудника">
                    ✏️
                </button>
                <button class="btn btn-small btn-warning" onclick="quickFireEmployee('${emp.id}')" title="Уволить сотрудника">
                    📋
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteEmployee('${emp.id}')" title="Удалить сотрудника">
                    🗑️
                </button>
            `;
        }
        
        html += `
            <tr>
                <td><strong>${escapeHtml(emp.fullName)}</strong></td>
                <td>${utils.getRoleName(emp.role)}</td>
                <td>${utils.formatDate(emp.hireDate)}</td>
                <td><span class="${status.class}">${status.text}</span></td>
                <td class="actions-cell">${actionsHtml}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Показать форму добавления сотрудника
function showAddEmployeeForm() {
    console.log("📋 Показ формы добавления сотрудника");
    
    // Устанавливаем сегодняшнюю дату
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('empHireDate').value = today;
    
    document.getElementById('addEmployeeForm').style.display = 'block';
    document.getElementById('empName').focus();
}

// Скрыть форму добавления сотрудника
function hideAddEmployeeForm() {
    console.log("📋 Скрытие формы добавления сотрудника");
    document.getElementById('addEmployeeForm').style.display = 'none';
    document.getElementById('empName').value = '';
}

// Добавить сотрудника
async function addEmployee() {
    const name = document.getElementById('empName').value.trim();
    const role = document.getElementById('empRole').value;
    const hireDate = document.getElementById('empHireDate').value;
    
    if (!name) {
        utils.showMessage('message', 'Введите ФИО сотрудника', 'error');
        return;
    }
    
    if (!hireDate) {
        utils.showMessage('message', 'Выберите дату приема', 'error');
        return;
    }
    
    try {
        console.log("📋 Добавление сотрудника:", { name, role, hireDate });
        utils.showMessage('message', 'Добавление сотрудника...', 'info');
        
        await api.addEmployee({
            teamId: currentTeamId,
            fullName: name,
            role: role,
            hireDate: hireDate
        });
        
        console.log("✅ Сотрудник добавлен");
        
        hideAddEmployeeForm();
        await loadEmployees();
        
        utils.showMessage('message', 'Сотрудник добавлен!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка добавления сотрудника:', error);
        utils.showMessage('message', 'Ошибка добавления сотрудника', 'error');
    }
}

// Удалить сотрудника
async function deleteEmployee(id) {
    const employee = await getEmployeeById(id);
    if (!employee) return;
    
    if (confirm(`Вы уверены, что хотите удалить сотрудника "${employee.fullName}"?\nЭто действие нельзя отменить.`)) {
        try {
            console.log(`📋 Удаление сотрудника: ${id}`);
            utils.showMessage('message', 'Удаление...', 'info');
            
            await api.deleteEmployee(id);
            await loadEmployees();
            
            utils.showMessage('message', `Сотрудник "${employee.fullName}" удален`, 'success');
            
        } catch (error) {
            console.error('❌ Ошибка удаления:', error);
            utils.showMessage('message', 'Ошибка удаления', 'error');
        }
    }
}

// Получить сотрудника по ID
async function getEmployeeById(id) {
    const employees = await api.getEmployees(currentTeamId);
    return employees.find(e => e.id === id);
}

// Удалить отсутствие (с улучшенным подтверждением)
async function deleteAbsence(id) {
    if (confirm('Вы уверены, что хотите удалить запись об отсутствии?\nЭто действие нельзя отменить.')) {
        try {
            console.log(`📋 Удаление отсутствия: ${id}`);
            utils.showMessage('message', 'Удаление...', 'info');
            
            await api.deleteAbsence(id);
            await loadAbsences();
            
            utils.showMessage('message', 'Запись об отсутствии удалена', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка удаления:', error);
            utils.showMessage('message', 'Ошибка удаления', 'error');
        }
    }
}

// ===== РАБОТА С ОТСУТСТВИЯМИ =====

// Загрузить отсутствия команды
async function loadAbsences() {
    if (!currentTeamId) return;
    
    try {
        console.log(`📋 Загрузка отсутствий команды ${currentTeamId}`);
        
        const absences = await api.getAbsences(currentTeamId);
        
        // Создаем карту отсутствий для быстрого доступа
        window.currentAbsencesMap = {};
        absences.forEach(absence => {
            if (!window.currentAbsencesMap[absence.employeeId]) {
                window.currentAbsencesMap[absence.employeeId] = [];
            }
            window.currentAbsencesMap[absence.employeeId].push(absence);
        });
        
        const employees = await api.getEmployees(currentTeamId);
        displayAbsencesTable(absences, employees);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки отсутствий:', error);
        utils.showMessage('message', 'Ошибка загрузки отсутствий', 'error');
    }
}

// Отобразить отсутствия в таблице
function displayAbsences(absences, employees) {
    const tbody = document.getElementById('absencesList');
    
    if (!absences || absences.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Нет данных об отсутствиях</td></tr>';
        return;
    }
    
    // Создаем карту сотрудников для быстрого поиска
    const employeeMap = {};
    employees.forEach(emp => {
        employeeMap[emp.id] = emp;
    });
    
    let html = '';
    absences.forEach(absence => {
        const employee = employeeMap[absence.employeeId];
        const employeeName = employee ? employee.fullName : 'Неизвестный сотрудник';
        
        // Рассчитываем количество дней
        const days = calculateDays(absence.startDate, absence.endDate);
        
        // Получаем класс для типа отсутствия
        const typeClass = getAbsenceTypeClass(absence.type);
        
        html += `
            <td class="actions-cell">
                ${emp.fireDate ? `
                    <!-- Кнопки для уволенного сотрудника -->
                    <button class="btn btn-small btn-success" onclick="restoreEmployee('${emp.id}')" title="Восстановить сотрудника">
                        🔄
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteEmployee('${emp.id}')" title="Удалить сотрудника">
                        🗑️
                    </button>
                ` : `
                    <!-- Кнопки для работающего сотрудника -->
                    <button class="btn btn-small btn-edit" onclick="editEmployee('${emp.id}')" title="Редактировать сотрудника">
                        ✏️
                    </button>
                    <button class="btn btn-small btn-warning" onclick="quickFireEmployee('${emp.id}')" title="Уволить сотрудника">
                        📋
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteEmployee('${emp.id}')" title="Удалить сотрудника">
                        🗑️
                    </button>
                `}
            </td>
        `;
    });
    
    tbody.innerHTML = html;
}

// Рассчитать количество дней между датами
function calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
}

// Получить класс CSS для типа отсутствия
function getAbsenceTypeClass(type) {
    const classes = {
        'vacation': 'status-vacation',
        'sick': 'status-sick',
        'dayoff': 'status-dayoff',
        'business': 'status-business'
    };
    return classes[type] || 'status-default';
}

// Показать форму добавления отсутствия
async function showAddAbsenceForm() {
    console.log("📋 Показ формы добавления отсутствия");
    
    // Загружаем сотрудников для выпадающего списка
    await loadEmployeesForSelect();
    
    // Устанавливаем сегодняшнюю дату
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('absenceStart').value = today;
    document.getElementById('absenceEnd').value = today;
    
    document.getElementById('addAbsenceForm').style.display = 'block';
}

// Скрыть форму добавления отсутствия
function hideAddAbsenceForm() {
    console.log("📋 Скрытие формы добавления отсутствия");
    document.getElementById('addAbsenceForm').style.display = 'none';
    document.getElementById('absenceNote').value = '';
}

// Загрузить сотрудников для выпадающего списка
async function loadEmployeesForSelect() {
    if (!currentTeamId) return;
    
    try {
        const employees = await api.getEmployees(currentTeamId);
        const select = document.getElementById('absenceEmployee');
        
        select.innerHTML = '<option value="">-- Выберите сотрудника --</option>';
        
        // Только работающие сотрудники (без даты увольнения)
        const activeEmployees = employees.filter(emp => !emp.fireDate);
        
        activeEmployees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = `${emp.fullName} (${utils.getRoleName(emp.role)})`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('❌ Ошибка загрузки сотрудников для селекта:', error);
    }
}

// Добавить отсутствие
async function addAbsence() {
    const employeeId = document.getElementById('absenceEmployee').value;
    const type = document.getElementById('absenceType').value;
    const startDate = document.getElementById('absenceStart').value;
    const endDate = document.getElementById('absenceEnd').value;
    const note = document.getElementById('absenceNote').value.trim();
    
    // Валидация
    if (!employeeId) {
        utils.showMessage('message', 'Выберите сотрудника', 'error');
        return;
    }
    
    if (!startDate || !endDate) {
        utils.showMessage('message', 'Выберите даты начала и окончания', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        utils.showMessage('message', 'Дата начала не может быть позже даты окончания', 'error');
        return;
    }
    
    try {
        console.log("📋 Добавление отсутствия:", { employeeId, type, startDate, endDate, note });
        utils.showMessage('message', 'Добавление отсутствия...', 'info');
        
        await api.addAbsence({
            employeeId: employeeId,
            type: type,
            startDate: startDate,
            endDate: endDate,
            note: note
        });
        
        console.log("✅ Отсутствие добавлено");
        
        hideAddAbsenceForm();
        await loadAbsences();
        
        utils.showMessage('message', 'Отсутствие добавлено!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка добавления отсутствия:', error);
        utils.showMessage('message', 'Ошибка добавления отсутствия', 'error');
    }
}

// Удалить отсутствие
async function deleteAbsence(id) {
    if (!confirm('Вы уверены, что хотите удалить запись об отсутствии?')) {
        return;
    }
    
    try {
        console.log(`📋 Удаление отсутствия: ${id}`);
        utils.showMessage('message', 'Удаление...', 'info');
        
        await api.deleteAbsence(id);
        await loadAbsences();
        
        utils.showMessage('message', 'Отсутствие удалено', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка удаления отсутствия:', error);
        utils.showMessage('message', 'Ошибка удаления отсутствия', 'error');
    }
}

// Загрузить отсутствия для определения статуса сотрудников
async function loadAbsencesForStatus() {
    if (!currentTeamId) return {};
    
    try {
        const absences = await api.getAbsences(currentTeamId);
        
        // Группируем отсутствия по сотрудникам
        const absencesMap = {};
        absences.forEach(absence => {
            if (!absencesMap[absence.employeeId]) {
                absencesMap[absence.employeeId] = [];
            }
            absencesMap[absence.employeeId].push(absence);
        });
        
        return absencesMap;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки отсутствий:', error);
        return {};
    }
}
// Определить текущий статус сотрудника с учетом отсутствий
function getEmployeeCurrentStatus(employee) {
    // Если нет данных об отсутствиях, возвращаем "Работает"
    if (!window.currentAbsencesMap) {
        return { text: 'Работает', class: 'status-active' };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const absences = window.currentAbsencesMap[employee.id] || [];
    
    // Проверяем активные отсутствия
    for (const absence of absences) {
        if (absence.startDate <= today && absence.endDate >= today) {
            let statusText = '';
            switch (absence.type) {
                case 'vacation': statusText = 'В отпуске'; break;
                case 'sick': statusText = 'На больничном'; break;
                case 'dayoff': statusText = 'Отгул'; break;
                case 'business': statusText = 'В командировке'; break;
                default: statusText = 'Отсутствует';
            }
            return { text: statusText, class: `status-${absence.type}` };
        }
    }
    
    return { text: 'Работает', class: 'status-active' };
}

// ===== РЕДАКТИРОВАНИЕ СОТРУДНИКА =====

// Редактировать сотрудника
async function editEmployee(id) {
    console.log(`📋 Редактирование сотрудника: ${id}`);
    
    try {
        // Получаем данные сотрудника
        const employees = await api.getEmployees(currentTeamId);
        const employee = employees.find(e => e.id === id);
        
        if (!employee) {
            utils.showMessage('message', 'Сотрудник не найден', 'error');
            return;
        }
        
        // Заполняем форму редактирования
        document.getElementById('editEmpId').value = employee.id;
        document.getElementById('editEmpName').value = employee.fullName;
        document.getElementById('editEmpRole').value = employee.role;
        document.getElementById('editEmpHireDate').value = employee.hireDate;
        document.getElementById('editEmpFireDate').value = employee.fireDate || '';
        
        // Показываем форму
        document.getElementById('editEmployeeForm').style.display = 'block';
        document.getElementById('addEmployeeForm').style.display = 'none';
        
    } catch (error) {
        console.error('❌ Ошибка загрузки сотрудника:', error);
        utils.showMessage('message', 'Ошибка загрузки данных', 'error');
    }
}

    // Сохранить изменения сотрудника
    async function saveEmployeeEdit() {
    const id = document.getElementById('editEmpId').value;
    const name = document.getElementById('editEmpName').value.trim();
    const role = document.getElementById('editEmpRole').value;
    const hireDate = document.getElementById('editEmpHireDate').value;
    const fireDate = document.getElementById('editEmpFireDate').value || null;
    
    if (!name || !hireDate) {
        utils.showMessage('message', 'Заполните обязательные поля', 'error');
        return;
    }
    
    try {
        console.log(`📋 Сохранение изменений сотрудника ${id}`);
        utils.showMessage('message', 'Сохранение...', 'info');
        
        await api.updateEmployee(id, {
            fullName: name,
            role: role,
            hireDate: hireDate,
            fireDate: fireDate
        });
        
        hideEditEmployeeForm();
        await loadEmployees();
        
        utils.showMessage('message', 'Данные сотрудника обновлены!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        utils.showMessage('message', 'Ошибка сохранения', 'error');
    }
}

// Скрыть форму редактирования
function hideEditEmployeeForm() {
    document.getElementById('editEmployeeForm').style.display = 'none';
    document.getElementById('editEmpId').value = '';
    document.getElementById('editEmpName').value = '';
    document.getElementById('editEmpFireDate').value = '';
}

// Отмена редактирования
function cancelEditEmployee() {
    hideEditEmployeeForm();
}

// ===== РЕДАКТИРОВАНИЕ ОТСУТСТВИЙ =====

// Редактировать отсутствие
async function editAbsence(id) {
    console.log(`📋 Редактирование отсутствия: ${id}`);
    
    try {
        // Получаем данные отсутствия
        const absences = await api.getAbsences(currentTeamId);
        const absence = absences.find(a => a.id === id);
        
        if (!absence) {
            utils.showMessage('message', 'Запись не найдена', 'error');
            return;
        }
        
        // Заполняем форму
        document.getElementById('editAbsenceId').value = absence.id;
        document.getElementById('editAbsenceEmployee').value = absence.employeeId;
        document.getElementById('editAbsenceType').value = absence.type;
        document.getElementById('editAbsenceStart').value = absence.startDate;
        document.getElementById('editAbsenceEnd').value = absence.endDate;
        document.getElementById('editAbsenceNote').value = absence.note || '';
        
        // Показываем форму
        document.getElementById('editAbsenceForm').style.display = 'block';
        document.getElementById('addAbsenceForm').style.display = 'none';
        
        // Загружаем сотрудников для селекта
        await loadEmployeesForEditSelect();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        utils.showMessage('message', 'Ошибка загрузки данных', 'error');
    }
}

// Загрузить сотрудников для редактирования
async function loadEmployeesForEditSelect() {
    if (!currentTeamId) return;
    
    try {
        const employees = await api.getEmployees(currentTeamId);
        const select = document.getElementById('editAbsenceEmployee');
        
        select.innerHTML = '';
        employees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = `${emp.fullName} (${utils.getRoleName(emp.role)})`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('❌ Ошибка загрузки сотрудников:', error);
    }
}

// Сохранить изменения отсутствия
async function saveAbsenceEdit() {
    const id = document.getElementById('editAbsenceId').value;
    const employeeId = document.getElementById('editAbsenceEmployee').value;
    const type = document.getElementById('editAbsenceType').value;
    const startDate = document.getElementById('editAbsenceStart').value;
    const endDate = document.getElementById('editAbsenceEnd').value;
    const note = document.getElementById('editAbsenceNote').value.trim();
    
    if (!employeeId || !startDate || !endDate) {
        utils.showMessage('message', 'Заполните все поля', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        utils.showMessage('message', 'Дата начала не может быть позже даты окончания', 'error');
        return;
    }
    
    try {
        console.log(`📋 Сохранение изменений отсутствия ${id}`);
        utils.showMessage('message', 'Сохранение...', 'info');
        
        await api.updateAbsence(id, {
            employeeId: employeeId,
            type: type,
            startDate: startDate,
            endDate: endDate,
            note: note
        });
        
        hideEditAbsenceForm();
        await loadAbsences();
        
        utils.showMessage('message', 'Изменения сохранены!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        utils.showMessage('message', 'Ошибка сохранения', 'error');
    }
}

// Скрыть форму редактирования отсутствия
function hideEditAbsenceForm() {
    document.getElementById('editAbsenceForm').style.display = 'none';
    document.getElementById('editAbsenceId').value = '';
    document.getElementById('editAbsenceNote').value = '';
}

// Отмена редактирования отсутствия
function cancelEditAbsence() {
    hideEditAbsenceForm();
}

// ===== ФИЛЬТРАЦИЯ СОТРУДНИКОВ =====

let allEmployees = [];      // Храним всех сотрудников
let filteredEmployees = [];  // Храним отфильтрованных
let currentPage = 1;
const itemsPerPage = 10;

// Загрузить сотрудников
async function loadEmployees() {
    if (!currentTeamId) return;
    
    try {
        console.log(`📋 Загрузка сотрудников команды ${currentTeamId}`);
        
        const employees = await api.getEmployees(currentTeamId);
        allEmployees = employees;
        console.log(`📋 Загружено сотрудников: ${employees.length}`);
        
        // Применяем фильтры
        applyFiltersAndSearch();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки сотрудников:', error);
        utils.showMessage('message', 'Ошибка загрузки сотрудников', 'error');
    }
}

// Применить поиск и фильтры (мгновенно)
function applyFiltersAndSearch() {
    const searchInput = document.getElementById('searchEmployee');
    const filterSelect = document.getElementById('filterRole');
    
    const searchText = searchInput?.value.toLowerCase().trim() || '';
    const filterRole = filterSelect?.value || '';
    
    // Фильтрация
    filteredEmployees = allEmployees.filter(emp => {
        let matchSearch = true;
        if (searchText) {
            matchSearch = emp.fullName.toLowerCase().includes(searchText);
        }
        
        let matchRole = true;
        if (filterRole) {
            matchRole = emp.role === filterRole;
        }
        
        return matchSearch && matchRole;
    });
    
    // Показываем информацию о результатах поиска
    showSearchResultInfo(searchText, filterRole);
    
    // Обновляем счетчик
    const countSpan = document.getElementById('employeesCount');
    if (countSpan) {
        if (filteredEmployees.length === allEmployees.length) {
            countSpan.textContent = `${allEmployees.length}`;
        } else {
            countSpan.textContent = `${filteredEmployees.length} из ${allEmployees.length}`;
        }
    }
    
    // Индикатор активного фильтра
    updateFilterIndicator(searchText, filterRole);
    
    // Сбрасываем страницу
    currentPage = 1;
    
    // Отображаем
    displayEmployeesPaginated();
}

// Показать информацию о результатах поиска
function showSearchResultInfo(searchText, filterRole) {
    const infoDiv = document.getElementById('searchResultInfo');
    const textSpan = document.getElementById('searchResultText');
    
    if (!infoDiv || !textSpan) return;
    
    if (searchText || filterRole) {
        let message = '';
        if (searchText && filterRole) {
            message = `Найдено ${filteredEmployees.length} сотрудников по запросу "${searchText}" и роли "${utils.getRoleName(filterRole)}"`;
        } else if (searchText) {
            message = `Найдено ${filteredEmployees.length} сотрудников по запросу "${searchText}"`;
        } else if (filterRole) {
            message = `Найдено ${filteredEmployees.length} сотрудников с ролью "${utils.getRoleName(filterRole)}"`;
        }
        
        textSpan.textContent = message;
        infoDiv.style.display = 'flex';
        
        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            if (infoDiv.style.display === 'flex') {
                infoDiv.style.opacity = '0';
                setTimeout(() => {
                    infoDiv.style.display = 'none';
                    infoDiv.style.opacity = '';
                }, 300);
            }
        }, 3000);
    } else {
        infoDiv.style.display = 'none';
    }
}

// Показать индикатор активного фильтра
function updateFilterIndicator(searchText, filterRole) {
    const searchInput = document.getElementById('searchEmployee');
    const filterSelect = document.getElementById('filterRole');
    
    if (searchText) {
        searchInput.classList.add('filter-active');
    } else {
        searchInput.classList.remove('filter-active');
    }
    
    if (filterRole) {
        filterSelect.classList.add('filter-active');
    } else {
        filterSelect.classList.remove('filter-active');
    }
}

// Отобразить сотрудников с пагинацией
function displayEmployeesPaginated() {
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageEmployees = filteredEmployees.slice(start, end);
    
    displayEmployeesTable(pageEmployees);
    updatePaginationControls(totalPages);
}

// Отобразить таблицу сотрудников
function displayEmployeesTable(employees) {
    const tbody = document.getElementById('employeesList');
    
    if (!employees || employees.length === 0) {
        const searchText = document.getElementById('searchEmployee')?.value;
        const filterRole = document.getElementById('filterRole')?.value;
        
        let message = '👥 Нет сотрудников';
        if (searchText || filterRole) {
            message = '🔍 Нет сотрудников, соответствующих критериям поиска';
        }
        
        tbody.innerHTML = `躬<td colspan="5" class="text-center">${message}</td> </tr>`;
        return;
    }
    
    let html = '';
    employees.forEach(emp => {
        const status = getEmployeeCurrentStatus(emp);
        
        html += `
            <tr>
                <td><strong>${escapeHtml(emp.fullName)}</strong> </td>
                <td>${utils.getRoleName(emp.role)}</td>
                <td>${utils.formatDate(emp.hireDate)}</td>
                <td><span class="${status.class}">${status.text}</span></td>
                <td>
                    <button class="btn btn-small btn-edit" onclick="editEmployee('${emp.id}')" title="Редактировать">✏️</button>
                    <button class="btn btn-small btn-danger" onclick="deleteEmployee('${emp.id}')" title="Удалить">🗑️</button>
                 </td>
             </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Функция для безопасного экранирования HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Обновить элементы пагинации
function updatePaginationControls(totalPages) {
    const container = document.getElementById('paginationControls');
    if (!container) return;
    
    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    
    let html = `
        <button class="btn-pagination" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            ← Назад
        </button>
        <span class="page-info">
            Страница ${currentPage} из ${totalPages}
            <span class="page-count">(${filteredEmployees.length} сотрудников)</span>
        </span>
        <button class="btn-pagination" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Вперед →
        </button>
    `;
    
    container.innerHTML = html;
}

// Сменить страницу
function changePage(page) {
    if (page < 1) return;
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    if (page > totalPages) return;
    
    currentPage = page;
    displayEmployeesPaginated();
}

// ===== НАСТРОЙКА МГНОВЕННЫХ ФИЛЬТРОВ =====
function setupFilterListeners() {
    const searchInput = document.getElementById('searchEmployee');
    const filterRole = document.getElementById('filterRole');
    
    if (searchInput) {
        // Мгновенное обновление при вводе текста
        searchInput.addEventListener('input', () => {
            console.log("🔍 Поиск мгновенно:", searchInput.value);
            applyFiltersAndSearch();
        });
        
        // Добавляем кнопку очистки поиска
        addClearButtonToSearch();
    }
    
    if (filterRole) {
        // Мгновенное обновление при изменении выбора
        filterRole.addEventListener('change', () => {
            console.log("📋 Фильтр мгновенно:", filterRole.value);
            applyFiltersAndSearch();
        });
    }
}

// Добавляем кнопку очистки поиска
function addClearButtonToSearch() {
    const searchContainer = document.querySelector('.search-bar .form-group.half:first-child');
    if (!searchContainer) return;
    
    // Создаем контейнер с относительным позиционированием
    searchContainer.style.position = 'relative';
    
    // Добавляем кнопку очистки
    const clearBtn = document.createElement('button');
    clearBtn.innerHTML = '✕';
    clearBtn.className = 'search-clear-btn';
    clearBtn.title = 'Очистить поиск';
    clearBtn.style.cssText = `
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #95a5a6;
        display: none;
        padding: 4px 8px;
    `;
    
    clearBtn.onclick = () => {
        const searchInput = document.getElementById('searchEmployee');
        if (searchInput) {
            searchInput.value = '';
            applyFiltersAndSearch();
            searchInput.focus();
        }
    };
    
    searchContainer.appendChild(clearBtn);
    
    // Показываем/скрываем кнопку в зависимости от наличия текста
    const searchInput = document.getElementById('searchEmployee');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearBtn.style.display = searchInput.value ? 'block' : 'none';
        });
    }
}

// Сменить страницу
function changePage(page) {
    if (page < 1) return;
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    if (page > totalPages) return;
    
    currentPage = page;
    displayEmployeesPaginated();
}

// Настройка обработчиков фильтров
function setupFilterListeners() {
    const searchInput = document.getElementById('searchEmployee');
    const filterRole = document.getElementById('filterRole');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            console.log("🔍 Поиск:", searchInput.value);
            applyFiltersAndSearch();
        });
    }
    
    if (filterRole) {
        filterRole.addEventListener('change', () => {
            console.log("📋 Фильтр по роли:", filterRole.value);
            applyFiltersAndSearch();
        });
    }
}

// ===== УВЕДОМЛЕНИЯ О ПРЕДСТОЯЩИХ ОТПУСКАХ =====
function checkUpcomingAbsences() {
    if (!currentTeamId) return;
    
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    api.getAbsences(currentTeamId).then(absences => {
        const upcomingAbsences = absences.filter(absence => {
            const startDate = new Date(absence.startDate);
            return startDate >= today && startDate <= threeDaysFromNow;
        });
        
        if (upcomingAbsences.length > 0) {
            api.getEmployees(currentTeamId).then(employees => {
                const employeeMap = {};
                employees.forEach(emp => employeeMap[emp.id] = emp);
                
                let message = '📢 Предстоящие отсутствия:\n';
                upcomingAbsences.forEach(absence => {
                    const employee = employeeMap[absence.employeeId];
                    if (employee) {
                        message += `\n• ${employee.fullName} - ${getAbsenceTypeName(absence.type)} с ${utils.formatDate(absence.startDate)}`;
                    }
                });
                
                // Показываем уведомление
                showNotification(message, 'warning');
            });
        }
    }).catch(error => {
        console.error('Ошибка проверки отсутствий:', error);
    });
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Закрытие по клику
    notification.querySelector('.notification-close').onclick = () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    };
    
    // Автоматическое закрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// ===== БЫСТРОЕ УВОЛЬНЕНИЕ/ВОССТАНОВЛЕНИЕ =====

async function quickFireEmployee(id) {
    console.log(`🔫 Быстрое увольнение сотрудника: ${id}`);
    
    // Получаем данные сотрудника по ID
    const employee = await getEmployeeById(id);
    
    // Если сотрудник не найден, показываем ошибку
    if (!employee) {
        utils.showMessage('message', '❌ Сотрудник не найден', 'error');
        return;
    }
    
    // Проверяем, не уволен ли уже сотрудник
    if (employee.fireDate) {
        utils.showMessage('message', `⚠️ Сотрудник "${employee.fullName}" уже уволен ${utils.formatDate(employee.fireDate)}`, 'warning');
        return;
    }
    
    // Формируем сообщение подтверждения
    const today = new Date();
    const todayStr = today.toLocaleDateString('ru-RU');
    const confirmMessage = `📋 Увольнение сотрудника\n\n` +
        `ФИО: ${employee.fullName}\n` +
        `Роль: ${utils.getRoleName(employee.role)}\n` +
        `Дата приема: ${utils.formatDate(employee.hireDate)}\n\n` +
        `Дата увольнения: ${todayStr}\n\n` +
        `Вы уверены, что хотите уволить сотрудника?`;
    
    // Запрашиваем подтверждение
    if (!confirm(confirmMessage)) {
        console.log("❌ Увольнение отменено пользователем");
        return;
    }
    
    try {
        console.log(`📡 Отправка запроса на увольнение...`);
        utils.showMessage('message', `⏳ Увольнение сотрудника "${employee.fullName}"...`, 'info');
        
        // Получаем текущую дату в формате YYYY-MM-DD
        const fireDate = today.toISOString().split('T')[0];
        
        // Отправляем запрос на обновление сотрудника
        await api.updateEmployee(id, {
            fireDate: fireDate
        });
        
        console.log(`✅ Сотрудник "${employee.fullName}" уволен`);
        
        // Обновляем список сотрудников
        await loadEmployees();
        
        // Показываем сообщение об успехе
        utils.showMessage('message', `✅ Сотрудник "${employee.fullName}" уволен (${todayStr})`, 'success');
        
    } catch (error) {
        console.error('❌ Ошибка увольнения:', error);
        utils.showMessage('message', `❌ Ошибка увольнения: ${error.message}`, 'error');
    }
}

/**
 * Восстановление уволенного сотрудника
 * @param {string} id - ID сотрудника
 */
async function restoreEmployee(id) {
    console.log(`🔄 Восстановление сотрудника: ${id}`);
    
    // Получаем данные сотрудника по ID
    const employee = await getEmployeeById(id);
    
    // Если сотрудник не найден, показываем ошибку
    if (!employee) {
        utils.showMessage('message', '❌ Сотрудник не найден', 'error');
        return;
    }
    
    // Проверяем, уволен ли сотрудник
    if (!employee.fireDate) {
        utils.showMessage('message', `⚠️ Сотрудник "${employee.fullName}" уже работает`, 'warning');
        return;
    }
    
    // Формируем сообщение подтверждения
    const confirmMessage = `🔄 Восстановление сотрудника\n\n` +
        `ФИО: ${employee.fullName}\n` +
        `Роль: ${utils.getRoleName(employee.role)}\n` +
        `Дата приема: ${utils.formatDate(employee.hireDate)}\n` +
        `Дата увольнения: ${utils.formatDate(employee.fireDate)}\n\n` +
        `Вы уверены, что хотите восстановить сотрудника?`;
    
    // Запрашиваем подтверждение
    if (!confirm(confirmMessage)) {
        console.log("❌ Восстановление отменено пользователем");
        return;
    }
    
    try {
        console.log(`📡 Отправка запроса на восстановление...`);
        utils.showMessage('message', `⏳ Восстановление сотрудника "${employee.fullName}"...`, 'info');
        
        // Отправляем запрос на обновление (удаляем дату увольнения)
        await api.updateEmployee(id, {
            fireDate: null
        });
        
        console.log(`✅ Сотрудник "${employee.fullName}" восстановлен`);
        
        // Обновляем список сотрудников
        await loadEmployees();
        
        // Показываем сообщение об успехе
        utils.showMessage('message', `✅ Сотрудник "${employee.fullName}" восстановлен`, 'success');
        
    } catch (error) {
        console.error('❌ Ошибка восстановления:', error);
        utils.showMessage('message', `❌ Ошибка восстановления: ${error.message}`, 'error');
    }
}

/**
 * Получить сотрудника по ID
 * @param {string} id - ID сотрудника
 * @returns {Object|null} - Данные сотрудника или null
 */
async function getEmployeeById(id) {
    if (!currentTeamId) {
        console.log("❌ Команда не выбрана");
        return null;
    }
    
    try {
        const employees = await api.getEmployees(currentTeamId);
        const employee = employees.find(e => e.id === id);
        
        if (!employee) {
            console.log(`❌ Сотрудник с ID ${id} не найден`);
            return null;
        }
        
        return employee;
        
    } catch (error) {
        console.error('❌ Ошибка получения сотрудника:', error);
        return null;
    }
}

async function exportEmployeeReport(employeeId) {
    try {
        const employee = await getEmployeeById(employeeId);
        if (!employee) return;
        
        const [absences, sprints] = await Promise.all([
            api.getAbsences(currentTeamId),
            api.getSprints(currentTeamId)
        ]);
        
        const employeeAbsences = absences.filter(a => a.employeeId === employeeId);
        const currentYear = new Date().getFullYear();
        const yearSprints = sprints.filter(s => new Date(s.startDate).getFullYear() === currentYear);
        
        // Создаем CSV отчет
        let csv = [];
        
        // Заголовок
        csv.push(['Отчет по сотруднику', employee.fullName]);
        csv.push(['Дата создания', new Date().toLocaleString('ru-RU')]);
        csv.push([]);
        
        // Информация о сотруднике
        csv.push(['Информация о сотруднике']);
        csv.push(['ФИО', employee.fullName]);
        csv.push(['Роль', utils.getRoleName(employee.role)]);
        csv.push(['Дата приема', utils.formatDate(employee.hireDate)]);
        csv.push(['Дата увольнения', employee.fireDate ? utils.formatDate(employee.fireDate) : 'Работает']);
        csv.push([]);
        
        // Отсутствия
        csv.push(['Отсутствия']);
        csv.push(['Тип', 'Дата начала', 'Дата окончания', 'Дней']);
        
        employeeAbsences.forEach(absence => {
            const days = calculateDays(absence.startDate, absence.endDate);
            csv.push([
                getAbsenceTypeName(absence.type),
                utils.formatDate(absence.startDate),
                utils.formatDate(absence.endDate),
                days
            ]);
        });
        
        if (employeeAbsences.length === 0) {
            csv.push(['Нет записей об отсутствиях']);
        }
        
        csv.push([]);
        
        // Доступные дни
        csv.push(['Доступность по спринтам']);
        csv.push(['Спринт', 'Период', 'Рабочих дней', 'Дней отсутствия', 'Доступно']);
        
        yearSprints.forEach(sprint => {
            const workingDays = calculateWorkingDaysInSprint(sprint);
            const absenceDays = calculateAbsenceDaysInSprint(employeeAbsences, sprint);
            const availableDays = workingDays - absenceDays;
            
            csv.push([
                sprint.name,
                `${utils.formatDate(sprint.startDate)} - ${utils.formatDate(sprint.endDate)}`,
                workingDays,
                absenceDays,
                availableDays
            ]);
        });
        
        // Скачиваем файл
        const csvString = csv.map(row => 
            row.map(cell => `"${cell || ''}"`).join(',')
        ).join('\n');
        
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `employee_${employee.fullName}_report.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        utils.showMessage('message', `✅ Отчет по сотруднику "${employee.fullName}" сохранен`, 'success');
        
    } catch (error) {
        console.error('❌ Ошибка экспорта:', error);
        utils.showMessage('message', 'Ошибка экспорта отчета', 'error');
    }
}

// Вспомогательные функции для расчета
function calculateWorkingDaysInSprint(sprint) {
    let days = 0;
    let current = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    
    while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            days++;
        }
        current.setDate(current.getDate() + 1);
    }
    return days;
}

function calculateAbsenceDaysInSprint(absences, sprint) {
    let days = 0;
    const sprintStart = new Date(sprint.startDate);
    const sprintEnd = new Date(sprint.endDate);
    
    absences.forEach(absence => {
        const absenceStart = new Date(absence.startDate);
        const absenceEnd = new Date(absence.endDate);
        
        if (absenceEnd >= sprintStart && absenceStart <= sprintEnd) {
            const start = absenceStart < sprintStart ? sprintStart : absenceStart;
            const end = absenceEnd > sprintEnd ? sprintEnd : absenceEnd;
            
            let current = new Date(start);
            while (current <= end) {
                const dayOfWeek = current.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    days++;
                }
                current.setDate(current.getDate() + 1);
            }
        }
    });
    
    return days;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Вызываем проверку при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkUpcomingAbsences, 2000);
});

// Сменить страницу
function changePage(page) {
    if (page < 1) return;
    const totalPages = Math.ceil(allEmployees.length / itemsPerPage);
    if (page > totalPages) return;
    
    currentPage = page;
    applyFilters();
}