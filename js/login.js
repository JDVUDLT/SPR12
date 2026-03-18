// Функция для подготовки данных (оставляем)
function data(data) {
    return {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }
}

// Функция проверки авторизации
function checkAuth() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            if (user && user.id) {
                window.location.href = "/profile";
                return true;
            }
        } catch (e) {
            // Если данные повреждены, удаляем их
            localStorage.removeItem('user');
        }
    }
    return false;
}

// Основная функция входа
async function sendData() {
    // 1. Получаем значения полей
    const loginInput = document.getElementById("log");
    const passInput = document.getElementById("pass1");
    
    const log = loginInput.value.trim();
    const pass = passInput.value;
    
    // 2. Валидация на клиенте
    if (!log || !pass) {
        alert("Пожалуйста, заполните все поля");
        return;
    }
    
    if (log.length < 3) {
        alert("Логин должен содержать минимум 3 символа");
        return;
    }
    
    try {
        // 3. Показываем процесс загрузки
        const submitButton = document.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = "Вход...";
        submitButton.disabled = true;
        
        // 4. Отправляем запрос
        const response = await fetch("/sendDataLogin", data({
            log: log,
            pass: pass
        }));
        
        // 5. Проверяем, что ответ получен
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        // 6. Парсим ответ
        const result = await response.json();
        
        // 7. Возвращаем кнопку в исходное состояние
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        // 8. Обрабатываем ответ (ПРАВИЛЬНАЯ ЛОГИКА!)
        if (result.success) {
            // Успешный вход
            localStorage.setItem('user', JSON.stringify(result.user));
            alert("Добро пожаловать, " + (result.user.name || result.user.log));
            window.location.href = "/profile";
        } else {
            // Ошибка входа
            alert(result.msg || "Неверный логин или пароль");
            
            // Очищаем поле пароля для безопасности
            passInput.value = "";
            passInput.focus();
        }
        
    } catch (error) {
        // 9. Обработка ошибок сети
        console.error("Ошибка:", error);
        alert("Ошибка соединения с сервером. Проверьте подключение к интернету.");
        
        // Возвращаем кнопку в исходное состояние
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = "Войти";
            submitButton.disabled = false;
        }
    }
}