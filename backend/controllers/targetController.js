const db = require('../config/db');
const ExcelJS = require('exceljs');

const HORMUUD_SERVICES = [
  'EVC Plus (Mobile Money)', 'WAAFI App (Fintech)', 'GSM Mobile Services (Voice & Calls)',
  'Mobile Data (2G/3G/4G/5G)', 'ADSL Plus (Home Broadband)', 'FTTH (Fiber to the Home)',
  'Hormuud Mifi (Portable WiFi)', 'Hormuud Hotspot (Public WiFi)', 'Enterprise Internet (Business)',
  'My SMS (Bulk Messaging)', 'Fixed Line Services', 'International Roaming',
  'International Calls', '5G Plus (LTE-A / LTE-Advanced)', 'EVC Plus Merchant Registration',
  'Fibre Optic Connectivity', 'Corporate & Enterprise Plans', 'Hormuud Salaam Foundation (CSR)'
];

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

const toDateStr = (d) => {
  if (!d) return '';
  const o = (d instanceof Date) ? d : new Date(d);
  if (isNaN(o.getTime())) return '';
  const y = o.getFullYear();
  const m = String(o.getMonth() + 1).padStart(2, '0');
  const day = String(o.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getPeriodKey = (periodType, dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (periodType === 'daily') return `${y}-${m}-${day}`;
  if (periodType === 'weekly') {
    // Week starts on Monday
    const dow = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - dow);
    const my = monday.getFullYear();
    const mm = String(monday.getMonth() + 1).padStart(2, '0');
    const md = String(monday.getDate()).padStart(2, '0');
    return `${my}-W${mm}-${md}`;
  }
  if (periodType === 'monthly') return `${y}-${m}`;
  if (periodType === 'yearly') return `${y}`;
  return null;
};

const enrichTargets = (targets, progress, users) => {
  return targets.map(t => {
    const inPeriod = (p) => {
      const d = toDateStr(p.visit_date) || toDateStr(p.created_at);
      if (!d) return true;
      if (t.start_date && d < t.start_date) return false;
      if (t.end_date && d > t.end_date) return false;
      return true;
    };
    const progressRows = progress.filter(p => p.target_id === t.id && inPeriod(p));
    const achieved = progressRows.length;
    const assignee = users.find(u => u.id === t.assigned_to);
    const manager = users.find(u => u.id === t.assigned_by);
    const remaining = Math.max(0, t.target_quantity - achieved);
    const percent = t.target_quantity > 0 ? Math.min(100, Math.round((achieved / t.target_quantity) * 100)) : 0;
    const status = t.status === 'active' && achieved >= t.target_quantity ? 'completed' : t.status;
    const contributors = {};
    progressRows.forEach(p => {
      const uname = users.find(u => u.id === p.user_id)?.full_name || 'Unknown';
      contributors[p.user_id] = (contributors[p.user_id] || 0) + 1;
    });
    return {
      ...t,
      status,
      achieved,
      remaining,
      percent,
      assigned_to_name: assignee?.full_name || null,
      assigned_by_name: manager?.full_name || 'Manager',
      contributors: Object.entries(contributors).map(([uid, count]) => ({
        user_id: uid,
        name: users.find(u => u.id === uid)?.full_name || 'Unknown',
        count
      })),
      progress: progressRows.map(p => {
        const user = users.find(u => u.id === p.user_id);
        return { ...p, user_name: user?.full_name || 'Unknown' };
      })
    };
  });
};

// Auto-complete: targets must complete automatically (never manually) when met or expired.
// achievedById maps target_id -> achieved count for the current viewer (total for admin).
const autoComplete = async (targets, achievedById) => {
  const today = toDateStr(new Date());
  const toComplete = [];
  for (const t of targets) {
    if (!t || t.status === 'cancelled') continue;
    const achieved = achievedById[t.id] || 0;
    const met = t.status === 'active' && achieved >= t.target_quantity;
    const expired = t.status === 'active' && t.end_date && today > t.end_date;
    if ((met || expired) && t.status !== 'completed') {
      toComplete.push(t.id);
    }
  }
  for (const id of toComplete) {
    await db.targetTasks.update(id, { status: 'completed' });
  }
  return toComplete;
};

exports.getServices = async (req, res) => {
  res.json({ success: true, data: HORMUUD_SERVICES });
};
exports.getTargets = async (req, res) => {
  try {
    const filters = {};
    if (req.user.role === 'marketing') {
      // Marketers see targets assigned to them personally OR to all staff
      const mine = await db.targetTasks.findMany({ assigned_to: req.user.id });
      const allStaff = await db.targetTasks.findMany({ assigned_to: null });
      const merged = [...mine, ...allStaff];
      const unique = merged.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
      const progress = await db.targetProgress.findMany({ user_id: req.user.id });
      const users = await db.users.findMany();
      const enriched = enrichTargets(unique, progress, users);
      return res.json({ success: true, data: enriched });
    }
    if (req.query.status) filters.status = req.query.status;
    const targets = await db.targetTasks.findMany(filters);
    const allProgress = await db.targetProgress.findMany();
    const users = await db.users.findMany();
    const achievedById = {};
    targets.forEach(t => { achievedById[t.id] = allProgress.filter(p => p.target_id === t.id).length; });
    await autoComplete(targets, achievedById);
    res.json({ success: true, data: enrichTargets(targets, allProgress, users) });
  } catch (error) {
    console.error('Error fetching target tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch target tasks.' });
  }
};

