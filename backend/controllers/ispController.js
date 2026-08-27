const db = require('../config/db');

exports.getIsps = async (req, res) => {
  try {
    const isps = await db.isps.findMany();
    res.json({ success: true, data: isps });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch ISPs.' });
  }
};

exports.addIsp = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'ISP name is required.' });
    }
    const result = await db.isps.create(name.trim());
    if (!result) {
      return res.status(400).json({ success: false, message: 'This ISP already exists or the name is invalid.' });
    }
    // result may be a row object (pgDb) or a string (mockDb)
    const ispName = typeof result === 'object' ? (result.name || name.trim().toUpperCase()) : result;
    await db.auditLogs.create({ user_id: req.user.id, action: 'CREATE_ISP', description: `Added ISP "${ispName}"` });
    res.status(201).json({ success: true, message: `ISP "${ispName}" added.`, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add ISP.' });
  }
};

exports.deleteIsp = async (req, res) => {
  try {
    const { name } = req.params;
    const result = await db.isps.delete(name);
    if (!result) return res.status(404).json({ success: false, message: 'ISP not found.' });
    await db.auditLogs.create({ user_id: req.user.id, action: 'DELETE_ISP', description: `Deleted ISP "${name}"` });
    res.json({ success: true, message: `ISP "${name}" deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete ISP.' });
  }
};
