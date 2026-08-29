const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.countUnread);
router.put('/:id/read', notificationController.markRead);
router.put('/mark-all-read', notificationController.markAllRead);

module.exports = router;
