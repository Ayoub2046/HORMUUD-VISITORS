const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, serviceController.getServices);
router.post('/', authenticateToken, requireAdmin, serviceController.addService);
router.delete('/:name', authenticateToken, requireAdmin, serviceController.deleteService);

module.exports = router;
