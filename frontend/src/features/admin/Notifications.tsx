import { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, X, BellOff, RefreshCw, User, Activity, Shield } from 'lucide-react';
import { clinicalService } from '@services/clinical.service';
import type { AuditLogRecord, CaseRecord } from '@/types/index';

type NotifType = 'critical' | 'warning' | 'info' | 'patient' | 'assessment';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  timestamp: string;
  unread: boolean;
}

const TYPE_CONFIG: Record<NotifType, {
  icon: JSX.Element; badge: string; dot: string; left: string; label: string;
}> = {
  critical:   { icon: <AlertTriangle className="w-4 h-4" />, badge: 'bg-red-50 text-critical',    dot: 'bg-critical', left: 'border-l-critical',  label: 'Critical' },
  warning:    { icon: <Bell className="w-4 h-4" />,          badge: 'bg-amber-50 text-amber-600',  dot: 'bg-warning',  left: 'border-l-warning',   label: 'Warning' },
  info:       { icon: <Info className="w-4 h-4" />,          badge: 'bg-mint/10 text-mint',        dot: 'bg-mint',     left: 'border-l-mint',      label: 'Info' },
  patient:    { icon: <User className="w-4 h-4" />,          badge: 'bg-blue-50 text-blue-600',    dot: 'bg-blue-500', left: 'border-l-blue-400',  label: 'Patient' },
  assessment: { icon: <Activity className="w-4 h-4" />,      badge: 'bg-violet-50 text-violet-600', dot: 'bg-violet-500', left: 'border-l-violet-400', label: 'Assessment' },
};

const FILTERS: Array<{ key: string; label: string }> = [
  { key: 'All',        label: 'All' },
  { key: 'critical',   label: 'Critical' },
  { key: 'warning',    label: 'Warning' },
  { key: 'patient',    label: 'Patient' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'info',       label: 'Info' },
];

const timeAgo = (timestamp: string) => {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diff < 1)    return 'Just now';
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

const classifyLog = (log: AuditLogRecord): NotifType => {
  const a = log.action.toLowerCase();
  if (a.includes('patient login') || a.includes('patient password')) return 'patient';
  if (a.includes('assessment') || a.includes('new assessment'))      return 'assessment';
  if (log.status === 'Critical') return 'critical';
  if (log.status === 'Warning')  return 'warning';
  return 'info';
};

const STORAGE_KEY_DISMISSED = 'dismissed_notifs';
const STORAGE_KEY_READ      = 'notifs_read_all';

const persist = (dismissed: Set<string>, readAll: boolean) => {
  localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify([...dismissed]));
  localStorage.setItem(STORAGE_KEY_READ, String(readAll));
};

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [filter, setFilter]     = useState('All');

  const [dismissed, setDismissed] = useState<Set<string>>(
    () => new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_DISMISSED) ?? '[]'))
  );
  const [readAll, setReadAll] = useState(
    () => localStorage.getItem(STORAGE_KEY_READ) === 'true'
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildNotifications = (logs: AuditLogRecord[], cases: CaseRecord[]): Notification[] => {
    const caseNotifs: Notification[] = cases
      .filter((c) => c.risk_color === 'Red' && !c.validated)
      .map((c) => ({
        id: `case-${c.entry_id}`,
        type: 'critical' as NotifType,
        title: 'Critical Patient Alert',
        message: `${c.patient_name} (Queue #${c.entry_id}) — ${c.classification ?? 'Unclassified'}`,
        timestamp: c.entry_datetime,
        unread: true,
      }));

    const logNotifs: Notification[] = logs.map((l) => ({
      id: `log-${l.id}`,
      type: classifyLog(l),
      title: l.action,
      message: `By ${l.user}`,
      timestamp: l.timestamp,
      unread: l.status === 'Critical',
    }));

    // Merge and sort newest first, dedupe by id
    const all = [...caseNotifs, ...logNotifs];
    const seen = new Set<string>();
    return all
      .filter((n) => { if (seen.has(n.id)) return false; seen.add(n.id); return true; })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [logs, cases] = await Promise.all([
        clinicalService.getAuditLogs(),
        clinicalService.getAllCases(),
      ]);
      setNotifications(buildNotifications(logs, cases as CaseRecord[]));
      setLastRefresh(new Date());
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => load(), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const visible = notifications.filter((n) => !dismissed.has(n.id));
  const filtered = filter === 'All' ? visible : visible.filter((n) => n.type === filter);
  const unreadCnt = visible.filter((n) => n.unread && !readAll).length;

  const handleDismiss = (id: string) => {
    const next = new Set([...dismissed, id]);
    setDismissed(next);
    persist(next, readAll);
  };

  const handleMarkAllRead = () => {
    setReadAll(true);
    persist(dismissed, true);
  };

  const handleClearAll = () => {
    const all = new Set(notifications.map((n) => n.id));
    setDismissed(all);
    persist(all, readAll);
  };

  return (
    <div className="space-y-5">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {unreadCnt > 0 && (
            <span className="px-2.5 py-1 bg-critical text-white text-xs font-bold rounded-full animate-pulse">
              {unreadCnt} unread
            </span>
          )}
          <span className="text-xs text-gray-400">
            Updated {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · auto-refreshes every 30s
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {visible.length > 0 && (
            <>
              <button onClick={handleMarkAllRead} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Mark all read
              </button>
              <button onClick={handleClearAll} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Clear all
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {FILTERS.map((f) => {
            const count = f.key === 'All'
              ? visible.length
              : visible.filter((n) => n.type === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f.key
                    ? 'bg-mint text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    filter === f.key ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-xl shadow-card border border-gray-100 flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <BellOff className="w-7 h-7 opacity-40" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            {filter === 'All' ? 'No notifications' : `No ${filter} notifications`}
          </p>
          <p className="text-xs text-gray-400 mt-1">You're all caught up.</p>
        </div>
      )}

      {/* Notifications list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const cfg     = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info;
            const isUnread = notif.unread && !readAll;
            return (
              <div
                key={notif.id}
                className={`bg-white rounded-xl border border-gray-100 border-l-4 ${cfg.left} shadow-card px-5 py-4 flex items-start gap-4 transition-all hover:shadow-card-md ${
                  isUnread ? '' : 'opacity-75'
                }`}
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg ${cfg.badge} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        {isUnread && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />}
                      </div>
                      <p className={`text-sm font-semibold truncate ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>
                    </div>
                    <button
                      className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
                      onClick={() => handleDismiss(notif.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">{timeAgo(notif.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary footer */}
      {!loading && visible.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Showing {filtered.length} of {visible.length} notifications
        </p>
      )}

    </div>
  );
};
