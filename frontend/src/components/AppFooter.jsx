import React from 'react';

export default function AppFooter({ variant = 'app' }) {
  return (
    <footer className={variant === 'login' ? 'hormuud-footer' : 'app-footer'}>
      <div className="app-footer-inner">
        <span className="app-footer-developer">Developed by Eng. Ayoub Adan Abdi

        </span>
        <span className="app-footer-copyright">© 2026 All Rights Reserved</span>
      </div>
    </footer>
  );
}
