const AuthService = {

    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    setToken(token) {
        localStorage.setItem('token', token);
    },

    getToken() {
        return localStorage.getItem('token');
    },

    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
    },

    requireAuth() {
        if (!this.isAuthenticated()) {
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            return false;
        }
        return true;
    },

    // 🔥 LOGIN
    async login(data) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (result.success) {
            this.setToken(result.token);
            this.setUser(result.user);
        }

        return result;
    },

    // 🔥 REGISTER
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