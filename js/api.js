// ======================================
// api.js - Stable Auth + Refresh System
// ======================================
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

const NO_REFRESH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

window.api = {

    async request(url, method = 'GET', body = null, retry = false) {
        const options = {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        };

        let res = await fetch(url, options);

    if (res.status === 401 && !retry && !NO_REFRESH_PATHS.includes(url)) {
        console.log('🔄 Attempting refresh, current url:', url);
        const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
        });
        console.log('🔄 Refresh status:', refreshRes.status);
        
        if (refreshRes.ok) {
            console.log('✅ Refresh ok, retrying original request');
            res = await fetch(url, options);
            console.log('✅ Retry status:', res.status);
        } else {
            const refreshData = await refreshRes.json();
            console.log('❌ Refresh failed:', refreshData);
            auth.logout();
            throw new Error('Session expired');
        }
    }

        const data = await res.json();
        return data;
    },

    me() {
        return this.request('/api/auth/me');
    },

    getTeams() {
        return this.request('/api/teams');
    },


    // =========================
    // AUTH
    // =========================
    login(data) {
        return this.request('/api/auth/login', 'POST', data);
    },

    register(data) {
        return this.request('/api/auth/register', 'POST', data);
    },

    logout() {
        return this.request('/api/auth/logout', 'POST')
            .finally(() => {
                auth.setAccessToken?.(null);
                window.location.href = '/login.html';
            });
    },

    // =========================
    // TEAMS
    // =========================
    getTeams() {
        return this.request('/api/teams');
    },

    createTeam(data) {
        return this.request('/api/teams', 'POST', data);
    },

    getUserTeams(userId) {
        return this.request(`/api/teams/user/${userId}`);
    },
    

    // =========================
    // EMPLOYEES
    // =========================
    getEmployees(teamId) {
        return this.request(`/api/employees/${teamId}`);
    },

    addEmployee(data) {
        return this.request('/api/employees', 'POST', data);
    },

    updateEmployee(id, data) {
        return this.request(`/api/employees/${id}`, 'PUT', data);
    },

    deleteEmployee(id) {
        return this.request(`/api/employees/${id}`, 'DELETE');
    },

    // =========================
    // ABSENCES
    // =========================
    getAbsences(teamId) {
        return this.request(`/api/absences/${teamId}`);
    },

    addAbsence(data) {
        return this.request('/api/absences', 'POST', data);
    },

    updateAbsence(id, data) {
        return this.request(`/api/absences/${id}`, 'PUT', data);
    },

    deleteAbsence(id) {
        return this.request(`/api/absences/${id}`, 'DELETE');
    },

    // =========================
    // SPRINTS / SETTINGS
    // =========================
    getSettings(teamId) {
        return this.request(`/api/settings/${teamId}`);
    },

    saveSettings(teamId, data) {
        return this.request(`/api/settings/${teamId}`, 'POST', data);
    },

    getSprints(teamId) {
        return this.request(`/api/sprints/${teamId}`);
    },

    generateSprints(teamId, params) {
        return this.request(`/api/sprints/generate/${teamId}`, 'POST', params);
    },

    calculateWorkingDays(teamId) {
        return this.request(`/api/sprints/calculate-days/${teamId}`, 'POST');
    },

    copySprintsFromYear(teamId, year) {
        return this.request(`/api/sprints/copy/${teamId}`, 'POST', { year });
    },

    // =========================
    // HOLIDAYS
    // =========================
    getHolidays(teamId) {
        return this.request(`/api/holidays/${teamId}`);
    },

    addHoliday(teamId, data) {
        return this.request(`/api/holidays/${teamId}`, 'POST', data);
    },

    deleteHoliday(id) {
        return this.request(`/api/holidays/${id}`, 'DELETE');
    },

    // =========================
    // SESSIONS
    // =========================
    getSessions() {
        return this.request('/api/auth/sessions');
    },

    deleteSession(id) {
        return this.request(`/api/auth/sessions/${id}`, 'DELETE');
    },

    deleteAllSessions() {
        return this.request('/api/auth/sessions', 'DELETE');
    },
};