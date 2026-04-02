// ======================================
// api.js - Все запросы к серверу
// ======================================

const API = {
    // Базовый URL (пустой, так как на том же сервере)
    baseUrl: '',
    
    // Универсальный метод для запросов
    async request(endpoint, method = 'GET', data = null) {
        let accessToken = localStorage.getItem('accessToken');

        const makeRequest = () => {
            const accessToken = localStorage.getItem('accessToken'); // 🔥 ВАЖНО

            return fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: data ? JSON.stringify(data) : null
            });
        };

        let response = await makeRequest();

    // 🔥 если токен умер
        if (response.status === 401) {
            const refreshToken = localStorage.getItem('refreshToken');

            const refreshRes = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (!refreshRes.ok) {
                localStorage.clear();
                window.location.href = '/login.html';
                return;
            }

            const refreshData = await refreshRes.json();

            localStorage.setItem('accessToken', refreshData.accessToken);
            accessToken = refreshData.accessToken;

            // 🔁 повторяем запрос
            response = await makeRequest();
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    },
    
    // ===== АВТОРИЗАЦИЯ =====
    
    // Регистрация
    register(data) {
    return this.request('/api/auth/register', 'POST', data);
    },
    
    // Вход
    async login(credentials) {
    const res = await this.request('/api/auth/login', 'POST', credentials);

    return res;
    },
    
// ===== КОМАНДЫ =====

// Получить все команды
async getTeams() {
    return this.request('/api/teams');
},

// Создать команду
async createTeam(teamData) {
    console.log("📡 API.createTeam вызван:", teamData);
    return this.request('/api/teams', 'POST', teamData);
},

// Получить команды пользователя
async getUserTeams(userId) {
    return this.request(`/api/teams/user/${userId}`);
},

// ===== СОТРУДНИКИ =====

// Получить сотрудников команды
async getEmployees(teamId) {
    console.log(`📡 API.getEmployees вызван для teamId: ${teamId}`);
    try {
        const result = await this.request(`/api/employees/${teamId}`);
        console.log(`📡 API.getEmployees вернул: ${result.length} сотрудников`);
        return result;
    } catch (error) {
        console.error(`❌ API.getEmployees ошибка:`, error);
        throw error;
    }
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

async getAbsences(teamId) {
        console.log(`📡 API.getAbsences вызван для teamId: ${teamId}`);
        try {
            const result = await this.request(`/api/absences/${teamId}`);
            console.log(`📡 API.getAbsences вернул: ${result.length} записей`);
            return result;
        } catch (error) {
            console.error(`❌ API.getAbsences ошибка:`, error);
            throw error;
        }
    },
    
// Добавить отсутствие
async addAbsence(absenceData) {
        console.log("📡 API.addAbsence вызван:", absenceData);
        return this.request('/api/absences', 'POST', absenceData);
    },
    
// Обновить отсутствие
async updateAbsence(id, absenceData) {
        console.log(`📡 API.updateAbsence вызван для ${id}:`, absenceData);
        return this.request(`/api/absences/${id}`, 'PUT', absenceData);
    },
    
// Удалить отсутствие
async deleteAbsence(id) {
        console.log(`📡 API.deleteAbsence вызван для ${id}`);
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

async copySprintsFromYear(teamId, year) {
    return this.request(`/api/sprints/copy/${teamId}`, 'POST', { year });
},

};

// Создаем глобальную переменную
const api = API;
