import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

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

export default function VisitTasks({ setActivePage }) {
  const { user, apiRequest } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [submitTaskId, setSubmitTaskId] = useState(null);

  const isAdmin = user?.role === 'admin';

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/visit-tasks');
      if (res.success) setTasks(res.data);
    } catch (e) {
      setAlert({ type: 'danger', message: e.message });
    } finally { setLoading(false); }
  }, [apiRequest]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const showAlert = (msg, type = 'success') => {
    setAlert({ type, message: msg });
    setTimeout(() => setAlert(null), 3000);
  };

  if (submitTaskId) {
    return <VisitTaskSubmit
      taskId={submitTaskId}
      onBack={() => setSubmitTaskId(null)}
      onDone={() => { setSubmitTaskId(null); fetchTasks(); }}
      showAlert={showAlert}
    />;
  }

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">Visit Tasks</h4>
          <p className="text-body-secondary small mb-0">
            {isAdmin ? 'Create and manage visit tasks for marketers.' : 'View your assigned visit tasks and submit reports.'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
            <i className="bi bi-plus-circle-fill"></i>New Task
          </button>
        )}
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible d-flex align-items-center gap-2 py-2 small`}>
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          {alert.message}
          <button type="button" className="btn-close btn-sm" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {showCreate && (
        <CreateTaskForm
          onSave={async (data) => {
            try {
              const res = await apiRequest('/visit-tasks', { method: 'POST', body: JSON.stringify(data) });
              if (res.success) { showAlert(res.message); setShowCreate(false); fetchTasks(); }
            } catch (e) { showAlert(e.message, 'danger'); }
          }}
          onClose={() => setShowCreate(false)}
        />
      )}

      <div className="d-flex flex-column gap-3">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-2"></div>
            <p className="text-body-secondary mb-0">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-5 text-body-secondary">
            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
            {isAdmin ? 'No visit tasks created yet.' : 'No tasks assigned to you.'}
          </div>
        ) : tasks.map(t => (
          <div key={t.id} className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="fw-bold mb-1">{t.title}</h6>
                  {t.description && <p className="text-body-secondary small mb-0">{t.description}</p>}
                </div>
                <span className={`badge rounded-pill ${t.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>{t.status}</span>
              </div>
              <div className="d-flex flex-wrap gap-3 small text-body-secondary mb-3">
                <span><i className="bi bi-person me-1"></i>Created by: {t.createdByName}</span>
                <span><i className="bi bi-people me-1"></i>Assigned: {t.assignedToNames?.join(', ') || '—'}</span>
                <span><i className="bi bi-calendar me-1"></i>{new Date(t.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              {t.services?.length > 0 && (
                <div className="d-flex flex-wrap gap-1 mb-3">
                  <small className="text-body-secondary me-1">Services:</small>
                  {t.services.map(s => {
                    const id = typeof s === 'object' ? s.id || s.name : s;
                    return (
                      <span key={id} className="badge bg-primary-subtle text-primary">{s}</span>
                    );
                  })}
                </div>
              )}
              {!isAdmin && t.status === 'active' && (
                <button onClick={() => setSubmitTaskId(t.id)} className="btn btn-success btn-sm">
                  <i className="bi bi-journal-plus me-1"></i>Submit Visit Report
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── Create Task Form ───── */
function CreateTaskForm({ onSave, onClose }) {
  const { apiRequest } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedSvcs, setSelectedSvcs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [uRes, sRes] = await Promise.all([
          apiRequest('/users'),
          apiRequest('/services')
        ]);
        if (uRes.success) setUsers(uRes.data.filter(u => u.role === 'marketing'));
        if (sRes.success) {
          const all = [...(sRes.data.enterprise||[]), ...(sRes.data.individual||[])];
          setServices(all);
        }
      } catch (e) {}
    })();
  }, [apiRequest]);

  const toggleUser = (id) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSvc = (s) => {
    setSelectedSvcs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { alert('Title is required.'); return; }
    if (selectedUsers.length === 0) { alert('Assign at least one marketer.'); return; }
    setSaving(true);
    await onSave({ title, description, assigned_to: selectedUsers, services: selectedSvcs });
    setSaving(false);
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 pb-0">
            <h5 className="fw-bold"><i className="bi bi-plus-circle-fill text-primary me-2"></i>Create Visit Task</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Title *</label>
              <input className="form-control" placeholder="e.g. 5 visits for ICT center"
                value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Description</label>
              <textarea className="form-control" rows="2" placeholder="Describe the task..."
                value={description} onChange={e => setDescription(e.target.value)}></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Assign Marketers *</label>
              <div className="d-flex flex-column gap-1" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                {users.map(u => (
                  <div key={u.id} className="form-check">
                    <input className="form-check-input" type="checkbox" id={`tu-${u.id}`}
                      checked={selectedUsers.includes(u.id)} onChange={() => toggleUser(u.id)} />
                    <label className="form-check-label" htmlFor={`tu-${u.id}`}><i className="bi bi-person me-1"></i>{u.full_name}</label>
                  </div>
                ))}
                {users.length === 0 && <p className="text-body-secondary small">No marketers available.</p>}
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Services to Check</label>
              <div className="d-flex flex-wrap gap-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {services.map(s => (
                  <button key={s.id || s} type="button"
                    className={`btn btn-sm ${selectedSvcs.includes(s) ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => toggleSvc(s)}>
                    {selectedSvcs.includes(s) ? '✓ ' : ''}{s.name || s}
                  </button>
                ))}
                {services.length === 0 && <p className="text-body-secondary small">No services defined.</p>}
              </div>
            </div>
          </div>
          <div className="modal-footer border-0">
            <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary px-4" onClick={handleSubmit} disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-check-lg me-1"></i>Create Task</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── Visit Task Submit Form ───── */
function VisitTaskSubmit({ taskId, onBack, onDone, showAlert }) {
  const { user, apiRequest } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [svcData, setSvcData] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest(`/visit-tasks/${taskId}`);
        if (res.success) {
          setTask(res.data);
          const init = {};
          (res.data.services||[]).forEach(s => { init[s] = { checked: false }; });
          setSvcData(init);
        }
      } catch (e) {} finally { setLoading(false); }
    })();
  }, [taskId, apiRequest]);

  const toggleSvc = (s) => {
    setSvcData(prev => ({
      ...prev,
      [s]: { ...prev[s], checked: !prev[s]?.checked }
    }));
  };

  const updateField = (svc, key, val) => {
    setSvcData(prev => ({
      ...prev,
      [svc]: { ...prev[svc], [key]: val }
    }));
  };

  const handleSubmit = async () => {
    if (!clientName.trim()) { alert('Client name is required.'); return; }
    setSaving(true);
    try {
      const res = await apiRequest(`/visit-tasks/${taskId}/reports`, {
        method: 'POST',
        body: JSON.stringify({
          client_name: clientName.trim(),
          client_phone: clientPhone,
          location,
          notes,
          service_data: svcData
        })
      });
      if (res.success) { showAlert(res.message); onDone(); }
    } catch (e) { showAlert(e.message, 'danger'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-2"></div>
        <p className="text-body-secondary mb-0">Loading task...</p>
      </div>
    );
  }

  if (!task) {
    return <div className="text-center py-5 text-body-secondary">Task not found.</div>;
  }

  return (
    <div>
      <button onClick={onBack} className="btn btn-link text-decoration-none p-0 mb-3">
        <i className="bi bi-arrow-left me-1"></i>Back to Tasks
      </button>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-1">{task.title}</h5>
          {task.description && <p className="text-body-secondary small mb-0">{task.description}</p>}
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-4"><i className="bi bi-journal-plus me-2"></i>Visit Report</h6>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Client / Establishment Name *</label>
              <input className="form-control" placeholder="Name..." value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Phone</label>
              <input className="form-control" placeholder="+252..." value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Location / Area</label>
              <input className="form-control" placeholder="e.g. Hodan District" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
          </div>

          {task.services?.length > 0 && (
            <div className="mb-4">
              <label className="form-label small fw-semibold">Services — Check what the client has</label>
              <div className="d-flex flex-column gap-2">
                {task.services.map(s => {
                  const svcName = typeof s === 'object' ? s.name || s.id : s;
                  const fields = SVC_FIELDS[svcName] || [{k:'number',l:'Number/Account'}];
                  const checked = svcData[svcName]?.checked;
                  return (
                    <div key={s.id || svcName} className="p-3 rounded-3 border" style={{ borderLeft: checked ? '4px solid #0066CC' : '4px solid #E2E8F0' }}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id={`svc-${svcName}`}
                          checked={!!checked} onChange={() => toggleSvc(svcName)} />
                        <label className="form-check-label fw-semibold" htmlFor={`svc-${svcName}`}>{svcName}</label>
                      </div>
                      {checked && (
                        <div className="mt-2 ps-4 row g-2">
                          {fields.map(f => (
                            <div key={f.k} className={fields.length > 1 ? 'col-6' : 'col-12'}>
                              <label className="form-label small text-body-secondary">{f.l}</label>
                              <input className="form-control form-control-sm"
                                placeholder={`Enter ${f.l}...`}
                                value={svcData[svcName]?.[f.k] || ''}
                                onChange={e => updateField(svcName, f.k, e.target.value)} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="form-label small fw-semibold">Notes / Summary</label>
            <textarea className="form-control" rows="3" placeholder="Additional notes or client feedback..."
              value={notes} onChange={e => setNotes(e.target.value)}></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light" onClick={onBack}>Cancel</button>
            <button type="button" className="btn btn-success px-4" onClick={handleSubmit} disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-check-lg me-1"></i>}
              Submit Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}