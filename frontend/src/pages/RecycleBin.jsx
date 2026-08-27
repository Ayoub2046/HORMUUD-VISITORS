import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const TYPE_LABELS = {
  clients: 'Client', visits: 'Field Visit', tasks: 'Daily Task',
  users: 'User', clientAssignments: 'Assignment', visitTasks: 'Visit Task',
  visitReports: 'Visit Report', isps: 'ISP'
};

const TYPE_ICONS = {
  clients: 'bi-building', visits: 'bi-geo-alt', tasks: 'bi-check2-square',
  users: 'bi-person', clientAssignments: 'bi-send', visitTasks: 'bi-journal-text',
  visitReports: 'bi-file-text', isps: 'bi-wifi'
};

export default function RecycleBin() {
  const { apiRequest } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/recycle-bin');
      if (res.success) setItems(res.data);
    } catch (e) {
      setAlert({ type: 'danger', message: e.message });
    } finally { setLoading(false); }
  }, [apiRequest]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const showAlert = (msg, type = 'success') => {
    setAlert({ type, message: msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleRestore = async (id) => {
    try {
      const res = await apiRequest(`/recycle-bin/${id}/restore`, { method: 'POST' });
      if (res.success) { showAlert(res.message); fetchItems(); }
    } catch (e) { showAlert(e.message, 'danger'); }
  };

  const handlePurge = async (id) => {
    if (!window.confirm('Permanently delete this item? It cannot be recovered.')) return;
    try {
      const res = await apiRequest(`/recycle-bin/${id}`, { method: 'DELETE' });
      if (res.success) { showAlert(res.message); fetchItems(); }
    } catch (e) { showAlert(e.message, 'danger'); }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1"><i className="bi bi-trash3-fill text-danger me-2"></i>Recycle Bin</h4>
          <p className="text-body-secondary small mb-0">Restore deleted items or permanently remove them.</p>
        </div>
        <span className="badge bg-danger rounded-pill">{items.length} items</span>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible d-flex align-items-center gap-2 py-2 small`}>
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          {alert.message}
          <button type="button" className="btn-close btn-sm" onClick={() => setAlert(null)}></button>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-2"></div>
              <p className="text-body-secondary mb-0">Loading recycle bin...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-5 text-body-secondary">
              <i className="bi bi-archive fs-1 d-block mb-2"></i>
              Recycle bin is empty.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Type</th>
                    <th>Name / Identifier</th>
                    <th className="d-none d-md-table-cell">Deleted By</th>
                    <th className="d-none d-sm-table-cell">Deleted At</th>
                    <th className="text-center pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="ps-4">
                        <span className="badge bg-secondary">
                          <i className={`bi ${TYPE_ICONS[item.type] || 'bi-question'} me-1`}></i>
                          {TYPE_LABELS[item.type] || item.type}
                        </span>
                      </td>
                      <td className="fw-semibold">
                        {item.data?.name || item.data?.title || item.data?.full_name || item.data?.place_name || item.data?.clientName || item.data?.toString() || item.original_id}
                      </td>
                      <td className="small text-body-secondary d-none d-md-table-cell">{item.deletedByName || 'System'}</td>
                      <td className="small text-body-secondary d-none d-sm-table-cell">
                        {new Date(item.deleted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="text-center pe-4">
                        <div className="d-flex gap-1 justify-content-center">
                          <button onClick={() => handleRestore(item.original_id)} className="btn btn-sm btn-success" title="Restore">
                            <i className="bi bi-arrow-counterclockwise"></i>
                          </button>
                          <button onClick={() => handlePurge(item.original_id)} className="btn btn-sm btn-outline-danger" title="Delete permanently">
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
