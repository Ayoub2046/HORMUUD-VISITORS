require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const visitRoutes = require('./routes/visits');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const taskRoutes = require('./routes/tasks');
const clientRoutes = require('./routes/clients');
const ispRoutes = require('./routes/isps');
const serviceRoutes = require('./routes/services');
const assignmentRoutes = require('./routes/assignments');
const visitTaskRoutes = require('./routes/visitTasks');
const recycleBinRoutes = require('./routes/recycleBin');

const app = express();

// Allowed origins — include the production Vercel domain automatically
let allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];
const vercelUrl = process.env.VERCEL_URL;
if (vercelUrl) {
  allowedOrigins.push(`https://${vercelUrl}`);
  allowedOrigins.push(`https://www.${vercelUrl}`);
}
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Health check — used by frontend to verify backend is reachable
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    database: db.isMock ? 'Mock In-Memory DB' : 'Supabase PostgreSQL',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/isps', ispRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/visit-tasks', visitTaskRoutes);
app.use('/api/recycle-bin', recycleBinRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Booqasho App Backend REST API is running successfully.',
    environment: process.env.NODE_ENV || 'development',
    database: db.isMock ? 'Mock In-Memory DB' : 'Supabase PostgreSQL'
  });
});

// 404 for unknown API routes (so the SPA fallback does not hijack API calls)
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message || err);
  res.status(500).json({
    success: false,
    message: 'A server error occurred.'
  });
});

// Memoized database initializer so a warm serverless instance reuses the pool
let initPromise = null;
function initializeDatabase() {
  if (!initPromise) {
    initPromise = db.initialize();
  }
  return initPromise;
}

module.exports = app;
module.exports.app = app;
module.exports.initializeDatabase = initializeDatabase;
