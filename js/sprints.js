// ======================================
// sprints.js - Логика страницы настроек спринтов
// ======================================

console.log("📁 sprints.js загружен");

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
        return;
    }
    
    // Загружаем команды пользователя
    await loadUserTeams();
    
    // Навешиваем обработчики
    setupEventListeners();
    
    // ===== ШАГ 5: ПРОВЕРКА КНОПКИ ЧЕРЕЗ 1 СЕКУНДУ =====
    setTimeout(() => {
        const btn = document.getElementById('generateSprintsBtn');
        if (btn) {
            console.log("✅ Кнопка существует, текст:", btn.textContent);
            console.log("✅ Кнопка доступна:", !btn.disabled);
            console.log("✅ Кнопка стили:", btn.className);
        } else {
            console.log("❌❌❌ Кнопка НЕ существует! Проверьте id='generateSprintsBtn' в sprints.html");
            
            // Дополнительная диагностика
            const allButtons = document.querySelectorAll('button');
            console.log("📋 Все кнопки на странице:");
            allButtons.forEach((b, i) => {
                console.log(`   Кнопка ${i}: id="${b.id}", текст="${b.textContent}"`);
            });
        }
    }, 1000); // Проверка через 1 секунду после загрузки
});

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
    } else {
        console.log("❌ logoutBtn не найден");
    }
    
    // Выбор команды
    const teamSelect = document.getElementById('teamSelect');
    if (teamSelect) {
        teamSelect.addEventListener('change', loadSprintSettings);
        console.log("✅ teamSelect обработчик навешен");
    } else {
        console.log("❌ teamSelect не найден");
    }
    
    // Сохранение настроек
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSprintSettings);
        console.log("✅ saveSettingsBtn обработчик навешен");
    } else {
        console.log("❌ saveSettingsBtn не найден");
    }
    
    // ===== ВАЖНО: КНОПКА ГЕНЕРАЦИИ =====
    const generateBtn = document.getElementById('generateSprintsBtn');
    if (generateBtn) {
        console.log("✅ generateSprintsBtn НАЙДЕН! Навешиваем обработчик");
        
        // Удаляем старые обработчики, если есть
        generateBtn.removeEventListener('click', generateSprints);
        
        // Добавляем новый обработчик
        generateBtn.addEventListener('click', generateSprints);
        
        // Проверяем, что кнопка активна
        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
        generateBtn.style.pointerEvents = 'auto';
        
        console.log("✅ generateSprintsBtn обработчик навешен, кнопка активна");
    } else {
        console.log("❌❌❌ generateSprintsBtn НЕ НАЙДЕН! Проверьте id в HTML");
    }
    
    // Добавление праздника
    const addHolidayBtn = document.getElementById('addHolidayBtn');
    if (addHolidayBtn) {
        addHolidayBtn.addEventListener('click', showAddHolidayForm);
        console.log("✅ addHolidayBtn обработчик навешен");
    } else {
        console.log("❌ addHolidayBtn не найден");
    }
    
    // Отмена добавления праздника
    const cancelHolidayBtn = document.getElementById('cancelHolidayBtn');
    if (cancelHolidayBtn) {
        cancelHolidayBtn.addEventListener('click', hideAddHolidayForm);
    }
    
    // Сохранение праздника
    const saveHolidayBtn = document.getElementById('saveHolidayBtn');
    if (saveHolidayBtn) {
        saveHolidayBtn.addEventListener('click', addHoliday);
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
            await loadSprintSettings();
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки команд:', error);
        utils.showMessage('message', 'Ошибка загрузки команд', 'error');
    }
}

// Загрузить настройки спринтов
async function loadSprintSettings() {
    const select = document.getElementById('teamSelect');
    currentTeamId = select.value;
    
    if (!currentTeamId) {
        document.getElementById('settingsSection').style.display = 'none';
        return;
    }
    
    console.log(`📋 Загрузка настроек для команды: ${currentTeamId}`);
    
    localStorage.setItem('lastTeamId', currentTeamId);
    document.getElementById('settingsSection').style.display = 'block';
    
    try {
        // Загружаем настройки из БД
        const settings = await api.getSettings(currentTeamId);
        
        if (settings) {
            document.getElementById('sprintDuration').value = settings.duration || 14;
            document.getElementById('firstSprintStart').value = settings.firstStart || getDefaultStartDate();
            document.getElementById('sprintCoefficient').value = settings.coefficient || 1.0;
        } else {
            // Значения по умолчанию
            document.getElementById('sprintDuration').value = 14;
            document.getElementById('firstSprintStart').value = getDefaultStartDate();
            document.getElementById('sprintCoefficient').value = 1.0;
        }
        
        // Загружаем список спринтов
        await loadSprintsList();
        
        // Загружаем праздники
        await loadHolidays();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки настроек:', error);
        utils.showMessage('message', 'Ошибка загрузки настроек', 'error');
    }
}

