import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Sidebar from './Sidebar.js';
import TopBar from './TopBar.js';
export default function Layout({ children }) {
    return (_jsxs("div", { className: "flex h-screen bg-slate-950 text-gray-100", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx(TopBar, {}), _jsx("main", { className: "flex-1 overflow-y-auto p-6", children: children })] })] }));
}
