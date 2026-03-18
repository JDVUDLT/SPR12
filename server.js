const express = require('express');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Раздаем файлы из корня
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Маршруты для HTML страниц (явно указываем)
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

// API маршруты (оставляем как есть)
// ... все ваши /api/... маршруты

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
server.post("/sendDataRegistration", async (req, res) => {
  try {
    const { name, login, password } = req.body;
    
    // Валидация
    if (!name || !login || !password) {
      return res.json({ 
        msg: "Все поля обязательны" 
      });
    }
    
    // Читаем пользователей
    let users = [];
    try {
      users = await fs.readJSON("Users.json");
    } catch {
      users = [];
    }
    
    // Проверяем существование
    const existingUser = users.find(u => u.log === login);
    if (existingUser) {
      return res.json({ 
        msg: "Такой пользователь существует" 
      });
    }
    
    // Создаем нового пользователя (id генерируем на сервере!)
    const newUser = {
      name: name,
      log: login,
      pass: password, // В реальном проекте нужно хешировать!
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await fs.writeJSON("Users.json", users, { spaces: 4 });
    
    // Отправляем успешный ответ (без пароля!)
    res.json({
      user: {
        name: newUser.name,
        log: newUser.log,
        id: newUser.id
      }
    });
    
  } catch (error) {
    console.error("Ошибка:", error);
    res.json({ 
      msg: "Ошибка сервера" 
    });
  }
});
server.post("/sendDataLogin", async (req, res) => {
    try {
        // 1. Получаем данные
        const { log, pass } = req.body;
        
        // 2. Проверяем, что данные есть
        if (!log || !pass) {
            return res.json({
                msg: "Логин и пароль обязательны",
                success: false
            });
        }
        
        // 3. Асинхронно читаем файл
        let users = [];
        try {
            users = await fs.readJSON("Users.json");
        } catch (error) {
            // Если файла нет, значит нет пользователей
            return res.json({
                msg: "Неверный логин или пароль",
                success: false
            });
        }
        
        // 4. Ищем пользователя по логину (один раз!)
        const user = users.find(u => u.log === log);
        
        // 5. Проверяем, существует ли пользователь и совпадает ли пароль
        if (user && user.pass === pass) {
            // Успешный вход
            res.json({
                msg: "Вы успешно вошли",
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    log: user.log
                    // НЕ отправляем пароль обратно!
                }
            });
        } else {
            // Неуспешный вход
            res.json({
                msg: "Неверный логин или пароль",
                success: false
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
