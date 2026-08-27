require('dotenv').config({ path: __dirname + '/.env' });

const { app, initializeDatabase } = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initializeDatabase();
    const server = app.listen(PORT, () => {
      console.log(`🚀 [SERVER] Booqasho App Backend running on http://localhost:${PORT}`);
      if (db.isMock) {
        console.log('👤 Demo login: admin@booqasho.com / admin123');
        console.log('👤 Demo login: marketing@booqasho.com / marketing123');
      }
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ [SERVER] Port ${PORT} is already in use!`);
        console.error(`   Run this command to free it:\n`);
        console.error(`   Get-NetTCPConnection -LocalPort ${PORT} | ForEach-Object { taskkill /F /PID $_.OwningProcess }\n`);
        process.exit(1);
      } else {
        throw err;
      }
    });
  } catch (err) {
    console.error('❌ [SERVER] Failed to start:', err.message);
    process.exit(1);
  }
}

startServer();
