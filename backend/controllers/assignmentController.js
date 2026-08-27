const db = require('../config/db');

exports.getAssignments = async (req, res) => {
  try {
    const filters = {};
    if (req.query.client_id) filters.client_id = req.query.client_id;
    if (req.query.status) filters.status = req.query.status;
    if (req.user.role === 'marketing') {
      filters.assigned_to = req.user.id;
    }
    let assignments = await db.clientAssignments.findMany(filters);
    const users = await db.users.findMany();
    const clients = await db.clients.findMany();
    assignments = assignments.map(a => {
      const client = clients.find(c => c.id === a.client_id);
      const assignedByUser = users.find(u => u.id === a.assigned_by);
      const assignedToUsers = a.assigned_to.map(uid => {
        const u = users.find(x => x.id === uid);
        return u ? u.full_name : 'Unknown';
      });
      return {
        ...a,
        clientName: client?.name || 'Unknown',
        clientType: client?.type || '',
        assignedByName: assignedByUser?.full_name || 'Unknown',
        assignedToNames: assignedToUsers
      };
    });
    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assignments.' });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const { client_id, assigned_to, type, notes, date } = req.body;
    if (!client_id) return res.status(400).json({ success: false, message: 'Client is required.' });
    if (!assigned_to || (Array.isArray(assigned_to) && assigned_to.length === 0)) {
      return res.status(400).json({ success: false, message: 'At least one marketer must be assigned.' });
    }
    const to = Array.isArray(assigned_to) ? assigned_to : [assigned_to];
    const assignment = await db.clientAssignments.create({
      client_id, assigned_to: to, assigned_by: req.user.id,
      type: type || 'visit', notes: notes || '', date: date || new Date().toISOString().split('T')[0]
    });
    await db.auditLogs.create({ user_id: req.user.id, action: 'CREATE_ASSIGNMENT', description: `Assigned ${to.length} marketer(s) to client ${client_id} for a ${assignment.type}` });
    res.status(201).json({ success: true, message: 'Assignment created.', data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create assignment.' });
  }
};

exports.completeAssignment = async (req, res) => {
  try {
    const assignment = await db.clientAssignments.findOne(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });
    if (req.user.role === 'marketing' && !assignment.assigned_to.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'This assignment is not for you.' });
    }
    const { status, notes } = req.body;
    const updated = await db.clientAssignments.update(req.params.id, {
      status: status || 'completed',
      notes: notes || assignment.notes,
      completed_at: new Date().toISOString()
    });
    if (status === 'completed' || !status) {
      await db.clients.addVisit(assignment.client_id, {
        agent: req.user.full_name || req.user.name,
        status: 'Active',
        notes: `Completed ${assignment.type}: ${notes || 'Visit done'}`
      });
    }
    await db.auditLogs.create({ user_id: req.user.id, action: 'COMPLETE_ASSIGNMENT', description: `Completed assignment for client ${assignment.client_id}` });
    res.json({ success: true, message: 'Assignment completed.', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to complete assignment.' });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const result = await db.clientAssignments.delete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Assignment not found.' });
    res.json({ success: true, message: 'Assignment deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete assignment.' });
  }
};
