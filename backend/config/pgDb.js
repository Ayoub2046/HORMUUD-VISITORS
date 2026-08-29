const dbUpdate = async (pool, table, id, updates) => {
  const keys = Object.keys(updates).filter(k => k !== 'id');
  if (keys.length === 0) return null;

  const setClause = keys.map((k, idx) => `"${k}" = $${idx + 2}`).join(', ');
  const values = keys.map(k => updates[k]);

  const query = `UPDATE "${table}" SET ${setClause} WHERE id = $1 RETURNING *`;
  const res = await pool.query(query, [id, ...values]);
  return res.rows[0];
};

const normalizeClientRow = (row) => {
  if (!row) return null;
  const copy = { ...row };
  const parseJson = (v, fallback) => {
    if (!v) return fallback;
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch (e) { return fallback; }
    }
    return v;
  };
  const parsedServices = parseJson(copy.services, []);
  copy.services = Array.isArray(parsedServices) ? parsedServices : [];

  const parsedVisits = parseJson(copy.visits, []);
  copy.visits = Array.isArray(parsedVisits) ? parsedVisits : [];

  const parsedSvcData = parseJson(copy.svc_data || copy.svcData, {});
  copy.svcData = (parsedSvcData && typeof parsedSvcData === 'object' && !Array.isArray(parsedSvcData)) ? parsedSvcData : {};
  return copy;
};

