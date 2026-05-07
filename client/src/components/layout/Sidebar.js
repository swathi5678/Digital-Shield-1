import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Users, Code2, Database, ClipboardCheck, Eye, BookOpen, LogOut, RadioTower } from 'lucide-react';
import { useSecurityStore } from '../../store/securityStore.js';
const navItems = [
    { name: 'Dashboard', path: '/', icon: Shield },
    { name: 'Authorization Intelligence', path: '/authorization', icon: Users },
    { name: 'Secure Code Guardian', path: '/code-guardian', icon: Code2 },
    { name: 'Test Data Sovereignty', path: '/test-data', icon: Database },
    { name: 'Compliance Posture', path: '/compliance', icon: ClipboardCheck },
    { name: 'Behavioral Sentinel', path: '/behavioral', icon: Eye },
    { name: 'Agent Ledger', path: '/agent-ledger', icon: BookOpen },
    { name: 'Vulnerability Surface', path: '/vulnerability-surface', icon: RadioTower }
];
export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, clearUser } = useSecurityStore();
    const handleLogout = () => {
        localStorage.removeItem('token');
        clearUser();
        navigate('/login');
    };
    const getRoleColor = (role) => {
        switch (role) {
            case 'ciso': return 'bg-red-600';
            case 'project_manager': return 'bg-blue-600';
            case 'security_analyst': return 'bg-purple-600';
            case 'auditor': return 'bg-gray-600';
            default: return 'bg-slate-600';
        }
    };
    return (_jsxs("div", { className: "w-60 bg-shield-sidebar border-r border-slate-800 flex flex-col", children: [_jsx("div", { className: "p-6 border-b border-slate-800", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Shield, { className: "w-8 h-8 text-shield-accent" }), _jsx("h1", { className: "text-xl font-bold text-white", children: "Digital Shield" })] }) }), _jsx("nav", { className: "flex-1 overflow-y-auto p-4 space-y-1", children: navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (_jsxs(Link, { to: item.path, className: `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                            ? 'bg-shield-accent bg-opacity-20 text-shield-accent border-l-4 border-shield-accent'
                            : 'text-gray-300 hover:bg-slate-800'}`, children: [_jsx(Icon, { className: "w-5 h-5" }), _jsx("span", { className: "text-sm font-medium", children: item.name })] }, item.path));
                }) }), _jsx("div", { className: "border-t border-slate-800 p-4 space-y-3", children: user && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "px-2 py-2", children: [_jsx("p", { className: "text-sm font-semibold text-white truncate", children: user.name }), _jsx("div", { className: "flex items-center gap-2 mt-1", children: _jsx("span", { className: `${getRoleColor(user.role)} text-xs font-semibold px-2 py-1 rounded text-white`, children: user.role.replace('_', ' ').toUpperCase() }) })] }), _jsxs("button", { onClick: handleLogout, className: "w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-lg text-gray-300 text-sm transition-colors", children: [_jsx(LogOut, { className: "w-4 h-4" }), "Logout"] })] })) })] }));
}
