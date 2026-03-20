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

// ===== РАБОТА С СОТРУДНИКАМИ =====

// Загрузить данные выбранной команды
async function loadTeamData() {
    const select = document.getElementById('teamSelect');
    currentTeamId = select.value;
    
    if (!currentTeamId) {
        document.getElementById('employeeSection').style.display = 'none';
        return;
    }
    
    console.log(`📋 Загрузка данных команды: ${currentTeamId}`);
    
    localStorage.setItem('lastTeamId', currentTeamId);
    document.getElementById('employeeSection').style.display = 'block';
    
    await loadEmployees();
    await loadAbsences(); // Добавлено!
}

// Загрузить сотрудников команды
async function loadEmployees() {
    if (!currentTeamId) return;
    
    try {
        console.log(`📋 Загрузка сотрудников команды ${currentTeamId}`);
        
        const employees = await api.getEmployees(currentTeamId);
        console.log(`📋 Загружено сотрудников: ${employees.length}`);
        
        // Передаем employees в displayEmployees
        displayEmployees(employees);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки сотрудников:', error);
        utils.showMessage('message', 'Ошибка загрузки сотрудников', 'error');
    }
}

// Отобразить сотрудников в таблице
function displayEmployees(employees) {
    const tbody = document.getElementById('employeesList');
    
    if (!employees || employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Нет сотрудников</td></tr>';
        return;
    }
    
    // Загружаем отсутствия для определения статуса
    loadAbsencesForStatus().then(absencesMap => {
        let html = '';
        employees.forEach(emp => {
            // Получаем статус сотрудника с учетом отсутствий
            const status = getEmployeeCurrentStatus(emp, absencesMap[emp.id] || []);
            const statusClass = status.class;
            const statusText = status.text;
            
            html += `
                <tr>
                    <td>${emp.fullName}</td>
                    <td>${utils.getRoleName(emp.role)}</td>
                    <td>${utils.formatDate(emp.hireDate)}</td>
                    <td><span class="${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-small btn-edit" onclick="editEmployee('${emp.id}')" title="Редактировать">✏️</button>
                        <button class="btn btn-small btn-danger" onclick="deleteEmployee('${emp.id}')" title="Удалить">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }).catch(error => {
        console.error('❌ Ошибка загрузки отсутствий для статусов:', error);
        
        // Если ошибка, показываем без учета отсутствий
        let html = '';
        employees.forEach(emp => {
            const status = emp.fireDate ? 'Уволен' : 'Работает';
            const statusClass = emp.fireDate ? 'status-fired' : 'status-active';
            
            html += `
                <tr>
                    <td>${emp.fullName}</td>
                    <td>${utils.getRoleName(emp.role)}</td>
                    <td>${utils.formatDate(emp.hireDate)}</td>
                    <td><span class="${statusClass}">${status}</span></td>
                    <td>
                        <button class="btn btn-small btn-edit" onclick="editEmployee('${emp.id}')" title="Редактировать">✏️</button>
                        <button class="btn btn-small btn-danger" onclick="deleteEmployee('${emp.id}')" title="Удалить">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    });
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
        const employees = await api.getEmployees(currentTeamId);
        
        console.log(`📋 Загружено отсутствий: ${absences.length}`);
        
        displayAbsences(absences, employees);
        
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
            <tr>
                <td>${employeeName}</td>
                <td><span class="${typeClass}">${utils.getAbsenceTypeName(absence.type)}</span></td>
                <td>${utils.formatDate(absence.startDate)} - ${utils.formatDate(absence.endDate)}</td>
                <td>${days} дн.</td>
                <td>${absence.note || '-'}</td>
                <td>
                    <button class="btn btn-small btn-edit" onclick="editAbsence('${absence.id}')" title="Редактировать">✏️</button>
                    <button class="btn btn-small btn-danger" onclick="deleteAbsence('${absence.id}')" title="Удалить">🗑️</button>
                </td>
            </tr>
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
function getEmployeeCurrentStatus(employee, absences) {
    const today = new Date().toISOString().split('T')[0];
    
    // Если есть дата увольнения и она прошла
    if (employee.fireDate && employee.fireDate <= today) {
        return {
            text: 'Уволен',
            class: 'status-fired'
        };
    }
    
    // Проверяем текущие отсутствия
    for (const absence of absences) {
        if (absence.startDate <= today && absence.endDate >= today) {
            // Сотрудник сейчас в отпуске или на больничном
            let statusText = '';
            switch (absence.type) {
                case 'vacation':
                    statusText = 'В отпуске';
                    break;
                case 'sick':
                    statusText = 'На больничном';
                    break;
                case 'dayoff':
                    statusText = 'Отгул';
                    break;
                case 'business':
                    statusText = 'В командировке';
                    break;
                default:
                    statusText = 'Отсутствует';
            }
            
            return {
                text: statusText,
                class: `status-${absence.type}`
            };
        }
    }
    
    // Проверяем будущие отсутствия
    for (const absence of absences) {
        if (absence.startDate > today) {
            const startDate = utils.formatDate(absence.startDate);
            let statusText = '';
            switch (absence.type) {
                case 'vacation':
                    statusText = `Отпуск с ${startDate}`;
                    break;
                case 'sick':
                    statusText = `Больничный с ${startDate}`;
                    break;
                case 'dayoff':
                    statusText = `Отгул с ${startDate}`;
                    break;
                case 'business':
                    statusText = `Командировка с ${startDate}`;
                    break;
            }
            
            return {
                text: statusText,
                class: `status-${absence.type}-future`
            };
        }
    }
    
    // Если ничего не нашли, сотрудник работает
    return {
        text: 'Работает',
        class: 'status-active'
    };
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

let allEmployees = []; // Храним всех сотрудников для фильтрации

// Загрузить сотрудников (обновленная версия)
async function loadEmployees() {
    if (!currentTeamId) return;
    
    try {
        console.log(`📋 Загрузка сотрудников команды ${currentTeamId}`);
        
        const employees = await api.getEmployees(currentTeamId);
        allEmployees = employees; // Сохраняем всех сотрудников
        console.log(`📋 Загружено сотрудников: ${employees.length}`);
        
        // Применяем текущие фильтры
        applyFilters();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки сотрудников:', error);
        utils.showMessage('message', 'Ошибка загрузки сотрудников', 'error');
    }
}

// Применить фильтры
function applyFilters() {
    const searchText = document.getElementById('searchEmployee')?.value.toLowerCase() || '';
    const filterRole = document.getElementById('filterRole')?.value || '';
    
    let filteredEmployees = [...allEmployees];
    
    // Фильтр по имени
    if (searchText) {
        filteredEmployees = filteredEmployees.filter(emp => 
            emp.fullName.toLowerCase().includes(searchText)
        );
    }
    
    // Фильтр по роли
    if (filterRole) {
        filteredEmployees = filteredEmployees.filter(emp => emp.role === filterRole);
    }
    
    // Обновляем отображение
    displayEmployees(filteredEmployees);
    
    // Показываем количество найденных
    const countSpan = document.getElementById('employeesCount');
    if (countSpan) {
        countSpan.textContent = `${filteredEmployees.length} из ${allEmployees.length}`;
    }
}

// Добавить обработчики фильтров
function setupFilterListeners() {
    const searchInput = document.getElementById('searchEmployee');
    const filterRole = document.getElementById('filterRole');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => applyFilters());
    }
    
    if (filterRole) {
        filterRole.addEventListener('change', () => applyFilters());
    }
}

// ===== ПАГИНАЦИЯ =====
let currentPage = 1;
const itemsPerPage = 10;

// Отобразить сотрудников с пагинацией
function displayEmployeesPaginated(employees) {
    const totalPages = Math.ceil(employees.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageEmployees = employees.slice(start, end);
    
    displayEmployees(pageEmployees);
    updatePaginationControls(totalPages);
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
        <span class="page-info">Страница ${currentPage} из ${totalPages}</span>
        <button class="btn-pagination" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Вперед →
        </button>
    `;
    
    container.innerHTML = html;
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