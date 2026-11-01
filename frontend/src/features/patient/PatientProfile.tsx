import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clinicalService } from '@services/clinical.service';
import { authService } from '@services/auth.service';
import { Stethoscope, ArrowLeft, Clock, User, FileText, Lock, Eye, EyeOff, LogOut } from 'lucide-react';
import type { PatientUser, CaseRecord } from '@/types/index';

const formatDate = (dt: string) =>
  new Date(dt).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatDOB = (dob?: string) => {
  if (!dob) return '—';
  return new Date(dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const inputCls = 'w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint text-sm';
const errCls = 'border-red-400 focus:ring-red-300';

export const PatientProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine national_id: from nav state, query param, or logged-in token
  const stateNationalId: string | undefined = (location.state as { nationalId?: string })?.nationalId;
  const queryNationalId = new URLSearchParams(location.search).get('id') ?? undefined;
  const tokenData = authService.getPatientFromToken();
  const nationalId = stateNationalId ?? queryNationalId ?? tokenData?.nationalId ?? '';

  const [patient, setPatient] = useState<PatientUser | null>(null);
  const [cases, setCases]     = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Change password state
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [oldPwd, setOldPwd]               = useState('');
  const [newPwd, setNewPwd]               = useState('');
  const [confirmPwd, setConfirmPwd]       = useState('');
  const [showOld, setShowOld]             = useState(false);
  const [showNew, setShowNew]             = useState(false);
  const [pwdError, setPwdError]           = useState('');
  const [pwdSuccess, setPwdSuccess]       = useState('');
  const [changingPwd, setChangingPwd]     = useState(false);

  const isLoggedIn = !!tokenData;

  useEffect(() => {
    if (!nationalId) {
      navigate('/patient', { replace: true });
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [patientData, casesData] = await Promise.all([
          clinicalService.lookupPatientByNationalId(nationalId),
          clinicalService.getPatientCases(nationalId),
        ]);
        if (!patientData) {
          setNotFound(true);
        } else {
          setPatient(patientData);
          setCases(casesData);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [nationalId, navigate]);

  const handleChangePassword = async () => {
    setPwdError('');
    setPwdSuccess('');
    if (!oldPwd || !newPwd || !confirmPwd) { setPwdError('All fields are required.'); return; }
    if (newPwd.length < 6) { setPwdError('New password must be at least 6 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('New password and confirmation do not match.'); return; }
    setChangingPwd(true);
    try {
      await authService.changePatientPassword(oldPwd, newPwd);
      setPwdSuccess('Password changed successfully.');
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      setShowChangePwd(false);
    } catch (err: any) {
      setPwdError(err.message || 'Failed to change password.');
    } finally {
      setChangingPwd(false);
    }
  };

  // ── Loading / Not found ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-mint/5 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading your records...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-mint/5 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Records Found</h2>
          <p className="text-gray-500 mb-6">
            No patient found with National ID <span className="font-mono font-semibold">{nationalId}</span>.
          </p>
          <button
            onClick={() => navigate('/patient')}
            className="w-full py-3 bg-gradient-to-r from-blue to-mint hover:from-[#2563EB] hover:to-mint/90 text-white font-semibold rounded-xl shadow-md transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const latestCase = cases[0];
  const redCount   = cases.filter((c) => c.risk_color === 'Red').length;
  const greenCount = cases.filter((c) => c.risk_color === 'Green').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-mint/5 p-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Top bar */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => navigate('/patient')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <button
                onClick={() => { authService.patientLogout(); navigate('/patient'); }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            )}
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-mint" />
              <span className="text-lg font-bold text-mint">AWAN</span>
            </div>
          </div>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-mint/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-mint" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {patient?.first_name} {patient?.last_name}
              </h1>
              <p className="text-sm text-gray-500">National ID: {nationalId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase font-medium mb-1">Date of Birth</p>
              <p className="text-gray-800 font-medium">{formatDOB(patient?.date_of_birth)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase font-medium mb-1">Gender</p>
              <p className="text-gray-800 font-medium">
                {patient?.gender === 'M' ? 'Male' : patient?.gender === 'F' ? 'Female' : patient?.gender === 'O' ? 'Other' : '—'}
              </p>
            </div>
            {patient?.contact_info && (
              <div className="col-span-2">
                <p className="text-gray-400 text-xs uppercase font-medium mb-1">Phone</p>
                <p className="text-gray-800 font-medium">{patient.contact_info}</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{cases.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total Visits</p>
          </div>
          <div className="bg-critical/5 rounded-xl p-4 text-center border border-critical/20 shadow-sm">
            <p className="text-2xl font-bold text-critical">{redCount}</p>
            <p className="text-xs text-critical/70 mt-1">Red Code</p>
          </div>
          <div className="bg-safe/5 rounded-xl p-4 text-center border border-safe/20 shadow-sm">
            <p className="text-2xl font-bold text-safe">{greenCount}</p>
            <p className="text-xs text-safe/70 mt-1">Green Code</p>
          </div>
        </div>

        {/* Latest Result */}
        {latestCase && (
          <div
            className={`rounded-2xl p-5 text-white shadow-sm ${
              latestCase.risk_color === 'Red' ? 'bg-critical' : 'bg-safe'
            }`}
          >
            <p className="text-xs uppercase font-bold opacity-80 mb-1">Latest Assessment</p>
            <p className="text-2xl font-bold mb-1">{latestCase.risk_color} Code</p>
            <p className="text-base opacity-90">{latestCase.classification || 'No classification'}</p>
            <p className="text-xs opacity-70 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(latestCase.entry_datetime)}
            </p>
          </div>
        )}

        {/* Assessment History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 p-5 border-b border-gray-100">
            <FileText className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Assessment History</h2>
          </div>

          {cases.length === 0 ? (
            <div className="py-10 px-6 text-center space-y-2">
              <p className="text-gray-700 font-medium">No results shared yet.</p>
              <p className="text-gray-400 text-sm">
                Your assessments are being reviewed. Once the doctor releases your result, it will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {cases.map((c) => (
                <div key={c.entry_id} className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${c.risk_color === 'Red' ? 'bg-critical' : 'bg-safe'}`} />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.risk_color === 'Red' ? 'bg-critical/10 text-critical' : 'bg-safe/10 text-safe'}`}>
                        {c.risk_color} Code
                      </span>
                      <span className="text-xs text-gray-400">#{c.entry_id}</span>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(c.entry_datetime)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    {c.classification || 'Pending classification'}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {[c.pain_type, c.pain_location, c.other_symptoms].filter(Boolean).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{s}</span>
                    ))}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    {c.severity && <span>Severity: <span className="font-medium text-gray-600">{c.severity}</span></span>}
                    {c.duration && <span>Duration: <span className="font-medium text-gray-600">{c.duration}</span></span>}
                    {c.confidence_score !== undefined && (
                      <span>Confidence: <span className="font-medium text-gray-600">{(c.confidence_score * 100).toFixed(0)}%</span></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Assessment */}
        <button
          onClick={() => navigate('/patient/assessment')}
          className="w-full py-4 bg-gradient-to-r from-blue to-mint hover:from-[#2563EB] hover:to-mint/90 text-white font-semibold rounded-xl shadow-md transition-all text-lg"
        >
          Start New Assessment
        </button>

        {/* Change Password (only if logged in) */}
        {isLoggedIn && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => { setShowChangePwd(!showChangePwd); setPwdError(''); setPwdSuccess(''); }}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-500" />
                <span className="font-semibold text-gray-900">Change Password</span>
              </div>
              <span className="text-xs text-gray-400">{showChangePwd ? '▲ Collapse' : '▼ Expand'}</span>
            </button>

            {showChangePwd && (
              <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">

                {/* Current password */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showOld ? 'text' : 'password'}
                      value={oldPwd}
                      onChange={(e) => setOldPwd(e.target.value)}
                      className={`${inputCls} pl-10`}
                      dir="ltr"
                    />
                    <button type="button" onClick={() => setShowOld(!showOld)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">New Password (min. 6 characters)</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      className={`${inputCls} pl-10`}
                      dir="ltr"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className={`${inputCls} ${confirmPwd && confirmPwd !== newPwd ? errCls : ''}`}
                    dir="ltr"
                  />
                  {confirmPwd && confirmPwd !== newPwd && (
                    <p className="text-red-500 text-xs mt-1">Passwords do not match.</p>
                  )}
                </div>

                {pwdError   && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{pwdError}</p>}
                {pwdSuccess && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-xl">{pwdSuccess}</p>}

                <button
                  onClick={handleChangePassword}
                  disabled={changingPwd}
                  className="w-full py-3 bg-gradient-to-r from-blue to-mint hover:from-[#2563EB] hover:to-mint/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md transition-all"
                >
                  {changingPwd ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-6">AWAN System v1.0</p>
      </div>
    </div>
  );
};
