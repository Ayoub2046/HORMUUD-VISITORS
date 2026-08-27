import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

const SVC_COLORS = {
  FTTH:"#0066CC",EvcAPI:"#00A651",MySMS:"#FF6B35",BankAcc:"#7B2D8B",
  Payroll:"#C0392B",Merchant:"#E67E22",CRPT:"#1ABC9C",MMT:"#3498DB",
  "Call Center":"#E74C3C","ADSL Plus":"#9B59B6",EVCPlus:"#00897B",
  MURABAHA:"#5D4037","SHORT CODE":"#1565C0",FiberOptic:"#2E7D32"
};
const svcColor = s => {
  const color = SVC_COLORS[s] || "#607D8B";
  return color;
};

const SVC_FIELDS = {
  BankAcc:[{k:"account",l:"Account Number"}], MySMS:[{k:"number",l:"SMS Number"}],
  MyExam:[{k:"code",l:"Exam Code"}], "Land line service":[{k:"line",l:"Line Number"}],
  "ADSL Plus":[{k:"username",l:"Username"},{k:"package",l:"Package"}],
  "Call Center":[{k:"number",l:"Call Center Number"}], Payroll:[{k:"account",l:"Payroll Account"}],
  "SMS API":[{k:"apiKey",l:"API Key"}], Merchant:[{k:"merchantId",l:"Merchant ID"}],
  MMT:[{k:"number",l:"MMT Number"}], FiberOptic:[{k:"port",l:"Port Number"}],
  FTTH:[{k:"number",l:"FTTH Number"}], WTTX:[{k:"number",l:"WTTX Number"}],
  P2MP:[{k:"number",l:"P2MP Number"}], CRPT:[{k:"number",l:"CRPT Number"}],
  MURABAHA:[{k:"account",l:"Account Number"}], "SHORT CODE":[{k:"code",l:"Short Code"}],
  EvcAPI:[{k:"apiKey",l:"EvcAPI Key"}], EVCPlus:[{k:"number",l:"EVC Number"}],
  Anfac:[{k:"number",l:"Anfac Number"}], Nasiye:[{k:"number",l:"Nasiye Number"}],
  Caawiye:[{k:"number",l:"Caawiye Number"}], Dhigaal:[{k:"number",l:"Dhigaal Number"}],
  Dhanbaal:[{k:"number",l:"Dhanbaal Number"}], Keyd:[{k:"number",l:"Keyd Number"}],
  MiFi:[{k:"serial",l:"MiFi Serial"}], Aqoonmaal:[{k:"number",l:"Aqoonmaal Number"}],
  LTE:[{k:"number",l:"LTE Number"}], ADSL:[{k:"username",l:"Username"}],
  Deeqtoon:[{k:"number",l:"Deeqtoon Number"}], Ilawadaag:[{k:"number",l:"Ilawadaag Number"}],
  Waafi:[{k:"number",l:"Waafi Number"}]
};


