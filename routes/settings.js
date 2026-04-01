const express = require('express');
const router = express.Router();
const fs = require('fs-extra');

const authMiddleware = require('../middleware/authMiddleware');
const checkTeamAccess = require('../utils/checkTeamAccess');

// ===== ПОЛУЧИТЬ НАСТРОЙКИ =====
router.get('/:teamId', authMiddleware, async (req, res) => {
    console.log(`📋 GET /api/settings/${req.params.teamId}`);

    const { teamId } = req.params;
    const userId = req.user.id;

    // 🔐 проверка доступа
    const hasAccess = await checkTeamAccess(teamId, userId);
    if (!hasAccess) {
        return res.status(403).json({ error: "Нет доступа к команде" });
    }

    try {
        const filePath = 'settings.json';

        if (!await fs.pathExists(filePath)) {
            await fs.writeJSON(filePath, [], { spaces: 4 });
        }

        const settings = await fs.readJSON(filePath);

        const teamSettings = settings.find(s => s.teamId === teamId);

        if (teamSettings) {
            return res.json(teamSettings);
        }

        // дефолт
        res.json({
            teamId,
            duration: 14,
            firstStart: new Date().toISOString().split('T')[0],
            coefficient: 1.0
        });

    } catch (error) {
        console.error("❌ SETTINGS ERROR:", error);
        res.status(500).json({ error: error.message });
    }
});

// ===== СОХРАНИТЬ НАСТРОЙКИ =====
router.post('/:teamId', authMiddleware, async (req, res) => {
    console.log(`📋 POST /api/settings/${req.params.teamId}`);

    const { teamId } = req.params;
    const userId = req.user.id;

    // 🔐 проверка доступа
    const hasAccess = await checkTeamAccess(teamId, userId);
    if (!hasAccess) {
        return res.status(403).json({ error: "Нет доступа к команде" });
    }

    try {
        const filePath = 'settings.json';

        if (!await fs.pathExists(filePath)) {
            await fs.writeJSON(filePath, [], { spaces: 4 });
        }

        const settings = await fs.readJSON(filePath);

        const index = settings.findIndex(s => s.teamId === teamId);

        const newSettings = {
            teamId,
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        if (index === -1) {
            settings.push(newSettings);
        } else {
            settings[index] = newSettings;
        }

        await fs.writeJSON(filePath, settings, { spaces: 4 });

        res.json(newSettings);

    } catch (error) {
        console.error("❌ SAVE SETTINGS ERROR:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;