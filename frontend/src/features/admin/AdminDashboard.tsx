import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@components/common/StatCard';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Users, UserCheck, Activity, AlertTriangle,
  Settings, FileText, Download, RefreshCw,
  TrendingUp, CheckCircle, AlertCircle, Info, Zap,
} from 'lucide-react';
import { clinicalService } from '@services/clinical.service';
import type { DashboardStats, AuditLogRecord } from '@/types/index';

/* Pie chart colors by classification name */
const CLASS_COLOR: Record<string, string> = {
  'Angina Pectoris': '#EF4444',
  'Stroke':          '#F59E0B',
  'Low Risk':        '#10B981',
  'Non-Classified':  '#6B7280',
};

const STATUS_STYLE: Record<string, { icon: JSX.Element; cls: string }> = {
  Critical: { icon: <AlertCircle className="w-3.5 h-3.5" />, cls: 'bg-red-50 text-critical border border-red-100' },
  Warning:  { icon: <AlertTriangle className="w-3.5 h-3.5" />, cls: 'bg-amber-50 text-amber-600 border border-amber-100' },
  Info:     { icon: <Info className="w-3.5 h-3.5" />, cls: 'bg-emerald-50 text-safe border border-emerald-100' },
};

const DOT_COLOR: Record<string, string> = {
  Critical: 'bg-critical',
  Warning:  'bg-warning',
  Info:     'bg-safe',
};

interface PerfMetrics {
  total_requests: number;
  avg_response_time_ms: number;
  max_response_time_ms: number;
  within_threshold: number;
}

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [perf, setPerf]           = useState<PerfMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [statsData, logsData, perfData] = await Promise.all([
        clinicalService.getDashboardStats(),
        clinicalService.getAuditLogs(),
        clinicalService.getPerformanceMetrics().catch(() => null),
      ]);
      setStats(statsData);
      setAuditLogs(logsData);
      if (perfData) setPerf(perfData);
    } catch { /* keep UI functional */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const quickActions = [
    { label: 'Export Report',   icon: <Download className="w-4 h-4" />, color: 'bg-blue-500',  hover: 'hover:bg-blue-600',  onClick: () => {} },
    { label: 'Refresh Data',    icon: <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />, color: 'bg-mint', hover: 'hover:bg-mint/90', onClick: () => load(true) },
    { label: 'System Settings', icon: <Settings className="w-4 h-4" />, color: 'bg-gray-700',  hover: 'hover:bg-gray-800', onClick: () => navigate('/admin/config') },
    { label: 'View Logs',       icon: <FileText className="w-4 h-4" />, color: 'bg-amber-500', hover: 'hover:bg-amber-600', onClick: () => navigate('/admin/audit') },
  ];

  const statCards = stats ? [
    { title: 'Total Cases',  value: stats.total_cases,       subtitle: 'All time',           color: 'blue'     as const, icon: <Users className="w-5 h-5" /> },
    { title: 'High Risk',    value: stats.high_risk_count,   subtitle: 'Red code alerts',    color: 'critical' as const, icon: <AlertTriangle className="w-5 h-5" /> },
    { title: 'Low Risk',     value: stats.low_risk_count,    subtitle: 'Green code cases',   color: 'safe'     as const, icon: <UserCheck className="w-5 h-5" /> },
    { title: 'Avg Response', value: `${Math.round(stats.avg_response_time_ms)} ms`, subtitle: 'AI classification time', color: 'violet' as const, icon: <Activity className="w-5 h-5" /> },
  ] : [];

  const classificationData = stats
    ? Object.entries(stats.classification_breakdown).map(([name, value]) => ({
        name, value,
        color: CLASS_COLOR[name] ?? '#6B7280',
      }))
    : [];

  const dailyCases = stats?.daily_cases ?? [];

  /* Derived performance metrics */
  const throughputPct = perf && perf.total_requests > 0
    ? Math.round((perf.within_threshold / perf.total_requests) * 100)
    : null;

  const aiMetrics = [
    {
      label: 'Requests Processed',
      value: perf ? perf.total_requests : '—',
      unit: '',
      sub: 'Total API calls logged',
      color: '#00D0B0',
      bg: 'bg-mint/10',
      text: 'text-mint',
      bar: throughputPct,
    },
    {
      label: 'Avg Response Time',
      value: perf ? `${Math.round(perf.avg_response_time_ms)}` : stats ? `${Math.round(stats.avg_response_time_ms)}` : '—',
      unit: 'ms',
      sub: 'Mean classification latency',
      color: '#3B82F6',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      bar: perf ? Math.min(100, Math.max(0, 100 - Math.round(perf.avg_response_time_ms / 100))) : null,
    },
    {
      label: 'Within Threshold',
      value: throughputPct !== null ? throughputPct : '—',
      unit: '%',
      sub: 'Responses under 5 s',
      color: '#7C3AED',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      bar: throughputPct,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">Overview of system activity and performance</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
            <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
            <span className="text-xs font-semibold text-safe">System Online</span>
          </div>
          <button
            onClick={() => load(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* AI / System Performance */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> System Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiMetrics.map((metric, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`px-2.5 py-1 ${metric.bg} ${metric.text} rounded-lg text-xs font-semibold`}>
                  {metric.label}
                </div>
                <div className="flex items-center gap-1 text-xs text-safe font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Live
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {metric.value}
                {metric.unit && <span className="text-base font-medium text-gray-400 ml-1">{metric.unit}</span>}
              </p>
              <p className="text-xs text-gray-400 mb-3">{metric.sub}</p>
              {metric.bar !== null && (
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(0, Math.min(100, metric.bar ?? 0))}%`, background: metric.color }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Pie chart */}
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Classification Distribution</h3>
            <p className="text-xs text-gray-400 mt-0.5">AI risk category breakdown — all time</p>
          </div>
          {classificationData.length === 0 ? (
            <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={classificationData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={95}
                  paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {classificationData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Daily Cases — Last 7 Days</h3>
            <p className="text-xs text-gray-400 mt-0.5">Critical vs. safe case volume</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dailyCases} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '12px' }} cursor={{ fill: '#F9FAFB' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="critical" name="Critical" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="safe"     name="Safe"     fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Audit Logs */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Recent Audit Logs</h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest system activity</p>
            </div>
            <button onClick={() => navigate('/admin/audit')} className="text-xs text-mint hover:text-mint/80 font-medium transition-colors">
              View all →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No audit logs yet.</p>
            ) : auditLogs.slice(0, 5).map((log) => {
              const s = STATUS_STYLE[log.status] ?? STATUS_STYLE.Info;
              return (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLOR[log.status] ?? 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate">{log.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">by <span className="font-medium text-gray-500">{log.user}</span></p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.cls}`}>
                      {s.icon} {log.status}
                    </span>
                    <span className="text-xs text-gray-400 hidden sm:block whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions + System Health */}
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-xs text-gray-400 mt-0.5">Common admin tasks</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-card transition-all group"
              >
                <div className={`${action.color} ${action.hover} w-10 h-10 rounded-xl flex items-center justify-center text-white transition-colors shadow-sm`}>
                  {action.icon}
                </div>
                <span className="text-xs font-medium text-gray-600 text-center leading-tight">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">System Health</p>
            {[
              { label: 'API Status',    value: 'Online' },
              { label: 'Total Requests', value: perf ? String(perf.total_requests) : '—' },
              { label: 'ML Model',      value: 'Active' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-safe" />
                  <span className="text-xs font-semibold text-safe">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
