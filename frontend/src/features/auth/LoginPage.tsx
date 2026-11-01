import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAppStore } from '@hooks/useAppStore';
import { Stethoscope, User, Lock, AlertCircle } from 'lucide-react';

interface LoginFormValues {
  username: string;
  password: string;
}

export const LoginPage = () => {
  const navigate     = useNavigate();
  const login        = useAppStore((s) => s.login);
  const [error, setError]           = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    setError('');
    setIsSubmitting(true);
    try {
      await login(data.username, data.password);
      const user = useAppStore.getState().user;
      if (user?.role === 'admin')          navigate('/admin');
      else if (user?.role === 'physician') navigate('/physician');
      else if (user?.role === 'staff')     navigate('/staff');
      else                                 navigate('/patient');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">

      {/* Decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-mint/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-mint/20 rounded-2xl mb-4 border border-mint/30">
            <Stethoscope className="w-8 h-8 text-mint" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AWAN</h1>
          <p className="text-slate-400 text-sm mt-1">AI-Assisted Triage System</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Staff Sign In</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  {...register('username', { required: 'Username is required' })}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.08] border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-mint/40 focus:border-mint/40 transition-all"
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.08] border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-mint/40 focus:border-mint/40 transition-all"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 mt-2 bg-gradient-to-r from-blue to-mint hover:from-[#2563EB] hover:to-mint/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>

          </form>

          {/* Patient portal link */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-slate-500 text-xs">Patient?</p>
            <a href="/patient" className="text-mint hover:text-mint/80 text-sm font-medium transition-colors mt-0.5 inline-block">
              Go to Patient Portal →
            </a>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          AWAN Emergency Triage System · Authorized personnel only
        </p>
      </div>
    </div>
  );
};
