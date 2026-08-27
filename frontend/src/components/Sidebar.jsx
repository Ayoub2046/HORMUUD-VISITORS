import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import HormuudLogo from './HormuudLogo';

export default function Sidebar({ activePage, setActivePage, isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const navItem = (page, icon, label) => (
    <a
      href="#"
      className={`nav-link ${activePage === page ? 'active' : ''}`}
      onClick={(e) => { e.preventDefault(); setActivePage(page); }}
    >
      <i className={icon}></i>
      <span>{label}</span>
    </a>
  );

  return (
    <aside className={`app-sidebar ${isOpen ? 'show' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <HormuudLogo size={36} showText={true} />
      </div>
      <div className="sidebar-divider" />

      {/* Navigation */}
      <nav className="sidebar-nav d-flex flex-column gap-3">
        <div>
          <div className="sidebar-section-label">{t('nav.core')}</div>
          <div className="nav flex-column gap-1">
            {navItem('dashboard', 'bi bi-grid-1x2-fill', t('nav.dashboard'))}
            {navItem('tasks', 'bi bi-check2-square', t('nav.tasks'))}
            {navItem('clients', 'bi bi-people-fill', 'Clients')}
            {navItem('visit-tasks', 'bi bi-journal-text', 'Visit Tasks')}
            {navItem('visits', 'bi bi-list-check', t('nav.visits'))}
            {user.role === 'marketing' && navItem('add-visit', 'bi bi-plus-circle-fill', t('nav.addVisit'))}
            {navItem('assignments', 'bi bi-send-fill', 'Assignments')}
          </div>
        </div>

        {user.role === 'admin' && (
          <div>
            <div className="sidebar-section-label">{t('nav.admin')}</div>
            <div className="nav flex-column gap-1">
              {navItem('users', 'bi bi-person-badge-fill', t('nav.users'))}
              {navItem('isps', 'bi bi-wifi', 'ISP Management')}
              {navItem('reports', 'bi bi-file-earmark-bar-graph-fill', t('nav.reports'))}
              {navItem('recycle-bin', 'bi bi-trash3-fill', 'Recycle Bin')}
            </div>
          </div>
        )}

        <div>
          <div className="sidebar-section-label">{t('nav.account')}</div>
          <div className="nav flex-column gap-1">
            {navItem('settings', 'bi bi-sliders', t('nav.settings'))}
            <a href="#" className="nav-link text-danger" onClick={(e) => { e.preventDefault(); logout(); }}>
              <i className="bi bi-box-arrow-right"></i>
              <span>{t('nav.logout')}</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Footer Profile */}
      <div className="sidebar-footer d-flex align-items-center gap-2">
        <div className="user-avatar">{user?.full_name?.charAt(0).toUpperCase()}</div>
        <div className="lh-sm overflow-hidden">
          <div className="fw-bold small text-truncate">{user?.full_name}</div>
          <div className="text-body-secondary" style={{ fontSize: '0.68rem' }}>{user?.role === 'admin' ? t('roles.admin') : t('roles.marketing')}</div>
        </div>
      </div>
    </aside>
  );
}
