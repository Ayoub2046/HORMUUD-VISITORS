const db = require('../config/db');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await db.notifications.findMany({ user_id: req.user.id });
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

exports.countUnread = async (req, res) => {
  try {
    const count = await db.notifications.countUnread(req.user.id);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error counting notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to count notifications.' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const notification = await db.notifications.findOne(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    if (String(notification.user_id) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access Denied.' });
    }
    const updated = await db.notifications.update(req.params.id, { is_read: true });
    res.json({ success: true, message: 'Notification marked as read.', data: updated });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await db.notifications.markAllRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
};
