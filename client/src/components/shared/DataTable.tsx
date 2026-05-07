import { ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Column<T> {
  header: string;
  key: keyof T;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  searchable?: boolean;
  searchKeys?: string[];
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  loading,
  emptyMessage = 'No data available',
  searchable = true,
  searchKeys = []
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: keyof T; desc: boolean } | null>(null);
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    let result = data;

    if (search && searchKeys.length > 0) {
      const searchLower = search.toLowerCase();
      result = result.filter((row) =>
        searchKeys.some((key) =>
          String((row as any)[key]).toLowerCase().includes(searchLower)
        )
      );
    }

    if (sort) {
      result = [...result].sort((a, b) => {
        const aVal = (a as any)[sort.key];
        const bVal = (b as any)[sort.key];

        if (aVal < bVal) return sort.desc ? 1 : -1;
        if (aVal > bVal) return sort.desc ? -1 : 1;
        return 0;
      });
    }

    return result;
  }, [data, sort, search, searchKeys]);

  const handleSort = (key: keyof T) => {
    if (sort?.key === key) {
      setSort({ key, desc: !sort.desc });
    } else {
      setSort({ key, desc: false });
    }
  };

  return (
    <div className="space-y-3">
      {searchable && searchKeys.length > 0 && (
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-shield-accent"
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable !== false && sort?.key === col.key && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${sort.desc ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-slate-800 hover:bg-slate-900 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      {col.render
                        ? col.render((row as any)[col.key], row)
                        : String((row as any)[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
