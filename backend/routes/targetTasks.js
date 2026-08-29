const express = require('express');
const router = express.Router();
const targetController = require('../controllers/targetController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/services', authenticateToken, targetController.getServices);
router.get('/reports/export', authenticateToken, requireAdmin, targetController.exportExcel);
router.get('/reports', authenticateToken, targetController.getReports);
router.get('/', authenticateToken, targetController.getTargets);
router.get('/:id', authenticateToken, targetController.getTarget);
router.post('/', authenticateToken, requireAdmin, targetController.createTarget);
router.put('/:id', authenticateToken, requireAdmin, targetController.updateTarget);
router.delete('/:id', authenticateToken, requireAdmin, targetController.deleteTarget);
router.post('/:id/progress', authenticateToken, targetController.logProgress);
router.delete('/:targetId/progress/:progressId', authenticateToken, targetController.deleteProgress);

module.exports = router;
