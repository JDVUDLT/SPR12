// ===== ПОДКЛЮЧАЕМ ЗАВИСИМОСТИ =====
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const app = express();

// ===== MIDDLEWARE =====
app.use(express.json()); 
app.use(express.static(path.join(__dirname))); 
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// ===== МАРШРУТЫ ДЛЯ СТРАНИЦ =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/sprints', (req, res) => {
    res.sendFile(path.join(__dirname, 'sprints.html'));
});

// ===== API МАРШРУТЫ =====

// РЕГИСТРАЦИЯ - теперь используем app, а не server!
app.post("/sendDataRegistration", async (req, res) => {
    console.log("🔥 ПОЛУЧЕН ЗАПРОС НА РЕГИСТРАЦИЮ:");
    console.log("Тело запроса:", req.body);
    
    try {
        const { name, log, email, pass } = req.body;
        
        // Проверяем обязательные поля
        if (!name || !log || !pass) {
            console.log("❌ Ошибка: не все поля заполнены");
            return res.json({ 
                msg: "Все поля обязательны",
                success: false 
            });
        }
        
        // Читаем пользователей
        let users = [];
        try {
            users = await fs.readJSON("Users.json");
            console.log(`📖 Загружено ${users.length} пользователей`);
        } catch (error) {
            console.log("📁 Файл Users.json не найден, создаем новый");
            users = [];
        }
        
        // Проверяем, существует ли пользователь
        const existingUser = users.find(u => u.log === log);
        if (existingUser) {
            console.log("❌ Пользователь уже существует:", log);
            return res.json({ 
                msg: "Такой пользователь существует",
                success: false 
            });
        }
        
        // Создаем нового пользователя
        const newUser = {
            id: Date.now().toString(),
            name: name,
            log: log,
            email: email || '',
            pass: pass,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        await fs.writeJSON("Users.json", users, { spaces: 4 });
        console.log("✅ Пользователь сохранен:", newUser.log);
        
        // Отправляем успешный ответ
        res.json({
            success: true,
            user: {
                id: newUser.id,
                name: newUser.name,
                log: newUser.log,
                email: newUser.email
            }
        });
        
    } catch (error) {
        console.error("❌ КРИТИЧЕСКАЯ ОШИБКА:", error);
        res.status(500).json({ 
            msg: "Ошибка сервера: " + error.message,
            success: false 
        });
    }
});

// ВХОД
app.post("/sendDataLogin", async (req, res) => {
    console.log("🔐 ПОЛУЧЕН ЗАПРОС НА ВХОД");
    console.log("📦 Тело запроса:", req.body);
    
    try {
        const { log, pass } = req.body;
        
        if (!log || !pass) {
            return res.json({ success: false, msg: "Логин и пароль обязательны" });
        }
        
        // Проверяем существование файла
        if (!await fs.pathExists("Users.json")) {
            await fs.writeJSON("Users.json", []);
            console.log("📁 Создан Users.json");
        }
        
        const users = await fs.readJSON("Users.json");
        console.log(`📋 В файле ${users.length} пользователей`);
        
        const user = users.find(u => u.log === log && u.pass === pass);
        
        if (user) {
            console.log(`✅ Успешный вход: ${log}`);
            res.json({
                success: true,
                msg: "Вы успешно вошли",
                user: { id: user.id, name: user.name, log: user.log, email: user.email }
            });
        } else {
            console.log(`❌ Неудачный вход: ${log}`);
            res.json({ success: false, msg: "Неверный логин или пароль" });
        }
        
    } catch (error) {
        console.error("❌ Ошибка:", error);
        res.json({ success: false, msg: "Ошибка сервера: " + error.message });
    }
});

// ===== КОМАНДЫ =====

app.get('/api/teams', async (req, res) => {
    console.log("📋 Запрос списка команд");
    
    try {
        // Проверяем существование файла
        if (!await fs.pathExists('teams.json')) {
            await fs.writeJSON('teams.json', []);
        }
        
        const teams = await fs.readJSON('teams.json');
        console.log(`📋 Загружено команд: ${teams.length}`);
        res.json(teams);
        
    } catch (error) {
        console.error("❌ Ошибка:", error);
        res.status(500).json({ error: error.message });
    }
});

// Создать новую команду
app.post('/api/teams', async (req, res) => {
    console.log("📋 POST /api/teams вызван");
    console.log("📦 Тело запроса:", req.body);
    
    try {
        const { name, userId } = req.body;
        
        if (!name || !userId) {
            console.log("❌ Ошибка: нет name или userId");
            return res.status(400).json({ error: "Название команды и ID пользователя обязательны" });
        }
        
        // Проверяем существование файла
        if (!await fs.pathExists('teams.json')) {
            await fs.writeJSON('teams.json', []);
        }
        
        const teams = await fs.readJSON('teams.json');
        
        const newTeam = {
            id: Date.now().toString(),
            name: name,
            ownerId: userId,
            createdAt: new Date().toISOString()
        };
        
        teams.push(newTeam);
        await fs.writeJSON('teams.json', teams, { spaces: 4 });
        
        console.log("✅ Команда создана:", newTeam);
        res.json(newTeam);
        
    } catch (error) {
        console.error("❌ Ошибка создания команды:", error);
        res.status(500).json({ error: error.message });
    }
});

// Получить команды конкретного пользователя
app.get('/api/teams/user/:userId', async (req, res) => {
    try {
        console.log(`📋 Запрос команд пользователя: ${req.params.userId}`);
        const teams = await fs.readJSON('teams.json');
        const userTeams = teams.filter(t => t.ownerId === req.params.userId);
        res.json(userTeams);
    } catch (error) {
        console.error("❌ Ошибка получения команд пользователя:", error);
        res.status(500).json({ error: error.message });
    }
});

// ===== СОТРУДНИКИ =====

// Получить сотрудников команды
app.get('/api/employees/:teamId', async (req, res) => {
    console.log(`📋 GET /api/employees/${req.params.teamId} вызван`);
    
    try {
        const teamId = req.params.teamId;
        
        // Проверяем существование файла
        if (!await fs.pathExists('employees.json')) {
            await fs.writeJSON('employees.json', []);
            console.log("📁 Создан employees.json");
        }
        
        const employees = await fs.readJSON('employees.json');
        console.log(`📋 Всего сотрудников в файле: ${employees.length}`);
        
        const teamEmployees = employees.filter(e => e.teamId === teamId);
        console.log(`📋 Сотрудников для команды ${teamId}: ${teamEmployees.length}`);
        
        res.json(teamEmployees);
        
    } catch (error) {
        console.error("❌ Ошибка получения сотрудников:", error);
        res.status(500).json({ error: error.message });
    }
});

// Добавить сотрудника
app.post('/api/employees', async (req, res) => {
    console.log("📋 POST /api/employees вызван");
    console.log("📦 Тело запроса:", req.body);
    
    try {
        const { teamId, fullName, role, hireDate } = req.body;
        
        // Проверка обязательных полей
        if (!teamId || !fullName || !role || !hireDate) {
            console.log("❌ Отсутствуют обязательные поля");
            return res.status(400).json({ 
                error: "Все поля обязательны",
                received: { teamId, fullName, role, hireDate }
            });
        }
        
        // Проверяем существование файла
        const fs = require('fs-extra');
        const filePath = 'employees.json';
        
        if (!await fs.pathExists(filePath)) {
            await fs.writeJSON(filePath, []);
            console.log("📁 Создан файл employees.json");
        }
        
        const employees = await fs.readJSON(filePath);
        console.log(`📋 Текущее количество сотрудников: ${employees.length}`);
        
        // Создаем нового сотрудника
        const newEmployee = {
            id: Date.now().toString(),
            teamId: teamId,
            fullName: fullName,
            role: role,
            hireDate: hireDate,
            fireDate: null,
            createdAt: new Date().toISOString()
        };
        
        employees.push(newEmployee);
        await fs.writeJSON('employees.json', employees, { spaces: 4 });
        
        console.log("✅ Сотрудник добавлен:", newEmployee);
        res.json(newEmployee);
        
    } catch (error) {
        console.error("❌ Ошибка добавления сотрудника:", error);
        console.error("❌ Stack:", error.stack);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack 
        });
    }
});

