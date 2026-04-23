const fs = require('fs-extra');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ACCESS_SECRET, REFRESH_SECRET } = require('../utils/config');
const path = require('path');
const SESSIONS_FILE = path.join(__dirname, '../refreshTokens.json');

const FILE = 'Users.json';

async function ensureFile() {
    if (!await fs.pathExists(FILE)) {
        await fs.writeJSON(FILE, []);
    }
}

async function safeReadJSON(file) {
    try {
        if (await fs.pathExists(file)) {
            return await fs.readJSON(file);
        }
        return [];
    } catch {
        return [];
    }
}

async function logout(refreshToken) {
    if (!refreshToken) {
        throw new Error("Нет refresh токена");
    }

    let sessions = await safeReadJSON(SESSIONS_FILE);

    const before = sessions.length;

    sessions = sessions.filter(s => s.refreshToken !== refreshToken);

    await fs.writeJSON(SESSIONS_FILE, sessions, { spaces: 4 });

    console.log(`🔐 Logout: удалено ${before - sessions.length} сессий`);

    return { success: true };
}

// ===== REGISTER =====
async function register(data) {
    await ensureFile();

    const { name, log, email, pass } = data;

    if (!name || !log || !pass) {
        throw new Error("Все поля обязательны");
    }

    if (email && !email.includes("@")) {
        throw new Error("Некорректный email");
    }

    const users = await fs.readJSON(FILE);

    const existingUser = users.find(u => u.log === log);
    if (existingUser) {
        throw new Error("Пользователь уже существует");
    }

    const hashedPassword = await bcrypt.hash(pass, 10);

    const newUser = {
        id: Date.now().toString(),
        name,
        log,
        email: email || '',
        pass: hashedPassword,
        role: "owner",
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await fs.writeJSON(FILE, users, { spaces: 4 });

    return {
        id: newUser.id,
        name: newUser.name,
        log: newUser.log,
        email: newUser.email
    };
}

// ===== LOGIN =====
async function login(data, req) {
    await ensureFile();

    const { log, pass } = data;

    const users = await fs.readJSON(FILE);

    const user = users.find(u => u.log === log);
    if (!user) {
        throw new Error("Пользователь не найден");
    }

    const isMatch = await bcrypt.compare(pass, user.pass);
    if (!isMatch) {
        throw new Error("Неверный пароль");
    }

    const payload = {
        id: user.id,
        log: user.log,
        role: user.role || "owner"
    };

    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

    const sessions = await safeReadJSON(SESSIONS_FILE);

    sessions.push({
        id: Date.now().toString(),
        userId: user.id,
        refreshToken,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
    });

    await fs.writeJSON(SESSIONS_FILE, sessions, { spaces: 4 });

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            log: user.log,
            role: user.role
        }
    };
}

async function generateTokens(user) {
    const accessToken = jwt.sign(
        { id: user.id },
        ACCESS_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    const tokens = await safeReadJSON(SESSIONS_FILE);

    tokens.push({
        token: refreshToken,
        userId: user.id
    });

    await fs.writeJSON(SESSIONS_FILE, tokens);

    return { accessToken, refreshToken };
}

async function refresh(refreshToken) {
    let sessions = await safeReadJSON(SESSIONS_FILE);

    const session = sessions.find(s => s.refreshToken === refreshToken);

    if (!session) {
        throw new Error("Session not found");
    }

    let user;

    try {
        user = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (e) {
        // удаляем протухший токен
        sessions = sessions.filter(s => s.refreshToken !== refreshToken);
        await fs.writeJSON(SESSIONS_FILE, sessions, { spaces: 4 });

        throw new Error("Refresh expired");
    }

    // 🔁 ROTATION

    const { exp, iat, ...cleanUser } = user;
    const newAccessToken = jwt.sign(cleanUser, ACCESS_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign(cleanUser, REFRESH_SECRET, { expiresIn: '7d' });

    sessions = sessions.map(s => {
        if (s.refreshToken === refreshToken) {
            return {
                ...s,
                refreshToken: newRefreshToken,
                lastUsed: new Date().toISOString()
            };
        }
        return s;
    });

    await fs.writeJSON(SESSIONS_FILE, sessions, { spaces: 4 });

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    };
}

async function getUserSessions(userId) {
    const sessions = await safeReadJSON(SESSIONS_FILE);
    return sessions.filter(s => s.userId === userId);
}

async function deleteSession(sessionId, userId) {
    let sessions = await safeReadJSON(SESSIONS_FILE);

    sessions = sessions.filter(s => !(s.id === sessionId && s.userId === userId));

    await fs.writeJSON(SESSIONS_FILE, sessions, { spaces: 4 });
}

async function deleteAllSessions(userId) {
    let sessions = await safeReadJSON(SESSIONS_FILE);

    sessions = sessions.filter(s => s.userId !== userId);

    await fs.writeJSON(SESSIONS_FILE, sessions, { spaces: 4 });
}


module.exports = {
    logout,
    register,
    login,
    generateTokens,
    refresh,
    getUserSessions,
    deleteSession,
    deleteAllSessions
};
