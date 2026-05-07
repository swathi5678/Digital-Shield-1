import { Navigate, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import { useSecurityStore } from './store/securityStore.js';
import LoginPage from './pages/LoginPage.js';
import Dashboard from './pages/Dashboard.js';
import AuthorizationIntelligence from './pages/AuthorizationIntelligence.js';
import SecureCodeGuardian from './pages/SecureCodeGuardian.js';
import TestDataSovereignty from './pages/TestDataSovereignty.js';
import CompliancePosture from './pages/CompliancePosture.js';
import BehavioralSentinel from './pages/BehavioralSentinel.js';
import AgentLedger from './pages/AgentLedger.js';
import VulnerabilitySurface from './pages/VulnerabilitySurface.js';
import Layout from './components/layout/Layout.js';

function ProtectedRoute({ element }: { element: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{element}</> : <Navigate to="/login" />;
}

export default function App() {
  const { setUser, setToken, user } = useSecurityStore();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setToken(token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      axios.get('/api/auth/me').catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={<ProtectedRoute element={<Layout><Dashboard /></Layout>} />}
      />
      <Route
        path="/authorization"
        element={<ProtectedRoute element={<Layout><AuthorizationIntelligence /></Layout>} />}
      />
      <Route
        path="/code-guardian"
        element={<ProtectedRoute element={<Layout><SecureCodeGuardian /></Layout>} />}
      />
      <Route
        path="/test-data"
        element={<ProtectedRoute element={<Layout><TestDataSovereignty /></Layout>} />}
      />
      <Route
        path="/compliance"
        element={<ProtectedRoute element={<Layout><CompliancePosture /></Layout>} />}
      />
      <Route
        path="/behavioral"
        element={<ProtectedRoute element={<Layout><BehavioralSentinel /></Layout>} />}
      />
      <Route
        path="/agent-ledger"
        element={<ProtectedRoute element={<Layout><AgentLedger /></Layout>} />}
      />
      <Route
        path="/vulnerability-surface"
        element={<ProtectedRoute element={<Layout><VulnerabilitySurface /></Layout>} />}
      />
    </Routes>
  );
}
