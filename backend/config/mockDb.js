const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const uuid = () => crypto.randomUUID();

const ADMIN_ID = 'd3b07384-d113-4ec2-a5d9-4828691512f4';
const MARKETING_ID = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

const INIT_ENT_SVCS = ["BankAcc","MySMS","MyExam","Land line service","ADSL Plus","Call Center","Payroll","SMS API","Merchant","MMT","FiberOptic","FTTH","WTTX","P2MP","CRPT","MURABAHA","SHORT CODE","EvcAPI"];
const INIT_IND_SVCS = ["EVCPlus","Anfac","Nasiye","Caawiye","Dhigaal","Dhanbaal","Keyd","MiFi","Aqoonmaal","LTE","ADSL","Deeqtoon","Ilawadaag","Waafi"];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const INIT_ISPS = ["HORMUUD","SOMNET","GOLIS","TELESOM","AMTEL"];

const SVC_COLORS = {
  FTTH:"#0066CC",EvcAPI:"#00A651",MySMS:"#FF6B35",BankAcc:"#7B2D8B",
  Payroll:"#C0392B",Merchant:"#E67E22",CRPT:"#1ABC9C",MMT:"#3498DB",
  "Call Center":"#E74C3C","ADSL Plus":"#9B59B6",EVCPlus:"#00897B",
  MURABAHA:"#5D4037","SHORT CODE":"#1565C0",FiberOptic:"#2E7D32"
};

