const fs = require('fs-extra');

async function safeReadJSON(path) {
    try {
        return await fs.readJSON(path);
    } catch {
        return [];
    }
}

module.exports = { safeReadJSON };