exports.getTarget = async (req, res) => {
  try {
    const target = await db.targetTasks.findOne(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Target not found.' });
    const progress = await db.targetProgress.findMany({ target_id: req.params.id });
    const users = await db.users.findMany();
    await autoComplete([target], { [target.id]: progress.length });
    res.json({ success: true, data: enrichTargets([target], progress, users)[0] });
  } catch (error) {
    console.error('Error fetching target:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch target.' });
  }
};

exports.createTarget = async (req, res) => {
  const { service, target_quantity, period_type, start_date, end_date, assigned_to } = req.body;
  if (!service) return res.status(400).json({ success: false, message: 'Service is required.' });
  if (!target_quantity || Number(target_quantity) <= 0) return res.status(400).json({ success: false, message: 'Target quantity must be greater than zero.' });
  if (!PERIODS.includes(period_type)) return res.status(400).json({ success: false, message: 'Invalid period type.' });

  try {
    const target = await db.targetTasks.create({
      service,
      target_quantity: Number(target_quantity),
      period_type,
      start_date: start_date || null,
      end_date: end_date || null,
      assigned_to: assigned_to || null,
      assigned_by: req.user.id,
      status: 'active'
    });
    const assignee = assigned_to ? (await db.users.findMany()).find(u => u.id === assigned_to)?.full_name : 'all marketing staff';
    await db.auditLogs.create({
      user_id: req.user.id,
      action: 'CREATE_TARGET',
      description: `Set a ${period_type} target of ${target_quantity} for "${service}" assigned to ${assignee}`
    });
    res.status(201).json({ success: true, message: 'Target task created successfully.', data: target });
  } catch (error) {
    console.error('Error creating target:', error);
    res.status(500).json({ success: false, message: 'Failed to create target task.' });
  }
};

