// Vercel Serverless Function wrapper for the Booqasho Express backend.
// Vercel routes all /api/* traffic to this single function (see vercel.json).
// It reuses the same Express app used in local development (backend/app.js).

const { app, initializeDatabase } = require('../backend/app');

// Make sure the database is ready before the first request is served.
let ready = initializeDatabase().then(() => {
  console.log('[api/index.js] Database initialized. Ready to serve requests.');
}).catch((err) => {
  console.error('[api/index.js] Database initialization failed:', err.message || err);
});

module.exports = async function handler(req, res) {
  await ready;
  return app(req, res);
};

// Also expose the raw app in case the platform calls it directly.
module.exports.app = app;
