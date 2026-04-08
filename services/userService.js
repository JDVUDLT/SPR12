const fs = require('fs-extra');
const FILE = 'users.json';

async function getById(id) {
    const users = await fs.readJSON(FILE);
    return users.find(u => u.id === id);
}

module.exports = { getById };