import React from 'react';
import logo from '../../logo.png';

export default function HormuudLogo({ showText = true, size = 40, className = '' }) {
  const greenColor = '#3cb043';
  const blueColor = '#2ca033';

  return (
    <div className={`hormuud-logo-container ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <img
        src={logo}
        alt="Hormuud Telecom Logo"
        width={size}
        height={size}
        style={{ flexShrink: 0, objectFit: 'contain' }}
      />

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span
            className="logo-text-hormuud"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: size > 40 ? '1.8rem' : '1.25rem',
              color: greenColor,
              letterSpacing: '0.04em'
            }}
          >
            HORMUUD
          </span>
          <span
            className="logo-text-telecom"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: size > 40 ? '1.05rem' : '0.75rem',
              color: blueColor,
              letterSpacing: '0.34em',
              marginTop: '-2px'
            }}
          >
            TELECOM
          </span>
        </div>
      )}
    </div>
  );
}
