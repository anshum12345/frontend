import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { checkBackendStatus } from './services/api';
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';
import './index.css';

function App() {
  const [backendStatus, setBackendStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyBackend = async () => {
      try {
        const status = await checkBackendStatus();
        setBackendStatus(status);
      } catch (error) {
        setBackendStatus({
          error: error.message || 'Failed to connect to backend'
        });
      } finally {
        setLoading(false);
      }
    };

    verifyBackend();
  }, []);

  if (loading) {
    return (
      <div className="status-loading">
        <p>Checking backend connection...</p>
      </div>
    );
  }

  if (backendStatus?.error) {
    return (
      <div className="status-error">
        <h2>⚠️ Backend Connection Error</h2>
        <p>{backendStatus.error}</p>
        <p>Please ensure the backend server is running and try refreshing.</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="status-banner success">
        ✓ Backend Connected - Database: {backendStatus?.database || 'Ready'}
      </div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppPage />} />
      </Routes>
    </Router>
  );
}

export default App;