import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const { apiRequest } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create / Edit User Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, full_name: '', email: '', phone: '', address: '', password: '', role: 'marketing' });
  const [savingAction, setSavingAction] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/users');
      if (res.success) setUsers(res.data);
    } catch (e) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({ id: null, full_name: '', email: '', phone: '', address: '', password: '', role: 'marketing' });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setFormData({ id: user.id, full_name: user.full_name, email: user.email, phone: user.phone || '', address: user.address || '', password: '', role: user.role });
    setModalError(null);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete user: ${name}? \n\nNote: This may also delete their visits if there are no foreign key constraints.`)) return;
    try {
      const res = await apiRequest(`/users/${id}`, { method: 'DELETE' });
      if (res.success) {
        alert('User deleted successfully.');
        fetchUsers();
      }
    } catch (e) {
      alert('Error deleting user.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.phone || !formData.address || (!isEditing && !formData.password)) {
      alert('Please fill required fields (name, email, phone, address, password).');
      return;
    }

    try {
      setSavingAction(true);
      let res;
      if (isEditing) {
        const payload = { full_name: formData.full_name, email: formData.email, phone: formData.phone, address: formData.address, role: formData.role };
        if (formData.password) payload.password = formData.password;
        res = await apiRequest(`/users/${formData.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        res = await apiRequest('/users', { method: 'POST', body: JSON.stringify(formData) });
      }

      if (res.success) {
        setShowModal(false);
        fetchUsers();
      }
    } catch (e) {
      setModalError(e.message || 'Failed to save user data.');
    } finally {
      setSavingAction(false);
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">User Management</h4>
          <p className="text-body-secondary small mb-0">Manage all system users here.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary d-flex align-items-center justify-content-center gap-2 shadow-sm w-100 w-sm-auto">
          <i className="bi bi-person-plus-fill"></i> Register New User
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-2" role="status"></div>
              <p className="text-body-secondary mb-0">Loading users...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Name</th>
                    <th className="d-none d-md-table-cell">Email</th>
                    <th className="d-none d-lg-table-cell">Phone</th>
                    <th className="d-none d-xl-table-cell">Address</th>
                    <th>Role</th>
                    <th className="d-none d-sm-table-cell">Date</th>
                    <th className="text-center pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-3">
                          <div className="user-avatar" style={{ width: 36, height: 36 }}>{u.full_name.charAt(0).toUpperCase()}</div>
                          <div className="fw-semibold text-body">{u.full_name}</div>
                        </div>
                      </td>
                      <td className="text-body-secondary d-none d-md-table-cell">{u.email}</td>
                      <td className="text-body-secondary small d-none d-lg-table-cell">{u.phone || '—'}</td>
                      <td className="text-body-secondary small d-none d-xl-table-cell">{u.address || '—'}</td>
                      <td>
                        <span className={`badge rounded-pill ${u.role === 'admin' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'} px-3`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-body-secondary small d-none d-sm-table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="text-center pe-4">
                        <div className="d-flex justify-content-center gap-1">
                          <button onClick={() => handleOpenEdit(u)} className="btn btn-light btn-sm text-primary" title="Edit User">
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button onClick={() => handleDelete(u.id, u.full_name)} className="btn btn-light btn-sm text-danger" title="Delete User">
                            <i className="bi bi-trash3-fill"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan="7" className="text-center py-4 text-body-secondary">No users registered yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Form Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
            <div className="modal-content shadow border-0">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">{isEditing ? 'Edit User' : 'Register New User'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} disabled={savingAction}></button>
              </div>
              {modalError && (
                <div className="mx-4 mt-3 alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  {modalError}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="modal-body pb-0">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-body-secondary">Full Name *</label>
                    <input type="text" className="form-control" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-body-secondary">Email *</label>
                    <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-body-secondary">Phone *</label>
                    <input type="tel" className="form-control" placeholder="+25261XXXXXXX" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                    <small className="text-body-secondary">This phone is used for OTP when password is forgotten.</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-body-secondary">Address *</label>
                    <input type="text" className="form-control" placeholder="e.g., Hodan District, Mogadishu" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-body-secondary">Role</label>
                    <select className="form-select" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                      <option value="marketing">Marketing User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-body-secondary">Password {isEditing && <span className="text-muted fw-normal">(Leave empty if not changing)</span>}</label>
                    <input type="password" className="form-control" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!isEditing} />
                  </div>
                </div>
                <div className="modal-footer bg-body-tertiary border-0 mt-3 rounded-bottom">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={savingAction}>Cancel</button>
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={savingAction}>
                    {savingAction ? <><span className="spinner-border spinner-border-sm"></span> Saving...</> : <><i className="bi bi-save2-fill"></i> Save</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
