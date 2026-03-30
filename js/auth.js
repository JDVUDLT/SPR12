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

    getToken() {
    const token = localStorage.getItem('token');
    console.log("🔑 Токен:", token ? "есть" : "нет");
    return token;
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
    const token = this.getToken();
    const isAuth = !!token;
    console.log("🔐 Проверка авторизации (по токену):", isAuth);
    return isAuth;
    },
    
    // Выйти
    logout() {
    console.log("🚪 Выход из системы");
    localStorage.removeItem('user');
    localStorage.removeItem('token'); 
    window.location.href = '/login';
    },
    
    // Требовать авторизацию
    requireAuth() {
    const isAuth = this.isAuthenticated();
    console.log("🔐 requireAuth вызван, авторизация:", isAuth);
    
    if (!isAuth) {
        console.log("⚠️ Перенаправление на /login");
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