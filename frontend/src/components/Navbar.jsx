import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Navbar({ activePage, setActivePage, toggleSidebar, theme, toggleTheme }) {
  const { user, logout, dbConnected, apiRequest } = useAuth();
  const { t, i18n } = useTranslation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiRequest('/notifications/unread-count');
        if (!cancelled && res.success) setUnread(res.count || 0);
      } catch (e) { /* noop */ }
    };
    load();
    const timer = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const getPageTitle = (page) => {
    switch(page) {
      case 'dashboard':    return t('nav.dashboard');
      case 'visits':       return t('nav.visits');
      case 'add-visit':    return t('nav.add_visit') || 'Add Visit';
      case 'edit-visit':   return 'Edit Visit';
      case 'tasks':        return t('nav.tasks') || 'Daily Tasks';
      case 'clients':      return t('nav.clients') || 'Clients';
      case 'client-detail':return 'Client Detail';
      case 'assignments':  return t('nav.assignments') || 'Assignments';
      case 'visit-tasks':  return t('nav.visit_tasks') || 'Visit Tasks';
      case 'isps':         return t('nav.isps') || 'ISPs & Services';
      case 'users':        return t('nav.users');
      case 'reports':      return t('nav.reports');
      case 'recycle-bin':  return t('nav.recycle_bin') || 'Recycle Bin';
      case 'notifications': return 'Notifications';
      case 'settings':     return t('nav.settings');
      default:             return 'Booqasho App';
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="app-topbar d-flex justify-content-between align-items-center">
      {/* Left: hamburger + title */}
      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-sm btn-outline-secondary mobile-menu-btn d-lg-none" onClick={toggleSidebar}>
          <i className="bi bi-list fs-5"></i>
        </button>
        <h1 className="topbar-title">{getPageTitle(activePage)}</h1>
      </div>

      {/* Right: badges + theme + language + profile */}
      <div className="d-flex align-items-center gap-3">

        {/* Theme Toggle */}
        <button className="theme-toggle btn btn-sm btn-outline-secondary rounded-circle" onClick={toggleTheme} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
          {theme === 'dark' ? <i className="bi bi-sun-fill"></i> : <i className="bi bi-moon-stars-fill"></i>}
        </button>

        {/* Notifications Bell */}
        <button
          className="theme-toggle btn btn-sm btn-outline-secondary rounded-circle position-relative"
          onClick={() => { setUnread(0); setActivePage && setActivePage('notifications'); }}
          title="Notifications"
        >
          <i className="bi bi-bell-fill"></i>
          {unread > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* User Dropdown */}
        <div className="dropdown">
          <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 rounded-pill px-2" data-bs-toggle="dropdown" aria-expanded="false" type="button">
            <div className="user-avatar" style={{ width: 30, height: 30, fontSize: '0.75rem' }}>
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <span className="d-none d-md-inline fw-bold small">{user?.full_name}</span>
            <i className="bi bi-chevron-down" style={{ fontSize: '0.65rem' }}></i>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
            <li><span className="dropdown-item-text small text-body-secondary">{user?.email}</span></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item small text-danger fw-semibold" onClick={logout}><i className="bi bi-box-arrow-right me-2"></i>{t('nav.logout')}</button></li>
          </ul>
        </div>
      </div>
    </header>
  );
}
