const db = require('../config/db');

async function notify(userIds, payload) {
  const targetIds = Array.isArray(userIds) ? userIds : [userIds];
  const uniqueIds = [...new Set(targetIds.filter(Boolean))];
  for (const uid of uniqueIds) {
    try {
      await db.notifications.create({ user_id: uid, ...payload });
    } catch (e) {
      console.error('Failed to create notification:', e.message);
    }
  }
}

async function notifyAllStaff(payload) {
  try {
    const users = await db.users.findMany();
    const marketingIds = users.filter(u => u.role !== 'admin').map(u => u.id);
    await notify(marketingIds, payload);
  } catch (e) {
    console.error('Failed to notify staff:', e.message);
  }
}

module.exports = { notify, notifyAllStaff };
