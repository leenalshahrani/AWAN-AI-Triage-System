import { useState, useEffect } from 'react';
import { Search, Filter, AlertCircle, AlertTriangle, Info, Download } from 'lucide-react';
import { clinicalService } from '@services/clinical.service';
import type { AuditLogRecord } from '@/types/index';

const STATUS_CONFIG: Record<string, { icon: JSX.Element; badge: string; dot: string }> = {
  Critical: {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    badge: 'bg-red-50 text-critical border border-red-100',
    dot: 'bg-critical',
  },
  Warning: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    badge: 'bg-amber-50 text-amber-600 border border-amber-100',
    dot: 'bg-warning',
  },
  Info: {
    icon: <Info className="w-3.5 h-3.5" />,
    badge: 'bg-emerald-50 text-safe border border-emerald-100',
    dot: 'bg-safe',
  },
};

const FILTERS = ['All', 'Info', 'Warning', 'Critical'];

export const AuditLogs = () => {
  const [logs, setLogs]       = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');

  useEffect(() => {
    clinicalService.getAuditLogs()
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.user.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || l.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{logs.length} total events recorded</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action or user..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint/40 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f
                    ? 'bg-mint text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log entries */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-center space-y-2">
              <div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-400">Loading logs...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No logs match your search.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[140px_120px_1fr_100px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
              {['Timestamp', 'User', 'Action', 'Status'].map((h) => (
                <span key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {filtered.map((log) => {
                const s = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.Info;
                return (
                  <div key={log.id} className="grid grid-cols-[140px_120px_1fr_100px] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/60 transition-colors group">

                    {/* Timestamp */}
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                      <div>
                        <p className="text-xs font-medium text-gray-700">
                          {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* User */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-mint/30 to-mint/10 rounded-md flex items-center justify-center text-mint text-[10px] font-bold flex-shrink-0">
                        {log.user[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate">{log.user}</span>
                    </div>

                    {/* Action */}
                    <p className="text-sm text-gray-600 truncate" title={log.action}>{log.action}</p>

                    {/* Status */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold w-fit ${s.badge}`}>
                      {s.icon} {log.status}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400">Showing {filtered.length} of {logs.length} events</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
