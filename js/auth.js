window.auth = {
    user: null,

    async init() {
        if (this.user) return true; // уже проинициализированы

        try {
            const res = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Not authenticated');
            const data = await res.json();
            if (data.success && data.user) {
                this.user = data.user;
                return true;
            }
            throw new Error('Invalid response');
        } catch (err) {
            console.error('Auth init error:', err);
            this.user = null;
            return false;
        }
    },

    async getUser() {
        if (this.user) return this.user;
        const ok = await this.init();
        return ok ? this.user : null;
    },

    logout() {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            .finally(() => {
                window.location.href = '/login.html';
            });
    }
};