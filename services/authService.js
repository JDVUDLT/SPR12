const fs = require('fs-extra');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ACCESS_SECRET, REFRESH_SECRET } = require('../utils/config');
const REFRESH_FILE = 'refreshTokens.json';

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

    let tokens = await safeReadJSON(REFRESH_FILE);

    const before = tokens.length;

    tokens = tokens.filter(t => t.token !== refreshToken);

    const after = tokens.length;

    await fs.writeJSON(REFRESH_FILE, tokens, { spaces: 4 });

    console.log(`🔐 Logout: удалено ${before - after} токенов`);

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
async function login(data) {
    await ensureFile();

    const { log, pass } = data;

    if (!log || !pass) {
        throw new Error("Логин и пароль обязательны");
    }

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

    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });

    return {
    accessToken,
    refreshToken,
    user: {
        id: user.id,
        name: user.name,
        log: user.log,
        email: user.email,
        role: user.role || "owner"
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

    const tokens = await safeReadJSON(REFRESH_FILE);

    tokens.push({
        token: refreshToken,
        userId: user.id
    });

    await fs.writeJSON(REFRESH_FILE, tokens);

    return { accessToken, refreshToken };
}

async function refresh(refreshToken) {
    if (!refreshToken) {
        throw new Error("Нет refresh токена");
    }

    const tokens = await safeReadJSON(REFRESH_FILE);

    const exists = tokens.find(t => t.token === refreshToken);

    if (!exists) {
        throw new Error("Refresh токен не найден");
    }

    let payload;

    try {
        payload = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (e) {
        throw new Error("Refresh токен истёк");
    }

    // 🔥 rotation (очень важно)
    const newTokens = tokens.filter(t => t.token !== refreshToken);

    const newAccessToken = jwt.sign(
        { id: payload.id },
        ACCESS_SECRET,
        { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
        { id: payload.id },
        REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    newTokens.push({
        token: newRefreshToken,
        userId: payload.id
    });

    await fs.writeJSON(REFRESH_FILE, newTokens);

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    };
}


module.exports = {
    logout,
    register,
    login,
    generateTokens,
    refresh
};