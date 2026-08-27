const db = require('../config/db');

exports.getItems = async (req, res) => {
  try {
    const items = await db.recycleBin.findMany();
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch recycle bin.' });
  }
};

exports.restoreItem = async (req, res) => {
  try {
    const item = await db.recycleBin.restore(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found in recycle bin.' });
    await db.auditLogs.create({ user_id: req.user.id, action: 'RESTORE', description: `Restored ${item.type} from recycle bin` });
    res.json({ success: true, message: `Item restored.`, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to restore item.' });
  }
};

exports.purgeItem = async (req, res) => {
  try {
    const item = await db.recycleBin.purge(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found in recycle bin.' });
    await db.auditLogs.create({ user_id: req.user.id, action: 'PURGE', description: `Permanently deleted ${item.type} from recycle bin` });
    res.json({ success: true, message: 'Item permanently deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to purge item.' });
  }
};
