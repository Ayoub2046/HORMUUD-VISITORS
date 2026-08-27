require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL missing in .env!');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function main() {
  try {
    console.log('⚡ Connected to Supabase PostgreSQL database.');
    console.log('📖 Reading database schema from database.sql...');
    
    // Read the database.sql file
    const sqlPath = path.join(__dirname, '..', 'database.sql');
    let sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Remove instructions or remarks that might cause SQL execution issues
    // We execute the raw DDL queries
    console.log('🔨 Executing schema DDL and table creations...');
    await pool.query(sqlContent);
    console.log('✅ Schema initialized successfully!');

    // Inject correct password hashes
    console.log('🌱 Injecting Admin and Marketing User credentials...');
    
    // Delete any old overlapping records
    await pool.query("DELETE FROM users WHERE email IN ('admin@booqasho.com', 'marketing@booqasho.com')");

    // Insert Admin
    const adminQuery = `
      INSERT INTO users (id, full_name, email, phone, role, department, password_hash, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    const adminValues = [
      'd3b07384-d113-4ec2-a5d9-4828691512f4',
      'Ayaanle Mohamed',
      'admin@booqasho.com',
      '+252615123456',
      'admin',
      'Marketing Management',
      '$2a$10$3jnsHPTa7UIE3IfI64g3xep/R4jxt3/fk1Y/XtF//BWKQG021aqVW',
      true
    ];
    await pool.query(adminQuery, adminValues);

    // Insert Marketing
    const marketingQuery = `
      INSERT INTO users (id, full_name, email, phone, role, department, password_hash, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    const marketingValues = [
      'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      'Fahad Omar',
      'marketing@booqasho.com',
      '+252615778899',
      'marketing',
      'Field Marketing',
      '$2a$10$8ayp/CAXa8pKd7vZO0eiwezekJ3AATSQnSbktrd05M.yoDCW68R7q',
      true
    ];
    await pool.query(marketingQuery, marketingValues);

    // Insert Default ISPs
    console.log('🌱 Seeding ISPs...');
    const isps = ["HORMUUD", "SOMNET", "GOLIS", "TELESOM", "AMTEL"];
    for (const isp of isps) {
      await pool.query("INSERT INTO isps (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [isp]);
    }

    // Insert Default Enterprise Services
    console.log('🌱 Seeding Enterprise Services...');
    const entSvcs = ["BankAcc","MySMS","MyExam","Land line service","ADSL Plus","Call Center","Payroll","SMS API","Merchant","MMT","FiberOptic","FTTH","WTTX","P2MP","CRPT","MURABAHA","SHORT CODE","EvcAPI"];
    for (const svc of entSvcs) {
      await pool.query("INSERT INTO ent_svcs (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [svc]);
    }

    // Insert Default Individual Services
    console.log('🌱 Seeding Individual Services...');
    const indSvcs = ["EVCPlus","Anfac","Nasiye","Caawiye","Dhigaal","Dhanbaal","Keyd","MiFi","Aqoonmaal","LTE","ADSL","Deeqtoon","Ilawadaag","Waafi"];
    for (const svc of indSvcs) {
      await pool.query("INSERT INTO ind_svcs (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [svc]);
    }

    // Insert Sample Client
    console.log('🌱 Seeding Sample Client...');
    const sampleClient = {
      id: 'c1000000-0000-0000-0000-000000000001',
      name: 'Tanzil Travel Agency',
      phone: '+252619860009',
      contact: 'BUULE CALI CABDI',
      employees: 2,
      isp: 'HORMUUD',
      type: 'Enterprise',
      services: JSON.stringify(['BankAcc', 'MySMS', 'FTTH', 'EvcAPI']),
      svc_data: JSON.stringify({ BankAcc: { account: '110024' }, MySMS: { number: '0615111222' }, FTTH: { number: 'FTTH-8821' }, EvcAPI: { apiKey: 'KEY-9981' } }),
      visits: JSON.stringify([
        { id: 'v1001', agent: 'Ayaanle Mohamed', date: new Date().toISOString(), status: 'Active', notes: 'Service check completed', newServices: ['EvcAPI'], removedServices: [], serviceNumbers: { EvcAPI: 'KEY-9981' } }
      ])
    };
    await pool.query(
      `INSERT INTO clients (id, name, phone, contact, employees, isp, type, services, svc_data, visits)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [sampleClient.id, sampleClient.name, sampleClient.phone, sampleClient.contact, sampleClient.employees, sampleClient.isp, sampleClient.type, sampleClient.services, sampleClient.svc_data, sampleClient.visits]
    );

    console.log('🎉 Seeding completed successfully!');
    console.log('👤 Admin: admin@booqasho.com / admin123');
    console.log('👤 Marketing: marketing@booqasho.com / marketing123');

  } catch (err) {
    console.error('❌ Error executing database script:', err.message || err);
  } finally {
    await pool.end();
  }
}

main();
