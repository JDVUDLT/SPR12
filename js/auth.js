let currentUser = null;
const auth = {
    getAccessToken() {
        return localStorage.getItem('accessToken');
    },

    getRefreshToken() {
        return localStorage.getItem('refreshToken');
    },

    setTokens(accessToken, refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    },

    async getUser() {
        if (!currentUser) {
            const res = await api.request('/api/auth/me');

            console.log("👤 /me ответ:", res);

            currentUser = res.user || res; // ← ВАЖНО
        }

        return currentUser;
    },

    async getUserId() {
    const user = await this.getUser();
    return user.id;
    },

    clearUser() {
        currentUser = null;
    },

    logout() {
        localStorage.clear();
        window.location.href = '/login.html';
    },

    async refreshTokens() {
        const refreshToken = this.getRefreshToken();

        if (!refreshToken) {
            throw new Error('Нет refresh токена');
        }

        const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });

        if (!res.ok) {
            this.logout();
            throw new Error('Refresh токен невалиден');
        }

        const data = await res.json();

        this.setTokens(data.accessToken, data.refreshToken);

        return data.accessToken;
    },

    async ensureAuth() {
        const token = this.getAccessToken();

        if (!token) {
            console.log('❌ Нет accessToken → редирект');
            this.logout();
            return;
        }

        try {
            // делаем тестовый запрос
            await api.request('/api/auth/me');
        } catch (e) {
            console.log('⚠️ accessToken умер, пробуем refresh');

            try {
                await this.refreshTokens();
                console.log('✅ Токен обновлён');
            } catch (err) {
                console.log('❌ refresh не помог → logout');
                this.logout();
            }
        }
    }
};

window.auth = auth;