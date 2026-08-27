import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const HORMUUD_SERVICES = [
  'EVC Plus (Mobile Money)', 'WAAFI App (Fintech)', 'GSM Mobile Services (Voice & Calls)',
  'Mobile Data (2G/3G/4G/5G)', 'ADSL Plus (Home Broadband)', 'FTTH (Fiber to the Home)',
  'Hormuud Mifi (Portable WiFi)', 'Hormuud Hotspot (Public WiFi)', 'Enterprise Internet (Business)',
  'My SMS (Bulk Messaging)', 'Fixed Line Services', 'International Roaming',
  'International Calls', '5G Plus (LTE-A / LTE-Advanced)', 'EVC Plus Merchant Registration',
  'Fibre Optic Connectivity', 'Corporate & Enterprise Plans', 'Hormuud Salaam Foundation (CSR)'
];

export default function Tasks() {
  const { user, apiRequest } = useAuth();
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ assigned_to: '', service: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [feedbackTask, setFeedbackTask] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackAction, setFeedbackAction] = useState('completed');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'admin' ? '/tasks/today' : '/tasks/mine';
      const res = await apiRequest(endpoint);
      if (res.success) setTasks(res.data);
    } catch (e) {
      setAlert({ type: 'danger', message: 'Failed to fetch tasks.' });
    } finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    if (user.role !== 'admin') return;
    try {
      const res = await apiRequest('/users');
      if (res.success) setUsers(res.data.filter(u => u.role === 'marketing'));
    } catch (e) {}
  };

  useEffect(() => { fetchTasks(); fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.service || !form.description || !form.date) {
      setAlert({ type: 'danger', message: 'Please fill in all fields.' }); return;
    }
    try {
      setSaving(true); setAlert(null);
      const payload = { ...form, assigned_to: form.assigned_to || null };
      const res = await apiRequest('/tasks', { method: 'POST', body: JSON.stringify(payload) });
      if (res.success) {
        setAlert({ type: 'success', message: 'Task created successfully!' });
        setShowForm(false);
        setForm({ assigned_to: '', service: '', description: '', date: new Date().toISOString().split('T')[0] });
        fetchTasks();
      }
    } catch (e) {
      setAlert({ type: 'danger', message: e.message });
    } finally { setSaving(false); }
  };

  const openFeedback = (task, action) => {
    setFeedbackTask(task);
    setFeedbackAction(action);
    setFeedbackText('');
  };

  const handleStatusUpdate = async (id, status, feedback) => {
    try {
      await apiRequest(`/tasks/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, feedback }) });
      setFeedbackTask(null);
      fetchTasks();
    } catch (e) {
      setAlert({ type: 'danger', message: 'Status update failed.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
      setAlert({ type: 'success', message: 'Task deleted.' });
      fetchTasks();
    } catch (e) {
      setAlert({ type: 'danger', message: 'Delete failed.' });
    }
  };

  const statusBadge = (status) => {
    const map = { pending: 'badge-warning', completed: 'badge-successful', cancelled: 'badge-failed' };
    return <span className={`badge rounded-pill ${map[status] || 'bg-secondary'}`}>{status}</span>;
  };

  const todayTasks = tasks.filter(t => t.date === new Date().toISOString().split('T')[0]);
  const allTasks = tasks;

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">{t('nav.tasks') || 'Daily Tasks'}</h4>
          <p className="text-body-secondary small mb-0">Manage and assign daily tasks to marketing staff</p>
        </div>
        {user.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary d-flex align-items-center justify-content-center gap-2 shadow-sm w-100 w-sm-auto">
            <i className="bi bi-plus-circle-fill"></i> Create New Task
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

      {/* Create Task Form (Admin) */}
      {showForm && user.role === 'admin' && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3"><i className="bi bi-plus-circle-fill text-primary me-2"></i>Create New Task</h5>
            <form onSubmit={handleCreate}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-body-secondary">Hormuud Service *</label>
                  <select className="form-select" value={form.service} onChange={e => setForm({...form, service: e.target.value})} required>
                    <option value="">Select a service</option>
                    {HORMUUD_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold text-body-secondary">Date *</label>
                  <input type="date" className="form-control" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold text-body-secondary">Staff</label>
                  <select className="form-select" value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})}>
                    <option value="">All Staff</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold text-body-secondary">Task Description *</label>
                  <textarea className="form-control" rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe what the staff should do today..." required></textarea>
                </div>
              </div>
              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-save2-fill me-1"></i>Save</>}
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
          <button className={`nav-link ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>
            <i className="bi bi-calendar-day me-1"></i> Today ({todayTasks.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            <i className="bi bi-list me-1"></i> All ({allTasks.length})
          </button>
        </li>
      </ul>

      {/* Task List */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-2"></div>
              <p className="text-body-secondary mb-0">Loading tasks...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 table-card-mobile">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Service</th>
                    {user.role === 'admin' && <th className="d-none d-md-table-cell">Staff</th>}
                    <th className="d-none d-sm-table-cell">Date</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th className="d-none d-md-table-cell">Feedback / Notes</th>
                    <th className="text-center pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'today' ? todayTasks : allTasks).map(task => (
                    <tr key={task.id}>
                      <td className="ps-4 fw-semibold">{task.service}</td>
                      {user.role === 'admin' && <td className="d-none d-md-table-cell">{task.assigned_to_name || 'All Staff'}</td>}
                      <td className="d-none d-sm-table-cell">{task.date}</td>
                      <td style={{ maxWidth: '280px' }}>
                        <span className="d-inline-block text-truncate" style={{ maxWidth: '100%' }}>{task.description}</span>
                      </td>
                      <td>
                        {task.status === 'pending' && user.role !== 'admin' ? (
                          <div className="d-flex gap-1">
                            <button onClick={() => openFeedback(task, 'completed')} className="btn btn-sm btn-outline-success" title="Complete with feedback">
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button onClick={() => openFeedback(task, 'cancelled')} className="btn btn-sm btn-outline-danger" title="Cancel with reason">
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                        ) : statusBadge(task.status)}
                      </td>
                      <td className="d-none d-md-table-cell small text-body-secondary" style={{ maxWidth: '260px' }}>
                        {task.feedback ? (
                          <div className="d-inline-block text-truncate" style={{ maxWidth: '100%' }} title={task.feedback}>
                            {task.feedback}
                            {task.completed_by_name && <span className="d-block text-muted fst-italic" style={{ fontSize: '0.85em' }}>— {task.completed_by_name}</span>}
                          </div>
                        ) : task.status === 'pending' ? (
                          <span className="text-muted fst-italic">Awaiting response</span>
                        ) : task.status === 'completed' ? (
                          <span className="text-muted fst-italic">No feedback</span>
                        ) : '-'}
                      </td>
                      <td className="text-center pe-4">
                        {user.role === 'admin' && (
                          <button onClick={() => handleDelete(task.id)} className="btn btn-light btn-sm text-danger" title="Delete">
                            <i className="bi bi-trash3-fill"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(activeTab === 'today' ? todayTasks : allTasks).length === 0 && (
                    <tr><td colSpan="7" className="text-center py-4 text-body-secondary">No tasks found for this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackTask && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">
                  <i className={`bi ${feedbackAction === 'completed' ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} me-2`}></i>
                  {feedbackAction === 'completed' ? 'Complete Task' : 'Cancel Task'}
                </h6>
                <button type="button" className="btn-close" onClick={() => setFeedbackTask(null)}></button>
              </div>
              <div className="modal-body">
                <p className="mb-2 small"><strong>Service:</strong> {feedbackTask.service}</p>
                <p className="mb-3 small"><strong>Description:</strong> {feedbackTask.description}</p>
                <label className="form-label small fw-semibold text-body-secondary">
                  {feedbackAction === 'completed' ? 'Feedback / Response *' : 'Reason for cancellation *'}
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder={feedbackAction === 'completed' ? 'Describe what was done, customer response, issues encountered...' : 'Describe why this task could not be completed...'}
                  required
                ></textarea>
              </div>
              <div className="modal-footer bg-light border-top-0">
                <button type="button" className="btn btn-light border" onClick={() => setFeedbackTask(null)}>Back</button>
                <button
                  type="button"
                  className={`btn ${feedbackAction === 'completed' ? 'btn-success' : 'btn-danger'} px-4`}
                  disabled={!feedbackText.trim()}
                  onClick={() => handleStatusUpdate(feedbackTask.id, feedbackAction, feedbackText.trim())}
                >
                  <i className={`bi ${feedbackAction === 'completed' ? 'bi-check-lg' : 'bi-x-lg'} me-1`}></i>
                  {feedbackAction === 'completed' ? 'Submit' : 'Cancel Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
