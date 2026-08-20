const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
    // JSON-файлы сервера (Users.json, sprints.json и т.д.) пишутся
    // относительно текущей рабочей директории — переключаем её
    // на папку данных пользователя, чтобы туда точно можно было писать
    process.chdir(app.getPath('userData'));

    // Запускаем твой Express-сервер как есть — он сам вызовет app.listen
    require(path.join(__dirname, 'server.js'));

    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        icon: path.join(__dirname, 'icon.ico') // опционально, если есть иконка
    });

    win.loadURL('http://localhost:3000');
});

app.on('window-all-closed', () => {
    app.quit();
});