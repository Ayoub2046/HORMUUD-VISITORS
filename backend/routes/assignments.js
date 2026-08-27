const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const assignmentController = require('../controllers/assignmentController');

router.get('/', authenticateToken, assignmentController.getAssignments);
router.post('/', authenticateToken, requireAdmin, assignmentController.createAssignment);
router.put('/:id/complete', authenticateToken, assignmentController.completeAssignment);
router.delete('/:id', authenticateToken, requireAdmin, assignmentController.deleteAssignment);

module.exports = router;
