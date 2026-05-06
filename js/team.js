// ======================================
// team.js - Логика главной страницы
// ======================================

console.log("📁 team.js загружен");

// Текущая выбранная команда
let currentTeamId = null;

// Проверка авторизации при загрузке
document.addEventListener('DOMContentLoaded', async () => {  
    console.log("🚀 init auth");

    const ok = await auth.init();

    if (!ok) {
        auth.logout();
        return;
    }

    // 👉 ТОЛЬКО ПОСЛЕ ЭТОГО ДЕЛАЕМ ЗАПРОСЫ
    const me = await api.request('/api/auth/me');

    console.log('✅ Пользователь проверен');

    console.log("✅ DOM загружен");
    
    // Проверяем зависимости
    console.log("📦 Проверка зависимостей:");
    console.log("   - api:", typeof api !== 'undefined' ? '✅' : '❌');
    console.log("   - auth:", typeof auth !== 'undefined' ? '✅' : '❌');
    console.log("   - utils:", typeof utils !== 'undefined' ? '✅' : '❌');
    
    
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

        const meRes = await api.me();

        if (!meRes.success) {
            auth.logout();
            return;
        }

        const user = meRes.user;
        const userId = user.id;

        const teams = await api.getTeams();

        // ✅ используем userId, а не auth.getUserId()
        const userTeams = teams.filter(t =>
            String(t.ownerId) === String(userId)
        );

        console.log(`📋 Загружено команд: ${userTeams.length}`);

        const select = document.getElementById('teamSelect');
        select.innerHTML = '<option value="">-- Выберите команду --</option>';

        userTeams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            select.appendChild(option);
        });

        const lastTeamId = localStorage.getItem('lastTeamId');

        if (lastTeamId && userTeams.some(t => String(t.id) === String(lastTeamId))) {
            select.value = lastTeamId;
            await loadTeamData();
        }

        utils.showMessage('message', '', 'info');

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
        
        const userId = (await api.me()).user.id;
        
        const newTeam = await api.createTeam({
            name: teamName,
            userId: userId
        });
        
        console.log("✅ Команда создана:", newTeam);
        
        hideCreateTeamForm();
        await loadTeams();
        
        const select = document.getElementById('teamSelect');
        select.value = newTeam.id;
        await loadTeamData();
        
        utils.showMessage('message', 'Команда создана!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка создания команды:', error);
        utils.showMessage('message', 'Ошибка создания команды: ' + error.message, 'error');
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
    // Сначала загружаем отсутствия для статусов
    window.currentAbsencesMap = await loadAbsencesForStatus();
    await loadEmployees();
    await loadAbsences();
}

