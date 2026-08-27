import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleReset = () => {
    localStorage.removeItem('booqasho_user');
    localStorage.removeItem('booqasho_token');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-light p-4">
          <div className="card border-0 shadow-lg bg-secondary-subtle text-dark" style={{ maxWidth: 520, borderRadius: 16 }}>
            <div className="card-body p-4 text-center">
              <div className="d-inline-flex align-items-center justify-content-center bg-danger-subtle text-danger rounded-circle mb-3" style={{ width: 64, height: 64, fontSize: '1.8rem' }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <h4 className="fw-bold mb-2">Wax khalad ah ayaa dhacay</h4>
              <p className="text-body-secondary small mb-4">
                {this.state.error?.message || 'A visual component encountered an issue.'}
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button onClick={this.handleReload} className="btn btn-primary px-4">
                  <i className="bi bi-arrow-clockwise me-1"></i> Dib u fur (Reload)
                </button>
                <button onClick={this.handleReset} className="btn btn-outline-secondary px-3">
                  Logout &amp; Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
