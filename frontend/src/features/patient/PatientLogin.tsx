import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Loader2, Eye, EyeOff } from 'lucide-react';
import { authService } from '@services/auth.service';

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint text-sm';
const errCls = 'border-red-400 focus:ring-red-300';

export const PatientLogin = () => {
  const navigate = useNavigate();

  const [nationalId, setNationalId] = useState('');
  const [password, setPassword]     = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [idError, setIdError]       = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const validateId = (id: string) => {
    if (!id) return 'National ID is required.';
    if (!/^\d{10}$/.test(id)) return 'National ID must be exactly 10 digits.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idErr = validateId(nationalId.trim());
    if (idErr) { setIdError(idErr); return; }
    if (!password) { setError('Password is required.'); return; }

    setError('');
    setLoading(true);
    try {
      await authService.patientLogin(nationalId.trim(), password);
      navigate('/patient/profile', { state: { nationalId: nationalId.trim() } });
    } catch (err: any) {
      setError(err.message || 'Invalid national ID or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-mint/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center">
              <Stethoscope className="w-8 h-8 text-mint" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-mint">AWAN</h1>
          <p className="text-gray-500 mt-2 text-sm">Sign in to view your medical records</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* National ID */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                National ID <span className="text-red-500">*</span>
              </label>
              <input
                value={nationalId}
                onChange={(e) => {
                  setNationalId(e.target.value.replace(/\D/g, '').slice(0, 10));
                  setIdError('');
                  setError('');
                }}
                placeholder="Enter your 10-digit National ID"
                className={`${inputCls} font-mono tracking-widest ${idError ? errCls : ''}`}
                inputMode="numeric"
                maxLength={10}
              />
              {idError && <p className="text-red-500 text-xs mt-1">{idError}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                  className={`${inputCls} pr-11 ${error ? errCls : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* General error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || nationalId.length !== 10}
              className="w-full py-3 bg-gradient-to-r from-blue to-mint hover:from-[#2563EB] hover:to-mint/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <p className="text-xs text-gray-400 text-center">
              First time? Your default password is your National ID.
            </p>
            <button
              onClick={() => navigate('/patient')}
              className="w-full py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-xl text-sm transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
