import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ArrowLeft, Info } from 'lucide-react';
import type { RiskAssessmentResult } from '@/types/index';

export const PatientReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const result: RiskAssessmentResult | undefined = location.state?.result;

  useEffect(() => {
    if (!result) navigate('/patient');
  }, [result, navigate]);

  if (!result) return null;

  const { patient, clinical_entry } = result;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-mint/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">

        {/* Thank you card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Queue number */}
          <div className="bg-gradient-to-br from-mint/10 to-blue-50 p-8 text-center border-b border-gray-100">
            <div className="w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-mint" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Assessment Submitted</h1>
            <p className="text-gray-500 text-sm">Thank you, {patient.first_name || 'Patient'}</p>
          </div>

          <div className="p-6 space-y-5">

            {/* Fallback notice */}
            {result.used_fallback && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  The AI analysis service is currently unavailable. Your assessment was processed using the local triage system and will be reviewed by a doctor.
                </p>
              </div>
            )}

            {/* Queue number display */}
            <div className="bg-gray-50 rounded-xl p-5 text-center">
              <p className="text-xs text-gray-400 uppercase font-medium mb-1">Your Queue Number</p>
              <p className="text-6xl font-bold text-mint">{clinical_entry.entry_id}</p>
              <p className="text-xs text-gray-400 mt-2">Please keep this number for reference</p>
            </div>

            {/* Message */}
            <div className="bg-mint/5 border border-mint/20 rounded-xl p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-mint font-semibold">
                <Clock className="w-4 h-4" />
                <span>Please wait</span>
              </div>
              <p className="text-sm text-gray-600">
                Your assessment has been received. A doctor will review your case and inform you of the results shortly.
              </p>
            </div>

            {/* Patient confirmation */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-8 h-8 bg-mint/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-mint text-xs font-bold">ID</span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Patient ID</p>
                <p className="text-sm font-semibold text-gray-800 font-mono">
                  {patient.national_id || `#${patient.id}`}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/patient')}
              className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-gray-800 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
