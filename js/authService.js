const AuthService = {

    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    setTokens(accessToken, refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    },

    getAccessToken() {
        return localStorage.getItem('accessToken');
    },

    getRefreshToken() {
        return localStorage.getItem('refreshToken');
    },

    isAuthenticated() {
        return !!this.getAccessToken(); // ✅ теперь правильно
    },

    logout() {
        localStorage.clear();
        window.location.href = '/login.html'; // ✅ исправил
    },

    requireAuth() {
        if (!this.isAuthenticated()) {
            if (window.location.pathname !== '/login.html') {
                window.location.href = '/login.html';
            }
            return false;
        }
        return true;
    },

    // LOGIN
    async login(data) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (result.success) {
            this.setTokens(result.accessToken, result.refreshToken); // 🔥
            this.setUser(result.user);
        }

        return result;
    },

    async register(data) {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        return res.json();
    },

    getUserId() {
        const user = this.getUser();
        return user ? user.id : null;
    }
};

window.auth = AuthService;