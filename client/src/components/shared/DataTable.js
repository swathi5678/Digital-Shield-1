import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';
export default function DataTable({ columns, data, onRowClick, loading, emptyMessage = 'No data available', searchable = true, searchKeys = [] }) {
    const [sort, setSort] = useState(null);
    const [search, setSearch] = useState('');
    const filteredData = useMemo(() => {
        let result = data;
        if (search && searchKeys.length > 0) {
            const searchLower = search.toLowerCase();
            result = result.filter((row) => searchKeys.some((key) => String(row[key]).toLowerCase().includes(searchLower)));
        }
        if (sort) {
            result = [...result].sort((a, b) => {
                const aVal = a[sort.key];
                const bVal = b[sort.key];
                if (aVal < bVal)
                    return sort.desc ? 1 : -1;
                if (aVal > bVal)
                    return sort.desc ? -1 : 1;
                return 0;
            });
        }
        return result;
    }, [data, sort, search, searchKeys]);
    const handleSort = (key) => {
        if (sort?.key === key) {
            setSort({ key, desc: !sort.desc });
        }
        else {
            setSort({ key, desc: false });
        }
    };
    return (_jsxs("div", { className: "space-y-3", children: [searchable && searchKeys.length > 0 && (_jsx("input", { type: "text", placeholder: "Search...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-shield-accent" })), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-slate-700", children: columns.map((col) => (_jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors", onClick: () => col.sortable !== false && handleSort(col.key), children: _jsxs("div", { className: "flex items-center gap-2", children: [col.header, col.sortable !== false && sort?.key === col.key && (_jsx(ChevronDown, { className: `w-4 h-4 transition-transform ${sort.desc ? 'rotate-180' : ''}` }))] }) }, String(col.key)))) }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, className: "px-4 py-8 text-center text-gray-400", children: "Loading..." }) })) : filteredData.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, className: "px-4 py-8 text-center text-gray-400", children: emptyMessage }) })) : (filteredData.map((row) => (_jsx("tr", { onClick: () => onRowClick?.(row), className: `border-b border-slate-800 hover:bg-slate-900 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`, children: columns.map((col) => (_jsx("td", { className: "px-4 py-3", children: col.render
                                        ? col.render(row[col.key], row)
                                        : String(row[col.key]) }, String(col.key)))) }, row.id)))) })] }) })] }));
}