function buildSeedData() {
  const now = new Date().toISOString();
  const users = [
    {
      id: ADMIN_ID,
      full_name: 'Ayaanle Mohamed',
      email: 'admin@booqasho.com',
      phone: '+252615123456',
      address: 'Hodan District, Mogadishu',
      role: 'admin',
      department: 'Marketing Management',
      password_hash: '$2a$10$3w/2GqS03NIftSJ4hx009eqo5yOsLp0MjHJTnKF6Ug8.wufLfKXMS',
      is_verified: true,
      created_at: now
    },
    {
      id: MARKETING_ID,
      full_name: 'Fahad Omar',
      email: 'marketing@booqasho.com',
      phone: '+252615778899',
      address: 'Wadajir District, Mogadishu',
      role: 'marketing',
      department: 'Field Marketing',
      password_hash: '$2a$10$P.qLindn2S9WakzTfakPLeCO.mrOoY./.R6zU6F5r15UPcQTYflki',
      is_verified: true,
      created_at: now
    },
    {
      id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      full_name: 'Sahra Ali',
      email: 'sahra@booqasho.com',
      phone: '+252615334455',
      address: 'Hamar Weyne, Mogadishu',
      role: 'marketing',
      department: 'Field Marketing',
      password_hash: bcrypt.hashSync('marketing123', 10),
      is_verified: true,
      created_at: now
    }
  ];

  const visits = [
    { id: uuid(), user_id: MARKETING_ID, place_name: 'Barwaaqo Supermarket', place_type: 'Shop', address: 'Hodan District, KM4', latitude: 2.0469, longitude: 45.3182, contact_person: 'Mohamed Hassan', phone: '+252615111222', visit_date: daysAgo(0), visit_time: '09:30', purpose: 'EVC Plus promotion', activities: 'Product demo', status: 'Successful', result: 'New merchant onboarded', comments: 'Interested in bulk SIM cards', created_at: now },
    { id: uuid(), user_id: MARKETING_ID, place_name: 'Hormuud Retail Hub', place_type: 'Business', address: 'Wadajir District', latitude: 2.0378, longitude: 45.3045, contact_person: 'Amina Yusuf', phone: '+252615333444', visit_date: daysAgo(1), visit_time: '11:00', purpose: 'Fiber internet pitch', activities: 'Site survey', status: 'Pending', result: '', comments: 'Follow-up scheduled', created_at: now },
    { id: uuid(), user_id: MARKETING_ID, place_name: 'Jubba Restaurant', place_type: 'Restaurant', address: 'Maka Al-Mukarama', latitude: 2.0412, longitude: 45.3421, contact_person: 'Omar Farah', phone: '+252615555666', visit_date: daysAgo(2), visit_time: '14:15', purpose: 'WiFi bundle offer', activities: 'Presentation', status: 'Failed', result: 'Budget constraints', comments: 'Retry next month', created_at: now },
    { id: uuid(), user_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', place_name: 'Banadir Hospital', place_type: 'Hospital', address: 'Howlwadaag', latitude: 2.0523, longitude: 45.3289, contact_person: 'Dr. Halima', phone: '+252615777888', visit_date: daysAgo(1), visit_time: '10:00', purpose: 'Corporate SIM plan', activities: 'Meeting with admin', status: 'Successful', result: '50 SIM order', comments: 'Contract signed', created_at: now },
    { id: uuid(), user_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', place_name: 'Al-Noor School', place_type: 'School', address: 'Waberi District', latitude: 2.0298, longitude: 45.3156, contact_person: 'Principal Ahmed', phone: '+252615999000', visit_date: daysAgo(3), visit_time: '08:45', purpose: 'Student data bundles', activities: 'Proposal delivery', status: 'Successful', result: 'Partnership agreed', comments: '', created_at: now },
    { id: uuid(), user_id: MARKETING_ID, place_name: 'Tech Solutions Ltd', place_type: 'Company', address: 'Hamar Weyne', latitude: 2.0334, longitude: 45.3378, contact_person: 'Yusuf Abdi', phone: '+252615222333', visit_date: daysAgo(4), visit_time: '16:00', purpose: 'Enterprise package', activities: 'Demo', status: 'Successful', result: 'Trial started', comments: '', created_at: now },
    { id: uuid(), user_id: MARKETING_ID, place_name: 'Corner Shop Waberi', place_type: 'Shop', address: 'Waberi', latitude: 2.0287, longitude: 45.3102, contact_person: 'Fatima Noor', phone: '+252615444555', visit_date: daysAgo(5), visit_time: '12:30', purpose: 'EVC agent registration', activities: 'Onboarding', status: 'Successful', result: 'Agent activated', comments: '', created_at: now },
    { id: uuid(), user_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', place_name: 'City Mall', place_type: 'Business', address: 'KM4 Area', latitude: 2.0445, longitude: 45.3201, contact_person: 'Hassan Ali', phone: '+252615666777', visit_date: daysAgo(6), visit_time: '15:00', purpose: 'Mall WiFi coverage', activities: 'Site assessment', status: 'Pending', result: '', comments: 'Awaiting management approval', created_at: now }
  ];

  const auditLogs = [
    { id: uuid(), user_id: ADMIN_ID, action: 'LOGIN', description: 'Admin logged in successfully', timestamp: now },
    { id: uuid(), user_id: MARKETING_ID, action: 'LOGIN', description: 'Marketing user logged in', timestamp: now },
    { id: uuid(), user_id: MARKETING_ID, action: 'CREATE_VISIT', description: 'Logged visit to Barwaaqo Supermarket', timestamp: now }
  ];

  const tasks = [
    { id: uuid(), assigned_by: ADMIN_ID, assigned_to: MARKETING_ID, service: 'EVC Plus (Mobile Money)', description: 'Visit 5 retail shops in Hodan district to register new EVC Plus merchants', date: daysAgo(0), status: 'pending', created_at: now },
    { id: uuid(), assigned_by: ADMIN_ID, assigned_to: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', service: 'ADSL Plus (Home Broadband)', description: 'Follow up with 3 potential ADSL customers in Wadajir', date: daysAgo(0), status: 'completed', created_at: now },
    { id: uuid(), assigned_by: ADMIN_ID, assigned_to: MARKETING_ID, service: 'WAAFI App (Fintech)', description: 'Demonstrate WAAFI app features to 2 business owners in Hamar Weyne', date: daysAgo(1), status: 'completed', created_at: now },
  ];

  const clients = [
    {
      id: 'c1', name: 'Tanzil Travel Agency', phone: '+252619860009', contact: 'BUULE CALI CABDI',
      employees: 2, isp: 'HORMUUD', type: 'Enterprise',
      services: ['BankAcc','MySMS','FTTH','EvcAPI'],
      svcData: { BankAcc: { account: '110024' }, MySMS: { number: '0615111222' }, FTTH: { number: 'FTTH-8821' }, EvcAPI: { apiKey: 'KEY-9981' } },
      visits: [
        { id: uuid(), agent: 'Ayaanle Mohamed', date: new Date().toISOString(), status: 'Active', notes: 'Service check completed', newServices: ['EvcAPI'], removedServices: [], serviceNumbers: { EvcAPI: 'KEY-9981' } },
        { id: uuid(), agent: 'Ayaanle Mohamed', date: new Date(Date.now() - 86400000 * 15).toISOString(), status: 'Active', notes: 'Initial onboarding', newServices: ['BankAcc','MySMS','FTTH'], removedServices: [], serviceNumbers: { BankAcc: '110024', MySMS: '0615111222', FTTH: 'FTTH-8821' } }
      ],
      created_at: new Date(Date.now() - 86400000 * 30).toISOString()
    }
  ];

  return { users, visits, auditLogs, otps: [], passwordResets: [], tasks, clients, isps: INIT_ISPS, entSvcs: INIT_ENT_SVCS, indSvcs: INIT_IND_SVCS, clientAssignments: [], visitTasks: [], visitReports: [], targetTasks: [], targetProgress: [], notifications: [], recycleBin: [] };
}

function createMockDb() {
  const store = buildSeedData();

  const dbUpdate = (collection, id, updates) => {
    const idx = store[collection].findIndex(item => item.id === id);
    if (idx === -1) return null;
    store[collection][idx] = { ...store[collection][idx], ...updates };
    return store[collection][idx];
  };

  return {
    isMock: true,
    pool: null,

    users: {
      findMany: async () => [...store.users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      findOne: async (filter) => {
        const key = Object.keys(filter)[0];
        return store.users.find(u => u[key] === filter[key]) || null;
      },
      create: async (userData) => {
        const password = userData.password_hash || userData.password || '';
        const password_hash = password.startsWith('$2a$') ? password : bcrypt.hashSync(password, 10);
        const user = {
          id: uuid(),
          full_name: userData.full_name,
          email: userData.email,
          phone: userData.phone || '',
          address: userData.address || '',
          role: userData.role || 'marketing',
          department: userData.department || 'Field Marketing',
          password_hash,
          is_verified: userData.is_verified || false,
          created_at: new Date().toISOString()
        };
        store.users.push(user);
        return user;
      },
      update: async (id, updates) => {
        if (updates.password) {
          updates.password_hash = bcrypt.hashSync(updates.password, 10);
          delete updates.password;
        }
        return dbUpdate('users', id, updates);
      },
      delete: async (id) => {
        const idx = store.users.findIndex(u => u.id === id);
        if (idx === -1) return null;
        const [removed] = store.users.splice(idx, 1);
        store.visits = store.visits.filter(v => v.user_id !== id);
        store.recycleBin.push({ id: uuid(), original_id: removed.id, type: 'users', data: JSON.parse(JSON.stringify(removed)), deleted_by: 'system', deleted_at: new Date().toISOString() });
        return removed;
      }
    },

    visits: {
      findMany: async (filters = {}) => {
        let list = store.visits.map(v => {
          const user = store.users.find(u => u.id === v.user_id);
          return { ...v, employee_name: user?.full_name || 'Unknown Employee', employee_email: user?.email || '' };
        });

        if (filters.user_id) list = list.filter(v => v.user_id === filters.user_id);
        if (filters.status && filters.status !== 'All') list = list.filter(v => v.status === filters.status);
        if (filters.place_type && filters.place_type !== 'All') list = list.filter(v => v.place_type === filters.place_type);
        if (filters.startDate) list = list.filter(v => v.visit_date >= filters.startDate);
        if (filters.endDate) list = list.filter(v => v.visit_date <= filters.endDate);
        if (filters.search) {
          const s = filters.search.toLowerCase();
          list = list.filter(v =>
            v.place_name.toLowerCase().includes(s) ||
            (v.address || '').toLowerCase().includes(s) ||
            (v.contact_person || '').toLowerCase().includes(s) ||
            (v.employee_name || '').toLowerCase().includes(s)
          );
        }

        return list.sort((a, b) => {
          const d = b.visit_date.localeCompare(a.visit_date);
          return d !== 0 ? d : (b.visit_time || '').localeCompare(a.visit_time || '');
        });
      },
      findOne: async (id) => {
        const visit = store.visits.find(v => v.id === id);
        if (!visit) return null;
        const user = store.users.find(u => u.id === visit.user_id);
        return { ...visit, employee_name: user?.full_name || 'Unknown', employee_email: user?.email || '', employee_phone: user?.phone || '' };
      },
      create: async (visitData) => {
        const visit = {
          id: uuid(),
          user_id: visitData.user_id,
          place_name: visitData.place_name,
          place_type: visitData.place_type,
          address: visitData.address || '',
          latitude: visitData.latitude || 0,
          longitude: visitData.longitude || 0,
          contact_person: visitData.contact_person || '',
          phone: visitData.phone || '',
          visit_date: visitData.visit_date,
          visit_time: visitData.visit_time,
          purpose: visitData.purpose || '',
          activities: visitData.activities || '',
          status: visitData.status || 'Pending',
          result: visitData.result || '',
          comments: visitData.comments || '',
          created_at: new Date().toISOString()
        };
        store.visits.push(visit);
        return visit;
      },
      update: async (id, updates) => dbUpdate('visits', id, updates),
      delete: async (id) => {
        const idx = store.visits.findIndex(v => v.id === id);
        if (idx === -1) return null;
        const [removed] = store.visits.splice(idx, 1);
        store.recycleBin.push({ id: uuid(), original_id: removed.id, type: 'visits', data: JSON.parse(JSON.stringify(removed)), deleted_by: 'system', deleted_at: new Date().toISOString() });
        return removed;
      }
    },

    auditLogs: {
      findMany: async () => store.auditLogs.map(l => {
        const user = store.users.find(u => u.id === l.user_id);
        return { ...l, full_name: user?.full_name || 'System' };
      }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      create: async (logData) => {
        const log = { id: uuid(), ...logData, timestamp: new Date().toISOString() };
        store.auditLogs.unshift(log);
        return log;
      }
    },

    otps: {
      create: async (otpData) => {
        const otp = { id: uuid(), ...otpData, is_used: false, created_at: new Date().toISOString() };
        store.otps.push(otp);
        return otp;
      },
      findOne: async (filter) => {
        const key = Object.keys(filter)[0];
        return [...store.otps].reverse().find(o => o[key] === filter[key] && !o.is_used) || null;
      },
      update: async (id, updates) => dbUpdate('otps', id, updates)
    },

    passwordResets: {
      create: async (resetData) => {
        const reset = { id: uuid(), ...resetData, is_used: false, created_at: new Date().toISOString() };
        store.passwordResets.push(reset);
        return reset;
      },
      findOne: async (filter) => {
        const key = Object.keys(filter)[0];
        return [...store.passwordResets].reverse().find(r => r[key] === filter[key] && !r.is_used) || null;
      },
      update: async (id, updates) => dbUpdate('passwordResets', id, updates)
    },

    tasks: {
      findMany: async (filters = {}) => {
        let list = [...store.tasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        if (filters.date) list = list.filter(t => t.date === filters.date);
        if (filters.user_id) {
          list = list.filter(t => t.assigned_to === filters.user_id || t.assigned_to === null);
        }
        if (filters.status) list = list.filter(t => t.status === filters.status);
        return list;
      },
      findOne: async (filter) => {
        const key = Object.keys(filter)[0];
        return store.tasks.find(t => t[key] === filter[key]) || null;
      },
      create: async (taskData) => {
        const task = {
          id: uuid(),
          assigned_by: taskData.assigned_by,
          assigned_to: taskData.assigned_to || null,
          service: taskData.service,
          description: taskData.description,
          date: taskData.date,
          status: taskData.status || 'pending',
          created_at: new Date().toISOString()
        };
        store.tasks.push(task);
        return task;
      },
      update: async (id, updates) => dbUpdate('tasks', id, updates),
      delete: async (id) => {
        const idx = store.tasks.findIndex(t => t.id === id);
        if (idx === -1) return null;
        const [removed] = store.tasks.splice(idx, 1);
        store.recycleBin.push({ id: uuid(), original_id: removed.id, type: 'tasks', data: JSON.parse(JSON.stringify(removed)), deleted_by: 'system', deleted_at: new Date().toISOString() });
        return removed;
      }
    },

    clients: {
      findMany: async () => [...store.clients].sort((a, b) => a.name.localeCompare(b.name)),
      findOne: async (id) => store.clients.find(c => c.id === id) || null,
      create: async (data) => {
        const client = {
          id: uuid(),
          name: data.name,
          phone: data.phone || '',
          contact: data.contact || '',
          employees: data.employees || 1,
          isp: data.isp || 'HORMUUD',
          type: data.type || 'Enterprise',
          services: data.services || [],
          svcData: data.svcData || {},
          visits: [],
          created_at: new Date().toISOString()
        };
        store.clients.push(client);
        return client;
      },
      update: async (id, updates) => {
        const idx = store.clients.findIndex(c => c.id === id);
        if (idx === -1) return null;
        store.clients[idx] = { ...store.clients[idx], ...updates };
        return store.clients[idx];
      },
      delete: async (id) => {
        const idx = store.clients.findIndex(c => c.id === id);
        if (idx === -1) return null;
        const [removed] = store.clients.splice(idx, 1);
        store.recycleBin.push({ id: uuid(), original_id: removed.id, type: 'clients', data: JSON.parse(JSON.stringify(removed)), deleted_by: 'system', deleted_at: new Date().toISOString() });
        return removed;
      },
      addVisit: async (clientId, visitData) => {
        const client = store.clients.find(c => c.id === clientId);
        if (!client) return null;
        const visit = {
          id: uuid(),
          agent: visitData.agent || 'Unknown',
          date: new Date().toISOString(),
          status: visitData.status || 'Active',
          notes: visitData.notes || '',
          newServices: visitData.newServices || [],
          removedServices: visitData.removedServices || [],
          serviceNumbers: visitData.serviceNumbers || {}
        };
        client.visits.push(visit);
        visit.newServices.forEach(s => { if (!client.services.includes(s)) client.services.push(s); });
        visit.removedServices.forEach(s => { client.services = client.services.filter(x => x !== s); });
        Object.entries(visit.serviceNumbers).forEach(([svc, num]) => {
          if (!client.svcData[svc]) client.svcData[svc] = {};
          if (typeof num === 'string' && num) client.svcData[svc].number = num;
        });
        return visit;
      }
    },

    isps: {
      findMany: async () => [...store.isps],
      create: async (name) => {
        const v = name.toUpperCase().trim();
        if (!v || store.isps.includes(v)) return null;
        store.isps.push(v);
        return v;
      },
      delete: async (name) => {
        const idx = store.isps.indexOf(name);
        if (idx === -1) return null;
        const [removed] = store.isps.splice(idx, 1);
        store.recycleBin.push({ id: uuid(), original_id: removed, type: 'isps', data: removed, deleted_by: 'system', deleted_at: new Date().toISOString() });
        return removed;
      }
    },

    entSvcs: {
      findMany: async () => [...store.entSvcs],
      add: async (name) => {
        const v = name.trim();
        if (!v || store.entSvcs.includes(v)) return null;
        store.entSvcs.push(v);
        return v;
      }
    },

    indSvcs: {
      findMany: async () => [...store.indSvcs],
      add: async (name) => {
        const v = name.trim();
        if (!v || store.indSvcs.includes(v)) return null;
        store.indSvcs.push(v);
        return v;
      }
    },

    clientAssignments: {
      findMany: async (filters = {}) => {
        let list = [...store.clientAssignments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        if (filters.client_id) list = list.filter(a => a.client_id === filters.client_id);
        if (filters.assigned_to) list = list.filter(a => a.assigned_to.includes(filters.assigned_to));
        if (filters.assigned_by) list = list.filter(a => a.assigned_by === filters.assigned_by);
        if (filters.status) list = list.filter(a => a.status === filters.status);
        return list;
      },
      findOne: async (id) => store.clientAssignments.find(a => a.id === id) || null,
      create: async (data) => {
        const assignment = {
          id: uuid(),
          client_id: data.client_id,
          assigned_to: data.assigned_to || [],
          assigned_by: data.assigned_by,
          type: data.type || 'visit',
          notes: data.notes || '',
          status: 'pending',
          date: data.date || new Date().toISOString().split('T')[0],
          completed_at: null,
          created_at: new Date().toISOString()
        };
        store.clientAssignments.push(assignment);
        return assignment;
      },
      update: async (id, updates) => dbUpdate('clientAssignments', id, updates),
      delete: async (id) => {
        const idx = store.clientAssignments.findIndex(a => a.id === id);
        if (idx === -1) return null;
        const [removed] = store.clientAssignments.splice(idx, 1);
        store.recycleBin.push({ id: uuid(), original_id: removed.id, type: 'clientAssignments', data: JSON.parse(JSON.stringify(removed)), deleted_by: 'system', deleted_at: new Date().toISOString() });
        return removed;
      }
    },

    visitTasks: {
      findMany: async (filters = {}) => {
        let list = [...store.visitTasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        if (filters.assigned_to) list = list.filter(t => t.assigned_to.includes(filters.assigned_to));
        if (filters.created_by) list = list.filter(t => t.created_by === filters.created_by);
        if (filters.status) list = list.filter(t => t.status === filters.status);
        return list;
      },
      findOne: async (id) => store.visitTasks.find(t => t.id === id) || null,
      create: async (data) => {
        const task = {
          id: uuid(),
          title: data.title || '',
          description: data.description || '',
          assigned_to: data.assigned_to || [],
          services: data.services || [],
          status: data.status || 'active',
          created_by: data.created_by,
          created_at: new Date().toISOString()
        };
        store.visitTasks.push(task);
        return task;
      },
      update: async (id, updates) => dbUpdate('visitTasks', id, updates),
      delete: async (id) => {
        const idx = store.visitTasks.findIndex(t => t.id === id);
        if (idx === -1) return null;
        const [removed] = store.visitTasks.splice(idx, 1);
        store.visitReports = store.visitReports.filter(r => r.task_id !== id);
        store.recycleBin.push({ id: uuid(), original_id: removed.id, type: 'visitTasks', data: JSON.parse(JSON.stringify(removed)), deleted_by: 'system', deleted_at: new Date().toISOString() });
        return removed;
      }
    },

    visitReports: {
      findMany: async (filters = {}) => {
        let list = [...store.visitReports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        if (filters.task_id) list = list.filter(r => r.task_id === filters.task_id);
        if (filters.submitted_by) list = list.filter(r => r.submitted_by === filters.submitted_by);
        return list;
      },
      findOne: async (id) => store.visitReports.find(r => r.id === id) || null,
      create: async (data) => {
        const report = {
          id: uuid(),
          task_id: data.task_id,
          submitted_by: data.submitted_by,
          client_name: data.client_name || '',
          client_phone: data.client_phone || '',
          location: data.location || '',
          notes: data.notes || '',
          service_data: data.service_data || {},
          created_at: new Date().toISOString()
        };
        store.visitReports.push(report);
        return report;
      },
      delete: async (id) => {
        const idx = store.visitReports.findIndex(r => r.id === id);
        if (idx === -1) return null;
        const [removed] = store.visitReports.splice(idx, 1);
        store.recycleBin.push({ id: uuid(), original_id: removed.id, type: 'visitReports', data: JSON.parse(JSON.stringify(removed)), deleted_by: 'system', deleted_at: new Date().toISOString() });
        return removed;
      }
    },

    targetTasks: {
      findMany: async (filters = {}) => {
        let list = [...store.targetTasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        if (filters.assigned_to) list = list.filter(t => t.assigned_to === filters.assigned_to);
        if (filters.assigned_by) list = list.filter(t => t.assigned_by === filters.assigned_by);
        if (filters.service) list = list.filter(t => t.service === filters.service);
        if (filters.status) list = list.filter(t => t.status === filters.status);
        return list;
      },
      findOne: async (id) => store.targetTasks.find(t => t.id === id) || null,
      create: async (data) => {
        const task = {
          id: uuid(),
          service: data.service,
          target_quantity: data.target_quantity || 0,
          period_type: data.period_type || 'monthly',
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          assigned_to: data.assigned_to || null,
          assigned_by: data.assigned_by,
          status: data.status || 'active',
          created_at: new Date().toISOString()
        };
        store.targetTasks.push(task);
        return task;
      },
      update: async (id, updates) => dbUpdate('targetTasks', id, updates),
      delete: async (id) => {
        const idx = store.targetTasks.findIndex(t => t.id === id);
        if (idx === -1) return null;
        const [removed] = store.targetTasks.splice(idx, 1);
        store.targetProgress = store.targetProgress.filter(p => p.target_id !== id);
        store.recycleBin.push({ id: uuid(), original_id: removed.id, type: 'targetTasks', data: JSON.parse(JSON.stringify(removed)), deleted_by: 'system', deleted_at: new Date().toISOString() });
        return removed;
      }
    },

    targetProgress: {
      findMany: async (filters = {}) => {
        let list = [...store.targetProgress].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        if (filters.target_id) list = list.filter(p => p.target_id === filters.target_id);
        if (filters.user_id) list = list.filter(p => p.user_id === filters.user_id);
        return list;
      },
      create: async (data) => {
        const progress = {
          id: uuid(),
          target_id: data.target_id,
          user_id: data.user_id,
          client_name: data.client_name || '',
          client_phone: data.client_phone || '',
          location: data.location || '',
          visit_date: data.visit_date || new Date().toISOString().split('T')[0],
          services: data.services || [],
          notes: data.notes || '',
          created_at: new Date().toISOString()
        };
        store.targetProgress.push(progress);
        return progress;
      },
      delete: async (id) => {
        const idx = store.targetProgress.findIndex(p => p.id === id);
        if (idx === -1) return null;
        const [removed] = store.targetProgress.splice(idx, 1);
        return removed;
      }
    },

    notifications: {
      findMany: async (filters = {}) => {
        let list = [...store.notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        if (filters.user_id) list = list.filter(n => n.user_id === filters.user_id);
        if (filters.is_read !== undefined && filters.is_read !== null) {
          const want = String(filters.is_read) === 'true';
          list = list.filter(n => !!n.is_read === want);
        }
        return list;
      },
      findOne: async (id) => store.notifications.find(n => n.id === id) || null,
      create: async (data) => {
        const notification = {
          id: uuid(),
          user_id: data.user_id,
          type: data.type || 'task',
          title: data.title || '',
          message: data.message || '',
          link: data.link || null,
          is_read: false,
          created_at: new Date().toISOString()
        };
        store.notifications.push(notification);
        return notification;
      },
      update: async (id, updates) => dbUpdate('notifications', id, updates),
      markAllRead: async (user_id) => {
        let count = 0;
        store.notifications.forEach(n => {
          if (n.user_id === user_id && !n.is_read) { n.is_read = true; count++; }
        });
        return count;
      },
      countUnread: async (user_id) => {
        return store.notifications.filter(n => n.user_id === user_id && !n.is_read).length;
      },
      delete: async (id) => {
        const idx = store.notifications.findIndex(n => n.id === id);
        if (idx === -1) return null;
        const [removed] = store.notifications.splice(idx, 1);
        return removed;
      }
    },

    recycleBin: {
      findMany: async () => {
        const users = store.users;
        return [...store.recycleBin].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at)).map(item => {
          const deleter = users.find(u => u.id === item.deleted_by);
          return { ...item, deletedByName: deleter?.full_name || 'Unknown' };
        });
      },
      trash: async (item, type, deletedBy) => {
        if (!item) return null;
        const entry = {
          id: item.id || uuid(),
          original_id: item.id,
          type,
          data: JSON.parse(JSON.stringify(item)),
          deleted_by: deletedBy || 'unknown',
          deleted_at: new Date().toISOString()
        };
        store.recycleBin.push(entry);
        return entry;
      },
      restore: async (id) => {
        const idx = store.recycleBin.findIndex(r => r.original_id === id);
        if (idx === -1) return null;
        const [entry] = store.recycleBin.splice(idx, 1);
        const target = entry.type;
        if (store[target]) {
          store[target].push(entry.data);
        }
        return entry;
      },
      purge: async (id) => {
        const idx = store.recycleBin.findIndex(r => r.original_id === id);
        if (idx === -1) return null;
        const [removed] = store.recycleBin.splice(idx, 1);
        return removed;
      }
    }
  };
};

module.exports = createMockDb;
