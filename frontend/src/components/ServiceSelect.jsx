import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ServiceSelect({ value, onChange, onListChange, admin = false }) {
  const { apiRequest } = useAuth();
  const [services, setServices] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Enterprise');
  const [savingNew, setSavingNew] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  const load = async () => {
    try {
      const res = await apiRequest('/services');
      if (res.success) {
        const all = [...(res.data.enterprise || []), ...(res.data.individual || [])];
        if (value && all.indexOf(value) === -1) {
          all.unshift(value);
        }
        setServices(all);
        if (onListChange) onListChange(all);
      }
    } catch (e) { /* noop */ }
  };

  useEffect(() => { load(); }, [loadKey]);

  const submitNew = async () => {
    const v = newName.trim();
    if (!v) { alert('Please enter a service name.'); return; }
    if (services.includes(v)) { alert('This service already exists.'); return; }
    setSavingNew(true);
    try {
      const res = await apiRequest('/services', {
        method: 'POST',
        body: JSON.stringify({ name: v, type: newType })
      });
      if (res.success) {
        onChange(v);
        setAdding(false);
        setNewName('');
        setLoadKey(k => k + 1);
      } else {
        alert(res.message || 'Failed to add service.');
      }
    } catch (e) {
      alert(e.message || 'Failed to add service.');
    } finally {
      setSavingNew(false);
    }
  };

  return (
    <>
      <select
        className="form-select"
        value={value}
        onChange={(e) => {
          if (e.target.value === '__add__') {
            setAdding(true);
          } else {
            onChange(e.target.value);
          }
        }}
        required
      >
        <option value="">Select a service</option>
        {services.map(s => <option key={s} value={s}>{s}</option>)}
        {admin && <option value="__add__">+ Add New Service...</option>}
      </select>

      {adding && admin && (
        <div className="mt-2 p-3 rounded-3 border bg-body-tertiary">
          <label className="form-label small fw-semibold text-body-secondary">New Service Name</label>
          <div className="d-flex flex-column flex-md-row gap-2">
            <input
              className="form-control"
              autoFocus
              placeholder="e.g. New 5G Plus Business Plan"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitNew()}
            />
            <div className="d-flex gap-2 flex-shrink-0">
              <select className="form-select w-auto" value={newType} onChange={(e) => setNewType(e.target.value)}>
                <option value="Enterprise">Enterprise</option>
                <option value="Individual">Individual</option>
              </select>
              <button className="btn btn-primary flex-shrink-0" disabled={savingNew || !newName.trim()} onClick={submitNew}>
                {savingNew ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-plus-lg me-1"></i>Add</>}
              </button>
            </div>
          </div>
          <div className="mt-2 d-flex align-items-center gap-3">
            <button className="btn btn-sm btn-light border" onClick={() => { setAdding(false); setNewName(''); }}>Cancel</button>
            <span className="small text-body-secondary">New services are saved for the whole company.</span>
          </div>
        </div>
      )}
    </>
  );
}