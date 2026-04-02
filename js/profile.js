// ======================================
// profile.js - Логика страницы профиля
// ======================================

console.log("📁 profile.js загружен");

// Проверка авторизации при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    // Проверяем, что мы не на странице логина
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        if (!auth.isAuthenticated()) {
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
    
    // Загружаем данные пользователя
    await loadUserProfile();
    
    // Навешиваем обработчики
    setupEventListeners();
});

// Загрузить данные пользователя
async function loadUserProfile() {
    try {
        console.log("📋 Загрузка профиля пользователя");
        
        const user = auth.getUser();
        if (!user) {
            throw new Error("Пользователь не найден");
        }
        
        console.log("📋 Данные пользователя:", user);
        
        // Отображаем профиль
        displayUserProfile(user);
        
        // Загружаем статистику
        await loadUserStats(user);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки профиля:', error);
        utils.showMessage('message', 'Ошибка загрузки профиля', 'error');
    }
}

// Отобразить профиль пользователя
function displayUserProfile(user) {
    document.getElementById('userName').textContent = user.name || 'Не указано';
    document.getElementById('userLogin').textContent = user.log || 'Не указано';
    document.getElementById('userEmail').textContent = user.email || 'Не указан';
    document.getElementById('userId').textContent = user.id || 'Не указан';
    
    // Удалите эти строки:
    // const regDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно';
    // document.getElementById('userRegDate').textContent = regDate;
    
    const firstLetter = (user.name || user.log || '?').charAt(0).toUpperCase();
    document.getElementById('userAvatar').textContent = firstLetter;
}

// Загрузить статистику пользователя
async function loadUserStats(user) {
    try {
        console.log("📋 Загрузка статистики пользователя");
        
        // Получаем все команды
        const teams = await api.getTeams();
        
        // Фильтруем команды пользователя
        const userTeams = teams.filter(t => t.ownerId === user.id);
        
        // Считаем статистику
        let totalEmployees = 0;
        let totalAbsences = 0;
        
        // Для каждой команды получаем данные
        for (const team of userTeams) {
            const employees = await api.getEmployees(team.id);
            totalEmployees += employees.length;
            
            const absences = await api.getAbsences(team.id);
            totalAbsences += absences.length;
        }
        
        // Отображаем статистику
        document.getElementById('statTeams').textContent = userTeams.length;
        document.getElementById('statEmployees').textContent = totalEmployees;
        document.getElementById('statAbsences').textContent = totalAbsences;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки статистики:', error);
    }
}

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
    }
    
    // Кнопка редактирования профиля
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
        editBtn.addEventListener('click', showEditForm);
    }
    
    // Кнопка отмены редактирования
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideEditForm);
    }
    
    // Форма редактирования
    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveProfileChanges();
        });
    }
    
    // Кнопка смены пароля
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', showPasswordForm);
    }
    
    // Кнопка отмены смены пароля
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener('click', hidePasswordForm);
    }
    
    // Форма смены пароля
    const passwordForm = document.getElementById('changePasswordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await changePassword();
        });
    }
}

// Показать форму редактирования
function showEditForm() {
    console.log("📋 Показ формы редактирования");
    
    const user = auth.getUser();
    
    // Заполняем поля текущими данными
    document.getElementById('editName').value = user.name || '';
    document.getElementById('editEmail').value = user.email || '';
    
    // Прячем кнопку редактирования, показываем форму
    document.getElementById('profileInfo').style.display = 'none';
    document.getElementById('editProfileForm').style.display = 'block';
}

// Скрыть форму редактирования
function hideEditForm() {
    console.log("📋 Скрытие формы редактирования");
    
    document.getElementById('profileInfo').style.display = 'block';
    document.getElementById('editProfileForm').style.display = 'none';
}

// Сохранить изменения профиля
async function saveProfileChanges() {
    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    
    if (!name) {
        utils.showMessage('message', 'Имя не может быть пустым', 'error');
        return;
    }
    
    try {
        console.log("📋 Сохранение изменений профиля");
        utils.showMessage('message', 'Сохранение...', 'info');
        
        const user = auth.getUser();
        
        // Здесь должен быть запрос к API для обновления профиля
        // Пока просто обновляем локально
        const updatedUser = {
            ...user,
            name: name,
            email: email
        };
        
        // Сохраняем в localStorage
        auth.setUser(updatedUser);
        
        // Обновляем отображение
        await loadUserProfile();
        
        // Скрываем форму
        hideEditForm();
        
        utils.showMessage('message', 'Профиль обновлен!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        utils.showMessage('message', 'Ошибка сохранения', 'error');
    }
}

// Показать форму смены пароля
function showPasswordForm() {
    console.log("📋 Показ формы смены пароля");
    
    document.getElementById('changePasswordForm').style.display = 'block';
    document.getElementById('changePasswordBtn').style.display = 'none';
}

// Скрыть форму смены пароля
function hidePasswordForm() {
    console.log("📋 Скрытие формы смены пароля");
    
    document.getElementById('changePasswordForm').style.display = 'none';
    document.getElementById('changePasswordBtn').style.display = 'block';
    
    // Очищаем поля
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// Сменить пароль
async function changePassword() {
    const oldPass = document.getElementById('oldPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    
    // Валидация
    if (!oldPass || !newPass || !confirmPass) {
        utils.showMessage('message', 'Заполните все поля', 'error');
        return;
    }
    
    if (newPass.length < 6) {
        utils.showMessage('message', 'Новый пароль должен быть минимум 6 символов', 'error');
        return;
    }
    
    if (newPass !== confirmPass) {
        utils.showMessage('message', 'Новые пароли не совпадают', 'error');
        return;
    }
    
    try {
        console.log("📋 Смена пароля");
        utils.showMessage('message', 'Смена пароля...', 'info');
        
        const user = auth.getUser();
        
        // Здесь должен быть запрос к API для смены пароля
        // Пока просто имитируем успех
        
        utils.showMessage('message', 'Пароль успешно изменен!', 'success');
        
        // Скрываем форму
        hidePasswordForm();
        
    } catch (error) {
        console.error('❌ Ошибка смены пароля:', error);
        utils.showMessage('message', 'Ошибка смены пароля', 'error');
    }
}