const db = require('../config/db');

exports.getTasks = async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.user.role === 'marketing') {
      filters.assigned_to = req.user.id;
    }
    let tasks = await db.visitTasks.findMany(filters);
    const users = await db.users.findMany();
    tasks = tasks.map(t => {
      const creator = users.find(u => u.id === t.created_by);
      const assignees = (t.assigned_to || []).map(id => {
        const u = users.find(x => x.id === id);
        return u ? u.full_name : 'Unknown';
      });
      return { ...t, createdByName: creator?.full_name || 'Unknown', assignedToNames: assignees };
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch visit tasks.' });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await db.visitTasks.findOne(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    const users = await db.users.findMany();
    const reports = await db.visitReports.findMany({ task_id: req.params.id });
    const enrichedReports = reports.map(r => {
      const submitter = users.find(u => u.id === r.submitted_by);
      return { ...r, submittedByName: submitter?.full_name || 'Unknown' };
    });
    const creator = users.find(u => u.id === task.created_by);
    res.json({ success: true, data: { ...task, createdByName: creator?.full_name || 'Unknown', reports: enrichedReports } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch task.' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, assigned_to, services } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: 'Title is required.' });
    const task = await db.visitTasks.create({
      title: title.trim(),
      description: description || '',
      assigned_to: assigned_to || [],
      services: services || [],
      created_by: req.user.id,
      status: 'active'
    });
    const today = new Date().toISOString().split('T')[0];
    const svc = (services && services.length > 0) ? services[0] : 'Visit Task';
    const desc = title.trim().substring(0, 100);
    const firstAssignee = (assigned_to && assigned_to.length > 0) ? assigned_to[0] : null;
    await db.tasks.create({
      assigned_by: req.user.id,
      assigned_to: firstAssignee,
      service: svc,
      description: desc,
      date: today,
      status: 'pending'
    });
    await db.auditLogs.create({ user_id: req.user.id, action: 'CREATE_VISIT_TASK', description: `Created visit task "${task.title}"` });
    await db.auditLogs.create({ user_id: req.user.id, action: 'CREATE_DAILY_TASK', description: `Created daily task "${svc}" linked to visit task "${task.title}"` });
    res.status(201).json({ success: true, message: 'Visit task created.', data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create task.' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await db.visitTasks.findOne(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    const updated = await db.visitTasks.update(req.params.id, req.body);
    res.json({ success: true, message: 'Task updated.', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update task.' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const result = await db.visitTasks.delete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete task.' });
  }
};

exports.submitReport = async (req, res) => {
  try {
    const task = await db.visitTasks.findOne(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    const { client_name, client_phone, location, notes, service_data } = req.body;
    if (!client_name || !client_name.trim()) return res.status(400).json({ success: false, message: 'Client name is required.' });
    const report = await db.visitReports.create({
      task_id: req.params.id,
      submitted_by: req.user.id,
      client_name: client_name.trim(),
      client_phone: client_phone || '',
      location: location || '',
      notes: notes || '',
      service_data: service_data || {}
    });
    await db.auditLogs.create({ user_id: req.user.id, action: 'SUBMIT_VISIT_REPORT', description: `Submitted report for "${client_name}" on task "${task.title}"` });
    res.status(201).json({ success: true, message: 'Visit report submitted.', data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit report.' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const filters = {};
    if (req.query.task_id) filters.task_id = req.query.task_id;
    if (req.user.role === 'marketing') filters.submitted_by = req.user.id;
    let reports = await db.visitReports.findMany(filters);
    const users = await db.users.findMany();
    const tasks = await db.visitTasks.findMany();
    reports = reports.map(r => {
      const submitter = users.find(u => u.id === r.submitted_by);
      const task = tasks.find(t => t.id === r.task_id);
      return { ...r, submittedByName: submitter?.full_name || 'Unknown', taskTitle: task?.title || 'Unknown' };
    });
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports.' });
  }
};
