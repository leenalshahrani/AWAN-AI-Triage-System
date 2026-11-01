import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Clock, CheckCircle, RefreshCw, Shield } from 'lucide-react';
import { clinicalService } from '@services/clinical.service';
import type { CaseRecord } from '@/types/index';

const elapsedLabel = (datetime: string) => {
  const diff = Math.floor((Date.now() - new Date(datetime).getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff === 1) return '1 min ago';
  return `${diff} mins ago`;
};

export const StaffAlertPage = () => {
  const [redCases, setRedCases]   = useState<CaseRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAlerts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await clinicalService.getAllCases({ riskLevel: 'Red' });
      setRedCases(data.filter((c) => !c.validated));
      setLastRefresh(new Date());
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    loadAlerts();
    intervalRef.current = setInterval(() => loadAlerts(), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="space-y-5">

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full">
            <span className="w-2 h-2 rounded-full bg-critical animate-pulse" />
            <span className="text-xs font-semibold text-critical">Live Monitoring</span>
          </div>
          <span className="text-xs text-gray-400">
            Updated {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · auto-refreshes every 30s
          </span>
        </div>
        <button
          onClick={() => loadAlerts(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="text-center space-y-2">
            <div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-400">Loading alerts...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && redCases.length === 0 && (
        <div className="bg-white rounded-xl shadow-card border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-safe" />
          </div>
          <h2 className="text-base font-bold text-gray-800">No Active RED Alerts</h2>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">All current cases are GREEN code. No ER preparation needed at this time.</p>
        </div>
      )}

      {!loading && redCases.length > 0 && (
        <>
          {/* Summary banner */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-critical/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-critical" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-critical text-sm">
                {redCases.length} Active RED {redCases.length === 1 ? 'Alert' : 'Alerts'} — Immediate Action Required
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Prepare ER bay, labs, and imaging for the following patients immediately.
              </p>
            </div>
          </div>

          {/* Alert cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {redCases.map((c) => (
              <div
                key={c.entry_id}
                className="bg-white border border-gray-100 border-t-2 border-t-critical rounded-xl p-5 shadow-card hover:shadow-card-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-critical text-white rounded-full text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
                    RED CODE
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {elapsedLabel(c.entry_datetime)}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="font-bold text-gray-900">{c.patient_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Queue #{c.entry_id}{c.national_id ? ` · ID: ${c.national_id}` : ''}</p>
                </div>

                {/* Symptoms */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Symptoms</p>
                  <div className="flex flex-wrap gap-1">
                    {[c.pain_type, c.pain_location, c.other_symptoms]
                      .filter(Boolean)
                      .map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-xs">
                          {s}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Condition */}
                {c.classification && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Possible Condition</p>
                    <p className="text-sm font-semibold text-gray-800">{c.classification}</p>
                  </div>
                )}

                {(c.severity || c.duration) && (
                  <div className="flex gap-4 text-xs text-gray-500 mb-3">
                    {c.severity && <span><span className="font-semibold text-gray-600">Severity:</span> {c.severity}</span>}
                    {c.duration && <span><span className="font-semibold text-gray-600">Duration:</span> {c.duration}</span>}
                  </div>
                )}

                {/* ER checklist */}
                <div className="pt-3 border-t border-red-100">
                  <p className="text-xs font-bold text-critical uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> ER Preparation Checklist
                  </p>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    {[
                      'Prepare ER bay and crash cart',
                      'Order stat labs (CBC, BMP, troponin, coags)',
                      'Request urgent imaging (ECG / CT as indicated)',
                      'Notify on-call physician',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border border-gray-300 rounded flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Summary table */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">All Active RED Cases</h3>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[60px_2fr_2fr_120px_100px] gap-4 px-5 py-3 bg-gray-50/50 border-b border-gray-100">
              {['Queue #', 'Patient', 'Condition', 'Severity', 'Time'].map((h) => (
                <span key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
              ))}
            </div>

            <div className="divide-y divide-gray-50">
              {redCases.map((c) => (
                <div key={c.entry_id} className="grid grid-cols-[60px_2fr_2fr_120px_100px] gap-4 items-center px-5 py-3.5 hover:bg-red-50/30 transition-colors">
                  <span className="font-bold text-critical text-sm">#{c.entry_id}</span>
                  <span className="font-semibold text-gray-900 text-sm truncate">{c.patient_name}</span>
                  <span className="text-sm text-gray-600 truncate">{c.classification || '—'}</span>
                  <span className="inline-flex items-center px-2.5 py-1 bg-red-50 text-critical border border-red-100 rounded-full text-xs font-semibold w-fit">
                    {c.severity || '—'}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {elapsedLabel(c.entry_datetime)}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400">{redCases.length} active red {redCases.length === 1 ? 'case' : 'cases'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
