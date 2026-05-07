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
  { name: 'Agent Ledger', path: '/agent-ledger', icon: BookOpen }
  ,{ name: 'Vulnerability Surface', path: '/vulnerability-surface', icon: RadioTower }
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

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'ciso': return 'bg-red-600';
      case 'project_manager': return 'bg-blue-600';
      case 'security_analyst': return 'bg-purple-600';
      case 'auditor': return 'bg-gray-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="w-60 bg-shield-sidebar border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-shield-accent" />
          <h1 className="text-xl font-bold text-white">Digital Shield</h1>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-shield-accent bg-opacity-20 text-shield-accent border-l-4 border-shield-accent'
                  : 'text-gray-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4 space-y-3">
        {user && (
          <>
            <div className="px-2 py-2">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`${getRoleColor(user.role)} text-xs font-semibold px-2 py-1 rounded text-white`}>
                  {user.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-lg text-gray-300 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}
