// ===== ПОДКЛЮЧАЕМ ЗАВИСИМОСТИ =====
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const cors = require('cors');
const authMiddleware = require('./middleware/authMiddleware');
const teamsRoutes = require('./routes/teams');
const authRoutes = require('./routes/auth');
const employeesRoutes = require('./routes/employees');
const absencesRoutes = require('./routes/absences');
const settingsRoutes = require('./routes/settings');
const sprintsRoutes = require('./routes/sprints');
const holidaysRoutes = require('./routes/holidays');
const { setCSRF, verifyCSRF } = require('./middleware/csrfMiddleware');

// ===== MIDDLEWARE ===== \\
app.use(express.json()); 
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use((req, res, next) => {
    console.log("➡️ REQUEST:", req.method, req.url);
    next();
});
app.use((req, res, next) => {
    console.log("COOKIE IN REQUEST:", req.cookies);
    next();
});
app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});
const csrfProtectedRoutes = [
    '/api/teams',
    '/api/employees',
    '/api/absences',
    '/api/sprints',
    '/api/settings',
    '/api/holidays'
];

app.use(setCSRF);
app.use((req, res, next) => {
    const isProtected = csrfProtectedRoutes.some(route =>
        req.path.startsWith(route)
    );

    if (!isProtected) {
        return next();
    }

    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        return verifyCSRF(req, res, next);
    }

    next();
});
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use(express.static(path.join(__dirname), {
    etag: false,
    lastModified: false,
    maxAge: 0
}));

// ===== МАРШРУТЫ ДЛЯ СТРАНИЦ =====
app.get('/', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/profile', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'profile.html'));
});

app.get('/dashboard', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/sprints', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'sprints.html'));
});

// ===== API МАРШРУТЫ =====

app.use('/api/auth', authRoutes);

// ===== КОМАНДЫ =====

app.use('/api/teams', authMiddleware, teamsRoutes);

// ===== СОТРУДНИКИ =====

app.use('/api/employees', authMiddleware, employeesRoutes);

// ===== ОТСУТСТВИЯ =====

app.use('/api/absences', authMiddleware, absencesRoutes);

// ===== НАСТРОЙКИ СПРИНТОВ =====

app.use('/api/settings', settingsRoutes);

// ===== СПРИНТЫ =====

app.use('/api/sprints', sprintsRoutes);

// ===== ПРАЗДНИКИ =====

app.use('/api/holidays', holidaysRoutes);


app.post('/api/test', (req, res) => {
    console.log("✅ Тестовый маршрут сработал!");
    res.json({ success: true, received: req.body });
});
app.post('/api/auth/login-test', (req, res) => {
    console.log("🔥 LOGIN HIT BACKEND");
    res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});