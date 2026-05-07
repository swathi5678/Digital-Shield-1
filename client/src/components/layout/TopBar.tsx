import { useLocation } from 'react-router-dom';
import { Bell, Moon, Sun, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/authorization': 'Authorization Intelligence Engine',
  '/code-guardian': 'Secure Code Guardian',
  '/test-data': 'Test Data Sovereignty Layer',
  '/compliance': 'Compliance Posture Mapper',
  '/behavioral': 'Behavioral Anomaly Sentinel',
  '/agent-ledger': 'Agent Governance Ledger'
};

export default function TopBar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const title = pageNames[location.pathname] || 'Digital Shield';
  const isDark = theme === 'dark';

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
          <span>Digital Shield</span>
          <span>{location.pathname === '/' ? '' : ` / ${title}`}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-300" />
          )}
        </button>
        <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-shield-critical rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
          <div className="w-8 h-8 bg-shield-accent rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
