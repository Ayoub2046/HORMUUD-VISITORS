const express = require('express');
const router = express.Router();
const ispController = require('../controllers/ispController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, ispController.getIsps);
router.post('/', authenticateToken, requireAdmin, ispController.addIsp);
router.delete('/:name', authenticateToken, requireAdmin, ispController.deleteIsp);

module.exports = router;
