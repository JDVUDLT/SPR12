const express = require("express");
const server = express();
const fs = require("fs-extra");
server.listen(3000);
server.use(express.json());
server.use(express.static(__dirname + "/public"));
server.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
server.get("/Registration", (req, res) => {
  res.sendFile(__dirname + "/register.html");
});
server.get("/Login", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});
server.get("/Profile", (req, res) => {
  res.sendFile(__dirname + "/profile.html");
});
server.get("/CreateTeam", (req, res) => {
  res.sendFile(__dirname + "/CreateTeam.html");
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