// Отобразить сотрудников в таблице
function displayEmployeesTable(employees) {
    const tbody = document.getElementById('employeesList');
    
    if (!employees || employees.length === 0) {
        const searchText = document.getElementById('searchEmployee')?.value;
        const filterRole = document.getElementById('filterRole')?.value;
        
        let message = 'Нет сотрудников';
        if (searchText || filterRole) {
            message = 'Нет сотрудников, соответствующих критериям поиска';
        }
        
        tbody.innerHTML = '<td colspan="5" class="text-center">👥 Нет сотрудников</td>';
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
        const employees = await api.getEmployees(currentTeamId);
        
        console.log(`📋 Загружено отсутствий: ${absences.length}`);
        
        // ИСПРАВЬТЕ ЗДЕСЬ: displayAbsencesTable -> displayAbsences
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
        tbody.innerHTML = '<td colspan="6" class="text-center">📋 Нет данных об отсутствиях</td></tr>';
        return;
    }
    
    const employeeMap = {};
    employees.forEach(emp => employeeMap[emp.id] = emp);
    
    let html = '';
    absences.forEach(absence => {
        const employee = employeeMap[absence.employeeId];
        const employeeName = employee ? employee.fullName : 'Неизвестный сотрудник';
        const days = calculateDays(absence.startDate, absence.endDate);
        
        html += `
            <tr>
                <td>${employeeName}</td>
                <td>${utils.getAbsenceTypeName(absence.type)}</td>
                <td>${utils.formatDate(absence.startDate)} - ${utils.formatDate(absence.endDate)}</td>
                <td>${days} дн.</td>
                <td>${absence.note || '-'}</td>
                <td>
                    <button class="btn btn-small btn-edit" onclick="editAbsence('${absence.id}')">✏️</button>
                    <button class="btn btn-small btn-danger" onclick="deleteAbsence('${absence.id}')">🗑️</button>
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
    if (!currentTeamId) {
        console.log("❌ currentTeamId не определен");
        return;
    }
    
    try {
        console.log(`📋 Загрузка сотрудников для селекта команды ${currentTeamId}`);
        
        const employees = await api.getEmployees(currentTeamId);
        console.log(`📋 Загружено сотрудников: ${employees.length}`);
        
        const select = document.getElementById('absenceEmployee');
        if (!select) {
            console.log("❌ Элемент absenceEmployee не найден");
            return;
        }
        
        select.innerHTML = '<option value="">-- Выберите сотрудника --</option>';
        
        // Только работающие сотрудники (без даты увольнения)
        const activeEmployees = employees.filter(emp => !emp.fireDate);
        
        if (activeEmployees.length === 0) {
            select.innerHTML = '<option value="">-- Нет активных сотрудников --</option>';
            return;
        }
        
        activeEmployees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = `${emp.fullName} (${utils.getRoleName(emp.role)})`;
            select.appendChild(option);
        });
        
        console.log(`✅ Загружено ${activeEmployees.length} активных сотрудников`);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки сотрудников для селекта:', error);
        console.error('❌ Детали:', error.message);
        const select = document.getElementById('absenceEmployee');
        if (select) {
            select.innerHTML = '<option value="">-- Ошибка загрузки --</option>';
        }
    }
}

// Добавить отсутствие
async function addAbsence() {
    // Надёжное получение полей (обязательно приводим к строке)
    const employeeId = String(document.getElementById('absenceEmployee')?.value ?? '');
    const type = String(document.getElementById('absenceType')?.value ?? '');
    const startDate = String(document.getElementById('absenceStart')?.value ?? '');
    const endDate = String(document.getElementById('absenceEnd')?.value ?? '');
    const note = String(document.getElementById('absenceNote')?.value ?? '').trim();

    console.log("📋 Добавление отсутствия:", { employeeId, type, startDate, endDate, note });

    // Проверка обязательных полей
    if (!employeeId) {
        alert('Выберите сотрудника из списка');
        return;
    }
    if (!currentTeamId) {
        alert('Не выбрана команда – обновите страницу');
        return;
    }
    if (!type) {
        alert('Выберите тип отсутствия');
        return;
    }
    if (!startDate || !endDate) {
        alert('Укажите даты начала и окончания');
        return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        alert('Дата начала не может быть позже даты окончания');
        return;
    }

    try {
        utils.showMessage('message', 'Добавление отсутствия...', 'info');

        const addBtn = document.getElementById('addAbsenceBtn');
        const originalText = addBtn.textContent;
        addBtn.textContent = '⏳ Сохранение...';
        addBtn.disabled = true;

        // 👇 Передаём teamId и employeeId
        const result = await api.addAbsence({
            teamId: currentTeamId,
            employeeId: employeeId,
            type: type,
            startDate: startDate,
            endDate: endDate,
            note: note
        });

        console.log("✅ Результат:", result);

        hideAddAbsenceForm();
        await loadAbsences();
        // Обновляем карту отсутствий для статусов
        window.currentAbsencesMap = await loadAbsencesForStatus();
        await loadEmployees();

        utils.showMessage('message', '✅ Отсутствие добавлено!', 'success');
    } catch (error) {
        console.error('❌ Ошибка добавления отсутствия:', error);
        utils.showMessage('message', '❌ Ошибка: ' + error.message, 'error');
    } finally {
        const addBtn = document.getElementById('addAbsenceBtn');
        if (addBtn) {
            addBtn.textContent = 'Сохранить';
            addBtn.disabled = false;
        }
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
    try {
        const absences = await api.getAbsences(currentTeamId);
        const absence = absences.find(a => a.id === id);
        
        if (!absence) {
            utils.showMessage('message', 'Запись не найдена', 'error');
            return;
        }
        
        document.getElementById('editAbsenceId').value = absence.id;
        document.getElementById('editAbsenceType').value = absence.type;
        document.getElementById('editAbsenceStart').value = absence.startDate;
        document.getElementById('editAbsenceEnd').value = absence.endDate;
        document.getElementById('editAbsenceNote').value = absence.note || '';
        
        const employees = await api.getEmployees(currentTeamId);
        const select = document.getElementById('editAbsenceEmployee');
        select.innerHTML = '';
        employees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = `${emp.fullName} (${utils.getRoleName(emp.role)})`;
            if (emp.id === absence.employeeId) option.selected = true;
            select.appendChild(option);
        });
        
        // Скрываем форму добавления, показываем форму редактирования
        document.getElementById('addAbsenceForm').style.display = 'none';
        document.getElementById('editAbsenceForm').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        utils.showMessage('message', 'Ошибка загрузки', 'error');
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
    await api.updateAbsence(id, {
        employeeId: document.getElementById('editAbsenceEmployee').value,
        type: document.getElementById('editAbsenceType').value,
        startDate: document.getElementById('editAbsenceStart').value,
        endDate: document.getElementById('editAbsenceEnd').value,
        note: document.getElementById('editAbsenceNote').value
    });
    hideEditAbsenceForm();
    window.currentAbsencesMap = await loadAbsencesForStatus();
    await loadAbsences();
    await loadEmployees();
}

function hideEditAbsenceForm() {
    document.getElementById('editAbsenceForm').style.display = 'none';
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
        
        tbody.innerHTML = `<td colspan="5" class="text-center">${message}</td> </tr>`;
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


// Вызываем проверку при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkUpcomingAbsences, 2000);
});
