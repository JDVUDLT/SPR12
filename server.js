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

const initDataFiles = async () => {
    const files = ['Users.json', 'teams.json', 'employees.json', 'absences.json', 'sprints.json', 'holidays.json', 'settings.json'];
    
    for (const file of files) {
        if (!await fs.pathExists(file)) {
            await fs.writeJSON(file, []);
            console.log(`📁 Создан файл: ${file}`);
        }
    }
};

initDataFiles().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Сервер запущен на порту ${PORT}`);
    });
}).catch(err => {
    console.error('❌ Ошибка инициализации:', err);
});

const readJSON = async (filename) => {
    try {
        return await fs.readJSON(filename);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Если файл не существует, создаем пустой массив
            await fs.writeJSON(filename, []);
            return [];
        }
        throw error;
    }
};

const writeJSON = async (filename, data) => {
    await fs.writeJSON(filename, data, { spaces: 4 });
};

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
    console.log("Получен запрос на вход:", req.body.log);
    
    try {
        const { log, pass } = req.body;
        
        if (!log || !pass) {
            return res.json({ 
                msg: "Логин и пароль обязательны",
                success: false 
            });
        }
        
        const users = await readJSON("Users.json");
        
        // Ищем пользователя
        const user = users.find(u => u.log === log && u.pass === pass);
        
        if (user) {
            // Успешный вход
            res.json({
                success: true,
                msg: "Вы успешно вошли",
                user: {
                    id: user.id,
                    name: user.name,
                    log: user.log
                }
            });
        } else {
            // Неуспешный вход
            res.json({
                success: false,
                msg: "Неверный логин или пароль"
            });
        }
        
    } catch (error) {
        console.error("Ошибка входа:", error);
        res.json({ 
            msg: "Ошибка сервера",
            success: false 
        });
    }
});

// ===== КОМАНДЫ =====

// Получить все команды
app.get('/api/teams', async (req, res) => {
    try {
        console.log("📋 Запрос списка команд");
        const teams = await readJSON('teams.json');
        res.json(teams);
    } catch (error) {
        console.error("❌ Ошибка получения команд:", error);
        res.status(500).json({ error: error.message });
    }
});

// Создать новую команду
app.post('/api/teams', async (req, res) => {
    try {
        console.log("📋 Создание новой команды:", req.body);
        const { name, userId } = req.body;
        
        if (!name || !userId) {
            return res.status(400).json({ error: "Название команды и ID пользователя обязательны" });
        }
        
        const teams = await readJSON('teams.json');
        
        const newTeam = {
            id: Date.now().toString(),
            name: name,
            ownerId: userId,
            createdAt: new Date().toISOString()
        };
        
        teams.push(newTeam);
        await writeJSON('teams.json', teams);
        
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
        const teams = await readJSON('teams.json');
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
    try {
        console.log(`📋 Запрос сотрудников команды: ${req.params.teamId}`);
        const employees = await readJSON('employees.json');
        const teamEmployees = employees.filter(e => e.teamId === req.params.teamId);
        res.json(teamEmployees);
    } catch (error) {
        console.error("❌ Ошибка получения сотрудников:", error);
        res.status(500).json({ error: error.message });
    }
});

// Добавить сотрудника
app.post('/api/employees', async (req, res) => {
    try {
        console.log("📋 Добавление сотрудника:", req.body);
        const { teamId, fullName, role, hireDate } = req.body;
        
        if (!teamId || !fullName || !role || !hireDate) {
            return res.status(400).json({ error: "Все поля обязательны" });
        }
        
        const employees = await readJSON('employees.json');
        
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
        await writeJSON('employees.json', employees);
        
        console.log("✅ Сотрудник добавлен:", newEmployee);
        res.json(newEmployee);
    } catch (error) {
        console.error("❌ Ошибка добавления сотрудника:", error);
        res.status(500).json({ error: error.message });
    }
});

// Обновить сотрудника
app.put('/api/employees/:id', async (req, res) => {
    try {
        console.log(`📋 Обновление сотрудника ${req.params.id}:`, req.body);
        const employees = await readJSON('employees.json');
        const index = employees.findIndex(e => e.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: "Сотрудник не найден" });
        }
        
        employees[index] = { ...employees[index], ...req.body };
        await writeJSON('employees.json', employees);
        
        console.log("✅ Сотрудник обновлен:", employees[index]);
        res.json(employees[index]);
    } catch (error) {
        console.error("❌ Ошибка обновления сотрудника:", error);
        res.status(500).json({ error: error.message });
    }
});

// Удалить сотрудника
app.delete('/api/employees/:id', async (req, res) => {
    try {
        console.log(`📋 Удаление сотрудника: ${req.params.id}`);
        const employees = await readJSON('employees.json');
        const filtered = employees.filter(e => e.id !== req.params.id);
        
        if (filtered.length === employees.length) {
            return res.status(404).json({ error: "Сотрудник не найден" });
        }
        
        await writeJSON('employees.json', filtered);
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
    try {
        console.log(`📋 Запрос отсутствий команды: ${req.params.teamId}`);
        const absences = await readJSON('absences.json');
        const employees = await readJSON('employees.json');
        
        // Получаем ID всех сотрудников команды
        const teamEmployeeIds = employees
            .filter(e => e.teamId === req.params.teamId)
            .map(e => e.id);
        
        // Фильтруем отсутствия только для этих сотрудников
        const teamAbsences = absences.filter(a => teamEmployeeIds.includes(a.employeeId));
        
        res.json(teamAbsences);
    } catch (error) {
        console.error("❌ Ошибка получения отсутствий:", error);
        res.status(500).json({ error: error.message });
    }
});

// Добавить отсутствие
app.post('/api/absences', async (req, res) => {
    try {
        console.log("📋 Добавление отсутствия:", req.body);
        const { employeeId, type, startDate, endDate } = req.body;
        
        if (!employeeId || !type || !startDate || !endDate) {
            return res.status(400).json({ error: "Все поля обязательны" });
        }
        
        const absences = await readJSON('absences.json');
        
        const newAbsence = {
            id: Date.now().toString(),
            employeeId: employeeId,
            type: type,
            startDate: startDate,
            endDate: endDate,
            createdAt: new Date().toISOString()
        };
        
        absences.push(newAbsence);
        await writeJSON('absences.json', absences);
        
        console.log("✅ Отсутствие добавлено:", newAbsence);
        res.json(newAbsence);
    } catch (error) {
        console.error("❌ Ошибка добавления отсутствия:", error);
        res.status(500).json({ error: error.message });
    }
});

// Удалить отсутствие
app.delete('/api/absences/:id', async (req, res) => {
    try {
        console.log(`📋 Удаление отсутствия: ${req.params.id}`);
        const absences = await readJSON('absences.json');
        const filtered = absences.filter(a => a.id !== req.params.id);
        
        if (filtered.length === absences.length) {
            return res.status(404).json({ error: "Отсутствие не найдено" });
        }
        
        await writeJSON('absences.json', filtered);
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
    try {
        console.log(`📋 Запрос настроек для команды: ${req.params.teamId}`);
        const settings = await readJSON('settings.json');
        
        // Ищем настройки для конкретной команды
        const teamSettings = settings.find(s => s.teamId === req.params.teamId);
        
        if (teamSettings) {
            res.json(teamSettings);
        } else {
            // Возвращаем настройки по умолчанию
            res.json({
                teamId: req.params.teamId,
                duration: 14,
                firstStart: getDefaultStartDate(),
                coefficient: 1.0
            });
        }
    } catch (error) {
        console.error("❌ Ошибка получения настроек:", error);
        res.status(500).json({ error: error.message });
    }
});

// Сохранить настройки команды
app.post('/api/settings/:teamId', async (req, res) => {
    try {
        console.log(`📋 Сохранение настроек для команды: ${req.params.teamId}`, req.body);
        const { duration, firstStart, coefficient } = req.body;
        const teamId = req.params.teamId;
        
        if (!duration || !firstStart) {
            return res.status(400).json({ error: "Не все поля заполнены" });
        }
        
        const settings = await readJSON('settings.json');
        
        // Удаляем старые настройки этой команды
        const otherSettings = settings.filter(s => s.teamId !== teamId);
        
        // Добавляем новые
        const newSettings = {
            teamId: teamId,
            duration: duration,
            firstStart: firstStart,
            coefficient: coefficient || 1.0,
            updatedAt: new Date().toISOString()
        };
        
        otherSettings.push(newSettings);
        await writeJSON('settings.json', otherSettings);
        
        console.log("✅ Настройки сохранены");
        res.json(newSettings);
        
    } catch (error) {
        console.error("❌ Ошибка сохранения настроек:", error);
        res.status(500).json({ error: error.message });
    }
});

// Получить спринты команды
app.get('/api/sprints/:teamId', async (req, res) => {
    try {
        console.log(`📋 Запрос спринтов для команды: ${req.params.teamId}`);
        const sprints = await readJSON('sprints.json');
        const teamSprints = sprints.filter(s => s.teamId === req.params.teamId);
        res.json(teamSprints);
    } catch (error) {
        console.error("❌ Ошибка получения спринтов:", error);
        res.status(500).json({ error: error.message });
    }
});

// ===== СПРИНТЫ =====

// Сгенерировать спринты 
app.post('/api/sprints/generate/:teamId', async (req, res) => {
    console.log("=".repeat(50));
    console.log("🔥 ГЕНЕРАЦИЯ СПРИНТОВ");
    console.log("📌 teamId:", req.params.teamId);
    console.log("📌 body:", req.body);
    console.log("=".repeat(50));
    
    try {
        const { duration, firstStart } = req.body;
        const teamId = req.params.teamId;
        
        if (!duration || !firstStart) {
            return res.status(400).json({ error: "Не указаны параметры" });
        }
        
        // Читаем существующие спринты
        const sprints = await readJSON('sprints.json');
        
        // Удаляем старые спринты этой команды
        const otherSprints = sprints.filter(s => s.teamId !== teamId);
        
        // Генерируем новые спринты
        const startDate = new Date(firstStart);
        const endOfYear = new Date(startDate.getFullYear(), 11, 31); // 31 декабря
        
        console.log(`📅 Начало: ${startDate.toISOString().split('T')[0]}`);
        console.log(`📅 Конец года: ${endOfYear.toISOString().split('T')[0]}`);
        
        let newSprints = [];
        let currentStart = new Date(startDate);
        let sprintNumber = 1;
        
        // Защита от бесконечного цикла
        const MAX_SPRINTS = 53; // Максимум недель в году
        
        while (currentStart <= endOfYear && sprintNumber <= MAX_SPRINTS) {
            // Вычисляем дату окончания спринта
            let currentEnd = new Date(currentStart);
            currentEnd.setDate(currentEnd.getDate() + duration - 1);
            
            // Если вышли за конец года, обрезаем
            if (currentEnd > endOfYear) {
                currentEnd = new Date(endOfYear);
            }
            
            // Форматируем даты
            const startStr = currentStart.toISOString().split('T')[0];
            const endStr = currentEnd.toISOString().split('T')[0];
            
            console.log(`   Спринт ${sprintNumber}: ${startStr} - ${endStr}`);
            
            newSprints.push({
                id: `${teamId}_sprint_${Date.now()}_${sprintNumber}`,
                teamId: teamId,
                name: `Спринт ${sprintNumber}`,
                startDate: startStr,
                endDate: endStr,
                workingDays: 0 // Пока 0, потом пересчитаем
            });
            
            // Переходим к следующему спринту (начинаем на следующий день после окончания)
            currentStart = new Date(currentEnd);
            currentStart.setDate(currentStart.getDate() + 1);
            sprintNumber++;
        }
        
        console.log(`✅ Сгенерировано ${newSprints.length} спринтов`);
        
        // Сохраняем все спринты
        const allSprints = [...otherSprints, ...newSprints];
        await writeJSON('sprints.json', allSprints);
        
        // Отправляем ответ
        res.json(newSprints);
        
    } catch (error) {
        console.error("❌ Ошибка:", error);
        res.status(500).json({ error: error.message });
    }
});

// ===== ПРАЗДНИКИ =====

// Получить праздники команды
app.get('/api/holidays/:teamId', async (req, res) => {
    try {
        console.log(`📋 Запрос праздников для команды: ${req.params.teamId}`);
        const holidays = await readJSON('holidays.json');
        const teamHolidays = holidays.filter(h => h.teamId === req.params.teamId);
        res.json(teamHolidays);
    } catch (error) {
        console.error("❌ Ошибка получения праздников:", error);
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
        
        const holidays = await readJSON('holidays.json');
        
        const newHoliday = {
            id: `${teamId}_holiday_${Date.now()}`,
            teamId: teamId,
            date: date,
            name: name || 'Праздник',
            createdAt: new Date().toISOString()
        };
        
        holidays.push(newHoliday);
        await writeJSON('holidays.json', holidays);
        
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
        const holidays = await readJSON('holidays.json');
        const filtered = holidays.filter(h => h.id !== req.params.id);
        
        if (filtered.length === holidays.length) {
            return res.status(404).json({ error: "Праздник не найден" });
        }
        
        await writeJSON('holidays.json', filtered);
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
        const sprints = await readJSON('sprints.json');
        const teamSprints = sprints.filter(s => s.teamId === teamId);
        
        // Получаем все праздники команды
        const holidays = await readJSON('holidays.json');
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
        await writeJSON('sprints.json', allSprints);
        
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
        const sprints = await readJSON('sprints.json');
        const teamSprints = sprints.filter(s => s.teamId === teamId);
        
        // Получаем все праздники
        const holidays = await readJSON('holidays.json');
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
        await writeJSON('sprints.json', allSprints);
        
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
        
        const sprints = await readJSON('sprints.json');
        
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
        await writeJSON('sprints.json', allSprints);
        
        res.json({ success: true, count: newSprints.length });
        
    } catch (error) {
        console.error('❌ Ошибка копирования спринтов:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});

// Обработка завершения
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});