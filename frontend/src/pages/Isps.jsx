import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Isps() {
  const { apiRequest } = useAuth();
  const [isps, setIsps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [newName, setNewName] = useState('');

  const fetchIsps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/isps');
      if (res.success) setIsps(res.data);
    } catch (e) {
      setAlert({ type: 'danger', message: e.message });
    } finally { setLoading(false); }
  }, [apiRequest]);

  useEffect(() => { fetchIsps(); }, [fetchIsps]);

  const showAlert = (msg, type = 'success') => {
    setAlert({ type, message: msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleAdd = async () => {
    const v = newName.trim().toUpperCase();
    if (!v) { alert('Please enter a name'); return; }
    if (isps.includes(v)) { alert('This ISP already exists!'); return; }
    try {
      const res = await apiRequest('/isps', { method: 'POST', body: JSON.stringify({ name: v }) });
      if (res.success) { showAlert(res.message); setNewName(''); fetchIsps(); }
    } catch (e) { showAlert(e.message, 'danger'); }
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`Delete ISP "${name}"?`)) return;
    try {
      const res = await apiRequest(`/isps/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (res.success) { showAlert(res.message); fetchIsps(); }
    } catch (e) { showAlert(e.message, 'danger'); }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">ISP Management</h4>
          <p className="text-body-secondary small mb-0">Manage internet service providers (ISPs)</p>
        </div>
        <span className="badge bg-primary rounded-pill">{isps.length} ISP</span>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible d-flex align-items-center gap-2 py-2 small`}>
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          {alert.message}
          <button type="button" className="btn-close btn-sm" onClick={() => setAlert(null)}></button>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">Existing ISPs</h6>
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border text-primary spinner-border-sm"></div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2 mb-4">
              {isps.map(isp => (
                <div key={isp} className="d-flex align-items-center justify-content-between p-3 rounded-3 border bg-body-tertiary">
                  <span className="fw-semibold"><i className="bi bi-wifi me-2"></i>{isp}</span>
                  {isps.length > 1 && (
                    <button onClick={() => handleDelete(isp)} className="btn btn-sm btn-outline-danger">
                      <i className="bi bi-trash3"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border-top pt-3">
            <label className="form-label small fw-semibold">Add New ISP</label>
            <div className="d-flex gap-2">
              <input className="form-control" placeholder="ISP name (e.g. AMTEL)..."
                value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              <button onClick={handleAdd} className="btn btn-primary flex-shrink-0"><i className="bi bi-plus-lg me-1"></i>Add</button>
            </div>
            <div className="form-text small">Press Enter or click Add</div>
          </div>
        </div>
      </div>
    </div>
  );
}