export default function Clients({ setActivePage, setClientId }) {
  const { user, apiRequest, token } = useAuth();
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState({ enterprise: [], individual: [] });
  const [isps, setIsps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [modal, setModal] = useState(null); // 'add' or 'bulk'
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const templateDropdownRef = useRef(null);

  const isAdmin = user?.role === 'admin';

  // Close template dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target)) {
        setTemplateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [cRes, sRes, iRes] = await Promise.all([
        apiRequest('/clients'),
        apiRequest('/services'),
        apiRequest('/isps')
      ]);
      if (cRes.success) setClients(cRes.data);
      if (sRes.success) setServices(sRes.data);
      if (iRes.success) setIsps(iRes.data);
    } catch (e) {
      setAlert({ type: 'danger', message: e.message });
    } finally { setLoading(false); }
  }, [apiRequest]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showAlert = (msg, type = 'success') => {
    setAlert({ type, message: msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleDownloadTemplate = async (format = 'excel') => {
    try {
      showAlert(`Downloading ${format.toUpperCase()} template...`, 'info');
      const response = await fetch(`${API_URL}/clients/template?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('Failed to download template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'csv' ? 'Clients_Import_Template.csv' : 'Clients_Import_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showAlert('Template downloaded successfully!', 'success');
    } catch (e) {
      showAlert(e.message, 'danger');
    }
  };

  const handleSave = async (data) => {
    try {
      const res = await apiRequest('/clients', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.success) {
        showAlert(res.message);
        setModal(null);
        fetchData();
      }
    } catch (e) { showAlert(e.message, 'danger'); }
  };

  const handleSaveBulk = async (clientRows) => {
    try {
      const res = await apiRequest('/clients/bulk', {
        method: 'POST',
        body: JSON.stringify({ clients: clientRows })
      });
      if (res.success) {
        showAlert(res.message, 'success');
        setModal(null);
        fetchData();
      }
    } catch (e) { showAlert(e.message, 'danger'); }
  };

  const handleUploadFile = async (fileObj) => {
    try {
      const formData = new FormData();
      formData.append('file', fileObj);
      const response = await fetch(`${API_URL}/clients/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'File upload failed');
      }
      showAlert(data.message, 'success');
      setModal(null);
      fetchData();
    } catch (e) {
      showAlert(e.message, 'danger');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete client "${name}"?`)) return;
    try {
      const res = await apiRequest(`/clients/${id}`, { method: 'DELETE' });
      if (res.success) { showAlert(res.message); fetchData(); }
    } catch (e) { showAlert(e.message, 'danger'); }
  };

  const openClient = (id) => {
    setClientId(id);
    setActivePage('clientDetail');
  };

  const allSvcs = (type) => type === 'Enterprise' ? services.enterprise : services.individual;

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">Clients Directory</h4>
          <p className="text-body-secondary small mb-0">Manage Hormuud corporate &amp; retail clients — bulk import, export &amp; service tracking</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {/* Download Template — React-controlled dropdown (no Bootstrap JS needed) */}
          <div className="position-relative" ref={templateDropdownRef}>
            <button
              className="btn btn-outline-secondary d-flex align-items-center gap-1 shadow-sm"
              type="button"
              onClick={() => setTemplateDropdownOpen(o => !o)}
            >
              <i className="bi bi-download"></i> Download Template <i className={`bi bi-chevron-${templateDropdownOpen ? 'up' : 'down'} ms-1`} style={{fontSize:'0.7rem'}}></i>
            </button>
            {templateDropdownOpen && (
              <div className="position-absolute end-0 mt-1 shadow rounded-3 border-0 bg-white" style={{ zIndex: 1060, minWidth: 240 }}>
                <button
                  className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-top-3"
                  onClick={() => { setTemplateDropdownOpen(false); handleDownloadTemplate('excel'); }}
                >
                  <i className="bi bi-file-earmark-excel-fill text-success fs-5"></i>
                  <div>
                    <div className="fw-semibold small">Excel Template (.xlsx)</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>Recommended — works in Microsoft Excel</div>
                  </div>
                </button>
                <hr className="my-0" />
                <button
                  className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-bottom-3"
                  onClick={() => { setTemplateDropdownOpen(false); handleDownloadTemplate('csv'); }}
                >
                  <i className="bi bi-file-earmark-text-fill text-primary fs-5"></i>
                  <div>
                    <div className="fw-semibold small">CSV Template (.csv)</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>Plain text, any spreadsheet app</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Bulk Import Button */}
          <button onClick={() => setModal('bulk')} className="btn btn-outline-success d-flex align-items-center gap-2 shadow-sm">
            <i className="bi bi-file-earmark-arrow-up-fill"></i> Bulk Upload (Excel / CSV)
          </button>

          {/* Add Single Client */}
          <button onClick={() => setModal('add')} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
            <i className="bi bi-plus-circle-fill"></i> Add Client
          </button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible d-flex align-items-center gap-2 py-2 small`}>
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : alert.type === 'info' ? 'bi-info-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          {alert.message}
          <button type="button" className="btn-close btn-sm" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Client Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-2"></div>
          <p className="text-body-secondary mb-0">Soo akhrinaya...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-people display-4 text-body-secondary"></i>
            <p className="text-body-secondary mt-3">No clients yet. Click "Add Client" to get started.</p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {clients.map(c => (
            <div key={c.id} className="col-12 col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm h-100" style={{ cursor: 'pointer' }} onClick={() => openClient(c.id)}>
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="fw-bold mb-0 text-truncate">{c.name}</h6>
                    <span className={`badge ${c.type === 'Enterprise' ? 'bg-primary' : 'bg-success'} rounded-pill`}>{c.type}</span>
                  </div>
                  <div className="small text-body-secondary mb-2">
                    <i className="bi bi-telephone me-1"></i>{c.phone} &middot; <i className="bi bi-person me-1"></i>{c.contact}
                  </div>
                  <div className="small text-body-secondary mb-2">
                    <i className="bi bi-wifi me-1"></i>{c.isp} &middot; <i className="bi bi-people me-1"></i>{c.employees} employees
                  </div>
                  <div className="d-flex flex-wrap gap-1 mb-2">
                    {c.services && Array.isArray(c.services) && c.services.length > 0 ? c.services.slice(0, 5).map(s => {
                      const svcName = typeof s === 'object' && s !== null ? (s.name || s.id || '') : String(s || '');
                      return (
                        <span key={svcName} className="badge" style={{ background: svcColor(svcName) }}>{svcName}</span>
                      );
                    }) : null}
                  </div>
                  {(c.services?.length || 0) > 5 && <span className="badge bg-secondary">+{(c.services?.length || 0) - 5}</span>}
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-body-secondary"><i className="bi bi-journal me-1"></i>{c.visits?.length || 0} visits</small>
                    {isAdmin && (
                      <div onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleDelete(c.id, c.name)} className="btn btn-sm btn-outline-danger" title="Delete">
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {modal === 'add' && (
        <ClientFormModal
          services={services}
          isps={isps}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Bulk Import Modal */}
      {modal === 'bulk' && (
        <BulkClientModal
          onUploadFile={handleUploadFile}
          onSaveBulk={handleSaveBulk}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function ClientFormModal({ services, isps, onSave, onClose }) {
  const [type, setType] = useState('Enterprise');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contact, setContact] = useState('');
  const [employees, setEmployees] = useState(1);
  const [isp, setIsp] = useState('HORMUUD');
  const [selected, setSelected] = useState(new Set());
  const [svcData, setSvcData] = useState({});

  const allSvcs = type === 'Enterprise' ? services.enterprise : services.individual;

  const toggleSvc = (s) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(s)) { next.delete(s); setSvcData(d => { const c = {...d}; delete c[s]; return c; }); }
      else next.add(s);
      return next;
    });
  };

  const updateSvcData = (svc, key, val) => {
    setSvcData(d => {
      const c = {...d};
      if (!c[svc]) c[svc] = {};
      c[svc][key] = val;
      return c;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { alert('Please fill in name and phone'); return; }
    onSave({ name: name.trim(), phone: phone.trim(), contact: contact.trim(), employees: Number(employees), isp, type, services: [...selected], svcData });
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 pb-0">
            <h5 className="fw-bold"><i className="bi bi-plus-circle-fill text-primary me-2"></i>New Client</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-semibold">Type</label>
                  <div className="d-flex gap-3">
                    {['Enterprise','Individual'].map(t => (
                      <label key={t} className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                        <input type="radio" name="ctype" checked={type === t} onChange={() => { setType(t); setSelected(new Set()); setSvcData({}); }} />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Name *</label>
                  <input className="form-control" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold">Phone *</label>
                  <input className="form-control" value={phone} onChange={e => setPhone(e.target.value)} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold">Contact Person</label>
                  <input className="form-control" value={contact} onChange={e => setContact(e.target.value)} />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold">ISP</label>
                  <select className="form-select" value={isp} onChange={e => setIsp(e.target.value)}>
                    {isps.map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold">Employees</label>
                  <input type="number" className="form-control" min="0" value={employees} onChange={e => setEmployees(e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Services ({type})</label>
                  <div className="d-flex flex-wrap gap-2 p-3 bg-body-tertiary rounded-3 border">
                    {allSvcs.map(s => {
                      const btnColor = selected.has(s) ? { background: svcColor(s), color: '#fff', borderColor: svcColor(s) } : {};
                      return (
                        <button key={s} type="button"
                          className={`btn btn-sm ${selected.has(s) ? '' : 'btn-outline-secondary'}`}
                          style={btnColor}
                          onClick={() => toggleSvc(s)}>
                          {selected.has(s) ? '✓ ' : ''}{s}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {selected.size > 0 && (
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Account Numbers / Details</label>
                    <div className="d-flex flex-column gap-2">
                      {[...selected].map(s => {
                        const fields = SVC_FIELDS[s] || [{k:'number',l:'Number/Account'}];
                        return (
                          <div key={s} className="p-3 rounded-3 border" style={{ borderLeft: '3px solid ' + svcColor(s) }}>
                            <span className="badge mb-2" style={{ background: svcColor(s) }}>{s}</span>
                            <div className="row g-2">
                              {fields.map(f => (
                                <div key={f.k} className={fields.length > 1 ? 'col-6' : 'col-12'}>
                                  <label className="form-label small">{f.l}</label>
                                  <input className="form-control form-control-sm"
                                    value={svcData[s]?.[f.k] || ''}
                                    onChange={e => updateSvcData(s, f.k, e.target.value)}
                                    placeholder="Enter Number/Account"
                                    />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4"><i className="bi bi-save2 me-1"></i>Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function BulkClientModal({ onUploadFile, onSaveBulk, onClose }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileInputRef = React.useRef();

  const parseCSVLine = (text) => {
    const result = [];
    let cur = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) { result.push(cur.trim()); cur = ''; }
      else cur += char;
    }
    result.push(cur.trim());
    return result;
  };

  const parseFile = async (selectedFile) => {
    setFile(selectedFile);
    setParseError('');
    setPreviewRows([]);
    if (!selectedFile) return;

    const fname = selectedFile.name.toLowerCase();
    if (!fname.endsWith('.csv') && !fname.endsWith('.xlsx') && !fname.endsWith('.xls')) {
      setParseError('Only .xlsx, .xls, or .csv files are supported.');
      return;
    }

    setParsing(true);
    try {
      if (fname.endsWith('.csv')) {
        const text = await selectedFile.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length <= 1) { setParseError('CSV is empty or has only a header row.'); setParsing(false); return; }
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.every(c => !c)) continue;
          const rowObj = {};
          headers.forEach((h, idx) => { rowObj[h] = cols[idx] || ''; });
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
        setPreviewRows(rows);
      } else {
        // For xlsx, we let the server parse it — just show file info
        setPreviewRows([{ _xlsxPlaceholder: true, name: selectedFile.name, size: selectedFile.size }]);
      }
    } catch (err) {
      setParseError('Failed to parse file: ' + err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) parseFile(dropped);
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) parseFile(selected);
  };

  const handleImport = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fname = file.name.toLowerCase();
      if (fname.endsWith('.csv') && previewRows.length > 0 && !previewRows[0]._xlsxPlaceholder) {
        await onSaveBulk(previewRows);
      } else {
        await onUploadFile(file);
      }
    } finally {
      setUploading(false);
    }
  };

  const isXlsx = file && (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'));
  const validRows = previewRows.filter(r => !r._xlsxPlaceholder && r.name && r.phone);
  const invalidRows = previewRows.filter(r => !r._xlsxPlaceholder && (!r.name || !r.phone));
  const canImport = file && (isXlsx || validRows.length > 0);

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg">

          {/* Header */}
          <div className="modal-header border-0" style={{ background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)', color: '#fff' }}>
            <div>
              <h5 className="fw-bold mb-0"><i className="bi bi-file-earmark-arrow-up-fill me-2"></i>Bulk Import Clients</h5>
              <small className="opacity-75">Upload Excel (.xlsx) or CSV file to import multiple clients at once</small>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">

            {/* Instructions */}
            <div className="alert alert-info d-flex align-items-start gap-3 py-3 border-0" style={{ background: '#e8f4fd' }}>
              <i className="bi bi-lightbulb-fill text-warning fs-5 mt-1"></i>
              <div className="small">
                <strong>How to use:</strong>
                <ol className="mb-0 ps-3 mt-1">
                  <li>Download the template using <strong>"Download Template"</strong> button above</li>
                  <li>Fill in your client data (Name and Phone are required)</li>
                  <li>Upload the filled file here and review the preview</li>
                  <li>Click <strong>"Import Clients"</strong> to save all records</li>
                </ol>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className={`border-2 rounded-4 text-center p-5 mb-4 ${dragOver ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary border-dashed'}`}
              style={{
                border: `2px dashed ${dragOver ? '#0d6efd' : '#adb5bd'}`,
                background: dragOver ? 'rgba(13,110,253,0.05)' : 'rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="d-none" onChange={handleFileSelect} />
              {file ? (
                <div>
                  <i className={`bi ${file.name.endsWith('.csv') ? 'bi-file-earmark-text-fill text-primary' : 'bi-file-earmark-excel-fill text-success'} display-4`}></i>
                  <p className="fw-bold mt-2 mb-1">{file.name}</p>
                  <small className="text-body-secondary">{(file.size / 1024).toFixed(1)} KB — Click to change file</small>
                </div>
              ) : (
                <div>
                  <i className="bi bi-cloud-arrow-up display-3 text-body-secondary"></i>
                  <p className="fw-semibold mt-3 mb-1">Drag &amp; drop your Excel or CSV file here</p>
                  <small className="text-body-secondary">or click to browse files (.xlsx, .xls, .csv)</small>
                </div>
              )}
            </div>

            {/* Parse Error */}
            {parseError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2">
                <i className="bi bi-exclamation-triangle-fill"></i> {parseError}
              </div>
            )}

            {/* Parsing spinner */}
            {parsing && (
              <div className="text-center py-3">
                <div className="spinner-border text-primary spinner-border-sm me-2"></div>
                <small className="text-body-secondary">Parsing file...</small>
              </div>
            )}

            {/* XLSX placeholder — no client-side preview for Excel */}
            {isXlsx && file && !parsing && (
              <div className="alert alert-warning d-flex align-items-center gap-2 border-0" style={{ background: '#fff8e1' }}>
                <i className="bi bi-file-earmark-excel-fill text-success fs-5"></i>
                <div>
                  <strong>Excel file selected.</strong> Preview will be generated after upload.<br />
                  <small className="text-body-secondary">File: <em>{file.name}</em> ({(file.size / 1024).toFixed(1)} KB)</small>
                </div>
              </div>
            )}

            {/* CSV Preview Table */}
            {!isXlsx && previewRows.length > 0 && !parsing && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold mb-0">
                    <i className="bi bi-table me-2 text-primary"></i>Preview — {previewRows.length} rows found
                  </h6>
                  <div className="d-flex gap-2">
                    {validRows.length > 0 && <span className="badge bg-success rounded-pill">✓ {validRows.length} valid</span>}
                    {invalidRows.length > 0 && <span className="badge bg-warning text-dark rounded-pill">⚠ {invalidRows.length} missing Name/Phone</span>}
                  </div>
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }} className="border rounded-3">
                  <table className="table table-sm table-hover mb-0">
                    <thead className="table-dark sticky-top">
                      <tr>
                        <th style={{ width: 32 }}>#</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Contact</th>
                        <th>ISP</th>
                        <th>Type</th>
                        <th>Services</th>
                        <th style={{ width: 70 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, idx) => {
                        const isValid = row.name && row.phone;
                        return (
                          <tr key={idx} className={!isValid ? 'table-warning' : ''}>
                            <td className="text-body-secondary">{idx + 1}</td>
                            <td className="fw-semibold">{row.name || <em className="text-danger">Missing</em>}</td>
                            <td>{row.phone || <em className="text-danger">Missing</em>}</td>
                            <td className="text-body-secondary">{row.contact || '—'}</td>
                            <td><span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.7rem' }}>{row.isp || 'HORMUUD'}</span></td>
                            <td><span className={`badge rounded-pill ${row.type === 'Individual' ? 'bg-success' : 'bg-primary'}`} style={{ fontSize: '0.7rem' }}>{row.type || 'Enterprise'}</span></td>
                            <td className="text-body-secondary small">{row.services || '—'}</td>
                            <td className="text-center">
                              {isValid
                                ? <span title="Ready to import">✅</span>
                                : <span title="Missing Name or Phone">⚠️</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 bg-light">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={uploading}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-success px-4 d-flex align-items-center gap-2"
              onClick={handleImport}
              disabled={!canImport || uploading}
            >
              {uploading ? (
                <><span className="spinner-border spinner-border-sm"></span> Importing...</>
              ) : (
                <><i className="bi bi-cloud-upload-fill"></i>
                  {isXlsx
                    ? `Import from Excel`
                    : `Import ${validRows.length} Clients`
                  }
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}