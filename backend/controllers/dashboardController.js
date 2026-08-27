const db = require('../config/db');

const formatDate = (d) => {
  if (!d) return '';
  const dateObj = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

exports.getStats = async (req, res) => {
  try {
    const visits = await db.visits.findMany();
    const users = await db.users.findMany();
    const logs = await db.auditLogs.findMany();
    let clients = [];
    try { clients = await db.clients.findMany(); } catch (e) { clients = []; }
    let assignments = [];
    try { assignments = await db.clientAssignments.findMany(); } catch (e) { assignments = []; }
    let visitTasks = [];
    try { visitTasks = await db.visitTasks.findMany(); } catch (e) { visitTasks = []; }
    let visitReports = [];
    try { visitReports = await db.visitReports.findMany(); } catch (e) { visitReports = []; }

    const todayStr = formatDate(new Date());

    // --- MARKETING USER DASHBOARD STATS ---
    if (req.user.role === 'marketing') {
      const myVisits = visits.filter(v => v.user_id === req.user.id);
      const successful = myVisits.filter(v => v.status === 'Successful').length;
      const failed = myVisits.filter(v => v.status === 'Failed').length;
      const pending = myVisits.filter(v => v.status === 'Pending').length;
      const visitsToday = myVisits.filter(v => formatDate(v.visit_date) === todayStr).length;

      const successRate = myVisits.length > 0 
        ? Math.round((successful / myVisits.length) * 100) 
        : 0;

      const myAssignments = assignments.filter(a => a.assigned_to.includes(req.user.id));
      const pendingAssignments = myAssignments.filter(a => a.status === 'pending');
      const myVisitTasks = visitTasks.filter(t => (t.assigned_to||[]).includes(req.user.id));
      const myReports = visitReports.filter(r => r.submitted_by === req.user.id);

      // Personal list by place type
      const placeTypeCounts = {};
      myVisits.forEach(v => {
        placeTypeCounts[v.place_type] = (placeTypeCounts[v.place_type] || 0) + 1;
      });

      return res.status(200).json({
        success: true,
        data: {
          role: 'marketing',
          summary: {
            totalVisits: myVisits.length,
            successful,
            failed,
            pending,
            visitsToday,
            successRate
          },
          assignmentSummary: {
            total: myAssignments.length,
            pending: pendingAssignments.length,
            completed: myAssignments.filter(a => a.status === 'completed').length
          },
          visitTaskSummary: {
            total: myVisitTasks.length,
            reports: myReports.length,
            active: myVisitTasks.filter(t => t.status === 'active').length
          },
          placeTypeCounts,
          recentVisits: myVisits.slice(0, 5)
        }
      });
    }

    // --- ADMIN DASHBOARD STATS ---
    const totalUsers = users.length;
    const totalVisits = visits.length;
    const successful = visits.filter(v => v.status === 'Successful').length;
    const failed = visits.filter(v => v.status === 'Failed').length;
    const pending = visits.filter(v => v.status === 'Pending').length;
    const visitsToday = visits.filter(v => formatDate(v.visit_date) === todayStr).length;

    const successRate = (successful + failed) > 0 
      ? Math.round((successful / (successful + failed)) * 100) 
      : 0;

    // Staff Performance Ranking
    const staffStats = {};
    users.forEach(u => {
      if (u.role === 'marketing') {
        staffStats[u.id] = {
          id: u.id,
          name: u.full_name,
          email: u.email,
          total: 0,
          success: 0,
          failed: 0
        };
      }
    });

    visits.forEach(v => {
      if (staffStats[v.user_id]) {
        staffStats[v.user_id].total += 1;
        if (v.status === 'Successful') staffStats[v.user_id].success += 1;
        if (v.status === 'Failed') staffStats[v.user_id].failed += 1;
      }
    });

    const activeStaff = Object.values(staffStats)
      .sort((a, b) => b.total - a.total)
      .map(s => ({
        ...s,
        rate: s.total > 0 ? Math.round((s.success / s.total) * 100) : 0
      }));

    // Trends by date (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      
      const dayVisits = visits.filter(v => formatDate(v.visit_date) === dateStr);
      const daySuccess = dayVisits.filter(v => v.status === 'Successful').length;
      const dayFailed = dayVisits.filter(v => v.status === 'Failed').length;

      // Extract day name (e.g. "Mon")
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });

      last7Days.push({
        date: dateStr,
        label,
        total: dayVisits.length,
        success: daySuccess,
        failed: dayFailed
      });
    }

    // Client Stats
    const totalClients = clients.length;
    const entCount = clients.filter(c => c.type === 'Enterprise').length;
    const indCount = clients.filter(c => c.type === 'Individual').length;
    const clientsNoVisits = clients.filter(c => !c.visits?.length).length;
    const svcCount = {};
    clients.forEach(c => (c.services||[]).forEach(s => { svcCount[s] = (svcCount[s]||0) + 1; }));
    const svcRanked = Object.entries(svcCount).sort((a,b) => b[1] - a[1]);

    // All client visits flat
    const allClientVisits = clients.flatMap(c => (c.visits||[]).map(v => ({ ...v, clientName: c.name, clientId: c.id, clientType: c.type })))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      data: {
        role: 'admin',
        summary: {
          totalUsers,
          totalVisits,
          successful,
          failed,
          pending,
          visitsToday,
          successRate
        },
        visitTaskSummary: {
          total: visitTasks.length,
          active: visitTasks.filter(t => t.status === 'active').length,
          reports: visitReports.length,
          recentTasks: visitTasks.slice(0, 5).map(t => {
            const creator = users.find(u => u.id === t.created_by);
            return { ...t, createdByName: creator?.full_name || 'Unknown' };
          })
        },
        clientSummary: {
          totalClients,
          entCount,
          indCount,
          clientsNoVisits,
          svcRanked: svcRanked.slice(0, 12)
        },
        recentClientVisits: allClientVisits.slice(0, 8),
        assignmentSummary: {
          total: assignments.length,
          pending: assignments.filter(a => a.status === 'pending').length,
          completed: assignments.filter(a => a.status === 'completed').length,
          byType: {
            visits: assignments.filter(a => a.type === 'visit').length,
            calls: assignments.filter(a => a.type === 'call').length
          },
          recent: (() => {
            const enriched = assignments.slice(0, 5).map(a => {
              const c = clients.find(x => x.id === a.client_id);
              const u = users.find(x => x.id === a.assigned_by);
              return { ...a, clientName: c?.name || 'Unknown', assignedByName: u?.full_name || 'Unknown' };
            });
            return enriched;
          })()
        },
        activeStaff,
        recentLogs: logs.slice(0, 8),
        trends: last7Days
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to prepare dashboard stats.' });
  }
};
