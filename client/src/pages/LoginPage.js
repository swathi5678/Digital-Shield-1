import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSecurityStore } from '../store/securityStore.js';
import { Shield } from 'lucide-react';
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUser, setToken } = useSecurityStore();
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await axios.post('/api/auth/login', { email, password });
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setToken(token);
            setUser(user);
            navigate('/');
        }
        catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-md space-y-8", children: [_jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "flex justify-center", children: _jsx(Shield, { className: "w-12 h-12 text-shield-accent" }) }), _jsx("h1", { className: "text-4xl font-bold text-white", children: "Digital Shield" }), _jsx("p", { className: "text-gray-400", children: "Cybersecurity Intelligence Platform" })] }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Email Address" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-gray-100 focus:outline-none focus:border-shield-accent transition-colors", placeholder: "your@email.com", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Password" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-gray-100 focus:outline-none focus:border-shield-accent transition-colors", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] }), error && (_jsx("div", { className: "p-3 bg-red-900 border border-red-700 rounded-lg text-red-200 text-sm", children: error })), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-shield-accent hover:bg-purple-500 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50", children: loading ? 'Logging in...' : 'Login' })] }), _jsxs("div", { className: "border-t border-slate-700 pt-6 space-y-3", children: [_jsx("p", { className: "text-sm text-gray-400 font-semibold", children: "Demo Credentials:" }), _jsxs("div", { className: "space-y-2 text-xs", children: [_jsx("div", { className: "bg-slate-900 p-2 rounded", children: _jsxs("p", { className: "text-gray-300", children: [_jsx("strong", { children: "ciso@demo.com" }), " \u2014 Full access"] }) }), _jsx("div", { className: "bg-slate-900 p-2 rounded", children: _jsxs("p", { className: "text-gray-300", children: [_jsx("strong", { children: "pm@demo.com" }), " \u2014 Project manager"] }) }), _jsx("div", { className: "bg-slate-900 p-2 rounded", children: _jsxs("p", { className: "text-gray-300", children: [_jsx("strong", { children: "analyst@demo.com" }), " \u2014 Security analyst"] }) }), _jsx("div", { className: "bg-slate-900 p-2 rounded", children: _jsxs("p", { className: "text-gray-300", children: [_jsx("strong", { children: "auditor@demo.com" }), " \u2014 Read-only access"] }) }), _jsx("div", { className: "bg-slate-900 p-2 rounded", children: _jsxs("p", { className: "text-gray-300", children: [_jsx("strong", { children: "Password:" }), " Shield@2025"] }) })] })] })] }) }));
}
