window.auth = {
    user: null,

    async init() {
        if (this.user) return true;

        try {
            let res = await fetch('/api/auth/me', { credentials: 'include' });
            
            if (res.status === 401) {
                const refreshRes = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    credentials: 'include'
                });
                if (refreshRes.ok) {
                    res = await fetch('/api/auth/me', { credentials: 'include' });
                } else {
                    throw new Error('Session expired');
                }
            }
            
            if (!res.ok) throw new Error('Not authenticated');
            
            const data = await res.json();
            if (data.success && data.user) {
                this.user = data.user;
                // Запускаем авторефреш за 1 минуту до истечения (14 мин)
                this._startAutoRefresh();
                return true;
            }
            throw new Error('Invalid response');
        } catch (err) {
            console.error('Auth init error:', err.message);
            this.user = null;
            return false;
        }
    },

    _startAutoRefresh() {
        if (this._refreshTimer) clearInterval(this._refreshTimer);
        // Каждые 14 минут обновляем токен
        this._refreshTimer = setInterval(async () => {
            console.log('🔄 Auto-refreshing token...');
            const res = await fetch('/api/auth/refresh', {
                method: 'POST',
                credentials: 'include'
            });
            if (!res.ok) {
                console.log('❌ Auto-refresh failed');
                this.logout();
            }
        }, 14 * 60 * 1000); // 14 минут
    },

    async getUser() {
        if (this.user) return this.user;
        const ok = await this.init();
        return ok ? this.user : null;
    },

    logout() {
        if (this._refreshTimer) clearInterval(this._refreshTimer);
        console.log('=== AUTH.LOGOUT CALLED ===');
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            .finally(() => {
                window.location.href = '/login.html';
            });
    }
};