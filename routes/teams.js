const router = require('express').Router();
const controller = require('../controllers/teamsController');
const auth = require('../middleware/authMiddleware');

router.use(auth);

router.get('/', controller.getTeams);
router.post('/', controller.createTeam);

module.exports = router;