function createPgDb(pool) {
  return {
    isMock: false,
    pool,

    users: {
      findMany: async () => {
        const res = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        return res.rows;
      },
      findOne: async (filter) => {
        const key = Object.keys(filter)[0];
        const val = filter[key];
        const res = await pool.query(`SELECT * FROM users WHERE "${key}" = $1 LIMIT 1`, [val]);
        return res.rows[0] || null;
      },
      create: async (userData) => {
        const query = `
          INSERT INTO users (full_name, email, phone, address, role, department, password_hash, is_verified)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;
        const values = [
          userData.full_name,
          userData.email,
          userData.phone || '',
          userData.address || '',
          userData.role || 'marketing',
          userData.department || 'Field Marketing',
          userData.password_hash || userData.password || '',
          userData.is_verified || false
        ];
        const res = await pool.query(query, values);
        return res.rows[0];
      },
      update: async (id, updates) => dbUpdate(pool, 'users', id, updates),
      delete: async (id) => {
        const res = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        return res.rows[0];
      }
    },

    visits: {
      findMany: async (filters = {}) => {
        let query = `
          SELECT v.*, u.full_name as employee_name, u.email as employee_email
          FROM visits v
          LEFT JOIN users u ON v.user_id = u.id
          WHERE 1=1
        `;
        const values = [];
        let valIdx = 1;

        if (filters.user_id) {
          query += ` AND v.user_id = $${valIdx++}`;
          values.push(filters.user_id);
        }
        if (filters.status && filters.status !== 'All') {
          query += ` AND v.status = $${valIdx++}`;
          values.push(filters.status);
        }
        if (filters.place_type && filters.place_type !== 'All') {
          query += ` AND v.place_type = $${valIdx++}`;
          values.push(filters.place_type);
        }
        if (filters.startDate) {
          query += ` AND v.visit_date >= $${valIdx++}`;
          values.push(filters.startDate);
        }
        if (filters.endDate) {
          query += ` AND v.visit_date <= $${valIdx++}`;
          values.push(filters.endDate);
        }

        query += ' ORDER BY v.visit_date DESC, v.visit_time DESC';

        const res = await pool.query(query, values);
        let list = res.rows.map(v => ({
          ...v,
          employee_name: v.employee_name || 'Unknown Employee'
        }));

        if (filters.search) {
          const s = filters.search.toLowerCase();
          list = list.filter(v =>
            v.place_name.toLowerCase().includes(s) ||
            v.address.toLowerCase().includes(s) ||
            v.contact_person.toLowerCase().includes(s) ||
            v.employee_name.toLowerCase().includes(s)
          );
        }

        return list;
      },
      findOne: async (id) => {
        const query = `
          SELECT v.*, u.full_name as employee_name, u.email as employee_email, u.phone as employee_phone
          FROM visits v
          LEFT JOIN users u ON v.user_id = u.id
          WHERE v.id = $1
        `;
        const res = await pool.query(query, [id]);
        const data = res.rows[0] || null;
        if (data) data.employee_name = data.employee_name || 'Unknown';
        return data;
      },
      create: async (visitData) => {
        const query = `
          INSERT INTO visits (user_id, place_name, place_type, address, latitude, longitude, contact_person, phone, visit_date, visit_time, purpose, activities, status, result, comments)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING *
        `;
        const values = [
          visitData.user_id,
          visitData.place_name,
          visitData.place_type,
          visitData.address || '',
          visitData.latitude || 0,
          visitData.longitude || 0,
          visitData.contact_person || '',
          visitData.phone || '',
          visitData.visit_date,
          visitData.visit_time,
          visitData.purpose || '',
          visitData.activities || '',
          visitData.status || 'Pending',
          visitData.result || '',
          visitData.comments || ''
        ];
        const res = await pool.query(query, values);
        return res.rows[0];
      },
      update: async (id, updates) => dbUpdate(pool, 'visits', id, updates),
      delete: async (id) => {
        const res = await pool.query('DELETE FROM visits WHERE id = $1 RETURNING *', [id]);
        return res.rows[0];
      }
    },

    auditLogs: {
      findMany: async () => {
        const query = `
          SELECT a.*, u.full_name
          FROM audit_logs a
          LEFT JOIN users u ON a.user_id = u.id
          ORDER BY a.timestamp DESC
        `;
        const res = await pool.query(query);
        return res.rows.map(l => ({ ...l, full_name: l.full_name || 'System' }));
      },
      create: async (logData) => {
        const query = `
          INSERT INTO audit_logs (user_id, action, description)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        const values = [logData.user_id, logData.action, logData.description];
        const res = await pool.query(query, values);
        return res.rows[0];
      }
    },

    otps: {
      create: async (otpData) => {
        const query = `
          INSERT INTO otps (phone, otp_code, purpose, expires_at)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        const values = [otpData.phone, otpData.otp_code, otpData.purpose || 'REGISTRATION', otpData.expires_at];
        const res = await pool.query(query, values);
        return res.rows[0];
      },
      findOne: async (filter) => {
        const key = Object.keys(filter)[0];
        const val = filter[key];
        const query = `SELECT * FROM otps WHERE "${key}" = $1 AND is_used = false ORDER BY created_at DESC LIMIT 1`;
        const res = await pool.query(query, [val]);
        return res.rows[0] || null;
      },
      update: async (id, updates) => dbUpdate(pool, 'otps', id, updates)
    },

    passwordResets: {
      create: async (resetData) => {
        const query = `
          INSERT INTO password_resets (user_id, reset_token, expires_at)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        const values = [resetData.user_id, resetData.reset_token, resetData.expires_at];
        const res = await pool.query(query, values);
        return res.rows[0];
      },
      findOne: async (filter) => {
        const key = Object.keys(filter)[0];
        const val = filter[key];
        const query = `SELECT * FROM password_resets WHERE "${key}" = $1 AND is_used = false ORDER BY created_at DESC LIMIT 1`;
        const res = await pool.query(query, [val]);
        return res.rows[0] || null;
      },
      update: async (id, updates) => dbUpdate(pool, 'password_resets', id, updates)
    },

    tasks: {
      findMany: async (filters = {}) => {
        let query = 'SELECT * FROM tasks WHERE 1=1';
        const values = [];
        let idx = 1;
        if (filters.date) { query += ` AND date = $${idx++}`; values.push(filters.date); }
        if (filters.user_id) { query += ` AND (assigned_to = $${idx++} OR assigned_to IS NULL)`; values.push(filters.user_id); }
        if (filters.status) { query += ` AND status = $${idx++}`; values.push(filters.status); }
        query += ' ORDER BY created_at DESC';
        const res = await pool.query(query, values);
        return res.rows;
      },
      findOne: async (filter) => {
        const key = Object.keys(filter)[0];
        const res = await pool.query(`SELECT * FROM tasks WHERE "${key}" = $1 LIMIT 1`, [filter[key]]);
        return res.rows[0] || null;
      },
      create: async (data) => {
        const query = `INSERT INTO tasks (assigned_by, assigned_to, service, description, date, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
        const res = await pool.query(query, [data.assigned_by, data.assigned_to || null, data.service, data.description, data.date, data.status || 'pending']);
        return res.rows[0];
      },
      update: async (id, updates) => dbUpdate(pool, 'tasks', id, updates),
      delete: async (id) => {
        const res = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
        await pool.query('INSERT INTO recycle_bin (original_id, type, data) VALUES ($1, $2, $3)', [id, 'tasks', JSON.stringify(res.rows[0] || {})]);
        return res.rows[0];
      }
    },

    clients: {
      findMany: async () => {
        const res = await pool.query('SELECT * FROM clients ORDER BY name ASC');
        return res.rows.map(normalizeClientRow);
      },
      findOne: async (id) => {
        const res = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
        return res.rows[0] ? normalizeClientRow(res.rows[0]) : null;
      },
      create: async (data) => {
        const query = `INSERT INTO clients (name, phone, contact, employees, isp, type, services, svc_data) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
        const res = await pool.query(query, [
          data.name, 
          data.phone || '', 
          data.contact || '', 
          data.employees || 1, 
          data.isp || 'HORMUUD', 
          data.type || 'Enterprise', 
          JSON.stringify(data.services || []), 
          JSON.stringify(data.svcData || data.svc_data || {})
        ]);
        return normalizeClientRow(res.rows[0]);
      },
      update: async (id, updates) => {
        const copy = { ...updates };
        if ('svcData' in copy) {
          copy.svc_data = typeof copy.svcData === 'object' ? JSON.stringify(copy.svcData) : copy.svcData;
          delete copy.svcData;
        }
        if (copy.services && Array.isArray(copy.services)) copy.services = JSON.stringify(copy.services);
        if (copy.visits && Array.isArray(copy.visits)) copy.visits = JSON.stringify(copy.visits);
        const updated = await dbUpdate(pool, 'clients', id, copy);
        return updated ? normalizeClientRow(updated) : null;
      },
      delete: async (id) => {
        const res = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);
        await pool.query('INSERT INTO recycle_bin (original_id, type, data) VALUES ($1, $2, $3)', [id, 'clients', JSON.stringify(res.rows[0] || {})]);
        return res.rows[0];
      },
      addVisit: async (clientId, visitData) => {
        const clientRes = await pool.query('SELECT * FROM clients WHERE id = $1', [clientId]);
        if (!clientRes.rows[0]) return null;
        const rawClient = normalizeClientRow(clientRes.rows[0]);
        const visit = { 
          id: require('crypto').randomUUID(), 
          agent: visitData.agent || 'Unknown', 
          date: new Date().toISOString(), 
          status: visitData.status || 'Active', 
          notes: visitData.notes || '', 
          newServices: visitData.newServices || [], 
          removedServices: visitData.removedServices || [], 
          serviceNumbers: visitData.serviceNumbers || {} 
        };
        const visits = [...(rawClient.visits || []), visit];
        let services = rawClient.services || [];
        visit.newServices.forEach(s => { if (!services.includes(s)) services.push(s); });
        visit.removedServices.forEach(s => { services = services.filter(x => x !== s); });
        let svcData = rawClient.svcData || {};
        Object.entries(visit.serviceNumbers).forEach(([svc, num]) => {
          if (!svcData[svc]) svcData[svc] = {};
          if (typeof num === 'string' && num) svcData[svc].number = num;
        });
        await pool.query('UPDATE clients SET visits = $1, services = $2, svc_data = $3 WHERE id = $4', [JSON.stringify(visits), JSON.stringify(services), JSON.stringify(svcData), clientId]);
        return visit;
      }
    },

    isps: {
      findMany: async () => {
        const res = await pool.query('SELECT name FROM isps ORDER BY name ASC');
        return res.rows.map(r => r.name);
      },
      create: async (name) => {
        const v = name.toUpperCase().trim();
        if (!v) return null;
        try {
          const res = await pool.query('INSERT INTO isps (name) VALUES ($1) RETURNING *', [v]);
          return res.rows[0]?.name || v;
        } catch (e) {
          if (e.code === '23505') return null;
          throw e;
        }
      },
      delete: async (name) => {
        const res = await pool.query('DELETE FROM isps WHERE name = $1 RETURNING *', [name]);
        if (res.rows[0]) await pool.query('INSERT INTO recycle_bin (original_id, type, data) VALUES ($1, $2, $3)', [res.rows[0].id, 'isps', JSON.stringify(res.rows[0])]);
        return res.rows[0]?.name || name;
      }
    },

    entSvcs: {
      findMany: async () => {
        const res = await pool.query('SELECT name FROM ent_svcs ORDER BY name ASC');
        return res.rows.map(r => r.name);
      },
      add: async (name) => {
        const v = name.trim();
        if (!v) return null;
        try {
          const res = await pool.query('INSERT INTO ent_svcs (name) VALUES ($1) RETURNING *', [v]);
          return res.rows[0]?.name || v;
        } catch (e) {
          if (e.code === '23505') return null;
          throw e;
        }
      }
    },

    indSvcs: {
      findMany: async () => {
        const res = await pool.query('SELECT name FROM ind_svcs ORDER BY name ASC');
        return res.rows.map(r => r.name);
      },
      add: async (name) => {
        const v = name.trim();
        if (!v) return null;
        try {
          const res = await pool.query('INSERT INTO ind_svcs (name) VALUES ($1) RETURNING *', [v]);
          return res.rows[0]?.name || v;
        } catch (e) {
          if (e.code === '23505') return null;
          throw e;
        }
      }
    },

    clientAssignments: {
      findMany: async (filters = {}) => {
        let query = 'SELECT * FROM client_assignments WHERE 1=1';
        const values = [];
        let idx = 1;
        if (filters.client_id) { query += ` AND client_id = $${idx++}`; values.push(filters.client_id); }
        if (filters.assigned_to) { query += ` AND assigned_to @> $${idx++}::jsonb`; values.push(JSON.stringify([filters.assigned_to])); }
        if (filters.assigned_by) { query += ` AND assigned_by = $${idx++}`; values.push(filters.assigned_by); }
        if (filters.status) { query += ` AND status = $${idx++}`; values.push(filters.status); }
        query += ' ORDER BY created_at DESC';
        const res = await pool.query(query, values);
        return res.rows.map(r => ({
          ...r,
          assigned_to: typeof r.assigned_to === 'string' ? (() => { try { return JSON.parse(r.assigned_to); } catch(e) { return []; } })() : (r.assigned_to || [])
        }));
      },
      findOne: async (id) => {
        const res = await pool.query('SELECT * FROM client_assignments WHERE id = $1', [id]);
        if (!res.rows[0]) return null;
        const r = res.rows[0];
        return {
          ...r,
          assigned_to: typeof r.assigned_to === 'string' ? (() => { try { return JSON.parse(r.assigned_to); } catch(e) { return []; } })() : (r.assigned_to || [])
        };
      },
      create: async (data) => {
        const query = `INSERT INTO client_assignments (client_id, assigned_to, assigned_by, type, notes, status, date) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
        const res = await pool.query(query, [data.client_id, JSON.stringify(data.assigned_to || []), data.assigned_by, data.type || 'visit', data.notes || '', data.status || 'pending', data.date || new Date().toISOString().split('T')[0]]);
        return res.rows[0];
      },
      update: async (id, updates) => {
        if (updates.assigned_to && Array.isArray(updates.assigned_to)) updates.assigned_to = JSON.stringify(updates.assigned_to);
        return dbUpdate(pool, 'client_assignments', id, updates);
      },
      delete: async (id) => {
        const res = await pool.query('DELETE FROM client_assignments WHERE id = $1 RETURNING *', [id]);
        await pool.query('INSERT INTO recycle_bin (original_id, type, data) VALUES ($1, $2, $3)', [id, 'clientAssignments', JSON.stringify(res.rows[0] || {})]);
        return res.rows[0];
      }
    },

    visitTasks: {
      findMany: async (filters = {}) => {
        let query = 'SELECT * FROM visit_tasks WHERE 1=1';
        const values = [];
        let idx = 1;
        if (filters.assigned_to) { query += ` AND assigned_to @> $${idx++}::jsonb`; values.push(JSON.stringify([filters.assigned_to])); }
        if (filters.created_by) { query += ` AND created_by = $${idx++}`; values.push(filters.created_by); }
        if (filters.status) { query += ` AND status = $${idx++}`; values.push(filters.status); }
        query += ' ORDER BY created_at DESC';
        const res = await pool.query(query, values);
        const parseArr = (v) => { if (Array.isArray(v)) return v; try { return JSON.parse(v) || []; } catch(e) { return []; } };
        return res.rows.map(r => ({ ...r, assigned_to: parseArr(r.assigned_to), services: parseArr(r.services) }));
      },
      findOne: async (id) => {
        const res = await pool.query('SELECT * FROM visit_tasks WHERE id = $1', [id]);
        if (!res.rows[0]) return null;
        const r = res.rows[0];
        const parseArr = (v) => { if (Array.isArray(v)) return v; try { return JSON.parse(v) || []; } catch(e) { return []; } };
        return { ...r, assigned_to: parseArr(r.assigned_to), services: parseArr(r.services) };
      },
      create: async (data) => {
        const query = `INSERT INTO visit_tasks (title, description, assigned_to, services, status, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
        const res = await pool.query(query, [data.title || '', data.description || '', JSON.stringify(data.assigned_to || []), JSON.stringify(data.services || []), data.status || 'active', data.created_by]);
        return res.rows[0];
      },
      update: async (id, updates) => {
        if (updates.assigned_to && Array.isArray(updates.assigned_to)) updates.assigned_to = JSON.stringify(updates.assigned_to);
        if (updates.services && Array.isArray(updates.services)) updates.services = JSON.stringify(updates.services);
        return dbUpdate(pool, 'visit_tasks', id, updates);
      },
      delete: async (id) => {
        await pool.query('DELETE FROM visit_reports WHERE task_id = $1', [id]);
        const res = await pool.query('DELETE FROM visit_tasks WHERE id = $1 RETURNING *', [id]);
        await pool.query('INSERT INTO recycle_bin (original_id, type, data) VALUES ($1, $2, $3)', [id, 'visitTasks', JSON.stringify(res.rows[0] || {})]);
        return res.rows[0];
      }
    },

    visitReports: {
      findMany: async (filters = {}) => {
        let query = 'SELECT * FROM visit_reports WHERE 1=1';
        const values = [];
        let idx = 1;
        if (filters.task_id) { query += ` AND task_id = $${idx++}`; values.push(filters.task_id); }
        if (filters.submitted_by) { query += ` AND submitted_by = $${idx++}`; values.push(filters.submitted_by); }
        query += ' ORDER BY created_at DESC';
        const res = await pool.query(query, values);
        return res.rows;
      },
      findOne: async (id) => { const res = await pool.query('SELECT * FROM visit_reports WHERE id = $1', [id]); return res.rows[0] || null; },
      create: async (data) => {
        const query = `INSERT INTO visit_reports (task_id, submitted_by, client_name, client_phone, location, notes, service_data) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
        const res = await pool.query(query, [data.task_id, data.submitted_by, data.client_name || '', data.client_phone || '', data.location || '', data.notes || '', JSON.stringify(data.service_data || {})]);
        return res.rows[0];
      },
      delete: async (id) => {
        const res = await pool.query('DELETE FROM visit_reports WHERE id = $1 RETURNING *', [id]);
        await pool.query('INSERT INTO recycle_bin (original_id, type, data) VALUES ($1, $2, $3)', [id, 'visitReports', JSON.stringify(res.rows[0] || {})]);
        return res.rows[0];
      }
    },

    targetTasks: {
      findMany: async (filters = {}) => {
        let query = 'SELECT * FROM target_tasks WHERE 1=1';
        const values = [];
        let idx = 1;
        if (filters.assigned_to) { query += ` AND assigned_to = $${idx++}`; values.push(filters.assigned_to); }
        if (filters.assigned_by) { query += ` AND assigned_by = $${idx++}`; values.push(filters.assigned_by); }
        if (filters.service) { query += ` AND service = $${idx++}`; values.push(filters.service); }
        if (filters.status) { query += ` AND status = $${idx++}`; values.push(filters.status); }
        query += ' ORDER BY created_at DESC';
        const res = await pool.query(query, values);
        return res.rows;
      },
      findOne: async (id) => {
        const res = await pool.query('SELECT * FROM target_tasks WHERE id = $1', [id]);
        return res.rows[0] || null;
      },
      create: async (data) => {
        const query = `INSERT INTO target_tasks (service, target_quantity, period_type, start_date, end_date, assigned_to, assigned_by, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
        const res = await pool.query(query, [
          data.service,
          data.target_quantity || 0,
          data.period_type || 'monthly',
          data.start_date || null,
          data.end_date || null,
          data.assigned_to || null,
          data.assigned_by,
          data.status || 'active'
        ]);
        return res.rows[0];
      },
      update: async (id, updates) => dbUpdate(pool, 'target_tasks', id, updates),
      delete: async (id) => {
        await pool.query('DELETE FROM target_progress WHERE target_id = $1', [id]);
        const res = await pool.query('DELETE FROM target_tasks WHERE id = $1 RETURNING *', [id]);
        await pool.query('INSERT INTO recycle_bin (original_id, type, data) VALUES ($1, $2, $3)', [id, 'targetTasks', JSON.stringify(res.rows[0] || {})]);
        return res.rows[0];
      }
    },

    targetProgress: {
      findMany: async (filters = {}) => {
        let query = 'SELECT * FROM target_progress WHERE 1=1';
        const values = [];
        let idx = 1;
        if (filters.target_id) { query += ` AND target_id = $${idx++}`; values.push(filters.target_id); }
        if (filters.user_id) { query += ` AND user_id = $${idx++}`; values.push(filters.user_id); }
        if (filters.startDate) { query += ` AND visit_date >= $${idx++}`; values.push(filters.startDate); }
        if (filters.endDate) { query += ` AND visit_date <= $${idx++}`; values.push(filters.endDate); }
        query += ' ORDER BY created_at DESC';
        const res = await pool.query(query, values);
        const parseArr = (v) => { if (Array.isArray(v)) return v; try { return JSON.parse(v) || []; } catch(e) { return []; } };
        return res.rows.map(r => ({ ...r, services: parseArr(r.services) }));
      },
      create: async (data) => {
        const query = `INSERT INTO target_progress (target_id, user_id, client_name, client_phone, location, visit_date, services, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
        const res = await pool.query(query, [
          data.target_id,
          data.user_id,
          data.client_name || '',
          data.client_phone || '',
          data.location || '',
          data.visit_date || new Date().toISOString().split('T')[0],
          JSON.stringify(Array.isArray(data.services) ? data.services : []),
          data.notes || ''
        ]);
        const r = res.rows[0];
        return { ...r, services: Array.isArray(r.services) ? r.services : (() => { try { return JSON.parse(r.services); } catch(e) { return []; } })() };
      },
      delete: async (id) => {
        const res = await pool.query('DELETE FROM target_progress WHERE id = $1 RETURNING *', [id]);
        return res.rows[0];
      }
    },

    notifications: {
      findMany: async (filters = {}) => {
        let query = 'SELECT * FROM notifications WHERE 1=1';
        const values = [];
        let idx = 1;
        if (filters.user_id) { query += ` AND user_id = $${idx++}`; values.push(filters.user_id); }
        if (filters.is_read !== undefined && filters.is_read !== null) {
          query += ` AND is_read = $${idx++}`;
          values.push(String(filters.is_read) === 'true');
        }
        query += ' ORDER BY created_at DESC';
        const res = await pool.query(query, values);
        return res.rows;
      },
      findOne: async (id) => {
        const res = await pool.query('SELECT * FROM notifications WHERE id = $1', [id]);
        return res.rows[0] || null;
      },
      create: async (data) => {
        const query = `INSERT INTO notifications (user_id, type, title, message, link) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
        const res = await pool.query(query, [
          data.user_id,
          data.type || 'task',
          data.title || '',
          data.message || '',
          data.link || null
        ]);
        return res.rows[0];
      },
      update: async (id, updates) => dbUpdate(pool, 'notifications', id, updates),
      markAllRead: async (user_id) => {
        const res = await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false', [user_id]);
        return res.rowCount || 0;
      },
      countUnread: async (user_id) => {
        const res = await pool.query('SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false', [user_id]);
        return res.rows[0]?.count || 0;
      },
      delete: async (id) => {
        const res = await pool.query('DELETE FROM notifications WHERE id = $1 RETURNING *', [id]);
        return res.rows[0];
      }
    },

    recycleBin: {
      findMany: async () => {
        const res = await pool.query('SELECT * FROM recycle_bin ORDER BY deleted_at DESC');
        return res.rows;
      },
      trash: async (item, type, deletedBy) => {
        if (!item) return null;
        const res = await pool.query('INSERT INTO recycle_bin (original_id, type, data, deleted_by) VALUES ($1,$2,$3,$4) RETURNING *', [item.id, type, JSON.stringify(item), deletedBy || 'system']);
        return res.rows[0];
      },
      restore: async (id) => {
        const res = await pool.query('SELECT * FROM recycle_bin WHERE original_id = $1 ORDER BY deleted_at DESC LIMIT 1', [id]);
        const entry = res.rows[0];
        if (!entry) return null;
        const target = entry.type;
        const tableMap = {
          clients: 'clients', users: 'users', visits: 'visits', tasks: 'tasks', isps: 'isps',
          clientAssignments: 'client_assignments', visitTasks: 'visit_tasks', visitReports: 'visit_reports'
        };
        const table = tableMap[target];
        if (table) {
          // Preserve original id when restoring
          const data = { ...entry.data, id: entry.original_id };
          const keys = Object.keys(data);
          const cols = keys.map(k => `"${k}"`).join(', ');
          const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
          const rowVals = keys.map(k => {
            const v = data[k];
            return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v;
          });
          // Use ON CONFLICT DO NOTHING in case the row was re-created manually
          await pool.query(
            `INSERT INTO "${table}" (${cols}) VALUES (${vals}) ON CONFLICT (id) DO NOTHING`,
            rowVals
          );
        }
        await pool.query('DELETE FROM recycle_bin WHERE id = $1', [entry.id]);
        return entry;
      },
      purge: async (id) => {
        const res = await pool.query('DELETE FROM recycle_bin WHERE original_id = $1 RETURNING *', [id]);
        return res.rows[0] || null;
      }
    }
  };
}

module.exports = createPgDb;
