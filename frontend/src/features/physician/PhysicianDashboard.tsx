import { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle, Clock, X, ShieldAlert, Bell, BellOff,
  CheckCircle, User, Phone, Calendar, Activity, RefreshCw,
} from 'lucide-react';
import { clinicalService } from '@services/clinical.service';
import { useAppStore } from '@hooks/useAppStore';
import type { CaseRecord, CaseDetail } from '@/types/index';

const elapsedLabel = (datetime: string) => {
  const diff = Math.floor((Date.now() - new Date(datetime).getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff === 1) return '1m ago';
  return `${diff}m ago`;
};

const RiskBadge = ({ color }: { color: string }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
    color === 'Red'
      ? 'bg-critical text-white'
      : 'bg-emerald-500 text-white'
  }`}>
    <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
    {color} Code
  </span>
);

export const PhysicianDashboard = () => {
  const user = useAppStore((s) => s.user);
  const [cases, setCases]               = useState<CaseRecord[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [caseDetail, setCaseDetail]     = useState<CaseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notified, setNotified]           = useState(false);

  const [showOverride, setShowOverride]     = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<'Red' | 'Green' | null>(null);
  const [justification, setJustification]   = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError]   = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadCases = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      setCases(await clinicalService.getAllCases());
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    loadCases();
    intervalRef.current = setInterval(() => loadCases(), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const criticalAlerts = cases.filter((c) => c.risk_color === 'Red' && !c.validated);

  const openCase = async (item: CaseRecord) => {
    setSelectedCase(item);
    setCaseDetail(null);
    setDetailLoading(true);
    setShowOverride(false);
    setJustification('');
    setOverrideError('');
    setNotified(false);
    try {
      setCaseDetail(await clinicalService.getCaseDetail(item.entry_id));
    } catch { /* keep list-level data */ }
    finally { setDetailLoading(false); }
  };

  const closeModal = () => {
    setSelectedCase(null);
    setCaseDetail(null);
    setShowOverride(false);
    setJustification('');
    setOverrideError('');
    setNotified(false);
  };

  const handleNotifyPatient = async () => {
    if (!selectedCase) return;
    setNotifyLoading(true);
    try {
      await clinicalService.notifyPatient(selectedCase.entry_id, user?.username || 'physician');
      setNotified(true);
    } catch { /* ignore */ }
    finally { setNotifyLoading(false); }
  };

  const markSeen = async () => {
    if (!selectedCase) return;
    try {
      await clinicalService.validateCase(selectedCase.entry_id);
      setCases((prev) => prev.map((c) => c.entry_id === selectedCase.entry_id ? { ...c, validated: true } : c));
    } catch { /* ignore */ }
    closeModal();
  };

  const initiateOverride = (target: 'Red' | 'Green') => {
    setOverrideTarget(target);
    setJustification('');
    setOverrideError('');
    setShowOverride(true);
  };

  const confirmOverride = async () => {
    if (!selectedCase || !overrideTarget) return;
    if (!justification.trim()) { setOverrideError('Justification is required.'); return; }
    setOverrideLoading(true);
    setOverrideError('');
    try {
      const result = await clinicalService.overrideCase(selectedCase.entry_id, {
        target_color: overrideTarget,
        justification: justification.trim(),
        doctor_username: user?.username || 'physician',
      });
      setCases((prev) => prev.map((c) =>
        c.entry_id === selectedCase.entry_id
          ? { ...c, risk_color: result.new_color as 'Red' | 'Green', classification: result.classification }
          : c
      ));
      setShowOverride(false);
      closeModal();
    } catch {
      setOverrideError('Override failed. Please try again.');
    } finally {
      setOverrideLoading(false);
    }
  };

  const currentColor    = selectedCase?.risk_color;
  const canOverrideToRed   = currentColor === 'Green';
  const canOverrideToGreen = currentColor === 'Red';

  return (
    <div className="space-y-5">

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
            <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
            <span className="text-xs font-semibold text-safe">Live Updates</span>
          </div>
          {criticalAlerts.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5 text-critical" />
              <span className="text-xs font-semibold text-critical">{criticalAlerts.length} Critical</span>
            </div>
          )}
        </div>
        <button
          onClick={() => loadCases(true)}
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
            <p className="text-sm text-gray-400">Loading triage queue...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Critical Alerts Banner */}
          {criticalAlerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-critical" />
                Critical Alerts — Immediate Attention Required
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {criticalAlerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.entry_id}
                    onClick={() => openCase(alert)}
                    className="bg-white border border-gray-100 border-t-2 border-t-critical rounded-xl p-4 shadow-card hover:shadow-card-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-critical text-white rounded-full text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
                        RED CODE
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {elapsedLabel(alert.entry_datetime)}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 mt-2">{alert.patient_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Queue #{alert.entry_id}</p>
                    {alert.classification && (
                      <p className="text-xs font-medium text-gray-700 mt-2 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100">
                        {alert.classification}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patient Queue */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Patient Queue</h3>
                <p className="text-xs text-gray-400 mt-0.5">{cases.length} total — {cases.filter(c => !c.validated).length} pending review</p>
              </div>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[48px_2fr_2fr_1fr_90px_80px_72px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
              {['#', 'Patient', 'Symptoms', 'Condition', 'Time', 'Risk', ''].map((h) => (
                <span key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
              ))}
            </div>

            <div className="divide-y divide-gray-50">
              {cases.map((item) => (
                <div
                  key={item.entry_id}
                  className={`grid grid-cols-[48px_2fr_2fr_1fr_90px_80px_72px] gap-3 items-center px-5 py-3.5 transition-colors ${
                    item.validated ? 'opacity-50 bg-gray-50/50' : 'hover:bg-gray-50/60'
                  }`}
                >
                  {/* Queue # */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${
                    item.risk_color === 'Red' ? 'bg-critical' : 'bg-emerald-500'
                  }`}>
                    {item.entry_id}
                  </div>

                  {/* Patient */}
                  <p className="font-semibold text-gray-900 text-sm truncate">{item.patient_name}</p>

                  {/* Symptoms */}
                  <div className="flex flex-wrap gap-1">
                    {[item.pain_type, item.pain_location].filter(Boolean).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Condition */}
                  <p className="text-xs text-gray-600 truncate">{item.classification}</p>

                  {/* Time */}
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {elapsedLabel(item.entry_datetime)}
                  </div>

                  {/* Risk badge */}
                  <RiskBadge color={item.risk_color} />

                  {/* Action */}
                  <button
                    onClick={() => openCase(item)}
                    className="px-2.5 py-1.5 bg-mint hover:bg-mint/90 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>

            {cases.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <CheckCircle className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No cases in queue.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Case Detail Modal */}
      {selectedCase && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className={`flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 ${
              selectedCase.risk_color === 'Red' ? 'bg-red-50/50' : 'bg-emerald-50/40'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                  selectedCase.risk_color === 'Red' ? 'bg-critical' : 'bg-emerald-500'
                }`}>
                  #{selectedCase.entry_id}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Case #{selectedCase.entry_id}</h2>
                  <p className="text-xs text-gray-400">
                    {new Date(selectedCase.entry_datetime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">

                {/* Patient Info */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Patient Information
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <p className="text-xs text-gray-400">Full Name</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {caseDetail
                          ? `${caseDetail.patient.first_name} ${caseDetail.patient.last_name}`
                          : selectedCase.patient_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Queue Number</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">#{selectedCase.entry_id}</p>
                    </div>
                    {caseDetail && (
                      <>
                        <div>
                          <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date of Birth</p>
                          <p className="text-sm font-medium text-gray-800 mt-0.5">{caseDetail.patient.date_of_birth}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Gender</p>
                          <p className="text-sm font-medium text-gray-800 mt-0.5">
                            {caseDetail.patient.gender === 'M' ? 'Male' : caseDetail.patient.gender === 'F' ? 'Female' : 'Other'}
                          </p>
                        </div>
                        {caseDetail.patient.contact_info && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> Contact</p>
                            <p className="text-sm font-medium text-gray-800 mt-0.5">{caseDetail.patient.contact_info}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Symptoms */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Reported Symptoms</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      caseDetail?.clinical_entry.pain_type ?? selectedCase.pain_type,
                      caseDetail?.clinical_entry.pain_location ?? selectedCase.pain_location,
                      caseDetail?.clinical_entry.numbness ? 'Numbness' : null,
                      caseDetail?.clinical_entry.other_symptoms ?? selectedCase.other_symptoms,
                    ].filter(Boolean).map((s, i) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Risk Factors */}
                {caseDetail && (
                  caseDetail.clinical_entry.height_cm != null ||
                  caseDetail.clinical_entry.weight_kg != null ||
                  caseDetail.clinical_entry.hypertension != null ||
                  caseDetail.clinical_entry.heart_disease_hx != null ||
                  caseDetail.clinical_entry.smoking_status != null ||
                  caseDetail.clinical_entry.chest_pain_type != null ||
                  caseDetail.clinical_entry.exercise_angina != null
                ) && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Risk Factors</h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      {caseDetail!.clinical_entry.height_cm != null && (
                        <div>
                          <p className="text-xs text-gray-400">Height</p>
                          <p className="text-sm font-medium text-gray-800 mt-0.5">{caseDetail!.clinical_entry.height_cm} cm</p>
                        </div>
                      )}
                      {caseDetail!.clinical_entry.weight_kg != null && (
                        <div>
                          <p className="text-xs text-gray-400">Weight</p>
                          <p className="text-sm font-medium text-gray-800 mt-0.5">{caseDetail!.clinical_entry.weight_kg} kg</p>
                        </div>
                      )}
                      {caseDetail!.clinical_entry.hypertension != null && (
                        <div>
                          <p className="text-xs text-gray-400">Hypertension</p>
                          <p className={`text-sm font-semibold mt-0.5 ${caseDetail!.clinical_entry.hypertension ? 'text-critical' : 'text-safe'}`}>
                            {caseDetail!.clinical_entry.hypertension ? 'Yes' : 'No'}
                          </p>
                        </div>
                      )}
                      {caseDetail!.clinical_entry.heart_disease_hx != null && (
                        <div>
                          <p className="text-xs text-gray-400">Heart Disease Hx</p>
                          <p className={`text-sm font-semibold mt-0.5 ${caseDetail!.clinical_entry.heart_disease_hx ? 'text-critical' : 'text-safe'}`}>
                            {caseDetail!.clinical_entry.heart_disease_hx ? 'Yes' : 'No'}
                          </p>
                        </div>
                      )}
                      {caseDetail!.clinical_entry.smoking_status && (
                        <div>
                          <p className="text-xs text-gray-400">Smoking Status</p>
                          <p className="text-sm font-medium text-gray-800 mt-0.5">{caseDetail!.clinical_entry.smoking_status}</p>
                        </div>
                      )}
                      {caseDetail!.clinical_entry.exercise_angina != null && (
                        <div>
                          <p className="text-xs text-gray-400">Exercise Angina</p>
                          <p className={`text-sm font-semibold mt-0.5 ${caseDetail!.clinical_entry.exercise_angina ? 'text-critical' : 'text-safe'}`}>
                            {caseDetail!.clinical_entry.exercise_angina ? 'Yes' : 'No'}
                          </p>
                        </div>
                      )}
                      {caseDetail!.clinical_entry.chest_pain_type != null && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-400">Chest Pain Type</p>
                          <p className="text-sm font-medium text-gray-800 mt-0.5">
                            {['', 'Typical Angina', 'Atypical Angina', 'Non-Anginal Pain', 'Asymptomatic'][caseDetail!.clinical_entry.chest_pain_type] ?? `Type ${caseDetail!.clinical_entry.chest_pain_type}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Risk Assessment */}
                <div className={`rounded-xl p-4 text-center border ${
                  selectedCase.risk_color === 'Red'
                    ? 'bg-red-50 border-red-100'
                    : 'bg-emerald-50 border-emerald-100'
                }`}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Risk Assessment
                  </h3>
                  <RiskBadge color={selectedCase.risk_color} />
                  <p className={`text-base font-bold mt-2 ${selectedCase.risk_color === 'Red' ? 'text-critical' : 'text-safe'}`}>
                    {selectedCase.classification}
                  </p>
                  {selectedCase.confidence_score !== undefined && (
                    <p className="text-xs text-gray-400 mt-1">
                      Confidence: {selectedCase.confidence_score.toFixed(1)}%
                    </p>
                  )}
                </div>

                {/* Manual Override */}
                {!showOverride ? (
                  <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <h3 className="text-sm font-semibold text-amber-800">Manual Safety Override</h3>
                    </div>
                    <p className="text-xs text-amber-700 mb-3">
                      Override the AI classification if clinical judgment differs. All overrides are logged to the audit trail.
                    </p>
                    <div className="flex gap-2">
                      {canOverrideToRed && (
                        <button
                          onClick={() => initiateOverride('Red')}
                          className="px-3 py-1.5 bg-critical hover:bg-critical/90 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Escalate to RED
                        </button>
                      )}
                      {canOverrideToGreen && (
                        <button
                          onClick={() => initiateOverride('Green')}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Downgrade to GREEN
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-amber-300 bg-amber-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <h3 className="text-sm font-semibold text-amber-800">
                        Confirm: {overrideTarget === 'Red' ? 'Escalate to RED' : 'Downgrade to GREEN'}
                      </h3>
                    </div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Clinical Justification <span className="text-critical">*</span>
                    </label>
                    <textarea
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 resize-none bg-white"
                      rows={3}
                      placeholder="Enter clinical reason (e.g., patient presentation, additional findings)..."
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                    />
                    {overrideError && (
                      <p className="text-critical text-xs mt-1">{overrideError}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={confirmOverride}
                        disabled={overrideLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-colors ${
                          overrideTarget === 'Red'
                            ? 'bg-critical hover:bg-critical/90'
                            : 'bg-emerald-500 hover:bg-emerald-600'
                        }`}
                      >
                        {overrideLoading ? 'Applying...' : 'Confirm Override'}
                      </button>
                      <button
                        onClick={() => setShowOverride(false)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Notify Patient */}
                <div className="border border-blue-100 bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-blue-800">Inform Patient of Result</h3>
                  </div>
                  <p className="text-xs text-blue-600 mb-3">
                    Record that you have informed the patient of their result. This releases their result in the patient portal and is logged in the audit trail.
                  </p>
                  {notified ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                      <BellOff className="w-4 h-4" />
                      Patient has been notified.
                    </div>
                  ) : (
                    <button
                      onClick={handleNotifyPatient}
                      disabled={notifyLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors"
                    >
                      {notifyLoading ? 'Notifying...' : 'Notify Patient'}
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      selectedCase.validated
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-mint hover:bg-mint/90 text-white'
                    }`}
                    onClick={markSeen}
                    disabled={selectedCase.validated}
                  >
                    {selectedCase.validated ? 'Already Seen' : 'Mark as Seen'}
                  </button>
                  <button
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
