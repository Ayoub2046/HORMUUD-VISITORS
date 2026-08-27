const ExcelJS = require('exceljs');
const db = require('../config/db');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
exports.uploadMiddleware = upload.single('file');

exports.getClients = async (req, res) => {
  try {
    const clients = await db.clients.findMany();
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch clients.' });
  }
};

exports.getClient = async (req, res) => {
  try {
    const client = await db.clients.findOne(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch client.' });
  }
};

exports.createClient = async (req, res) => {
  try {
    const { name, phone, contact, employees, isp, type, services, svcData } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }
    const client = await db.clients.create({ name, phone, contact, employees, isp, type, services, svcData });
    await db.auditLogs.create({ user_id: req.user.id, action: 'CREATE_CLIENT', description: `Created client "${name}"` });
    res.status(201).json({ success: true, message: 'Client created successfully.', data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create client.' });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const client = await db.clients.findOne(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
    const { name, phone, contact, employees, isp, type, services, svcData } = req.body;
    const updated = await db.clients.update(req.params.id, { name, phone, contact, employees, isp, type, services, svcData });
    await db.auditLogs.create({ user_id: req.user.id, action: 'UPDATE_CLIENT', description: `Updated client "${name || client.name}"` });
    res.json({ success: true, message: 'Client updated successfully.', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update client.' });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await db.clients.findOne(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
    await db.clients.delete(req.params.id);
    await db.auditLogs.create({ user_id: req.user.id, action: 'DELETE_CLIENT', description: `Deleted client "${client.name}"` });
    res.json({ success: true, message: 'Client deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete client.' });
  }
};

exports.addVisit = async (req, res) => {
  try {
    const client = await db.clients.findOne(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
    const { status, notes, newServices, removedServices, serviceNumbers } = req.body;
    const visit = await db.clients.addVisit(req.params.id, {
      agent: req.user.full_name || req.user.name,
      status, notes, newServices, removedServices, serviceNumbers
    });
    res.status(201).json({ success: true, message: 'Visit recorded successfully.', data: visit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record visit.' });
  }
};

// Download Excel or CSV template for bulk importing clients
exports.downloadTemplate = async (req, res) => {
  try {
    const format = req.query.format || 'excel';

    if (format === 'csv') {
      const csvHeader = 'Name,Phone,Contact Person,Employees,ISP,Type,Services,Notes\n';
      const sample1 = '"Tanzil Travel Agency","+252619860009","BUULE CALI CABDI",5,"HORMUUD","Enterprise","BankAcc, MySMS, FTTH, EvcAPI","VIP Corporate Client"\n';
      const sample2 = '"Jubba Supermarket","+252615112233","Mohamed Hassan",12,"SOMNET","Enterprise","EVCPlus, Merchant, ADSL Plus","Interested in Fiber"\n';
      const sample3 = '"Dr. Halima Clinic","+252615443322","Dr. Halima Ali",3,"HORMUUD","Individual","EVCPlus, MiFi, Anfac","Regular visit needed"\n';

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=Clients_Import_Template.csv');
      return res.status(200).send(csvHeader + sample1 + sample2 + sample3);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Booqasho App';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Clients_Template');

    sheet.columns = [
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Contact Person', key: 'contact', width: 22 },
      { header: 'Employees', key: 'employees', width: 14 },
      { header: 'ISP', key: 'isp', width: 16 },
      { header: 'Type', key: 'type', width: 16 },
      { header: 'Services', key: 'services', width: 35 },
      { header: 'Notes', key: 'notes', width: 30 }
    ];

    // Style Header Row with Hormuud Green
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF008000' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // Add Sample Rows
    const samples = [
      { name: 'Tanzil Travel Agency', phone: '+252619860009', contact: 'BUULE CALI CABDI', employees: 5, isp: 'HORMUUD', type: 'Enterprise', services: 'BankAcc, MySMS, FTTH, EvcAPI', notes: 'VIP Corporate Client' },
      { name: 'Jubba Supermarket', phone: '+252615112233', contact: 'Mohamed Hassan', employees: 12, isp: 'SOMNET', type: 'Enterprise', services: 'EVCPlus, Merchant, ADSL Plus', notes: 'Interested in Fiber' },
      { name: 'Dr. Halima Clinic', phone: '+252615443322', contact: 'Dr. Halima Ali', employees: 3, isp: 'HORMUUD', type: 'Individual', services: 'EVCPlus, MiFi, Anfac', notes: 'Regular visit needed' }
    ];

    samples.forEach(s => {
      const row = sheet.addRow(s);
      row.alignment = { vertical: 'middle' };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Clients_Import_Template.xlsx');

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error('Template Download Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate template.' });
  }
};

// Bulk Import Clients from Array of Rows
exports.bulkImport = async (req, res) => {
  try {
    const { clients } = req.body;
    if (!Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ success: false, message: 'No client records provided for import.' });
    }

    const createdList = [];
    const errors = [];

    for (let i = 0; i < clients.length; i++) {
      const row = clients[i];
      const name = (row.name || row.Name || row['Client Name'] || '').toString().trim();
      const phone = (row.phone || row.Phone || row['Phone Number'] || '').toString().trim();
      const contact = (row.contact || row.Contact || row['Contact Person'] || '').toString().trim();
      const employees = parseInt(row.employees || row.Employees || '1') || 1;
      const isp = (row.isp || row.ISP || 'HORMUUD').toString().trim().toUpperCase();
      const type = (row.type || row.Type || 'Enterprise').toString().trim();
      const rawServices = row.services || row.Services || '';
      const notes = (row.notes || row.Notes || '').toString().trim();

      if (!name || !phone) {
        errors.push(`Row #${i + 1}: Name and phone are required.`);
        continue;
      }

      let services = [];
      if (Array.isArray(rawServices)) {
        services = rawServices.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof rawServices === 'string' && rawServices.trim()) {
        services = rawServices.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
      }

      const svcData = {};
      services.forEach(s => {
        svcData[s] = {};
      });

      const initialVisits = notes ? [{
        id: require('crypto').randomUUID(),
        agent: req.user.full_name || req.user.name || 'System Import',
        date: new Date().toISOString(),
        status: 'Active',
        notes: `Imported via bulk upload: ${notes}`,
        newServices: services,
        removedServices: [],
        serviceNumbers: {}
      }] : [];

      try {
        const created = await db.clients.create({
          name,
          phone,
          contact,
          employees,
          isp,
          type: type.toLowerCase() === 'individual' ? 'Individual' : 'Enterprise',
          services,
          svcData,
          visits: initialVisits
        });
        createdList.push(created);
      } catch (err) {
        errors.push(`Row #${i + 1} (${name}): ${err.message}`);
      }
    }

    await db.auditLogs.create({
      user_id: req.user.id,
      action: 'BULK_IMPORT_CLIENTS',
      description: `Bulk imported ${createdList.length} clients (${errors.length} skipped)`
    });

    res.status(200).json({
      success: true,
      message: `Successfully imported ${createdList.length} clients!${errors.length > 0 ? ` (${errors.length} rows skipped)` : ''}`,
      data: { importedCount: createdList.length, errors }
    });
  } catch (error) {
    console.error('Bulk Import Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process bulk import.' });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Fadlan dooro file (Please select an Excel or CSV file).' });
    }

    const buffer = req.file.buffer;
    const filename = req.file.originalname.toLowerCase();
    const rows = [];

    if (filename.endsWith('.csv')) {
      const content = buffer.toString('utf8');
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) {
        return res.status(400).json({ success: false, message: 'CSV file-ku waa madhan yahay (CSV file is empty).' });
      }

      const parseCSVLine = (text) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === '"') {
            if (inQuotes && text[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.every(c => !c)) continue;
        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cols[idx] || '';
        });
        rows.push({
          name: rowObj.name || rowObj.clientname || cols[0] || '',
          phone: rowObj.phone || rowObj.phonenumber || cols[1] || '',
          contact: rowObj.contact || rowObj.contactperson || cols[2] || '',
          employees: parseInt(rowObj.employees || cols[3] || '1') || 1,
          isp: (rowObj.isp || cols[4] || 'HORMUUD').toUpperCase(),
          type: rowObj.type || cols[5] || 'Enterprise',
          services: rowObj.services || cols[6] || '',
          notes: rowObj.notes || cols[7] || ''
        });
      }
    } else {
      // Excel (.xlsx / .xls) parsing via ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      if (!worksheet || worksheet.rowCount <= 1) {
        return res.status(400).json({ success: false, message: 'Excel file-ku waa madhan yahay (Excel sheet is empty).' });
      }

      const headerRow = worksheet.getRow(1);
      const colMap = {};
      headerRow.eachCell((cell, colNumber) => {
        const val = (cell.text || cell.value || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        colMap[val] = colNumber;
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const getCol = (key, defaultCol) => {
          const colIdx = colMap[key] || defaultCol;
          const cell = row.getCell(colIdx);
          return (cell.text || cell.value || '').toString().trim();
        };

        const name = getCol('name', 1) || getCol('clientname', 1);
        const phone = getCol('phone', 2) || getCol('phonenumber', 2);
        if (!name && !phone) return; // skip empty rows

        rows.push({
          name,
          phone,
          contact: getCol('contact', 3) || getCol('contactperson', 3),
          employees: parseInt(getCol('employees', 4) || '1') || 1,
          isp: (getCol('isp', 5) || 'HORMUUD').toUpperCase(),
          type: getCol('type', 6) || 'Enterprise',
          services: getCol('services', 7) || '',
          notes: getCol('notes', 8) || ''
        });
      });
    }

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid client rows found in uploaded file.' });
    }

    req.body.clients = rows;
    return exports.bulkImport(req, res);

  } catch (error) {
    console.error('File Upload Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process file: ' + error.message });
  }
};

