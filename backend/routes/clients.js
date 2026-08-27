const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/template', authenticateToken, clientController.downloadTemplate);
router.post('/bulk', authenticateToken, clientController.bulkImport);
router.post('/upload', authenticateToken, clientController.uploadMiddleware, clientController.uploadFile);

router.get('/', authenticateToken, clientController.getClients);
router.get('/:id', authenticateToken, clientController.getClient);
router.post('/', authenticateToken, clientController.createClient);
router.put('/:id', authenticateToken, clientController.updateClient);
router.delete('/:id', authenticateToken, requireAdmin, clientController.deleteClient);
router.post('/:id/visits', authenticateToken, clientController.addVisit);

module.exports = router;