exports.updateTarget = async (req, res) => {
  try {
    const target = await db.targetTasks.findOne(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Target not found.' });
    // Status is managed automatically (completes when achieved/expired). Never allow manual status edits.
    if (req.body.status && req.body.status !== target.status) {
      return res.status(400).json({ success: false, message: 'Target status is updated automatically when the target is met or expires.' });
    }
    const updates = { ...req.body };
    delete updates.status;
    const updated = await db.targetTasks.update(req.params.id, updates);
    await db.auditLogs.create({ user_id: req.user.id, action: 'UPDATE_TARGET', description: `Updated target "${updated.service}"` });
    res.json({ success: true, message: 'Target updated.', data: updated });
  } catch (error) {
    console.error('Error updating target:', error);
    res.status(500).json({ success: false, message: 'Failed to update target.' });
  }
};

exports.deleteTarget = async (req, res) => {
  try {
    const target = await db.targetTasks.findOne(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Target not found.' });
    await db.targetTasks.delete(req.params.id);
    await db.auditLogs.create({ user_id: req.user.id, action: 'DELETE_TARGET', description: `Deleted target "${target.service}"` });
    res.json({ success: true, message: 'Target deleted.' });
  } catch (error) {
    console.error('Error deleting target:', error);
    res.status(500).json({ success: false, message: 'Failed to delete target.' });
  }
};

exports.logProgress = async (req, res) => {
  const { client_name, client_phone, location, visit_date, services, notes } = req.body;
  if (!client_name || !client_name.trim()) return res.status(400).json({ success: false, message: 'Client name is required.' });

  try {
    const target = await db.targetTasks.findOne(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Target not found.' });
    if (target.status === 'completed') return res.status(400).json({ success: false, message: 'This target is already completed.' });
    if (target.status === 'cancelled') return res.status(400).json({ success: false, message: 'This target has been cancelled.' });
    if (target.assigned_to && target.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'This target is not assigned to you.' });
    }

    const svcList = Array.isArray(services) ? services : [];
    // Ensure at least the target's service is recorded so the visit always contributes
    if (svcList.indexOf(target.service) === -1) svcList.unshift(target.service);

    const progress = await db.targetProgress.create({
      target_id: req.params.id,
      user_id: req.user.id,
      client_name: client_name.trim(),
      client_phone: client_phone || '',
      location: location || '',
      visit_date: visit_date || new Date().toISOString().split('T')[0],
      services: svcList,
      notes: notes || ''
    });

    await db.auditLogs.create({
      user_id: req.user.id,
      action: 'TARGET_PROGRESS',
      description: `Recorded client "${client_name.trim()}" service visit (${svcList.join(', ')}) toward target for "${target.service}"`
    });

    res.status(201).json({ success: true, message: 'Client service visit recorded.', data: progress });
  } catch (error) {
    console.error('Error logging target progress:', error);
    res.status(500).json({ success: false, message: 'Failed to log progress.' });
  }
};

exports.deleteProgress = async (req, res) => {
  try {
    const { targetId, progressId } = req.params;
    const target = await db.targetTasks.findOne(targetId);
    if (!target) return res.status(404).json({ success: false, message: 'Target not found.' });
    const removed = await db.targetProgress.delete(progressId);
    if (!removed) return res.status(404).json({ success: false, message: 'Progress entry not found.' });
    res.json({ success: true, message: 'Progress entry removed.' });
  } catch (error) {
    console.error('Error deleting progress:', error);
    res.status(500).json({ success: false, message: 'Failed to delete progress.' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const allProgress = await db.targetProgress.findMany();
    const targets = await db.targetTasks.findMany();
    const users = await db.users.findMany();

    // Only include progress relevant to the current marketer
    let progress = allProgress;
    if (req.user.role === 'marketing') {
      const myTargetIds = targets
        .filter(t => !t.assigned_to || t.assigned_to === req.user.id)
        .map(t => t.id);
      progress = allProgress.filter(p => p.user_id === req.user.id && myTargetIds.includes(p.target_id));
    }

    const breakdown = [];
    progress.forEach(p => {
      const target = targets.find(t => t.id === p.target_id);
      if (!target) return;
      const user = users.find(u => u.id === p.user_id);
      const dateStr = toDateStr(p.visit_date) || toDateStr(p.created_at);
      breakdown.push({
        target_id: target.id,
        service: target.service,
        period_type: target.period_type,
        date: dateStr,
        period_key: getPeriodKey(target.period_type, dateStr),
        user_id: p.user_id,
        user_name: user?.full_name || 'Unknown',
        client_name: p.client_name,
        client_phone: p.client_phone,
        location: p.location,
        services: p.services || [],
        notes: p.notes
      });
    });

    // Aggregate by period_key
    const aggregated = {};
    breakdown.forEach(b => {
      const key = b.period_key;
      if (!key) return;
      if (!aggregated[key]) aggregated[key] = { period_key: key, period_type: b.period_type, counts: {} };
      aggregated[key].counts[b.user_id] = (aggregated[key].counts[b.user_id] || 0) + 1;
    });
    const byPeriod = Object.values(aggregated)
      .map(g => ({
        period_key: g.period_key,
        period_type: g.period_type,
        total: Object.values(g.counts).reduce((s, n) => s + n, 0),
        byUser: Object.entries(g.counts).map(([uid, count]) => ({
          user_id: uid,
          name: users.find(u => u.id === uid)?.full_name || 'Unknown',
          count
        }))
      }))
      .sort((a, b) => b.period_key.localeCompare(a.period_key));

    // Aggregate by target service
    const byService = {};
    breakdown.forEach(b => {
      byService[b.service] = (byService[b.service] || 0) + 1;
    });

    // Aggregate by the actual Hormuud services delivered to clients
    const byServicesDelivered = {};
    breakdown.forEach(b => {
      (b.services || []).forEach(s => { byServicesDelivered[s] = (byServicesDelivered[s] || 0) + 1; });
    });

    res.json({ success: true, data: { breakdown, byPeriod, byService, byServicesDelivered } });
  } catch (error) {
    console.error('Error fetching target reports:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch target reports.' });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const targets = (await db.targetTasks.findMany()).filter(t => t.status !== 'cancelled');
    const progress = await db.targetProgress.findMany();
    const users = await db.users.findMany();
    const enriched = enrichTargets(targets, progress, users);

    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Target Summary
    const summary = workbook.addWorksheet('Target Summary');
    summary.columns = [
      { header: 'Service', key: 'service', width: 26 },
      { header: 'Period', key: 'period_type', width: 12 },
      { header: 'Start Date', key: 'start_date', width: 14 },
      { header: 'End Date', key: 'end_date', width: 14 },
      { header: 'Assigned To', key: 'assigned_to', width: 20 },
      { header: 'Target Qty', key: 'target_quantity', width: 12 },
      { header: 'Achieved', key: 'achieved', width: 12 },
      { header: 'Percent', key: 'pct', width: 10 },
      { header: 'Status', key: 'status', width: 12 }
    ];
    summary.getRow(1).font = { bold: true };
    for (const t of enriched) {
      summary.addRow({
        service: t.service,
        period_type: t.period_type,
        start_date: t.start_date || '',
        end_date: t.end_date || '',
        assigned_to: t.assigned_to_name || 'All Marketing Staff',
        target_quantity: t.target_quantity,
        achieved: t.achieved,
        pct: `${t.pct}%`,
        status: t.status
      });
    }
    // Color-code the percent cell
    summary.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      // green when completed, red when behind
      if (String(row.getCell('status').value).toLowerCase() === 'completed') {
        row.getCell('pct').font = { color: { argb: '16A34A' }, bold: true };
      } else {
        row.getCell('pct').font = { color: { argb: 'DC2626' }, bold: true };
      }
    });

    // Sheet 2: Client Service Visits (progress detail)
    const detail = workbook.addWorksheet('Client Service Visits');
    detail.columns = [
      { header: 'Target Service', key: 'target_service', width: 26 },
      { header: 'Client Name', key: 'client_name', width: 22 },
      { header: 'Phone', key: 'client_phone', width: 16 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Visit Date', key: 'visit_date', width: 14 },
      { header: 'Services Delivered', key: 'services', width: 46 },
      { header: 'Marketer', key: 'user_name', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 }
    ];
    detail.getRow(1).font = { bold: true };
    let hasRows = false;
    for (const p of progress) {
      const t = targets.find(x => x.id === p.target_id);
      hasRows = true;
      detail.addRow({
        target_service: t ? t.service : 'Unknown',
        client_name: p.client_name,
        client_phone: p.client_phone || '',
        location: p.location || '',
        visit_date: p.visit_date || '',
        services: Array.isArray(p.services) && p.services.length ? p.services.join(', ') : t ? t.service : '',
        user_name: users.find(u => u.id === p.user_id)?.full_name || 'Unknown',
        notes: p.notes || ''
      });
    }
    if (!hasRows) {
      detail.addRow({ client_name: 'No client service visits recorded yet.' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=booqasho_target_reports_${new Date().toISOString().split('T')[0]}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();

    await db.auditLogs.create({ user_id: req.user.id, action: 'EXPORT_TARGET_EXCEL', description: 'Downloaded target report as Excel' });
  } catch (error) {
    console.error('Error exporting target reports:', error);
    res.status(500).json({ success: false, message: 'Failed to export target reports.' });
  }
};
