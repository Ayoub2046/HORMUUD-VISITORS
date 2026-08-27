import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, apiRequest } = useAuth();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setAlert({ type: 'danger', message: 'New passwords do not match.' });
      return;
    }
    if (formData.newPassword.length < 6) {
      setAlert({ type: 'danger', message: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      setLoading(true); setAlert(null);
      const res = await apiRequest('/auth/update-password', { method: 'PUT', body: JSON.stringify({ currentPassword: formData.currentPassword, newPassword: formData.newPassword }) });
      if (res.success) {
        setAlert({ type: 'success', message: 'Password updated successfully!' });
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row g-4 justify-content-center">
      {/* Profile Overview Card */}
      <div className="col-12 col-md-5 col-lg-4">
        <div className="card border-0 shadow-sm text-center h-100">
          <div className="card-body p-4 p-lg-5 d-flex flex-column align-items-center">
            <div className="profile-avatar-lg mb-3 shadow-sm">{user?.full_name?.charAt(0).toUpperCase()}</div>
            <h4 className="fw-bold mb-1">{user?.full_name}</h4>
            <span className={`badge rounded-pill mb-3 ${user?.role === 'admin' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'} px-3`}>{user?.role?.toUpperCase()}</span>
            
            <div className="w-100 text-start mt-4 pt-4 border-top">
              <div className="mb-3">
                <label className="text-body-secondary small text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.05em' }}>Email Address</label>
                <div className="fw-semibold">{user?.email}</div>
              </div>
              <div className="mb-3">
                <label className="text-body-secondary small text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.05em' }}>Phone Number</label>
                <div className="fw-semibold">{user?.phone || '—'}</div>
              </div>
              <div className="mb-3">
                <label className="text-body-secondary small text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.05em' }}>Address</label>
                <div className="fw-semibold">{user?.address || '—'}</div>
              </div>
              <div>
                <label className="text-body-secondary small text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.05em' }}>Account Status</label>
                <div className="text-success fw-bold d-flex align-items-center gap-1"><i className="bi bi-check-circle-fill"></i> Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Preferences Card */}
      <div className="col-12 col-md-7 col-lg-6">
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-transparent border-bottom-0 pt-4 pb-0">
            <h5 className="fw-bold mb-0"><i className="bi bi-shield-lock-fill text-primary me-2"></i>Change Password</h5>
          </div>
          <div className="card-body p-4">
            {alert && (
              <div className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center gap-2 py-2 small`} role="alert">
                <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
                {alert.message}
                <button type="button" className="btn-close btn-sm" onClick={() => setAlert(null)}></button>
              </div>
            )}
            
            <form onSubmit={handlePasswordUpdate}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-body-secondary">Current Password</label>
                <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="form-control" required disabled={loading} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-body-secondary">New Password</label>
                <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className="form-control" required disabled={loading} minLength="6" />
              </div>
              <div className="mb-4">
                <label className="form-label small fw-semibold text-body-secondary">Confirm New Password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-control" required disabled={loading} minLength="6" />
              </div>
              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary px-4 fw-semibold" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2"></span> Updating...</> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* System Settings Section (Mock for Future Expansion) */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent border-bottom-0 pt-4 pb-0">
            <h5 className="fw-bold mb-0"><i className="bi bi-gear-fill text-secondary me-2"></i>System Preferences</h5>
          </div>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
              <div>
                <div className="fw-semibold">Ogeysiisyada Email-ka (Email Notifications)</div>
                <div className="text-body-secondary small">Receive notifications when new reports are logged.</div>
              </div>
              <div className="form-check form-switch fs-5 mb-0">
                <input className="form-check-input shadow-none focus-ring focus-ring-primary" type="checkbox" role="switch" defaultChecked />
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold">Offline Mode Auto-Sync</div>
                <div className="text-body-secondary small">Save data locally until connection is restored.</div>
              </div>
              <div className="form-check form-switch fs-5 mb-0">
                <input className="form-check-input shadow-none focus-ring focus-ring-primary" type="checkbox" role="switch" defaultChecked />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
