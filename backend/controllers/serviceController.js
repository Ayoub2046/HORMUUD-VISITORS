const db = require('../config/db');

const SVC_COLORS = {
  FTTH:"#0066CC",EvcAPI:"#00A651",MySMS:"#FF6B35",BankAcc:"#7B2D8B",
  Payroll:"#C0392B",Merchant:"#E67E22",CRPT:"#1ABC9C",MMT:"#3498DB",
  "Call Center":"#E74C3C","ADSL Plus":"#9B59B6",EVCPlus:"#00897B",
  MURABAHA:"#5D4037","SHORT CODE":"#1565C0",FiberOptic:"#2E7D32"
};

exports.getServices = async (req, res) => {
  try {
    const [entSvcs, indSvcs] = await Promise.all([db.entSvcs.findMany(), db.indSvcs.findMany()]);
    res.json({ success: true, data: { enterprise: entSvcs, individual: indSvcs, colors: SVC_COLORS } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch services.' });
  }
};

exports.addService = async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Service name is required.' });
    if (!type || !['Enterprise','Individual'].includes(type)) return res.status(400).json({ success: false, message: 'Type must be Enterprise or Individual.' });
    const collection = type === 'Enterprise' ? db.entSvcs : db.indSvcs;
    const result = await collection.add(name.trim());
    if (!result) return res.status(400).json({ success: false, message: 'This service already exists.' });
    await db.auditLogs.create({ user_id: req.user.id, action: 'ADD_SERVICE', description: `Added ${type} service "${name}"` });
    res.status(201).json({ success: true, message: `Service "${name}" added.`, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add service.' });
  }
};
