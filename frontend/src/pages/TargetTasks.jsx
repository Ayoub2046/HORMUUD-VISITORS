import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import ServiceSelect from '../components/ServiceSelect';

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

export default function TargetTasks() {
  const { user, apiRequest, token } = useAuth();
  const [targets, setTargets] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    service: '',
    target_quantity: '',
    period_type: 'monthly',
    start_date: '',
    end_date: '',
    assigned_to: ''
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('targets');

  const [logTarget, setLogTarget] = useState(null);
  const [logForm, setLogForm] = useState({ client_name: '', client_phone: '', location: '', visit_date: new Date().toISOString().split('T')[0], services: [], notes: '' });
  const [logging, setLogging] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const [reports, setReports] = useState(null);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const [tRes, sRes] = await Promise.all([
        apiRequest('/target-tasks'),
        apiRequest('/target-tasks/services')
      ]);
      if (tRes.success) setTargets(tRes.data);
      if (sRes.success) setServices(sRes.data);
    } catch (e) {
      setAlert({ type: 'danger', message: 'Failed to fetch targets.' });
    } finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    if (user.role !== 'admin') return;
    try {
      const res = await apiRequest('/users');
      if (res.success) setUsers(res.data.filter(u => u.role === 'marketing'));
    } catch (e) {}
  };

  const fetchReports = async () => {
    try {
      const res = await apiRequest('/target-tasks/reports');
      if (res.success) setReports(res.data);
    } catch (e) {}
  };

  useEffect(() => { fetchTargets(); fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.service || !form.target_quantity) {
      setAlert({ type: 'danger', message: 'Please select a service and enter a target quantity.' });
      return;
    }
    try {
      setSaving(true); setAlert(null);
      const payload = {
        service: form.service,
        target_quantity: Number(form.target_quantity),
        period_type: form.period_type,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        assigned_to: form.assigned_to || null
      };
      const res = await apiRequest('/target-tasks', { method: 'POST', body: JSON.stringify(payload) });
      if (res.success) {
        setAlert({ type: 'success', message: 'Target created successfully!' });
        setShowForm(false);
        setForm({ service: '', target_quantity: '', period_type: 'monthly', start_date: '', end_date: '', assigned_to: '' });
        fetchTargets();
      } else {
        setAlert({ type: 'danger', message: res.message });
      }
    } catch (e) {
      setAlert({ type: 'danger', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this target and all its progress?')) return;
    try {
      await apiRequest(`/target-tasks/${id}`, { method: 'DELETE' });
      setAlert({ type: 'success', message: 'Target deleted.' });
      fetchTargets();
    } catch (e) {
      setAlert({ type: 'danger', message: 'Delete failed.' });
    }
  };

  const handleExport = async () => {
    try {
      setAlert({ type: 'info', message: 'Preparing Excel report...' });
      const response = await fetch(`${API_URL}/target-tasks/reports/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `booqasho_target_reports_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
      setAlert({ type: 'success', message: 'Report downloaded successfully!' });
    } catch (e) {
      setAlert({ type: 'danger', message: 'Failed to export report.' });
    }
  };

  const handleLog = async (e) => {
    e.preventDefault();
    if (!logForm.client_name) {
      setAlert({ type: 'danger', message: 'Client name is required.' });
      return;
    }
    try {
      setLogging(true); setAlert(null);
      const res = await apiRequest(`/target-tasks/${logTarget.id}/progress`, { method: 'POST', body: JSON.stringify(logForm) });
      if (res.success) {
        setAlert({ type: 'success', message: 'Client service visit recorded.' });
        setLogTarget(null);
        setLogForm({ client_name: '', client_phone: '', location: '', visit_date: new Date().toISOString().split('T')[0], services: [], notes: '' });
        fetchTargets();
      } else {
        setAlert({ type: 'danger', message: res.message });
      }
    } catch (e) {
      setAlert({ type: 'danger', message: e.message });
    } finally { setLogging(false); }
  };

  const handleDeleteProgress = async (targetId, progressId) => {
    if (!window.confirm('Remove this progress entry?')) return;
    try {
      await apiRequest(`/target-tasks/${targetId}/progress/${progressId}`, { method: 'DELETE' });
      fetchTargets();
    } catch (e) {
      setAlert({ type: 'danger', message: 'Failed to remove entry.' });
    }
  };

  const statusBadge = (s) => {
    const map = { active: 'badge-successful', completed: 'badge-pending', cancelled: 'badge-failed' };
    return <span className={`badge rounded-pill ${map[s] || 'bg-secondary'} text-capitalize`}>{s}</span>;
  };

  const openLog = (target) => {
    setLogForm({
      client_name: '',
      client_phone: '',
      location: '',
      visit_date: new Date().toISOString().split('T')[0],
      services: [target.service],
      notes: ''
    });
    setLogTarget(target);
  };

  const toggleService = (svc) => {
    setLogForm(prev => ({
      ...prev,
      services: prev.services.includes(svc)
        ? prev.services.filter(s => s !== svc)
        : [...prev.services, svc]
    }));
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'reports') fetchReports();
  };

  const progressColor = (pct) => (pct >= 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444');

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">Target Tasks</h4>
          <p className="text-body-secondary small mb-0">Set sales/service targets for marketers and track their progress</p>
        </div>
        {user.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary d-flex align-items-center justify-content-center gap-2 shadow-sm w-100 w-sm-auto">
            <i className="bi bi-bullseye"></i> Create New Target
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

      {/* Create Target Form (Admin) */}
      {showForm && user.role === 'admin' && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3"><i className="bi bi-bullseye text-primary me-2"></i>Create New Target</h5>
            <form onSubmit={handleCreate}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-body-secondary">Hormuud Service *</label>
                  <ServiceSelect
                    value={form.service}
                    onChange={(v) => setForm({ ...form, service: v })}
                    onListChange={(list) => setServices(list)}
                    admin={user.role === 'admin'}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold text-body-secondary">Target Quantity (clients) *</label>
                  <input type="number" min="1" className="form-control" value={form.target_quantity} onChange={e => setForm({...form, target_quantity: e.target.value})} placeholder="e.g. 100" required />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold text-body-secondary">Period *</label>
                  <select className="form-select" value={form.period_type} onChange={e => setForm({...form, period_type: e.target.value})}>
                    {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold text-body-secondary">Start Date</label>
                  <input type="date" className="form-control" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold text-body-secondary">End Date</label>
                  <input type="date" className="form-control" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-body-secondary">Assign To</label>
                  <select className="form-select" value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})}>
                    <option value="">All Marketing Staff</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-save2-fill me-1"></i>Save Target</>}
                </button>
                <button type="button" className="btn btn-light border" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-pills mb-3 gap-2">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'targets' ? 'active' : ''}`} onClick={() => switchTab('targets')}>
            <i className="bi bi-bullseye me-1"></i> Targets ({targets.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => switchTab('reports')}>
            <i className="bi bi-bar-chart-fill me-1"></i> Reports
          </button>
        </li>
      </ul>

      {activeTab === 'targets' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-2"></div>
                <p className="text-body-secondary mb-0">Loading targets...</p>
              </div>
            ) : targets.length === 0 ? (
              <div className="text-center py-5 text-body-secondary">
                <i className="bi bi-bullseye d-block mb-2" style={{ fontSize: '2rem' }}></i>
                No targets found. Click "Create New Target" to get started.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 table-card-mobile">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Service</th>
                      <th>Assigned To</th>
                      <th style={{ minWidth: '220px' }}>Progress</th>
                      <th className="d-none d-md-table-cell">Period</th>
                      <th>Status</th>
                      <th className="text-center pe-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targets.map(target => (
                      <React.Fragment key={target.id}>
                        <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === target.id ? null : target.id)}>
                          <td className="ps-4 fw-semibold">
                            {target.service}
                            <span className="d-block small text-body-secondary">{target.achieved}/{target.target_quantity} clients</span>
                          </td>
                          <td>{target.assigned_to_name || <span className="text-body-secondary">All Staff</span>}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="progress progress-hormuud flex-grow-1" style={{ height: '8px' }}>
                                <div className="progress-bar" role="progressbar"
                                  style={{ width: `${target.percent}%`, backgroundColor: progressColor(target.percent) }}
                                  aria-valuenow={target.percent} aria-valuemin="0" aria-valuemax="100"></div>
                              </div>
                              <span className="small fw-semibold">{target.percent}%</span>
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell text-capitalize">
                            {target.period_type}
                            {target.start_date && <span className="d-block small text-body-secondary">{target.start_date} → {target.end_date || 'n/a'}</span>}
                          </td>
                          <td>{statusBadge(target.status)}</td>
                          <td className="text-center pe-4">
                            <button onClick={(e) => { e.stopPropagation(); setExpanded(expanded === target.id ? null : target.id); }} className="btn btn-light btn-sm text-primary me-1" title="View details">
                              <i className="bi bi-chevron-down"></i>
                            </button>
                            {user.role !== 'admin' && target.status === 'active' && (
                              <button onClick={(e) => { e.stopPropagation(); openLog(target); }} className="btn btn-sm btn-success me-1" title="Record client service visit">
                                <i className="bi bi-plus-circle-fill"></i> Record Visit
                              </button>
                            )}
                            {user.role === 'admin' && (
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(target.id); }} className="btn btn-light btn-sm text-danger" title="Delete">
                                <i className="bi bi-trash3-fill"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                        {expanded === target.id && (
                          <tr>
                            <td colSpan="6" className="bg-body-tertiary p-4">
                              <div className="row g-4">
                                <div className="col-12 col-md-6">
                                  <h6 className="fw-bold mb-3"><i className="bi bi-people-fill me-1"></i>Progress Log</h6>
                                  {target.progress.length === 0 ? (
                                    <p className="text-body-secondary small mb-0">No client acquisitions logged yet.</p>
                                  ) : (
                                    <ul className="list-group list-group-flush">
                                      {target.progress.map(p => (
                                        <li key={p.id} className="list-group-item d-flex justify-content-between align-items-start">
                                          <div>
                                            <div className="fw-semibold">{p.client_name}</div>
                                            <div className="small text-body-secondary">
                                              {p.client_phone} {p.location && `• ${p.location}`}
                                              <span className="d-block fst-italic">— {p.user_name} • {p.visit_date || 'n/a'}</span>
                                              <span className="d-block mt-1 d-flex flex-wrap gap-1">
                                                {(p.services || []).map(s => (
                                                  <span key={s} className="badge rounded-pill text-bg-light border">{s}</span>
                                                ))}
                                              </span>
                                              {p.notes && <span className="d-block mt-1">{p.notes}</span>}
                                            </div>
                                          </div>
                                          <button onClick={() => handleDeleteProgress(target.id, p.id)} className="btn btn-sm text-danger" title="Remove">
                                            <i className="bi bi-x-lg"></i>
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                                <div className="col-12 col-md-6">
                                  <h6 className="fw-bold mb-3"><i className="bi bi-bar-chart-fill me-1"></i>Contribution by Staff</h6>
                                  {!target.assigned_to && user.role === 'admin' ? (
                                    target.contributors.length === 0 ? (
                                      <p className="text-body-secondary small mb-0">No contributions yet.</p>
                                    ) : (
                                      <ul className="list-group list-group-flush">
                                        {target.contributors.map(c => (
                                          <li key={c.user_id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <span>{c.name}</span>
                                            <span className="badge rounded-pill text-bg-primary">{c.count} clients</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )
                                  ) : (
                                    <p className="text-body-secondary small mb-0">This target is assigned to a single staff member.</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div>
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <h6 className="fw-bold mb-0"><i className="bi bi-bar-chart-fill me-2"></i>Target Reports</h6>
            {user.role === 'admin' && (
              <button onClick={handleExport} className="btn btn-outline-success btn-sm d-flex align-items-center gap-1">
                <i className="bi bi-download"></i> Download Report (Excel)
              </button>
            )}
          </div>
          {/* Period breakdown */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3"><i className="bi bi-calendar3 me-2"></i>Target Achievement by Period</h6>
              {!reports ? (
                <p className="text-body-secondary small mb-0">Loading reports...</p>
              ) : reports.byPeriod.length === 0 ? (
                <p className="text-body-secondary small mb-0">No target progress recorded yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">Period</th>
                        <th>Type</th>
                        <th>Total Clients</th>
                        <th>By Staff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.byPeriod.map(p => (
                        <tr key={p.period_key}>
                          <td className="ps-3 fw-semibold">{p.period_key}</td>
                          <td className="text-capitalize">{p.period_type}</td>
                          <td>{p.total}</td>
                          <td>
                            {p.byUser.length === 0 ? (
                              <span className="text-body-secondary">—</span>
                            ) : (
                              <div className="d-flex flex-wrap gap-1">
                                {p.byUser.map(u => (
                                  <span key={u.user_id} className="badge rounded-pill text-bg-light border">{u.name}: {u.count}</span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* By service */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3"><i className="bi bi-grid-3x3-gap-fill me-2"></i>Clients Acquired by Service</h6>
              {!reports ? (
                <p className="text-body-secondary small mb-0">Loading reports...</p>
              ) : Object.keys(reports.byService).length === 0 ? (
                <p className="text-body-secondary small mb-0">No target progress recorded yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">Service</th>
                        <th>Clients Acquired</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reports.byService).sort((a, b) => b[1] - a[1]).map(([svc, count]) => (
                        <tr key={svc}>
                          <td className="ps-3 fw-semibold">{svc}</td>
                          <td>{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Services delivered breakdown */}
          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3"><i className="bi bi-activity me-2"></i>Hormuud Services Delivered to Clients</h6>
              {!reports ? (
                <p className="text-body-secondary small mb-0">Loading reports...</p>
              ) : Object.keys(reports.byServicesDelivered || {}).length === 0 ? (
                <p className="text-body-secondary small mb-0">No services delivered recorded yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">Service Delivered</th>
                        <th>Times Delivered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reports.byServicesDelivered).sort((a, b) => b[1] - a[1]).map(([svc, count]) => (
                        <tr key={svc}>
                          <td className="ps-3 fw-semibold">{svc}</td>
                          <td>{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {logTarget && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">
                  <i className="bi bi-plus-circle-fill text-success me-2"></i>Record Client Service Visit
                </h6>
                <button type="button" className="btn-close" onClick={() => setLogTarget(null)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-light border d-flex align-items-center gap-2 py-2 small mb-3">
                  <i className="bi bi-bullseye text-primary"></i>
                  Target: <strong>{logTarget.service}</strong> ({logTarget.achieved}/{logTarget.target_quantity} clients)
                </div>
                <form onSubmit={handleLog}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-body-secondary">Client / Business Name *</label>
                    <input type="text" className="form-control" value={logForm.client_name} onChange={e => setLogForm({...logForm, client_name: e.target.value})} placeholder="Client/business name" required />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-7">
                      <label className="form-label small fw-semibold text-body-secondary">Phone</label>
                      <input type="text" className="form-control" value={logForm.client_phone} onChange={e => setLogForm({...logForm, client_phone: e.target.value})} placeholder="e.g. +252..." />
                    </div>
                    <div className="col-5">
                      <label className="form-label small fw-semibold text-body-secondary">Visit Date *</label>
                      <input type="date" className="form-control" value={logForm.visit_date} onChange={e => setLogForm({...logForm, visit_date: e.target.value})} required />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-body-secondary">Location</label>
                    <input type="text" className="form-control" value={logForm.location} onChange={e => setLogForm({...logForm, location: e.target.value})} placeholder="District / area" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-body-secondary">
                      Services Provided to This Client
                      <span className="text-body-secondary fw-normal"> (select all that apply)</span>
                    </label>
                    <div className="border rounded p-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      {services.map(s => {
                        const checked = logForm.services.includes(s);
                        return (
                          <label key={s} className={`d-flex align-items-center gap-2 form-check p-0 ps-4 mb-1 small ${checked ? '' : 'text-body-secondary'}`}>
                            <input
                              type="checkbox"
                              className="form-check-input ms-0"
                              style={{ marginLeft: '-1.25em' }}
                              checked={checked}
                              onChange={() => toggleService(s)}
                            />
                            <span>{s}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="small text-body-secondary mt-1">Selected: {logForm.services.length} service(s)</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-body-secondary">Notes / Details</label>
                    <textarea className="form-control" rows="2" value={logForm.notes} onChange={e => setLogForm({...logForm, notes: e.target.value})} placeholder="Optional notes about the visit / outcome"></textarea>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-success px-4" disabled={logging || logForm.services.length === 0}>
                      {logging ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-check-lg me-1"></i>Submit Visit</>}
                    </button>
                    <button type="button" className="btn btn-light border" onClick={() => setLogTarget(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marketing: quick add buttons on each target */}
      {user.role !== 'admin' && !loading && targets.length > 0 && (
        <div className="text-body-secondary small mt-3">
          <i className="bi bi-info-circle me-1"></i>
          To record a client you've acquired, open a target below.
        </div>
      )}
    </div>
  );
}
