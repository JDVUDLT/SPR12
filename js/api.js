// ======================================
// api.js - Все запросы к серверу
// ======================================

const API = {
    // Базовый URL (пустой, так как на том же сервере)
    baseUrl: '',
    
    // Универсальный метод для запросов
    async request(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(this.baseUrl + endpoint, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    },
    
    // ===== АВТОРИЗАЦИЯ =====
    
    // Регистрация
    async register(userData) {
        return this.request('/sendDataRegistration', 'POST', userData);
    },
    
    // Вход (добавлено!)
    async login(credentials) {
        return this.request('/sendDataLogin', 'POST', credentials);
    },
    
// ===== КОМАНДЫ =====

// Получить все команды
async getTeams() {
    return this.request('/api/teams');
},

// Создать команду
async createTeam(teamData) {
    return this.request('/api/teams', 'POST', teamData);
},

// Получить команды пользователя
async getUserTeams(userId) {
    return this.request(`/api/teams/user/${userId}`);
},

// ===== СОТРУДНИКИ =====

// Получить сотрудников команды
async getEmployees(teamId) {
    return this.request(`/api/employees/${teamId}`);
},

// Добавить сотрудника
async addEmployee(employeeData) {
    return this.request('/api/employees', 'POST', employeeData);
},

// Обновить сотрудника
async updateEmployee(id, employeeData) {
    return this.request(`/api/employees/${id}`, 'PUT', employeeData);
},

// Удалить сотрудника
async deleteEmployee(id) {
    return this.request(`/api/employees/${id}`, 'DELETE');
},

// ===== ОТСУТСТВИЯ =====

// Получить отсутствия команды
async getAbsences(teamId) {
    return this.request(`/api/absences/${teamId}`);
},

// Добавить отсутствие
async addAbsence(absenceData) {
    return this.request('/api/absences', 'POST', absenceData);
},

// Удалить отсутствие
async deleteAbsence(id) {
    return this.request(`/api/absences/${id}`, 'DELETE');
},

// ===== НАСТРОЙКИ =====
    
// Получить настройки
async getSettings() {
    return this.request('/api/settings');
},
    
// Сохранить настройки
async saveSettings(settingsData) {
    return this.request('/api/settings', 'POST', settingsData);
},

// ===== НАСТРОЙКИ СПРИНТОВ =====

// Получить настройки команды
async getSettings(teamId) {
    return this.request(`/api/settings/${teamId}`);
},

// Сохранить настройки
async saveSettings(teamId, settingsData) {
    return this.request(`/api/settings/${teamId}`, 'POST', settingsData);
},

// Получить спринты команды
async getSprints(teamId) {
    return this.request(`/api/sprints/${teamId}`);
},

// Сгенерировать спринты
async generateSprints(teamId, params) {
    console.log("📡 API.generateSprints вызван:", { teamId, params });
    return this.request(`/api/sprints/generate/${teamId}`, 'POST', params);
},

// ===== ПРАЗДНИКИ =====

// Получить праздники команды
async getHolidays(teamId) {
    return this.request(`/api/holidays/${teamId}`);
},

// Добавить праздник
async addHoliday(teamId, holidayData) {
    return this.request(`/api/holidays/${teamId}`, 'POST', holidayData);
},

// Удалить праздник
async deleteHoliday(id) {
    return this.request(`/api/holidays/${id}`, 'DELETE');
},

// Пересчитать рабочие дни
async calculateWorkingDays(teamId) {
    return this.request(`/api/sprints/calculate-days/${teamId}`, 'POST');
},

// Обновить сотрудника
async updateEmployee(id, employeeData) {
    return this.request(`/api/employees/${id}`, 'PUT', employeeData);
},

// Обновить отсутствие
async updateAbsence(id, absenceData) {
    return this.request(`/api/absences/${id}`, 'PUT', absenceData);
},

};

// Создаем глобальную переменную
const api = API;
