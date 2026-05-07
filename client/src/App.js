import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
function ProtectedRoute({ element }) {
    const token = localStorage.getItem('token');
    return token ? _jsx(_Fragment, { children: element }) : _jsx(Navigate, { to: "/login" });
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
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/", element: _jsx(ProtectedRoute, { element: _jsx(Layout, { children: _jsx(Dashboard, {}) }) }) }), _jsx(Route, { path: "/authorization", element: _jsx(ProtectedRoute, { element: _jsx(Layout, { children: _jsx(AuthorizationIntelligence, {}) }) }) }), _jsx(Route, { path: "/code-guardian", element: _jsx(ProtectedRoute, { element: _jsx(Layout, { children: _jsx(SecureCodeGuardian, {}) }) }) }), _jsx(Route, { path: "/test-data", element: _jsx(ProtectedRoute, { element: _jsx(Layout, { children: _jsx(TestDataSovereignty, {}) }) }) }), _jsx(Route, { path: "/compliance", element: _jsx(ProtectedRoute, { element: _jsx(Layout, { children: _jsx(CompliancePosture, {}) }) }) }), _jsx(Route, { path: "/behavioral", element: _jsx(ProtectedRoute, { element: _jsx(Layout, { children: _jsx(BehavioralSentinel, {}) }) }) }), _jsx(Route, { path: "/agent-ledger", element: _jsx(ProtectedRoute, { element: _jsx(Layout, { children: _jsx(AgentLedger, {}) }) }) }), _jsx(Route, { path: "/vulnerability-surface", element: _jsx(ProtectedRoute, { element: _jsx(Layout, { children: _jsx(VulnerabilitySurface, {}) }) }) })] }));
}
