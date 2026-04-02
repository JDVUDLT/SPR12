const fs = require('fs-extra');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

const FILE = 'Users.json';

async function ensureFile() {
    if (!await fs.pathExists(FILE)) {
        await fs.writeJSON(FILE, []);
    }
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

    const accessToken = jwt.sign(payload, SECRET_KEY, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });

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

module.exports = {
    register,
    login
};