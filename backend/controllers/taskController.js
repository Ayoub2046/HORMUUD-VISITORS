const db = require('../config/db');
const { notify, notifyAllStaff } = require('../utils/notify');

exports.getTodayTasks = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasks = await db.tasks.findMany({ date: today });
    const users = await db.users.findMany();

    const enriched = tasks.map(t => {
      const assignedBy = users.find(u => u.id === t.assigned_by);
      const assignedTo = users.find(u => u.id === t.assigned_to);
      const completedBy = users.find(u => u.id === t.completed_by);
      return {
        ...t,
        assigned_by_name: assignedBy?.full_name || 'System',
        assigned_to_name: assignedTo?.full_name || 'All Staff',
        completed_by_name: completedBy?.full_name || null
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks.' });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasks = await db.tasks.findMany({ date: today, user_id: req.user.id });
    const users = await db.users.findMany();

    const enriched = tasks.map(t => {
      const assignedBy = users.find(u => u.id === t.assigned_by);
      const completedBy = users.find(u => u.id === t.completed_by);
      return {
        ...t,
        assigned_by_name: assignedBy?.full_name || 'System',
        completed_by_name: completedBy?.full_name || null
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks.' });
  }
};

exports.createTask = async (req, res) => {
  const { assigned_to, service, description, date } = req.body;

  if (!service || !description || !date) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields (Service, Description, Date).' });
  }

  try {
    const task = await db.tasks.create({
      assigned_by: req.user.id,
      assigned_to: assigned_to || null,
      service,
      description,
      date,
      status: 'pending'
    });

    await db.auditLogs.create({
      user_id: req.user.id,
      action: 'CREATE_TASK',
      description: `Assigned "${service}" task to ${assigned_to || 'all marketing staff'} for ${date}`
    });

    if (assigned_to) {
      await notify(assigned_to, {
        type: 'task',
        title: 'New task assigned',
        message: `You have been assigned "${service}" for ${date}.`,
        link: '/tasks'
      });
    } else {
      await notifyAllStaff({
        type: 'task',
        title: 'New work assigned',
        message: `A new "${service}" task has been assigned for ${date}.`,
        link: '/tasks'
      });
    }

    res.status(201).json({ success: true, message: 'Task created successfully.', data: task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, message: 'Failed to create task.' });
  }
};

exports.updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status, feedback } = req.body;

  try {
    const task = await db.tasks.findOne({ id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const updates = { status };
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = req.user.id;
      updates.feedback = feedback || '';
    }
    if (status === 'cancelled') {
      updates.feedback = feedback || '';
    }

    await db.tasks.update(id, updates);

    await db.auditLogs.create({
      user_id: req.user.id,
      action: 'UPDATE_TASK_STATUS',
      description: `Updated task "${task.service}" status to ${status}` + (feedback ? ` — Feedback: ${feedback}` : '')
    });

    res.json({ success: true, message: 'Task status updated.', data: updates });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, message: 'Failed to update task status.' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await db.tasks.findOne({ id: req.params.id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    await db.tasks.delete(req.params.id);

    await db.auditLogs.create({
      user_id: req.user.id,
      action: 'DELETE_TASK',
      description: `Deleted task "${task.service}"`
    });

    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, message: 'Failed to delete task.' });
  }
};

exports.getServices = async (req, res) => {
  try {
    const [ent, ind] = await Promise.all([db.entSvcs.findMany(), db.indSvcs.findMany()]);
    res.json({ success: true, data: [...ent, ...ind] });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services.' });
  }
};
