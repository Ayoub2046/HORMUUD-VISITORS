import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function MyAssignments({ setActivePage, setClientId }) {
  const { user, apiRequest } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [completeModal, setCompleteModal] = useState(null);

  const isAdmin = user?.role === 'admin';

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/assignments`);
      if (res.success) setAssignments(res.data);
    } catch (e) {
      setAlert({ type: 'danger', message: e.message });
    } finally { setLoading(false); }
  }, [apiRequest]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const showAlert = (msg, type = 'success') => {
    setAlert({ type, message: msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const pending = assignments.filter(a => a.status === 'pending');
  const completed = assignments.filter(a => a.status !== 'pending');

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">{isAdmin ? 'Client Assignments' : 'My Assignments'}</h4>
          <p className="text-body-secondary small mb-0">
            {isAdmin ? 'Manage marketer assignments to clients.' : 'Complete your assignments and report what the client needs.'}
          </p>
        </div>
        <span className="badge bg-primary rounded-pill">{pending.length} pending / {assignments.length} total</span>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible d-flex align-items-center gap-2 py-2 small`}>
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          {alert.message}
          <button type="button" className="btn-close btn-sm" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Pending Assignments */}
      <h6 className="fw-bold mb-3"><i className="bi bi-hourglass-split me-2"></i>Pending ({pending.length})</h6>
      <div className="d-flex flex-column gap-2 mb-4">
        {pending.length === 0 ? (
          <p className="text-body-secondary small">No pending assignments.</p>
        ) : pending.map(a => (
          <div key={a.id} className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <a href="#" className="fw-bold text-decoration-none"
                      onClick={e => { e.preventDefault(); setClientId(a.client_id); setActivePage('clientDetail'); }}>
                      {a.clientName}
                    </a>
                    <span className={`badge ${a.type === 'visit' ? 'bg-primary' : 'bg-info'}`}>
                      <i className={`bi ${a.type === 'visit' ? 'bi-person-walking' : 'bi-telephone'} me-1`}></i>
                      {a.type === 'visit' ? 'Visit' : 'Call'}
                    </span>
                  </div>
                  <div className="small text-body-secondary">
                    Assigned to: {a.assignedToNames?.join(', ') || '—'} &middot; {a.date}
                    {isAdmin && a.assignedByName && <span> &middot; by {a.assignedByName}</span>}
                  </div>
                  {a.notes && <div className="small mt-1 p-2 rounded-3 bg-light border">{a.notes}</div>}
                </div>
                {!isAdmin && (
                  <button onClick={() => setCompleteModal(a)} className="btn btn-success btn-sm ms-3 flex-shrink-0">
                    <i className="bi bi-check-lg me-1"></i>Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completed/History */}
      {completed.length > 0 && (
        <>
          <h6 className="fw-bold mb-3"><i className="bi bi-clock-history me-2"></i>History ({completed.length})</h6>
          <div className="d-flex flex-column gap-2">
            {completed.map(a => (
              <div key={a.id} className="card border-0 shadow-sm">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <a href="#" className="fw-semibold text-decoration-none"
                          onClick={e => { e.preventDefault(); setClientId(a.client_id); setActivePage('clientDetail'); }}>
                          {a.clientName}
                        </a>
                        <span className={`badge ${a.type === 'visit' ? 'bg-primary' : 'bg-info'}`}>
                          {a.type === 'visit' ? 'Visit' : 'Call'}
                        </span>
                        <span className={`badge rounded-pill ${a.status === 'completed' ? 'bg-success' : 'bg-danger'}`}>
                          {a.status}
                        </span>
                      </div>
                      <div className="small text-body-secondary">
                        Assigned to: {a.assignedToNames?.join(', ') || '—'} &middot; {a.date}
                      </div>
                      {a.notes && (
                        <div className="small mt-2 p-2 rounded-3" style={{ background: '#EBF8FF', border: '1px solid #BEE3F8' }}>
                          <span className="fw-semibold text-primary">Client Response:</span> {a.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Complete Modal */}
      {completeModal && (
        <CompleteAssignmentModal
          assignment={completeModal}
          onSave={async (data) => {
            try {
              const res = await apiRequest(`/assignments/${completeModal.id}/complete`, {
                method: 'PUT',
                body: JSON.stringify(data)
              });
              if (res.success) { showAlert(res.message); setCompleteModal(null); fetchAssignments(); }
            } catch (e) { showAlert(e.message, 'danger'); }
          }}
          onClose={() => setCompleteModal(null)}
        />
      )}
    </div>
  );
}

/* ───── Complete Assignment Modal ───── */
function CompleteAssignmentModal({ assignment, onSave, onClose }) {
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('completed');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim()) { alert('Please write the client response.'); return; }
    setSaving(true);
    await onSave({ status, notes: response.trim() });
    setSaving(false);
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 pb-0">
            <h5 className="fw-bold"><i className="bi bi-check-circle text-success me-2"></i>Complete Assignment</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3 p-3 rounded-3 bg-body-tertiary">
              <div className="fw-semibold">{assignment.clientName}</div>
              <div className="small text-body-secondary">
                <span className={`badge ${assignment.type === 'visit' ? 'bg-primary' : 'bg-info'}`}>
                  {assignment.type === 'visit' ? 'Physical Visit' : 'Phone Call'}
                </span>
                <span className="ms-2">{assignment.date}</span>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="completed">Completed Successfully</option>
                <option value="cancelled">Cancelled / No Response</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Client Response / What They Need *</label>
              <textarea className="form-control" rows="4"
                placeholder="Describe what the client said, what services they need, any issues or requests..."
                value={response} onChange={e => setResponse(e.target.value)}></textarea>
              <div className="form-text small">This will be visible to the admin.</div>
            </div>
          </div>
          <div className="modal-footer border-0">
            <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-success px-4" onClick={handleSubmit} disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-check-lg me-1"></i>Submit Response</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
