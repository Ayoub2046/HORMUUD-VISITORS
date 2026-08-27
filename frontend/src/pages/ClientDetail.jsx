import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const SVC_COLORS = {
  FTTH:"#0066CC",EvcAPI:"#00A651",MySMS:"#FF6B35",BankAcc:"#7B2D8B",
  Payroll:"#C0392B",Merchant:"#E67E22",CRPT:"#1ABC9C",MMT:"#3498DB",
  "Call Center":"#E74C3C","ADSL Plus":"#9B59B6",EVCPlus:"#00897B",
  MURABAHA:"#5D4037","SHORT CODE":"#1565C0",FiberOptic:"#2E7D32"
};
const svcColor = s => SVC_COLORS[s] || "#607D8B";

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

const fmtDate = d => new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});

function statusBadge(s) {
  const m = { Active: { bg: '#C6F6D5', c: '#276749' }, Pending: { bg: '#FEFCBF', c: '#744210' }, Inactive: { bg: '#FED7D7', c: '#C53030' } };
  const x = m[s] || { bg: '#EDF2F7', c: '#4A5568' };
  return <span className="badge rounded-pill" style={{ background: x.bg, color: x.c }}>{s}</span>;
}

export default function ClientDetail({ clientId, setActivePage, setClientId }) {
  const { user, apiRequest } = useAuth();
  const [client, setClient] = useState(null);
  const [services, setServices] = useState({ enterprise: [], individual: [] });
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [visitModal, setVisitModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchClient = useCallback(async () => {
    try {
      setLoading(true);
      const [cRes, sRes, aRes] = await Promise.all([
        apiRequest(`/clients/${clientId}`),
        apiRequest('/services'),
        apiRequest(`/assignments?client_id=${clientId}`)
      ]);
      if (cRes.success) setClient(cRes.data);
      if (sRes.success) setServices(sRes.data);
      if (aRes.success) setAssignments(aRes.data);
    } catch (e) {
      setAlert({ type: 'danger', message: e.message });
    } finally { setLoading(false); }
  }, [clientId, apiRequest]);

  useEffect(() => { fetchClient(); }, [fetchClient]);

  const showAlert = (msg, type = 'success') => {
    setAlert({ type, message: msg });
    setTimeout(() => setAlert(null), 3000);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-2"></div>
        <p className="text-body-secondary mb-0">Soo akhrinaya...</p>
      </div>
    );
  }

  if (!client) {
    return <div className="text-center py-5 text-body-secondary">Macmiilka lama helin.</div>;
  }

  const allSvcs = (client.type === 'Enterprise' ? services?.enterprise : services?.individual) || [];
  const clientServices = Array.isArray(client.services) ? client.services.map(s => typeof s === 'object' && s !== null ? (s.name || s.id || '') : String(s || '')) : [];
  const clientSvcData = client.svcData || {};
  const clientVisits = Array.isArray(client.visits)
    ? client.visits
    : (typeof client.visits === 'string'
        ? (() => { try { const p = JSON.parse(client.visits); return Array.isArray(p) ? p : []; } catch(e) { return []; } })()
        : []);

  return (
    <div>
      {/* Back button */}
      <button onClick={() => { setClientId(null); setActivePage('clients'); }}
        className="btn btn-link text-decoration-none p-0 mb-3">
        <i className="bi bi-arrow-left me-1"></i>Clients
      </button>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible d-flex align-items-center gap-2 py-2 small`}>
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          {alert.message}
          <button type="button" className="btn-close btn-sm" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Client Info Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <h4 className="fw-bold mb-0">{client.name}</h4>
                <span className={`badge ${client.type === 'Enterprise' ? 'bg-primary' : 'bg-success'} rounded-pill`}>{client.type}</span>
              </div>
              <div className="d-flex flex-wrap gap-3 text-body-secondary small">
                <span><i className="bi bi-telephone me-1"></i>{client.phone || '—'}</span>
                <span><i className="bi bi-person me-1"></i>{client.contact || '—'}</span>
                <span><i className="bi bi-wifi me-1"></i>{client.isp || '—'}</span>
                <span><i className="bi bi-people me-1"></i>{client.employees || 1} employees</span>
              </div>
            </div>
            <div className="d-flex gap-2 flex-shrink-0">
              {isAdmin && <button onClick={() => setAssignModal(true)} className="btn btn-outline-warning"><i className="bi bi-send me-1"></i>Assign</button>}
              <button onClick={() => setVisitModal(true)} className="btn btn-success"><i className="bi bi-plus-circle me-1"></i>Log Visit</button>
              <button onClick={() => setEditModal(true)} className="btn btn-outline-primary"><i className="bi bi-pencil me-1"></i>Edit</button>
            </div>
          </div>
          {/* Visit stats row */}
          <div className="d-flex flex-wrap gap-4 mt-3 pt-3 border-top">
            <div>
              <div className="fw-bold fs-5 text-primary">{clientVisits.length}</div>
              <div className="small text-body-secondary">Total Visits</div>
            </div>
            <div>
              <div className="fw-bold fs-5 text-success">
                {(() => { const agents = [...new Set(clientVisits.map(v => v.agent))]; return agents.length; })()}
              </div>
              <div className="small text-body-secondary">Who Visited</div>
            </div>
            <div>
              <div className="fw-bold fs-5 text-warning">{assignments.filter(a => a.status === 'pending').length}</div>
              <div className="small text-body-secondary">Pending Assignments</div>
            </div>
          </div>
          {/* Who visited list */}
          {clientVisits.length > 0 && (
            <div className="mt-2 d-flex flex-wrap gap-2">
              {[...new Set(clientVisits.map(v => v.agent))].map(agent => {
                const count = clientVisits.filter(v => v.agent === agent).length;
                return (
                  <span key={agent} className="badge bg-light text-dark border px-3 py-2">
                    <i className="bi bi-person me-1"></i>{agent} <span className="text-primary fw-bold">({count}x)</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Services Section */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">Services — Has ({clientServices.length}/{allSvcs.length})</h6>
          {clientServices.length === 0 && allSvcs.length === 0 ? (
            <p className="text-body-secondary small mb-0">No services configured.</p>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {allSvcs.map(s => {
                const svcName = typeof s === 'object' && s !== null ? (s.name || s.id || '') : String(s || '');
                const has = clientServices.includes(svcName);
                const data = clientSvcData?.[svcName];
                const num = data && typeof data === 'object' ? Object.values(data).filter(Boolean).join(' · ') : null;
                return (
                  <div key={svcName} className="p-2 rounded-3 border" style={{
                    borderColor: has ? svcColor(svcName) : '#E2E8F0',
                    background: has ? `${svcColor(svcName)}08` : '#F7FAFC',
                    opacity: has ? 1 : 0.6,
                    minWidth: '120px'
                  }}>
                    <div className="d-flex align-items-center gap-1">
                      <span className="badge" style={{ background: has ? svcColor(svcName) : '#94A3B8' }}>{svcName}</span>
                      {!has && <small className="text-body-secondary ms-1">(doesn't have)</small>}
                    </div>
                    {has && num && <div className="small text-body-secondary mt-1">{num}</div>}
                    {has && !num && <div className="small text-body-secondary mt-1">—</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Visit History */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">Visit History ({clientVisits.length})</h6>
          {!clientVisits.length ? (
            <p className="text-body-secondary small mb-0">No visits recorded.</p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {[...clientVisits].reverse().map(v => (
                <div key={v.id || Math.random()} className="p-3 rounded-3 border bg-body-tertiary">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-semibold small"><i className="bi bi-person me-1"></i>{v.agent || 'Unknown'}</div>
                    <div className="d-flex align-items-center gap-2">
                      {statusBadge(v.status || 'Active')}
                      <small className="text-body-secondary">{fmtDate(v.date || new Date())}</small>
                    </div>
                  </div>
                  {v.notes && <p className="small mb-2">{v.notes}</p>}
                  {v.newServices && Array.isArray(v.newServices) && v.newServices.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mb-1">
                      <small className="text-body-secondary me-1">New:</small>
                      {v.newServices.map(s => (
                        <span key={s} className="badge" style={{ background: '#C6F6D5', color: '#276749' }}>
                          +{s}{v.serviceNumbers?.[s] ? ` (${v.serviceNumbers[s]})` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  {v.removedServices && Array.isArray(v.removedServices) && v.removedServices.length > 0 && (
                    <div className="d-flex flex-wrap gap-1">
                      <small className="text-body-secondary me-1">Removed:</small>
                      {v.removedServices.map(s => (
                        <span key={s} className="badge" style={{ background: '#FED7D7', color: '#C53030' }}>-{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visit Modal */}
      {visitModal && (
        <VisitFormModal
          client={client}
          allSvcs={allSvcs}
          onSave={async (data) => {
            try {
              const res = await apiRequest(`/clients/${client.id}/visits`, {
                method: 'POST',
                body: JSON.stringify(data)
              });
              if (res.success) { showAlert(res.message); setVisitModal(false); fetchClient(); }
            } catch (e) { showAlert(e.message, 'danger'); }
          }}
          onClose={() => setVisitModal(false)}
        />
      )}

      {/* Assignment History */}
      {assignments.length > 0 && (
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-body p-4">
            <h6 className="fw-bold mb-3"><i className="bi bi-send-fill me-2"></i>Assignments ({assignments.length})</h6>
            <div className="d-flex flex-column gap-2">
              {assignments.map(a => (
                <div key={a.id} className="p-3 rounded-3 border bg-body-tertiary d-flex justify-content-between align-items-center">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className={`badge ${a.type === 'visit' ? 'bg-primary' : 'bg-info'}`}>
                        <i className={`bi ${a.type === 'visit' ? 'bi-person-walking' : 'bi-telephone'} me-1`}></i>
                        {a.type === 'visit' ? 'Visit' : 'Call'}
                      </span>
                      <span className={`badge rounded-pill ${a.status === 'completed' ? 'bg-success' : a.status === 'cancelled' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="small">
                      Assigned to <strong>{a.assignedToNames?.join(', ') || '—'}</strong>
                      {a.assignedByName && <span> by <strong>{a.assignedByName}</strong></span>}
                      <span className="text-body-secondary ms-2">{a.date}</span>
                    </div>
                    {a.notes && (
                      <div className="small mt-2 p-2 rounded-3" style={{ background: '#EBF8FF', border: '1px solid #BEE3F8' }}>
                        <span className="fw-semibold text-primary">Response:</span> {a.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal (Admin) */}
      {assignModal && (
        <AssignModal
          clientId={client.id}
          onSave={async (data) => {
            try {
              const res = await apiRequest('/assignments', {
                method: 'POST',
                body: JSON.stringify({ client_id: client.id, ...data })
              });
              if (res.success) { showAlert(res.message); setAssignModal(false); fetchClient(); }
            } catch (e) { showAlert(e.message, 'danger'); }
          }}
          onClose={() => setAssignModal(false)}
        />
      )}

      {/* Edit Modal */}
      {editModal && (
        <EditClientModal
          client={client}
          services={services}
          allSvcs={allSvcs}
          onSave={async (data) => {
            try {
              const res = await apiRequest(`/clients/${client.id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
              });
              if (res.success) { showAlert(res.message); setEditModal(false); fetchClient(); }
            } catch (e) { showAlert(e.message, 'danger'); }
          }}
          onClose={() => setEditModal(false)}
        />
      )}
    </div>
  );
}

/* ───── Visit Form Modal ───── */
function VisitFormModal({ client, allSvcs, onSave, onClose }) {
  const [status, setStatus] = useState('Active');
  const [notes, setNotes] = useState('');
  const [newSvcs, setNewSvcs] = useState(new Set());
  const [rmSvcs, setRmSvcs] = useState(new Set());
  const [svcNumbers, setSvcNumbers] = useState({});

  const safeServices = Array.isArray(client.services) ? client.services.map(s => typeof s === 'object' && s !== null ? (s.name || s.id || '') : String(s || '')) : [];
  const safeAllSvcs = Array.isArray(allSvcs) ? allSvcs.map(s => typeof s === 'object' && s !== null ? (s.name || s.id || '') : String(s || '')) : [];

  const notHas = safeAllSvcs.filter(s => !safeServices.includes(s));
  const hasAlready = safeServices;

  const toggleNew = (s) => {
    setNewSvcs(prev => {
      const n = new Set(prev);
      if (n.has(s)) { n.delete(s); setSvcNumbers(d => { const c = {...d}; delete c[s]; return c; }); }
      else n.add(s);
      return n;
    });
  };

  const toggleRm = (s) => {
    setRmSvcs(prev => { const n = new Set(prev); if (n.has(s)) n.delete(s); else n.add(s); return n; });
  };

  const handleSubmit = () => {
    onSave({ status, notes, newServices: [...newSvcs], removedServices: [...rmSvcs], serviceNumbers: svcNumbers });
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 pb-0">
            <h5 className="fw-bold"><i className="bi bi-journal-plus text-success me-2"></i>New Visit</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            <p className="small text-body-secondary mb-3">Client: <strong>{client.name}</strong></p>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Client Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {hasAlready.length > 0 && (
              <div className="mb-3 p-3 rounded-3" style={{ background: '#EBF4FF', border: '1px solid #BEE3F8' }}>
                <label className="form-label small fw-semibold">Existing Services — Number/Account</label>
                {hasAlready.map(s => (
                  <div key={s} className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge" style={{ background: svcColor(s), minWidth: '90px' }}>{s}</span>
                    <input className="form-control form-control-sm" placeholder={`${s} number...`}
                      value={svcNumbers[s] || ''}
                      onChange={e => setSvcNumbers(d => ({...d, [s]: e.target.value}))} />
                  </div>
                ))}
              </div>
            )}

            {notHas.length > 0 && (
              <div className="mb-3 p-3 rounded-3" style={{ background: '#F0FFF4', border: '1px solid #C6F6D5' }}>
                <label className="form-label small fw-semibold">New Services (Client Wants)</label>
                <div className="d-flex flex-wrap gap-2">
                  {notHas.map(s => (
                    <button key={s} type="button"
                      className={`btn btn-sm ${newSvcs.has(s) ? '' : 'btn-outline-secondary'}`}
                      style={newSvcs.has(s) ? { background: svcColor(s), color: '#fff', borderColor: svcColor(s) } : {}}
                      onClick={() => toggleNew(s)}>
                      {newSvcs.has(s) ? '✓ +' : '+'}{s}
                    </button>
                  ))}
                </div>
                {newSvcs.size > 0 && (
                  <div className="mt-2 pt-2 border-top">
                    {[...newSvcs].map(s => (
                      <div key={s} className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge" style={{ background: svcColor(s), minWidth: '90px' }}>{s}</span>
                        <input className="form-control form-control-sm" placeholder={`${s} number...`}
                          value={svcNumbers[s] || ''}
                          onChange={e => setSvcNumbers(d => ({...d, [s]: e.target.value}))} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {hasAlready.length > 0 && (
              <div className="mb-3 p-3 rounded-3" style={{ background: '#FFF5F5', border: '1px solid #FED7D7' }}>
                <label className="form-label small fw-semibold">Remove Services</label>
                <div className="d-flex flex-wrap gap-2">
                  {hasAlready.map(s => (
                    <button key={s} type="button"
                      className={`btn btn-sm ${rmSvcs.has(s) ? 'btn-danger' : 'btn-outline-secondary'}`}
                      onClick={() => toggleRm(s)}>
                      {rmSvcs.has(s) ? '✗ ' : '-'}{s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label small fw-semibold">Notes</label>
              <textarea className="form-control" rows="3" placeholder="Any notes..."
                value={notes} onChange={e => setNotes(e.target.value)}></textarea>
            </div>
          </div>
          <div className="modal-footer border-0">
            <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-success px-4" onClick={handleSubmit}>
              <i className="bi bi-check-lg me-1"></i>Save Visit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── Edit Client Form Modal ───── */
function EditClientModal({ client, services, allSvcs, onSave, onClose }) {
  const [name, setName] = useState(client.name || '');
  const [phone, setPhone] = useState(client.phone || '');
  const [contact, setContact] = useState(client.contact || '');
  const [employees, setEmployees] = useState(client.employees || 1);
  const safeClientSvcs = Array.isArray(client.services) ? client.services.map(s => typeof s === 'object' && s !== null ? (s.name || s.id || '') : String(s || '')) : [];
  const [selected, setSelected] = useState(new Set(safeClientSvcs));
  const [svcData, setSvcData] = useState(JSON.parse(JSON.stringify(client.svcData || {})));

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
    onSave({ name: name.trim(), phone: phone.trim(), contact: contact.trim(), employees: Number(employees), isp: client.isp, type: client.type, services: [...selected], svcData });
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 pb-0">
            <h5 className="fw-bold"><i className="bi bi-pencil-square text-primary me-2"></i>Edit Client</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div className="row g-3">
                <div className="col-6">
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
                  <label className="form-label small fw-semibold">Employees</label>
                  <input type="number" className="form-control" min="0" value={employees} onChange={e => setEmployees(e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Services ({client.type})</label>
                  <div className="d-flex flex-wrap gap-2 p-3 bg-body-tertiary rounded-3 border">
                    {allSvcs.map(s => (
                      <button key={s} type="button"
                        className={`btn btn-sm ${selected.has(s) ? '' : 'btn-outline-secondary'}`}
                        style={selected.has(s) ? { background: svcColor(s), color: '#fff', borderColor: svcColor(s) } : {}}
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
                          <div key={s} className="p-3 rounded-3 border" style={{ borderLeft: `3px solid ${svcColor(s)}` }}>
                            <span className="badge mb-2" style={{ background: svcColor(s) }}>{s}</span>
                            <div className="row g-2">
                              {fields.map(f => (
                                <div key={f.k} className={fields.length > 1 ? 'col-6' : 'col-12'}>
                                  <label className="form-label small">{f.l}</label>
                                  <input className="form-control form-control-sm"
                                    value={svcData[s]?.[f.k] || ''}
                                    onChange={e => updateSvcData(s, f.k, e.target.value)}
                                    placeholder={`Enter ${f.l}...`} />
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
              <button type="submit" className="btn btn-primary px-4"><i className="bi bi-save2 me-1"></i>Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ───── Assign Modal (Admin) ───── */
function AssignModal({ clientId, onSave, onClose }) {
  const { apiRequest } = useAuth();
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [type, setType] = useState('visit');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest('/users');
        if (res.success) setUsers(res.data.filter(u => u.role === 'marketing'));
      } catch (e) {}
    })();
  }, [apiRequest]);

  const toggleUser = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (selected.length === 0) { alert('Please select at least one marketer.'); return; }
    setSaving(true);
    await onSave({ assigned_to: selected, type, notes, date });
    setSaving(false);
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 pb-0">
            <h5 className="fw-bold"><i className="bi bi-send-fill text-warning me-2"></i>Assign to Client</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Assignment Type</label>
              <div className="d-flex gap-2">
                <button type="button" className={`btn btn-sm ${type === 'visit' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setType('visit')}>
                  <i className="bi bi-person-walking me-1"></i>Physical Visit
                </button>
                <button type="button" className={`btn btn-sm ${type === 'call' ? 'btn-info' : 'btn-outline-secondary'}`}
                  onClick={() => setType('call')}>
                  <i className="bi bi-telephone me-1"></i>Phone Call
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Date</label>
              <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Assign to Marketers</label>
              <div className="d-flex flex-column gap-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {users.map(u => (
                  <div key={u.id} className="form-check">
                    <input className="form-check-input" type="checkbox" id={`u-${u.id}`}
                      checked={selected.includes(u.id)} onChange={() => toggleUser(u.id)} />
                    <label className="form-check-label" htmlFor={`u-${u.id}`}>
                      <i className="bi bi-person me-1"></i>{u.full_name}
                    </label>
                  </div>
                ))}
                {users.length === 0 && <p className="text-body-secondary small">No marketers available.</p>}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Instructions / Notes</label>
              <textarea className="form-control" rows="3" placeholder="e.g. Go and meet the client, discuss new services..."
                value={notes} onChange={e => setNotes(e.target.value)}></textarea>
            </div>
          </div>
          <div className="modal-footer border-0">
            <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-warning px-4" onClick={handleSubmit} disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-send me-1"></i>Assign</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