// Получить дату начала по умолчанию (ближайший понедельник)
function getDefaultStartDate() {
    const date = new Date();
    const day = date.getDay(); // 0 - вс, 1 - пн, 2 - вт, ...
    
    // Если сегодня не понедельник, переходим на следующий понедельник
    if (day !== 1) {
        const daysToAdd = day === 0 ? 1 : 8 - day;
        date.setDate(date.getDate() + daysToAdd);
    }
    
    return date.toISOString().split('T')[0];
}

// Загрузить список спринтов
async function loadSprintsList() {
    if (!currentTeamId) return;
    
    try {
        console.log(`📋 Загрузка спринтов для команды ${currentTeamId}`);
        
        const sprints = await api.getSprints(currentTeamId);
        const tbody = document.getElementById('sprintsList');
        
        if (!sprints || sprints.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Нет сгенерированных спринтов</td></tr>';
            return;
        }
        
        // Сортируем спринты по дате начала
        sprints.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        let html = '';
        sprints.forEach(sprint => {
            const workingDays = sprint.workingDays ? sprint.workingDays : 'Не рассчитано';
            html += `
                <tr>
                    <td>${sprint.name}</td>
                    <td>${utils.formatDate(sprint.startDate)}</td>
                    <td>${utils.formatDate(sprint.endDate)}</td>
                    <td>${workingDays}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки спринтов:', error);
    }
}

// Сохранить настройки спринтов
async function saveSprintSettings() {
    const duration = document.getElementById('sprintDuration').value;
    const firstStart = document.getElementById('firstSprintStart').value;
    const coefficient = document.getElementById('sprintCoefficient').value;
    
    if (!duration || !firstStart || !coefficient) {
        utils.showMessage('message', 'Заполните все поля', 'error');
        return;
    }
    
    if (duration < 1 || duration > 30) {
        utils.showMessage('message', 'Длительность спринта должна быть от 1 до 30 дней', 'error');
        return;
    }
    
    if (coefficient < 0.1 || coefficient > 1) {
        utils.showMessage('message', 'Коэффициент должен быть от 0.1 до 1', 'error');
        return;
    }
    
    try {
        console.log("📋 Сохранение настроек спринтов");
        utils.showMessage('message', 'Сохранение...', 'info');
        
        await api.saveSettings(currentTeamId, {
            duration: parseInt(duration),
            firstStart: firstStart,
            coefficient: parseFloat(coefficient)
        });
        
        utils.showMessage('message', 'Настройки сохранены!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка сохранения настроек:', error);
        utils.showMessage('message', 'Ошибка сохранения', 'error');
    }
}

// Генерировать спринты
async function generateSprints() {
    console.log("🟢🟢🟢 generateSprints ВЫЗВАНА! 🟢🟢🟢");
    
    // Проверяем, что кнопка не заблокирована
    const generateBtn = document.getElementById('generateSprintsBtn');
    if (generateBtn && generateBtn.disabled) {
        console.log("⏳ Кнопка заблокирована, возможно уже идет генерация");
        return;
    }
    
    if (!currentTeamId) {
        console.log("❌ currentTeamId не выбран");
        utils.showMessage('message', 'Сначала выберите команду', 'error');
        return;
    }
    
    const duration = parseInt(document.getElementById('sprintDuration').value);
    const firstStart = document.getElementById('firstSprintStart').value;
    
    console.log("📋 Параметры:", { duration, firstStart, currentTeamId });
    
    if (!duration || !firstStart) {
        console.log("❌ Не заполнены поля");
        utils.showMessage('message', 'Заполните все поля', 'error');
        return;
    }
    
    // Подтверждение
    if (!confirm(`Сгенерировать спринты длительностью ${duration} дней, начиная с ${firstStart}?`)) {
        return;
    }
    
    try {
        utils.showMessage('message', 'Генерация спринтов...', 'info');
        
        // Блокируем кнопку
        if (generateBtn) {
            generateBtn.textContent = '⏳ Генерация...';
            generateBtn.disabled = true;
            generateBtn.style.opacity = '0.7';
            generateBtn.style.cursor = 'not-allowed';
        }
        
        // 1. Генерируем спринты
        console.log("📡 Шаг 1: Генерация спринтов");
        const result = await api.generateSprints(currentTeamId, {
            duration: duration,
            firstStart: firstStart
        });
        
        console.log(`✅ Сгенерировано ${result.length} спринтов`);
        
        // 2. Рассчитываем рабочие дни
        console.log("📡 Шаг 2: Расчет рабочих дней");
        await api.calculateWorkingDays(currentTeamId);
        
        // 3. Загружаем обновленный список
        console.log("📡 Шаг 3: Загрузка списка");
        await loadSprintsList();
        
        // Разблокируем кнопку
        if (generateBtn) {
            generateBtn.textContent = 'Сгенерировать спринты';
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
            generateBtn.style.cursor = 'pointer';
        }
        
        utils.showMessage('message', `✅ Сгенерировано ${result.length} спринтов с расчетом рабочих дней!`, 'success');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        utils.showMessage('message', '❌ Ошибка: ' + error.message, 'error');
        
        // Разблокируем кнопку в случае ошибки
        const generateBtn = document.getElementById('generateSprintsBtn');
        if (generateBtn) {
            generateBtn.textContent = 'Сгенерировать спринты';
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
            generateBtn.style.cursor = 'pointer';
        }
    }
}
// ===== ПРОИЗВОДСТВЕННЫЙ КАЛЕНДАРЬ =====

// Загрузить праздники
async function loadHolidays() {
    if (!currentTeamId) return;
    
    try {
        console.log(`📋 Загрузка праздников для команды ${currentTeamId}`);
        
        const holidays = await api.getHolidays(currentTeamId);
        const tbody = document.getElementById('holidaysList');
        
        if (!holidays || holidays.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">Нет праздничных дней</td></tr>';
            return;
        }
        
        let html = '';
        holidays.forEach(holiday => {
            html += `
                <tr>
                    <td>${utils.formatDate(holiday.date)}</td>
                    <td>${holiday.name || 'Праздник'}</td>
                    <td>
                        <button class="btn btn-small btn-danger" onclick="deleteHoliday('${holiday.id}')" title="Удалить">✕</button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки праздников:', error);
    }
}

// Показать форму добавления праздника
function showAddHolidayForm() {
    console.log("📋 Показ формы добавления праздника");
    
    // Устанавливаем сегодняшнюю дату
    document.getElementById('holidayDate').value = utils.getTodayString();
    
    document.getElementById('addHolidayForm').style.display = 'block';
}

// Скрыть форму добавления праздника
function hideAddHolidayForm() {
    console.log("📋 Скрытие формы добавления праздника");
    document.getElementById('addHolidayForm').style.display = 'none';
    document.getElementById('holidayName').value = '';
}

// Добавить праздник
async function addHoliday() {
    const date = document.getElementById('holidayDate').value;
    const name = document.getElementById('holidayName').value.trim();
    
    if (!date) {
        utils.showMessage('message', 'Выберите дату', 'error');
        return;
    }
    
    try {
        console.log("📋 Добавление праздника:", { date, name });
        utils.showMessage('message', 'Добавление...', 'info');
        
        await api.addHoliday(currentTeamId, {
            date: date,
            name: name || 'Праздник'
        });
        
        hideAddHolidayForm();
        await loadHolidays();
        
        utils.showMessage('message', 'Праздник добавлен!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка добавления праздника:', error);
        utils.showMessage('message', 'Ошибка добавления', 'error');
    }
}

// Удалить праздник
async function deleteHoliday(id) {
    if (!confirm('Удалить этот праздничный день?')) return;
    
    try {
        console.log(`📋 Удаление праздника: ${id}`);
        utils.showMessage('message', 'Удаление...', 'info');
        
        await api.deleteHoliday(id);
        await loadHolidays();
        
        utils.showMessage('message', 'Праздник удален', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка удаления праздника:', error);
        utils.showMessage('message', 'Ошибка удаления', 'error');
    }
}

// Генерировать спринты
async function generateSprints() {
    console.log("🟢 generateSprints вызвана!");
    
    if (!currentTeamId) {
        utils.showMessage('message', 'Сначала выберите команду', 'error');
        return;
    }
    
    const duration = parseInt(document.getElementById('sprintDuration').value);
    const firstStart = document.getElementById('firstSprintStart').value;
    
    console.log("📋 Параметры:", { duration, firstStart, currentTeamId });
    
    if (!duration || !firstStart) {
        utils.showMessage('message', 'Заполните все поля', 'error');
        return;
    }
    
    // Подтверждение
    if (!confirm(`Сгенерировать спринты длительностью ${duration} дней, начиная с ${firstStart}?`)) {
        return;
    }
    
    try {
        utils.showMessage('message', 'Генерация спринтов...', 'info');
        
        const generateBtn = document.getElementById('generateSprintsBtn');
        const originalText = generateBtn.textContent;
        generateBtn.textContent = 'Генерация...';
        generateBtn.disabled = true;
        
        // 1. Генерируем спринты
        console.log("📡 Шаг 1: Генерация спринтов");
        const result = await api.generateSprints(currentTeamId, {
            duration: duration,
            firstStart: firstStart
        });
        
        console.log(`✅ Сгенерировано ${result.length} спринтов`);
        
        // 2. Рассчитываем рабочие дни
        console.log("📡 Шаг 2: Расчет рабочих дней");
        await api.calculateWorkingDays(currentTeamId);
        
        // 3. Загружаем обновленный список
        console.log("📡 Шаг 3: Загрузка списка");
        await loadSprintsList();
        
        generateBtn.textContent = originalText;
        generateBtn.disabled = false;
        
        utils.showMessage('message', `Сгенерировано ${result.length} спринтов с расчетом рабочих дней!`, 'success');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        utils.showMessage('message', 'Ошибка: ' + error.message, 'error');
        
        const generateBtn = document.getElementById('generateSprintsBtn');
        if (generateBtn) {
            generateBtn.textContent = 'Сгенерировать спринты';
            generateBtn.disabled = false;
        }
    }
}
