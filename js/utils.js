// ======================================
// utils.js - Вспомогательные функции
// ======================================

console.log("📁 utils.js загружен");

const Utils = {
    // Показать сообщение
    showMessage(elementId, text, type = 'info') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.textContent = text;
        element.className = 'message';
        
        if (type === 'error') {
            element.classList.add('error');
        } else if (type === 'success') {
            element.classList.add('success');
        } else if (type === 'info') {
            element.classList.add('info');
        }
    },
    
    // Отформатировать дату
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    },
    
    // Получить название роли
    getRoleName(role) {
        const roles = {
            'developer': 'Разработчик',
            'qa': 'Тестировщик',
            'analyst': 'Аналитик',
            'pm': 'Project Manager',
            'designer': 'Дизайнер'
        };
        return roles[role] || role;
    },
    
    // Получить название типа отсутствия
    getAbsenceTypeName(type) {
        const types = {
            'vacation': 'Отпуск',
            'sick': 'Больничный',
            'dayoff': 'Отгул',
            'business': 'Командировка'
        };
        return types[type] || type;
    },
    
    // Подсветить активный пункт меню
    highlightActiveNav() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (currentPath === href || 
                (currentPath === '/' && href === '/')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },
    
    // Рассчитать количество дней между датами
    calculateDaysBetween(startDate, endDate) {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    },
    
    // Проверить, является ли дата выходным (суббота или воскресенье)
    isWeekend(dateString) {
        const date = new Date(dateString);
        const day = date.getDay();
        return day === 0 || day === 6; // 0 - воскресенье, 6 - суббота
    },
    
    // Получить текущую дату в формате YYYY-MM-DD
    getTodayString() {
        const date = new Date();
        return date.toISOString().split('T')[0];
    },
    
    // Сгенерировать ID
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 5);
    },

    
};

// Создаем глобальную переменную
const utils = Utils;

console.log("✅ utils.js загружен, utils доступен:", typeof utils !== 'undefined');