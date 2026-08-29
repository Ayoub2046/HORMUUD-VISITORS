const createMockDb = require('./mockDb');
const createPgDb = require('./pgDb');

let dbInstance = null;
let isMock = false;

function useMock(reason) {
  dbInstance = createMockDb();
  isMock = true;
  console.log(`📦 [DATABASE] Using in-memory mock database (${reason}). WARNING: mock data is volatile and WILL be lost on restart.`);
  return dbInstance;
}

async function initialize() {
  // Explicitly requested mock DB (development/demo only)
  if (process.env.USE_MOCK_DB === 'true') {
    return useMock('USE_MOCK_DB=true');
  }

  const connectionString = process.env.DATABASE_URL;

  // No connection string configured
  if (!connectionString) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[DATABASE] DATABASE_URL is required in production. Set it in your environment/variables.');
    }
    return useMock('No DATABASE_URL found');
  }

  const { Pool } = require('pg');

  const attempt = async () => {
    const pool = new Pool({
      connectionString,
      max: parseInt(process.env.POOL_MAX_ACTIVE || '4'),
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: parseInt(process.env.POOL_CONNECTION_TIMEOUT || '15000'),
    });
    await pool.query('SELECT 1');
    return pool;
  };

  // Retry a few times to ride out transient pooler hiccups (cold start, etc.)
  const maxAttempts = Math.max(1, parseInt(process.env.DB_INIT_RETRIES || '3'));
  let lastError;

  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const pool = await attempt();
      dbInstance = createPgDb(pool);
      isMock = false;
      console.log('✅ [DATABASE] Connected to Supabase PostgreSQL via direct PG Pool.');
      return dbInstance;
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ [DATABASE] PostgreSQL connection attempt ${i}/${maxAttempts} failed: ${err.message}`);
      if (i < maxAttempts) await new Promise((r) => setTimeout(r, 1200 * i));
    }
  }

  // PRODUCTION: never silently fall back to a volatile in-memory DB.
  // Doing so would make user data appear to "disappear" on refresh/restart.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `[DATABASE] Could not connect to PostgreSQL in production after ${maxAttempts} attempts (${lastError?.message}). ` +
      `Refusing to fall back to the in-memory mock DB to prevent data loss. Check your DATABASE_URL.`
    );
  }

  // Development only: fall back to mock so the UI still works without PostgreSQL.
  return useMock(`PostgreSQL unavailable (${lastError?.message})`);
}

function getInstance() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initialize() before handling requests.');
  }
  return dbInstance;
}

const db = {
  initialize,
  get isMock() { return isMock; },
  get pool() { return getInstance().pool; },
  get users() { return getInstance().users; },
  get visits() { return getInstance().visits; },
  get auditLogs() { return getInstance().auditLogs; },
  get otps() { return getInstance().otps; },
  get passwordResets() { return getInstance().passwordResets; },
  get tasks() { return getInstance().tasks; },
  get clients() { return getInstance().clients; },
  get isps() { return getInstance().isps; },
  get entSvcs() { return getInstance().entSvcs; },
  get indSvcs() { return getInstance().indSvcs; },
  get clientAssignments() { return getInstance().clientAssignments; },
  get visitTasks() { return getInstance().visitTasks; },
  get visitReports() { return getInstance().visitReports; },
  get targetTasks() { return getInstance().targetTasks; },
  get targetProgress() { return getInstance().targetProgress; },
  get notifications() { return getInstance().notifications; },
  get recycleBin() { return getInstance().recycleBin; }
};

module.exports = db;
