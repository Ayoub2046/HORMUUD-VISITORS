const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const vt = require('../controllers/visitTaskController');

router.get('/', authenticateToken, vt.getTasks);
router.get('/reports', authenticateToken, vt.getReports);
router.get('/:id', authenticateToken, vt.getTask);
router.post('/', authenticateToken, requireAdmin, vt.createTask);
router.put('/:id', authenticateToken, requireAdmin, vt.updateTask);
router.delete('/:id', authenticateToken, requireAdmin, vt.deleteTask);
router.post('/:id/reports', authenticateToken, vt.submitReport);

module.exports = router;
