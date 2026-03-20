// ======================================
// login.js - Логика страницы входа
// ======================================

console.log("📁 login.js загружен");

// Ждем полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM загружен");
    
    // ПРОВЕРЯЕМ, ЧТО ВСЕ ЗАВИСИМОСТИ ЗАГРУЖЕНЫ
    console.log("📦 Проверка зависимостей:");
    console.log("   - api:", typeof api !== 'undefined' ? '✅' : '❌');
    console.log("   - auth:", typeof auth !== 'undefined' ? '✅' : '❌');
    console.log("   - utils:", typeof utils !== 'undefined' ? '✅' : '❌');
    
    // Если чего-то нет, показываем ошибку
    if (typeof auth === 'undefined') {
        console.error("❌ КРИТИЧЕСКАЯ ОШИБКА: auth не определен!");
        console.error("   Проверьте, что auth.js подключен ПЕРЕД login.js");
        return;
    }
    
    const form = document.getElementById('loginForm');
    if (!form) {
        console.error("❌ Форма с id='loginForm' не найдена!");
        return;
    }
    
    console.log("✅ Форма найдена, навешиваем обработчик");
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("🔵 Форма отправлена");
        
        // Получаем данные из формы
        const logInput = document.getElementById('log');
        const passInput = document.getElementById('pass1');
        
        if (!logInput || !passInput) {
            console.error("❌ Поля ввода не найдены");
            if (typeof utils !== 'undefined' && utils.showMessage) {
                utils.showMessage('message', 'Ошибка: поля не найдены', 'error');
            } else {
                alert('Ошибка: поля не найдены');
            }
            return;
        }
        
        const log = logInput.value.trim();
        const pass = passInput.value;
        
        console.log("📝 Данные для входа:", { log: log, pass: '***' });
        
        // Валидация
        if (!log || !pass) {
            console.log("⚠️ Не все поля заполнены");
            if (typeof utils !== 'undefined' && utils.showMessage) {
                utils.showMessage('message', 'Заполните все поля', 'error');
            } else {
                alert('Заполните все поля');
            }
            return;
        }
        
        try {
            console.log("🔄 Отправка запроса к API...");
            if (typeof utils !== 'undefined' && utils.showMessage) {
                utils.showMessage('message', 'Вход в систему...', 'info');
            }
            
            // Проверяем, что api.login существует
            if (typeof api === 'undefined') {
                throw new Error("api не загружен!");
            }
            if (typeof api.login !== 'function') {
                throw new Error("Метод api.login не найден!");
            }
            
            // Отправляем запрос через API
            const result = await api.login({ log, pass });
            console.log("📥 Ответ от сервера:", result);
            
            if (result.success) {
                console.log("✅ Успешный вход!");
                if (typeof utils !== 'undefined' && utils.showMessage) {
                    utils.showMessage('message', 'Успешный вход! Перенаправление...', 'success');
                } else {
                    alert('Успешный вход!');
                }
                
                // Сохраняем пользователя (используем auth)
                console.log("💾 Сохраняем пользователя через auth.setUser()");
                auth.setUser(result.user);
                
                // Перенаправляем на главную
                console.log("➡️ Перенаправление на главную через 1 секунду");
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                console.log("❌ Ошибка входа:", result.msg);
                if (typeof utils !== 'undefined' && utils.showMessage) {
                    utils.showMessage('message', result.msg || 'Неверный логин или пароль', 'error');
                } else {
                    alert(result.msg || 'Неверный логин или пароль');
                }
            }
            
        } catch (error) {
            console.error('🔥 Ошибка:', error);
            if (typeof utils !== 'undefined' && utils.showMessage) {
                utils.showMessage('message', 'Ошибка: ' + error.message, 'error');
            } else {
                alert('Ошибка: ' + error.message);
            }
        }
    });
});