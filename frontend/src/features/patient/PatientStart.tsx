import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowRight, Loader2 } from 'lucide-react';
import { clinicalService } from '@services/clinical.service';

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint text-sm';
const errCls = 'border-red-400 focus:ring-red-300';

export const PatientStart = () => {
  const navigate = useNavigate();

  const [nationalId, setNationalId] = useState('');
  const [idError, setIdError]       = useState('');
  const [checking, setChecking]     = useState(false);
  const [returning, setReturning]   = useState<null | { firstName: string; lastName: string }>(null);

  const validateId = (id: string) => {
    if (!id) return 'National ID is required.';
    if (!/^\d{10}$/.test(id)) return 'National ID must be exactly 10 digits.';
    return '';
  };

  const handleIdChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setNationalId(digits);
    setIdError('');
    setReturning(null);
  };

  const handleIdBlur = async () => {
    const id = nationalId.trim();
    const err = validateId(id);
    if (err) { setIdError(err); return; }

    setChecking(true);
    try {
      const patient = await clinicalService.lookupPatientByNationalId(id);
      if (patient) {
        setReturning({
          firstName: patient.first_name || '',
          lastName: patient.last_name || '',
        });
      }
    } catch {
      // Silent fail — assessment page will retry lookup
    } finally {
      setChecking(false);
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateId(nationalId.trim());
    if (err) { setIdError(err); return; }
    navigate('/patient/assessment', { state: { nationalId: nationalId.trim() } });
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
          <p className="text-gray-500 mt-2 text-sm">Enter your National ID to begin your assessment</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <form onSubmit={handleContinue} className="space-y-4">

            {/* National ID */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                National ID <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-1">(10 digits)</span>
              </label>
              <div className="relative">
                <input
                  value={nationalId}
                  onChange={(e) => handleIdChange(e.target.value)}
                  onBlur={handleIdBlur}
                  placeholder="e.g. 1100001111"
                  className={`${inputCls} font-mono tracking-widest ${idError ? errCls : ''}`}
                  inputMode="numeric"
                  maxLength={10}
                  autoFocus
                />
                {checking && (
                  <Loader2 className="w-4 h-4 text-mint animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
              {idError && <p className="text-red-500 text-xs mt-1">{idError}</p>}
              {returning && !idError && (
                <p className="text-xs text-mint mt-1 font-medium">
                  Welcome back, {returning.firstName} {returning.lastName} — your information will be filled automatically.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={nationalId.length !== 10 || !!idError}
              className="w-full py-3 bg-gradient-to-r from-blue to-mint hover:from-[#2563EB] hover:to-mint/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer */}
          <div className="pt-2 border-t border-gray-100">
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
