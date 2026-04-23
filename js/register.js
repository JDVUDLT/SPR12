// ======================================
// register.js - Логика страницы регистрации
// ======================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("Страница регистрации загружена");
    
    const form = document.getElementById('registerForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Получаем данные из формы
        const name = document.getElementById('name')?.value.trim() || '';
        const log = document.getElementById('log')?.value.trim() || '';
        const email = document.getElementById('email')?.value.trim() || '';
        const pass = document.getElementById('pass1')?.value || '';
        const pass2 = document.getElementById('pass2')?.value || '';
        
        // Валидация
        if (!name || !log || !pass) {
            utils.showMessage('message', 'Заполните все поля', 'error');
            return;
        }
        
        if (log.length < 3) {
            utils.showMessage('message', 'Логин должен быть минимум 3 символа', 'error');
            return;
        }
        
        if (pass.length < 6) {
            utils.showMessage('message', 'Пароль должен быть минимум 6 символов', 'error');
            return;
        }
        
        if (pass !== pass2) {
            utils.showMessage('message', 'Пароли не совпадают', 'error');
            return;
        }
        
        try {
            utils.showMessage('message', 'Отправка данных...', 'info');
            
            // Отправляем запрос через API
            const result = await api.register({ name, log, email, pass });
            
            if (result.success) {
                utils.showMessage('message', 'Регистрация успешна! Перенаправление...', 'success');
                
                // Очищаем форму
                form.reset();
                
                // Перенаправляем на вход через 2 секунды
                setTimeout(() => {
                    window.location.href = '/';
                }, 10);
            } else {
                utils.showMessage('message', result.msg || 'Ошибка регистрации', 'error');
            }
            
        } catch (error) {
            console.error('Ошибка:', error);
            utils.showMessage('message', 'Ошибка соединения с сервером', 'error');
        }
    });
});