const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const rb = require('../controllers/recycleBinController');

router.get('/', authenticateToken, rb.getItems);
router.post('/:id/restore', authenticateToken, requireAdmin, rb.restoreItem);
router.delete('/:id', authenticateToken, requireAdmin, rb.purgeItem);

module.exports = router;
