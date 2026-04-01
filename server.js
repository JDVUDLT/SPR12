// ===== ПОДКЛЮЧАЕМ ЗАВИСИМОСТИ =====
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const app = express();
const authMiddleware = require('./middleware/authMiddleware');
const teamsRoutes = require('./routes/teams');
const authRoutes = require('./routes/auth');
const employeesRoutes = require('./routes/employees');
const absencesRoutes = require('./routes/absences');
const settingsRoutes = require('./routes/settings');
const sprintsRoutes = require('./routes/sprints');
const holidaysRoutes = require('./routes/holidays');

// ===== MIDDLEWARE =====
app.use(express.json()); 
app.use(express.static(path.join(__dirname))); 
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// ===== МАРШРУТЫ ДЛЯ СТРАНИЦ =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/sprints', (req, res) => {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});