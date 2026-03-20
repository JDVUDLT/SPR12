// ======================================
// auth.js - Авторизация и пользователь
// ======================================

console.log("📁 auth.js загружен");

const Auth = {
    // Сохранить пользователя
    setUser(user) {
        console.log("💾 Сохраняем пользователя:", user);
        localStorage.setItem('user', JSON.stringify(user));
    },
    
    // Получить пользователя
    getUser() {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            console.log("👤 Пользователь не найден в localStorage");
            return null;
        }
        
        try {
            const user = JSON.parse(userStr);
            console.log("👤 Загружен пользователь:", user);
            return user;
        } catch (error) {
            console.error("❌ Ошибка парсинга пользователя:", error);
            return null;
        }
    },
    
    // Проверить, авторизован ли
    isAuthenticated() {
        const isAuth = this.getUser() !== null;
        console.log("🔐 Проверка авторизации:", isAuth);
        return isAuth;
    },
    
    // Выйти
    logout() {
        console.log("🚪 Выход из системы");
        localStorage.removeItem('user');
        window.location.href = '/login';
    },
    
    // Требовать авторизацию
    requireAuth() {
        const isAuth = this.isAuthenticated();
        console.log("🔐 requireAuth вызван, авторизация:", isAuth);
        
        if (!isAuth) {
            console.log("⚠️ Перенаправление на /login");
            // Проверяем, что мы не уже на странице логина
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            return false;
        }
        return true;
    },
    
    // Получить ID текущего пользователя
    getUserId() {
        const user = this.getUser();
        const id = user ? user.id : null;
        console.log("🆔 ID пользователя:", id);
        return id;
    },
    
    // Получить имя текущего пользователя
    getUserName() {
        const user = this.getUser();
        const name = user ? (user.name || user.log) : null;
        console.log("📛 Имя пользователя:", name);
        return name;
    },
        // Обновить данные пользователя
    updateUser(updatedData) {
        const user = this.getUser();
        if (!user) return null;   
        const updatedUser = { ...user, ...updatedData };
        this.setUser(updatedUser);
        return updatedUser;
    },
};


// Создаем глобальную переменную
const auth = Auth;

console.log("✅ auth.js загружен, auth доступен:", typeof auth !== 'undefined');