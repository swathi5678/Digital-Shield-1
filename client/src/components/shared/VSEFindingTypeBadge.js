import { jsx as _jsx } from "react/jsx-runtime";
export default function VSEFindingTypeBadge({ type }) {
    const map = {
        open_rfc_destination: { bg: 'bg-amber-900', text: 'text-amber-200', label: 'RFC Exposure' },
        default_user_active: { bg: 'bg-red-900', text: 'text-red-200', label: 'Default User' },
        debug_access_granted: { bg: 'bg-orange-900', text: 'text-orange-200', label: 'Debug Access' },
        icf_service_exposed: { bg: 'bg-yellow-900', text: 'text-yellow-200', label: 'ICF Exposed' },
        profile_parameter_misconfiguration: { bg: 'bg-violet-900', text: 'text-violet-200', label: 'Param Config' },
        gateway_security_gap: { bg: 'bg-red-800', text: 'text-red-200', label: 'Gateway Gap' }
    };
    const cfg = map[type];
    return _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`, children: cfg.label });
}
