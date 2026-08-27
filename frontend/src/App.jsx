import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VisitList from './pages/VisitList';
import VisitForm from './pages/VisitForm';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Isps from './pages/Isps';
import MyAssignments from './pages/MyAssignments';
import VisitTasks from './pages/VisitTasks';
import RecycleBin from './pages/RecycleBin';
import AppFooter from './components/AppFooter';

export default function App() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [clientId, setClientId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('booqasho_theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-bs-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('booqasho_theme', next);
    document.documentElement.setAttribute('data-bs-theme', next);
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    if (page !== 'clientDetail') setClientId(null);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="app-loader" data-bs-theme={theme}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="text-body-secondary fw-semibold">Booqasho App is starting up...</span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard setActivePage={handlePageChange} />;
      case 'visits': return <VisitList />;
      case 'add-visit': return <VisitForm setActivePage={handlePageChange} />;
      case 'users': return user.role === 'admin' ? <Users /> : <Dashboard setActivePage={handlePageChange} />;
      case 'reports': return user.role === 'admin' ? <Reports /> : <Dashboard setActivePage={handlePageChange} />;
      case 'tasks': return <Tasks />;
      case 'clients': return <Clients setActivePage={handlePageChange} setClientId={setClientId} />;
      case 'clientDetail': return <ClientDetail clientId={clientId} setActivePage={handlePageChange} setClientId={setClientId} />;
      case 'assignments': return <MyAssignments setActivePage={handlePageChange} setClientId={setClientId} />;
      case 'visit-tasks': return <VisitTasks setActivePage={handlePageChange} />;
      case 'recycle-bin': return user.role === 'admin' ? <RecycleBin /> : <Dashboard setActivePage={handlePageChange} />;
      case 'isps': return user.role === 'admin' ? <Isps /> : <Dashboard setActivePage={handlePageChange} />;
      case 'settings': return <Settings />;
      default: return <Dashboard setActivePage={handlePageChange} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} setActivePage={handlePageChange} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="sidebar-overlay d-lg-none" onClick={() => setSidebarOpen(false)} />}
      <div className="app-main">
        <Navbar activePage={activePage} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} theme={theme} toggleTheme={toggleTheme} />
        <main className="app-page-content">
          {renderPage()}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
