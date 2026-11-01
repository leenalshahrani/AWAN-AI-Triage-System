import { useNavigate } from 'react-router-dom';
import { Button } from '@components/common/Button';
import { Stethoscope, ArrowRight } from 'lucide-react';

export const PatientWelcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-mint/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Branding */}
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-mint/10 rounded-full flex items-center justify-center">
              <Stethoscope className="w-10 h-10 text-mint" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-mint mb-3">AWAN</h1>

          <p className="text-gray-600 leading-relaxed">
            Your health assessment starts here. We're here to help you quickly and calmly.
          </p>
        </div>

        {/* Main Button */}
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-blue to-mint hover:from-[#2563EB] hover:to-mint/90 text-white py-4 text-lg rounded-full shadow-lg"
          onClick={() => navigate('/patient/login')}
        >
          <span className="flex items-center justify-center gap-2">
            Login & Start Assessment
            <ArrowRight className="w-5 h-5" />
          </span>
        </Button>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300">
          AWAN System v1.0
        </p>

      </div>
    </div>
  );
};