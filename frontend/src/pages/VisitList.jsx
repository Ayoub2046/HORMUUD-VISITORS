import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

export default function VisitList() {
  const { user, apiRequest, token } = useAuth();
  
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [placeType, setPlaceType] = useState('All');
  const [employeeId, setEmployeeId] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Details Modal State
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [savingAction, setSavingAction] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({ status, place_type: placeType, search, startDate, endDate });
      if (user.role === 'admin' && employeeId !== 'All') queryParams.append('employee_id', employeeId);
      const res = await apiRequest(`/visits?${queryParams.toString()}`);
      if (res.success) setVisits(res.data);
    } catch (error) {
      setAlert({ type: 'danger', message: 'Failed to load visits.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (user.role !== 'admin') return;
    try {
      const res = await apiRequest('/users');
      if (res.success) setEmployees(res.data.filter(u => u.role === 'marketing'));
    } catch (e) {}
  };

  useEffect(() => { fetchVisits(); }, [status, placeType, employeeId, startDate, endDate]);
  useEffect(() => { fetchEmployees(); }, []);

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchVisits(); };

  const handleExport = async (format) => {
    try {
      setAlert({ type: 'info', message: `Preparing ${format.toUpperCase()} export...` });
      const queryParams = new URLSearchParams({ status, place_type: placeType, search, startDate, endDate });
      if (user.role === 'admin' && employeeId !== 'All') queryParams.append('employee_id', employeeId);
      const response = await fetch(`${API_URL}/visits/export/${format}?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `visit_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
      setAlert({ type: 'success', message: 'Report downloaded successfully!' });
    } catch (error) {
      setAlert({ type: 'danger', message: 'Failed to export report.' });
    }
  };

  const handleAdminApproval = async (id, newStatus) => {
    try {
      setSavingAction(true);
      const res = await apiRequest(`/visits/${id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
      if (res.success) {
        setAlert({ type: 'success', message: `Visit status updated to: ${newStatus}` });
        setSelectedVisit(null); fetchVisits();
      }
    } catch (e) {
      setAlert({ type: 'danger', message: 'Error updating visit status.' });
    } finally { setSavingAction(false); }
  };

  const handleDeleteVisit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this visit?')) return;
    try {
      const res = await apiRequest(`/visits/${id}`, { method: 'DELETE' });
      if (res.success) {
        setAlert({ type: 'success', message: 'Visit deleted successfully.' });
        setSelectedVisit(null); fetchVisits();
      }
    } catch (e) {
      setAlert({ type: 'danger', message: 'Failed to delete visit.' });
    }
  };

  return (
    <div>
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center gap-2`} role="alert">
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : alert.type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'}`}></i>
          <div>{alert.message}</div>
          <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Filters Card */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSearchSubmit} className="d-flex flex-column flex-sm-row gap-2 mb-3">
            <div className="input-group flex-grow-1">
              <span className="input-group-text bg-transparent"><i className="bi bi-search"></i></span>
              <input type="text" className="form-control" placeholder="Search by place name, address..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary px-4 w-100 w-sm-auto">Search</button>
          </form>

          <div className="row g-3 mb-3">
            <div className="col-md-4 col-lg-2">
              <label className="form-label small fw-semibold text-body-secondary">Status</label>
              <select className="form-select form-select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="All">All</option>
                <option value="Successful">Successful</option>
                <option value="Failed">Failed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="col-md-4 col-lg-2">
              <label className="form-label small fw-semibold text-body-secondary">Place Type</label>
              <select className="form-select form-select-sm" value={placeType} onChange={(e) => setPlaceType(e.target.value)}>
                <option value="All">All</option>
                <option value="Shop">Shop</option>
                <option value="Business">Business</option>
                <option value="Company">Company</option>
                <option value="School">School</option>
                <option value="Hospital">Hospital</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {user.role === 'admin' && (
              <div className="col-md-4 col-lg-3">
                <label className="form-label small fw-semibold text-body-secondary">Marketing Staff</label>
                <select className="form-select form-select-sm" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  <option value="All">All Staff</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                </select>
              </div>
            )}
            <div className="col-md-6 col-lg-2">
              <label className="form-label small fw-semibold text-body-secondary">From</label>
              <input type="date" className="form-control form-control-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="col-md-6 col-lg-2">
              <label className="form-label small fw-semibold text-body-secondary">To</label>
              <input type="date" className="form-control form-control-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center pt-3 border-top gap-3">
            <div className="text-body-secondary small">
              Total found: <strong className="text-body fw-bold">{visits.length}</strong> visits
            </div>
            <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-sm-auto">
              <button onClick={() => handleExport('excel')} className="btn btn-outline-success btn-sm d-flex align-items-center justify-content-center gap-1">
                <i className="bi bi-file-earmark-excel-fill"></i> Excel
              </button>
              <button onClick={() => handleExport('csv')} className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center gap-1">
                <i className="bi bi-filetype-csv"></i> CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-2" role="status"></div>
              <p className="text-body-secondary mb-0">Loading visits...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Place</th>
                    <th className="d-none d-md-table-cell">Type</th>
                    {user.role === 'admin' && <th className="d-none d-lg-table-cell">Staff</th>}
                    <th className="d-none d-sm-table-cell">Contact</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-center pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.id}>
                      <td className="ps-4 fw-semibold">{v.place_name}</td>
                      <td className="d-none d-md-table-cell">{v.place_type}</td>
                      {user.role === 'admin' && <td className="d-none d-lg-table-cell">{v.employee_name}</td>}
                      <td className="d-none d-sm-table-cell">
                        <div className="d-flex flex-column lh-sm">
                          <span>{v.contact_person || 'Not provided'}</span>
                          <span className="text-body-secondary small">{v.phone}</span>
                        </div>
                      </td>
                      <td>{v.visit_date}</td>
                      <td><span className={`badge rounded-pill badge-${v.status.toLowerCase()}`}>{v.status}</span></td>
                      <td className="text-center pe-4">
                        <div className="d-flex justify-content-center gap-1">
                          <button onClick={() => setSelectedVisit(v)} className="btn btn-light btn-sm text-primary" title="View Details">
                            <i className="bi bi-eye-fill"></i>
                          </button>
                          {user.role === 'admin' && (
                            <button onClick={() => handleDeleteVisit(v.id)} className="btn btn-light btn-sm text-danger" title="Delete Visit">
                              <i className="bi bi-trash3-fill"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visits.length === 0 && (
                    <tr>
                      <td colSpan={user.role === 'admin' ? 7 : 6} className="text-center py-4 text-body-secondary">
                        No visits match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedVisit && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable modal-fullscreen-sm-down">
            <div className="modal-content shadow">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-geo-alt-fill text-primary"></i> Visit Details
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedVisit(null)} disabled={savingAction}></button>
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-body-secondary text-uppercase fw-bold mb-1">Place Name</label>
                    <div className="fw-semibold text-body">{selectedVisit.place_name}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small text-body-secondary text-uppercase fw-bold mb-1">Place Type</label>
                    <div><span className="badge bg-secondary-subtle text-body-emphasis rounded-pill px-3">{selectedVisit.place_type}</span></div>
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small text-body-secondary text-uppercase fw-bold mb-1">Status</label>
                    <div><span className={`badge rounded-pill badge-${selectedVisit.status.toLowerCase()} px-3`}>{selectedVisit.status}</span></div>
                  </div>

                  <div className="col-12">
                    <label className="form-label small text-body-secondary text-uppercase fw-bold mb-1">Address</label>
                    <div className="text-body">{selectedVisit.address || 'No address recorded'}</div>
                  </div>

                  <div className="col-6 col-md-4">
                    <label className="form-label small text-body-secondary text-uppercase fw-bold mb-1">Contact Name</label>
                    <div className="text-body">{selectedVisit.contact_person || 'Not provided'}</div>
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label small text-body-secondary text-uppercase fw-bold mb-1">Phone</label>
                    <div className="text-body">{selectedVisit.phone || 'Not provided'}</div>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label small text-body-secondary text-uppercase fw-bold mb-1">Date / Time</label>
                    <div className="text-body">{selectedVisit.visit_date} / {selectedVisit.visit_time}</div>
                  </div>

                  <div className="col-12">
                    <label className="form-label small text-body-secondary text-uppercase fw-bold mb-1">Recorded By</label>
                    <div className="text-primary fw-semibold">{selectedVisit.employee_name}</div>
                  </div>

                  <div className="col-12">
                    <label className="form-label small text-body-secondary text-uppercase fw-bold mb-1">Visit Purpose</label>
                    <div className="p-3 bg-body-secondary rounded-3 text-body">{selectedVisit.purpose || 'No purpose'}</div>
                  </div>
                  <div className="col-12">
                    <label className="form-label small text-body-secondary text-uppercase fw-bold mb-1">Activities</label>
                    <div className="p-3 bg-body-secondary rounded-3 text-body" style={{ whiteSpace: 'pre-wrap' }}>{selectedVisit.activities || 'Not provided'}</div>
                  </div>
                  <div className="col-12">
                    <label className="form-label small text-body-secondary text-uppercase fw-bold mb-1">Result</label>
                    <div className="p-3 bg-body-secondary rounded-3 text-body" style={{ whiteSpace: 'pre-wrap' }}>{selectedVisit.result || 'Not specified'}</div>
                  </div>
                  <div className="col-12">
                    <label className="form-label small text-body-secondary text-uppercase fw-bold mb-1">Additional Comments</label>
                    <div className="p-3 bg-body-secondary rounded-3 text-body" style={{ whiteSpace: 'pre-wrap' }}>{selectedVisit.comments || 'Not provided'}</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-body-tertiary">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedVisit(null)} disabled={savingAction}>Close</button>
                {user.role === 'admin' && selectedVisit.status === 'Pending' && (
                  <>
                    <button type="button" className="btn btn-danger d-flex align-items-center gap-2" onClick={() => handleAdminApproval(selectedVisit.id, 'Failed')} disabled={savingAction}>
                      <i className="bi bi-x-circle"></i> Mark as Failed
                    </button>
                    <button type="button" className="btn btn-success d-flex align-items-center gap-2" onClick={() => handleAdminApproval(selectedVisit.id, 'Successful')} disabled={savingAction}>
                      <i className="bi bi-check-circle"></i> Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
