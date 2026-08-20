const fs = require('fs-extra');
const FILE = 'Users.json';

async function getById(id) {
    const users = await fs.readJSON(FILE);
    return users.find(u => u.id === id);
}

module.exports = { getById };