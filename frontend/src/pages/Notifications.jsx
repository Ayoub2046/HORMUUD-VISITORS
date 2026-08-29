import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Notifications({ setActivePage }) {
  const { apiRequest } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/notifications');
      if (res.success) setNotifications(res.data);
    } catch (e) {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/mark-all-read', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  const handleClick = (n) => {
    if (!n.is_read) handleMarkRead(n.id);
    if (n.link && setActivePage) {
      const page = n.link.replace(/^\//, '');
      setActivePage(page);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">Notifications</h4>
          <p className="text-body-secondary small mb-0">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'You are all caught up.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn btn-outline-primary d-flex align-items-center gap-2 shadow-sm w-100 w-sm-auto">
            <i className="bi bi-check2-all"></i> Mark All as Read
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-2" role="status"></div>
          <p className="text-body-secondary mb-0">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5 text-body-secondary">
            <i className="bi bi-bell-slash fs-1 d-block mb-2 opacity-50"></i>
            No notifications yet.
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <ul className="list-group list-group-flush">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`list-group-item d-flex align-items-start gap-3 p-3 ${n.is_read ? '' : 'bg-primary-subtle'}`}
                  style={{ cursor: n.link ? 'pointer' : 'default' }}
                >
                  <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`} style={{ width: 38, height: 38, background: n.is_read ? 'var(--bs-secondary-bg)' : 'var(--bs-primary)' }}>
                    <i className={`bi ${iconFor(n.type)} text-white`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className={`fw-bold small ${n.is_read ? 'text-body' : 'text-primary'}`}>{n.title}</span>
                      <span className="text-body-secondary small">{timeAgo(n.created_at)}</span>
                    </div>
                    <div className="text-body-secondary small">{n.message}</div>
                  </div>
                  {!n.is_read && <span className="badge bg-primary rounded-pill mt-1">new</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function iconFor(type) {
  switch (type) {
    case 'task': return 'bi-check2-square';
    case 'visit_task': return 'bi-journal-text';
    case 'assignment': return 'bi-send-fill';
    default: return 'bi-bell-fill';
  }
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
