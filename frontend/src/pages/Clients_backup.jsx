import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

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
  const { user, apiRequest } = useAuth();
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState({ enterprise: [], individual: [] });
  const [isps, setIsps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [modal, setModal] = useState(null);

  const isAdmin = user?.role === 'admin';

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
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">Clients</h4>
          <p className="text-body-secondary small mb-0">Manage Hormuud clients — track which services they have</p>
        </div>
        <button onClick={() => setModal('add')} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm w-100 w-sm-auto">
          <i className="bi bi-plus-circle-fill"></i> Add Client
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible d-flex align-items-center gap-2 py-2 small`}>
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
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
                    {c.services && c.services.length > 0 ? c.services.slice(0, 5).map(s => {
                      return (
                        <span key={s} className="badge" style={{ background: svcColor(s) }}>{s}</span>
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

      {/* Add/Edit Client Modal */}
      {modal && (
        <ClientFormModal
          services={services}
          isps={isps}
          onSave={handleSave}
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
                          className={`btn btn-sm ${selected.has(s) ? '' : 'btn-outline-secondary'}``}
                          style={btnColor}
                          onClick={() => toggleSvc(s)}>
                          {selected.has(s) ? '✓ ' : ''}{s}
                        </button>
                      ))}
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
                                    placeholder="Enter " + f.l + "..." />
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