// Обновить сотрудника
app.put('/api/employees/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updateData = req.body;
        
        const employees = await fs.readJSON('employees.json');
        const index = employees.findIndex(e => e.id === id);
        
        if (index === -1) {
            return res.status(404).json({ error: "Сотрудник не найден" });
        }
        
        employees[index] = { ...employees[index], ...updateData };
        await fs.writeJSON('employees.json', employees, { spaces: 4 });
        
        res.json(employees[index]);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Удалить сотрудника
app.delete('/api/employees/:id', async (req, res) => {
    try {
        console.log(`📋 Удаление сотрудника: ${req.params.id}`);
        const employees = await fs.readJSON('employees.json');
        const filtered = employees.filter(e => e.id !== req.params.id);
        
        if (filtered.length === employees.length) {
            return res.status(404).json({ error: "Сотрудник не найден" });
        }
        
        await fs.writeJSON('employees.json', filtered, { spaces: 4 });
        console.log("✅ Сотрудник удален");
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Ошибка удаления сотрудника:", error);
        res.status(500).json({ error: error.message });
    }
});

// ===== ОТСУТСТВИЯ =====

// Получить отсутствия команды
app.get('/api/absences/:teamId', async (req, res) => {
    console.log(`📋 GET /api/absences/${req.params.teamId} вызван`);
    
    try {
        const teamId = req.params.teamId;
        
        // Проверяем существование файлов
        if (!await fs.pathExists('absences.json')) {
            await fs.writeJSON('absences.json', [], { spaces: 4 });
        }
        if (!await fs.pathExists('employees.json')) {
            await fs.writeJSON('employees.json', [], { spaces: 4 });
        }
        
        const absences = await fs.readJSON('absences.json');
        const employees = await fs.readJSON('employees.json');
        
        // Получаем ID всех сотрудников команды
        const teamEmployeeIds = employees
            .filter(e => e.teamId === teamId)
            .map(e => e.id);
        
        // Фильтруем отсутствия только для этих сотрудников
        const teamAbsences = absences.filter(a => teamEmployeeIds.includes(a.employeeId));
        
        console.log(`📋 Найдено отсутствий: ${teamAbsences.length}`);
        res.json(teamAbsences);
        
    } catch (error) {
        console.error("❌ Ошибка получения отсутствий:", error);
        res.status(500).json({ error: error.message });
    }
});

// Добавить отсутствие
app.post('/api/absences', async (req, res) => {
    console.log("📋 POST /api/absences вызван");
    console.log("📦 Тело запроса:", req.body);
    
    try {
        const { employeeId, type, startDate, endDate, note } = req.body;
        
        // Валидация
        if (!employeeId || !type || !startDate || !endDate) {
            console.log("❌ Ошибка: не все поля заполнены");
            return res.status(400).json({ error: "Все поля обязательны" });
        }
        
        // Проверяем валидность дат
        if (new Date(startDate) > new Date(endDate)) {
            console.log("❌ Ошибка: дата начала позже даты окончания");
            return res.status(400).json({ error: "Дата начала не может быть позже даты окончания" });
        }
        
        // Проверяем существование файла
        if (!await fs.pathExists('absences.json')) {
            await fs.writeJSON('absences.json', [], { spaces: 4 });
            console.log("📁 Создан файл absences.json");
        }
        
        const absences = await fs.readJSON('absences.json');
        
        const newAbsence = {
            id: Date.now().toString(),
            employeeId: employeeId,
            type: type,
            startDate: startDate,
            endDate: endDate,
            note: note || '',
            createdAt: new Date().toISOString()
        };
        
        absences.push(newAbsence);
        await fs.writeJSON('absences.json', absences, { spaces: 4 });
        
        console.log("✅ Отсутствие добавлено:", newAbsence);
        res.json(newAbsence);
        
    } catch (error) {
        console.error("❌ Ошибка добавления отсутствия:", error);
        console.error("❌ Stack:", error.stack);
        res.status(500).json({ error: error.message });
    }
});

// Обновить отсутствие
app.put('/api/absences/:id', async (req, res) => {
    try {
        const absences = await fs.readJSON('absences.json');
        const index = absences.findIndex(a => a.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: "Отсутствие не найдено" });
        }
        
        absences[index] = { ...absences[index], ...req.body };
        await fs.writeJSON('absences.json', absences, { spaces: 4 });
        
        res.json(absences[index]);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Удалить отсутствие
app.delete('/api/absences/:id', async (req, res) => {
    console.log(`📋 DELETE /api/absences/${req.params.id} вызван`);
    
    try {
        const id = req.params.id;
        
        if (!await fs.pathExists('absences.json')) {
            return res.status(404).json({ error: "Файл отсутствий не найден" });
        }
        
        const absences = await fs.readJSON('absences.json');
        const filtered = absences.filter(a => a.id !== id);
        
        if (filtered.length === absences.length) {
            return res.status(404).json({ error: "Отсутствие не найдено" });
        }
        
        await fs.writeJSON('absences.json', filtered, { spaces: 4 });
        
        console.log("✅ Отсутствие удалено");
        res.json({ success: true });
        
    } catch (error) {
        console.error("❌ Ошибка удаления отсутствия:", error);
        res.status(500).json({ error: error.message });
    }
});

// ===== НАСТРОЙКИ СПРИНТОВ =====

// Получить настройки команды
app.get('/api/settings/:teamId', async (req, res) => {
    console.log(`📋 GET /api/settings/${req.params.teamId}`);
    
    try {
        const filePath = 'settings.json';
        
        if (!await fs.pathExists(filePath)) {
            console.log("📁 Файл settings.json не найден, создаем");
            await fs.writeJSON(filePath, [], { spaces: 4 });
        }
        
        const settings = await fs.readJSON(filePath);
        console.log(`📋 Всего настроек: ${settings.length}`);
        
        const teamSettings = settings.find(s => s.teamId === req.params.teamId);
        
        if (teamSettings) {
            console.log("✅ Настройки найдены");
            res.json(teamSettings);
        } else {
            console.log("⚠️ Настройки не найдены, возвращаем значения по умолчанию");
            res.json({
                teamId: req.params.teamId,
                duration: 14,
                firstStart: new Date().toISOString().split('T')[0],
                coefficient: 1.0
            });
        }
        
    } catch (error) {
        console.error("❌ Ошибка:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Сохранить настройки команды
app.post('/api/settings/:teamId', async (req, res) => {
    try {
        const settings = await fs.readJSON('settings.json');
        const index = settings.findIndex(s => s.teamId === req.params.teamId);
        
        const newSettings = {
            teamId: req.params.teamId,
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        if (index === -1) {
            settings.push(newSettings);
        } else {
            settings[index] = newSettings;
        }
        
        await fs.writeJSON('settings.json', settings, { spaces: 4 });
        res.json(newSettings);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить спринты команды
app.get('/api/sprints/:teamId', async (req, res) => {
    try {
        if (!await fs.pathExists('sprints.json')) {
            await fs.writeJSON('sprints.json', []);
        }
        const sprints = await fs.readJSON('sprints.json', { spaces: 4 });
        const teamSprints = sprints.filter(s => s.teamId === req.params.teamId);
        res.json(teamSprints);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== СПРИНТЫ =====

// Сгенерировать спринты 
app.post('/api/sprints/generate/:teamId', async (req, res) => {
    console.log("🔥 POST /api/sprints/generate/:teamId");
    console.log("teamId:", req.params.teamId);
    console.log("body:", req.body);
    
    try {
        const { duration, firstStart } = req.body;
        const teamId = req.params.teamId;
        
        const startDate = new Date(firstStart);
        const endOfYear = new Date(startDate.getFullYear(), 11, 31);
        
        let newSprints = [];
        let currentStart = new Date(startDate);
        let sprintNumber = 1;
        
        while (currentStart <= endOfYear && sprintNumber <= 52) {
            let currentEnd = new Date(currentStart);
            currentEnd.setDate(currentEnd.getDate() + duration - 1);
            if (currentEnd > endOfYear) currentEnd = new Date(endOfYear);
            
            newSprints.push({
                id: `${teamId}_sprint_${Date.now()}_${sprintNumber}`,
                teamId: teamId,
                name: `Спринт ${sprintNumber}`,
                startDate: currentStart.toISOString().split('T')[0],
                endDate: currentEnd.toISOString().split('T')[0],
                workingDays: 0
            });
            
            currentStart = new Date(currentEnd);
            currentStart.setDate(currentStart.getDate() + 1);
            sprintNumber++;
        }
        
        const sprints = await fs.readJSON('sprints.json');
        const otherSprints = sprints.filter(s => s.teamId !== teamId);
        await fs.writeJSON('sprints.json', [...otherSprints, ...newSprints], { spaces: 4 });
        
        console.log(`✅ Сгенерировано ${newSprints.length} спринтов`);
        res.json(newSprints);
        
    } catch (error) {
        console.error("❌ Ошибка:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ===== ПРАЗДНИКИ =====

// Получить праздники команды
app.get('/api/holidays/:teamId', async (req, res) => {
    try {
        if (!await fs.pathExists('holidays.json')) {
            await fs.writeJSON('holidays.json', []);
        }
        const holidays = await fs.readJSON('holidays.json');
        const teamHolidays = holidays.filter(h => h.teamId === req.params.teamId);
        res.json(teamHolidays);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Добавить праздник
app.post('/api/holidays/:teamId', async (req, res) => {
    try {
        console.log(`📋 Добавление праздника для команды: ${req.params.teamId}`, req.body);
        const { date, name } = req.body;
        const teamId = req.params.teamId;
        
        if (!date) {
            return res.status(400).json({ error: "Дата обязательна" });
        }
        
        const holidays = await fs.readJSON('holidays.json');
        
        const newHoliday = {
            id: `${teamId}_holiday_${Date.now()}`,
            teamId: teamId,
            date: date,
            name: name || 'Праздник',
            createdAt: new Date().toISOString()
        };
        
        holidays.push(newHoliday);
        await fs.writeJSON('holidays.json', holidays);
        
        console.log("✅ Праздник добавлен");
        res.json(newHoliday);
        
    } catch (error) {
        console.error("❌ Ошибка добавления праздника:", error);
        res.status(500).json({ error: error.message });
    }
});

// Удалить праздник
app.delete('/api/holidays/:id', async (req, res) => {
    try {
        console.log(`📋 Удаление праздника: ${req.params.id}`);
        const holidays = await fs.readJSON('holidays.json');
        const filtered = holidays.filter(h => h.id !== req.params.id);
        
        if (filtered.length === holidays.length) {
            return res.status(404).json({ error: "Праздник не найден" });
        }
        
        await fs.writeJSON('holidays.json', filtered);
        console.log("✅ Праздник удален");
        res.json({ success: true });
        
    } catch (error) {
        console.error("❌ Ошибка удаления праздника:", error);
        res.status(500).json({ error: error.message });
    }
});

// Функция для расчета рабочих дней в спринте
function calculateWorkingDays(startDate, endDate, holidays) {
    let workingDays = 0;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    // Создаем Set из праздничных дат для быстрого поиска
    const holidaySet = new Set();
    holidays.forEach(h => {
        if (h.date) holidaySet.add(h.date);
    });
    
    while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay(); // 0 - вс, 6 - сб
        
        // Если это не выходной (не суббота и не воскресенье) и не праздник
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
            workingDays++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
}

// Пересчитать рабочие дни для всех спринтов команды
app.post('/api/sprints/calculate-days/:teamId', async (req, res) => {
    try {
        console.log(`📋 Пересчет рабочих дней для команды: ${req.params.teamId}`);
        const teamId = req.params.teamId;
        
        // Получаем все спринты команды
        const sprints = await fs.readJSON('sprints.json');
        const teamSprints = sprints.filter(s => s.teamId === teamId);
        
        // Получаем все праздники команды
        const holidays = await fs.readJSON('holidays.json');
        const teamHolidays = holidays.filter(h => h.teamId === teamId);
        
        // Обновляем рабочие дни для каждого спринта
        teamSprints.forEach(sprint => {
            sprint.workingDays = calculateWorkingDays(
                sprint.startDate, 
                sprint.endDate, 
                teamHolidays
            );
        });
        
        // Сохраняем обновленные спринты
        const otherSprints = sprints.filter(s => s.teamId !== teamId);
        const allSprints = [...otherSprints, ...teamSprints];
        await fs.writeJSON('sprints.json', allSprints, { spaces: 4 });
        
        console.log(`✅ Пересчитаны рабочие дни для ${teamSprints.length} спринтов`);
        res.json(teamSprints);
        
    } catch (error) {
        console.error("❌ Ошибка пересчета рабочих дней:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sprints/calculate-days/:teamId', async (req, res) => {
    try {
        console.log(`📋 Расчет рабочих дней для команды: ${req.params.teamId}`);
        const teamId = req.params.teamId;
        
        // Получаем все спринты команды
        const sprints = await fs.readJSON('sprints.json');
        const teamSprints = sprints.filter(s => s.teamId === teamId);
        
        // Получаем все праздники
        const holidays = await fs.readJSON('holidays.json');
        const teamHolidays = holidays.filter(h => h.teamId === teamId);
        
        // Создаем Set с праздничными датами для быстрого поиска
        const holidaySet = new Set();
        teamHolidays.forEach(h => holidaySet.add(h.date));
        
        console.log(`📅 Загружено праздников: ${teamHolidays.length}`);
        
        // Для каждого спринта считаем рабочие дни
        teamSprints.forEach(sprint => {
            let workingDays = 0;
            const start = new Date(sprint.startDate);
            const end = new Date(sprint.endDate);
            
            let current = new Date(start);
            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                const dayOfWeek = current.getDay(); // 0 = вс, 6 = сб
                
                // Проверяем, что день рабочий (не сб, не вс, и не праздник)
                if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
                    workingDays++;
                }
                
                current.setDate(current.getDate() + 1);
            }
            
            sprint.workingDays = workingDays;
        });
        
        // Сохраняем обновленные спринты
        const otherSprints = sprints.filter(s => s.teamId !== teamId);
        const allSprints = [...otherSprints, ...teamSprints];
        await fs.writeJSON('sprints.json', allSprints, { spaces: 4 });
        
        console.log(`✅ Рассчитаны рабочие дни для ${teamSprints.length} спринтов`);
        res.json(teamSprints);
        
    } catch (error) {
        console.error("❌ Ошибка расчета:", error);
        res.status(500).json({ error: error.message });
    }
});

// Вспомогательная функция для даты по умолчанию
function getDefaultStartDate() {
    const date = new Date();
    const day = date.getDay();
    
    // Если сегодня не понедельник, переходим на следующий понедельник
    if (day !== 1) {
        const daysToAdd = day === 0 ? 1 : 8 - day;
        date.setDate(date.getDate() + daysToAdd);
    }
    
    return date.toISOString().split('T')[0];
}

app.post('/api/sprints/copy/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;
        const { year } = req.body;
        
        const sprints = await fs.readJSON('sprints.json');
        
        // Находим спринты за прошлый год
        const lastYearSprints = sprints.filter(s => 
            s.teamId === teamId && 
            new Date(s.startDate).getFullYear() === year
        );
        
        if (lastYearSprints.length === 0) {
            return res.json({ success: false, error: `Нет спринтов за ${year} год` });
        }
        
        // Удаляем старые спринты за текущий год
        const currentYear = new Date().getFullYear();
        const otherSprints = sprints.filter(s => 
            !(s.teamId === teamId && new Date(s.startDate).getFullYear() === currentYear)
        );
        
        // Создаем новые спринты со сдвигом дат
        const newSprints = lastYearSprints.map(sprint => {
            const newStart = new Date(sprint.startDate);
            newStart.setFullYear(currentYear);
            
            const newEnd = new Date(sprint.endDate);
            newEnd.setFullYear(currentYear);
            
            return {
                ...sprint,
                id: `${teamId}_sprint_${Date.now()}_${Math.random()}`,
                startDate: newStart.toISOString().split('T')[0],
                endDate: newEnd.toISOString().split('T')[0],
                workingDays: 0
            };
        });
        
        const allSprints = [...otherSprints, ...newSprints];
        await fs.writeJSON('sprints.json', allSprints, { spaces: 4 });
        
        res.json({ success: true, count: newSprints.length });
        
    } catch (error) {
        console.error('❌ Ошибка копирования спринтов:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/test', (req, res) => {
    console.log("✅ Тестовый маршрут сработал!");
    res.json({ success: true, received: req.body });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});