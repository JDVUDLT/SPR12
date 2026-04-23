// ======================================
// auth.js
// ======================================

let accessToken = null;
let isRefreshing = false;
let refreshPromise = null;
let isLoggedOut = false;

window.auth = {
    accessToken: null,

    init() {
        this.accessToken = localStorage.getItem('accessToken');
        return true;
    },

    setAccessToken(token) {
        this.accessToken = token;

        if (token) {
            localStorage.setItem('accessToken', token);
        } else {
            localStorage.removeItem('accessToken');
        }
    },

    getAccessToken() {
        return this.accessToken;
    },

    logout() {
        this.setAccessToken(null);
        window.location.href = '/login.html';
    }
};