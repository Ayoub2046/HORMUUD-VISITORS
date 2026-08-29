import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import AppFooter from '../components/AppFooter';
import logo from '../../logo.png';

export default function Login() {
  const { login } = useAuth();
  const { t, i18n } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password Flow State
  const [resetStep, setResetStep] = useState(0);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetAlert, setResetAlert] = useState(null);

  // Dynamic public stats
  const [statsData, setStatsData] = useState({ totalVisits: 1280, totalUsers: 45, activeBranches: 15 });
  const [animatedVisits, setAnimatedVisits] = useState(0);
  const [animatedUsers, setAnimatedUsers] = useState(0);
  const [animatedBranches, setAnimatedBranches] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: result } = await apiFetch('/auth/public-stats');
        if (result?.success && result.data) {
          setStatsData(result.data);
        }
      } catch {
        // Keep default demo stats when backend is offline
      }
    };
    fetchStats();
  }, []);

  // Animators
  useEffect(() => {
    let start = 0;
    const end = statsData.totalVisits;
    if (end === 0) return;
    const duration = 1200;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = Math.max(1, Math.ceil(end / steps));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setAnimatedVisits(end);
      } else {
        setAnimatedVisits(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [statsData.totalVisits]);

  useEffect(() => {
    let start = 0;
    const end = statsData.totalUsers;
    if (end === 0) return;
    const duration = 1200;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = Math.max(1, Math.ceil(end / steps));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setAnimatedUsers(end);
      } else {
        setAnimatedUsers(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [statsData.totalUsers]);

  useEffect(() => {
    let start = 0;
    const end = statsData.activeBranches;
    if (end === 0) return;
    const duration = 1200;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = Math.max(1, Math.ceil(end / steps));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setAnimatedBranches(end);
      } else {
        setAnimatedBranches(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [statsData.activeBranches]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in email and password.'); return; }
    try {
      setLoading(true); setError('');
      const result = await login(email, password);
      if (!result.success) setError(result.message || 'Email ama password khaldan.');
    } catch (err) { setError('Cilad baa ka dhacday server-ka.'); }
    finally { setLoading(false); }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true); setResetAlert(null);
    try {
      const { response, data } = await apiFetch('/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetEmail })
      });
      if (response.ok && data?.success) {
        setResetStep(2); setResetAlert({ type: 'success', message: data.message });
      } else { setResetAlert({ type: 'danger', message: data?.message || 'Cilad baa dhacday.' }); }
    } catch (error) { setResetAlert({ type: 'danger', message: error.message }); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setResetAlert(null);
    try {
      const { response, data } = await apiFetch('/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, reset_code: resetCode, new_password: newPassword })
      });
      if (response.ok && data?.success) {
        setResetAlert({ type: 'success', message: data.message });
        setTimeout(() => setResetStep(0), 3000);
      } else { setResetAlert({ type: 'danger', message: data?.message || 'Cilad baa dhacday.' }); }
    } catch (error) { setResetAlert({ type: 'danger', message: error.message }); }
    finally { setLoading(false); }
  };

  return (
    <div className="hormuud-page">

      {/* ── TOP NAV BAR (Hormuud Green) ── */}
      <nav className="hormuud-navbar">
        <div className="hormuud-nav-inner">
          {/* Logo */}
          <div className="hormuud-logo-wrap">
            <img
              src={logo}
              alt="Hormuud Telecom Logo"
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'contain',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                boxShadow: '0 0 0 4px rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                marginRight: '8px',
                padding: '2px'
              }}
            />
            <div className="hormuud-logo-text">
              <span className="logo-name">Booqasho</span>
              <span className="logo-sub">by Hormuud Telecom</span>
            </div>
          </div>

          {/* Nav Portal Badge */}
          <div className="hormuud-nav-links">
            <span className="nav-link-item active">
              <i className="bi bi-grid-3x3-gap-fill me-1" style={{ fontSize: '0.75rem' }}></i>
              Portal
            </span>
          </div>

          {/* Lang + Contact */}
          <div className="hormuud-nav-right">
            <div className="lang-pills">
              <button
                className={`lang-pill ${i18n.language === 'so' ? 'active' : ''}`}
                onClick={() => i18n.changeLanguage('so')}
              >SO</button>
              <button
                className={`lang-pill ${i18n.language === 'en' ? 'active' : ''}`}
                onClick={() => i18n.changeLanguage('en')}
              >EN</button>
            </div>
            <a href="tel:141" className="nav-contact-btn">
              <i className="bi bi-telephone-fill me-1"></i> 141
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="hormuud-hero">
        {/* Background pattern */}
        <div className="hero-bg-pattern"></div>
        <div className="hero-bg-circles">
          <div className="hero-circle hero-circle-1"></div>
          <div className="hero-circle hero-circle-2"></div>
          <div className="hero-circle hero-circle-3"></div>
        </div>

        <div className="hormuud-hero-inner">
          {/* Left: Hero Content */}
          <div className="hero-content">
            <div className="hero-tag">
              <i className="bi bi-patch-check-fill me-2"></i>
              Hormuud Telecom Somalia
            </div>
            <h1 className="hero-title">
              The Official<br />
              <span className="hero-title-accent">Marketing Visit System</span>
            </h1>
            <p className="hero-subtitle">
              Record, verify, and track all field marketing visits using the Booqasho App.
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-num">{animatedVisits.toLocaleString()}+</span>
                <span className="stat-label">Visits</span>
              </div>
              <div className="stat-divider"></div>
              <div className="hero-stat">
                <span className="stat-num">{animatedUsers}+</span>
                <span className="stat-label">Staff</span>
              </div>
              <div className="stat-divider"></div>
              <div className="hero-stat">
                <span className="stat-num">{animatedBranches}+</span>
                <span className="stat-label">Branches</span>
              </div>
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="hero-login-side">
            <div className="login-floating-card">
              <div className="login-card-header">
                <div className="login-card-icon">
                  <i className="bi bi-person-badge-fill"></i>
                </div>
                <h2 className="login-card-title">{t('auth.login_title')}</h2>
                <p className="login-card-sub">{t('auth.login_subtitle')}</p>
              </div>

              {error && (
                <div className="login-error-box">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-field">
                  <label className="field-label">{t('auth.email')}</label>
                  <div className="field-input-wrap">
                    <i className="bi bi-envelope field-icon"></i>
                    <input
                      id="login-email"
                      type="email"
                      className="field-input"
                      placeholder="admin@booqasho.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label-row">
                    <label className="field-label">{t('auth.password')}</label>
                    <button
                      type="button"
                      className="forgot-link"
                      onClick={() => setResetStep(1)}
                    >
                      {t('auth.forgot_pwd')}
                    </button>
                  </div>
                  <div className="field-input-wrap">
                    <i className="bi bi-lock field-icon"></i>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className="field-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="login-submit-btn"
                  className="login-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Galahaya...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      {t('auth.login_btn')}
                    </>
                  )}
                </button>
              </form>

              <div className="login-card-footer">
                <i className="bi bi-shield-lock-fill me-1"></i>
                Secured by Hormuud SSL &amp; OTP Authentication
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="login-workflow">
        <div className="login-workflow-inner">
          <div className="login-workflow-header">
            <span className="login-workflow-badge">
              <i className="bi bi-lightning-charge-fill me-1"></i>
              {t('login.workflow_badge')}
            </span>
            <h2 className="login-workflow-title">{t('login.workflow_title')}</h2>
            <p className="login-workflow-subtitle">{t('login.workflow_subtitle')}</p>
          </div>

          <div className="login-workflow-steps">
            <div className="workflow-step">
              <div className="workflow-step-num">01</div>
              <div className="workflow-step-icon"><i className="bi bi-person-check-fill"></i></div>
              <h3>{t('login.step1_title')}</h3>
              <p>{t('login.step1_desc')}</p>
            </div>
            <div className="workflow-connector" aria-hidden="true"><i className="bi bi-chevron-right"></i></div>
            <div className="workflow-step">
              <div className="workflow-step-num">02</div>
              <div className="workflow-step-icon"><i className="bi bi-journal-plus"></i></div>
              <h3>{t('login.step2_title')}</h3>
              <p>{t('login.step2_desc')}</p>
            </div>
            <div className="workflow-connector" aria-hidden="true"><i className="bi bi-chevron-right"></i></div>
            <div className="workflow-step">
              <div className="workflow-step-num">03</div>
              <div className="workflow-step-icon"><i className="bi bi-graph-up-arrow"></i></div>
              <h3>{t('login.step3_title')}</h3>
              <p>{t('login.step3_desc')}</p>
            </div>
          </div>

          <div className="login-trust-pills">
            <span className="trust-pill"><i className="bi bi-shield-lock-fill"></i>{t('login.trust_secure')}</span>
            <span className="trust-pill"><i className="bi bi-phone-fill"></i>{t('login.trust_otp')}</span>
            <span className="trust-pill"><i className="bi bi-bar-chart-line-fill"></i>{t('login.trust_reports')}</span>
            <span className="trust-pill"><i className="bi bi-people-fill"></i>{t('login.trust_team')}</span>
          </div>
        </div>
      </section>

      <AppFooter variant="login" />

      {/* ── FORGOT PASSWORD MODAL ── */}
      {resetStep > 0 && (
        <div className="modal-backdrop-overlay" onClick={() => setResetStep(0)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-box-header">
              <h5>{resetStep === 1 ? t('auth.forgot_pwd_title') : t('auth.reset_pwd_title')}</h5>
              <button className="modal-close-btn" onClick={() => setResetStep(0)}>&times;</button>
            </div>
            <div className="modal-box-body">
              {resetAlert && (
                <div className={`reset-alert ${resetAlert.type}`}>
                  <i className={`bi ${resetAlert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                  {resetAlert.message}
                </div>
              )}
              {resetStep === 1 && (
                <form onSubmit={handleRequestReset}>
                  <p className="modal-desc">{t('auth.forgot_pwd_desc')}</p>
                  <div className="form-field mb-3">
                    <label className="field-label">{t('auth.email')}</label>
                    <div className="field-input-wrap">
                      <i className="bi bi-envelope field-icon"></i>
                      <input type="email" className="field-input" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
                    </div>
                  </div>
                  <button type="submit" className="login-submit-btn" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm"></span> : t('auth.send_code')}
                  </button>
                </form>
              )}
              {resetStep === 2 && (
                <form onSubmit={handleResetPassword}>
                  <p className="modal-desc small text-body-secondary mb-3">
                    <i className="bi bi-telephone-fill me-1"></i>
                    {t('auth.verify_otp_desc')}
                  </p>
                  <div className="form-field mb-3">
                    <label className="field-label">{t('auth.otp_code')}</label>
                    <input type="text" className="field-input otp-input" style={{ textAlign: 'center', letterSpacing: '0.4em', fontSize: '1.4rem', fontWeight: 700 }} maxLength="6" value={resetCode} onChange={(e) => setResetCode(e.target.value)} required />
                  </div>
                  <div className="form-field mb-4">
                    <label className="field-label">{t('auth.new_pwd')}</label>
                    <div className="field-input-wrap">
                      <i className="bi bi-lock field-icon"></i>
                      <input type="password" className="field-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength="6" />
                    </div>
                  </div>
                  <button type="submit" className="login-submit-btn" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm"></span> : t('auth.reset_btn')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
