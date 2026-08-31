# SprintPlanner

Веб-приложение для планирования спринтов, учёта трудоёмкости задач и управления командами.

## Возможности

- Аутентификация пользователей (JWT + защита от CSRF)
- Управление спринтами, командами и сотрудниками
- Расчёт трудоёмкости
- Учёт отсутствий и праздничных дней

## Стек

- Node.js + Express
- Vanilla JS / HTML / CSS
- JSON-хранилище (миграция на полноценную БД запланирована)

## Установка и запуск

```bash
git clone https://github.com/JDVUDLT/SPR12.git
cd SPR12
npm install
```

Перед первым запуском скопируйте файлы-заглушки с данными:

```bash
cp Users.example.json Users.json
cp sprints.example.json sprints.json
cp employees.example.json employees.json
cp teams.example.json teams.json
cp absences.example.json absences.json
cp holidays.example.json holidays.json
cp refreshTokens.example.json refreshTokens.json
```

Создайте `.env` файл с необходимыми переменными окружения (JWT-секреты и т.д.).

Запуск сервера:

```bash
node server.js
```

## Скачать готовую сборку

Готовый `.exe` для Windows доступен в разделе [Releases](https://github.com/JDVUDLT/SPR12/releases) — установка не требуется, просто запустите файл.

## Roadmap

- [ ] Переход с JSON-хранилища на PostgreSQL
- [ ] Юнит-тесты (Jest)
- [ ] CI/CD

## Лицензия

MIT
