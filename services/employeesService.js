const fs = require('fs-extra');
const FILE = 'employees.json';

async function ensure() {
    if (!await fs.pathExists(FILE)) {
        await fs.writeJSON(FILE, []);
    }
}

async function getByTeam(teamId) {
    await ensure();
    const data = await fs.readJSON(FILE);
    return data.filter(e => e.teamId === teamId);
}

async function create(data) {
    const employees = await fs.readJSON(FILE);
    const emp = {
        id: Date.now().toString(),
        ...data
    };
    employees.push(emp);
    await fs.writeJSON(FILE, employees);
    return emp;
}

async function updateById(id, data) {
    await ensure();
    const employees = await fs.readJSON(FILE);
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    employees[index] = {
        ...employees[index],
        fullName: data.fullName || employees[index].fullName,
        role: data.role || employees[index].role,
        hireDate: data.hireDate || employees[index].hireDate,
        fireDate: data.fireDate !== undefined ? data.fireDate : employees[index].fireDate
    };
    
    await fs.writeJSON(FILE, employees, { spaces: 4 });
    return employees[index];
}

async function deleteById(id) {
    await ensure();
    const employees = await fs.readJSON(FILE);
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) return null;
    const deleted = employees.splice(index, 1);
    await fs.writeJSON(FILE, employees, { spaces: 4 });
    return deleted[0];
}

module.exports = { ensure, getByTeam, create, deleteById, updateById };