import { useState } from 'react';
import { Save, CheckCircle, Cpu, SlidersHorizontal } from 'lucide-react';
import { useAppStore } from '@hooks/useAppStore';
import { apiService } from '@services/api.service';

const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint/50 bg-gray-50/50 transition-all';

export const AIConfiguration = () => {
  const user = useAppStore((s) => s.user);

  const [modelVersion, setModelVersion]           = useState('2.1.0');
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [autoRetrain, setAutoRetrain]             = useState(true);
  const [criticalThreshold, setCriticalThreshold] = useState(90);
  const [safeThreshold, setSafeThreshold]         = useState(70);
  const [saving, setSaving]                       = useState(false);
  const [saved, setSaved]                         = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.post('/v1/audit/', {
        action: `AI Configuration Updated — model: ${modelVersion}, confidence: ${confidenceThreshold}%, critical: ${criticalThreshold}, safe: ${safeThreshold}`,
        user: user?.username ?? 'admin',
        status: 'Warning',
      });
    } catch { /* still show saved — config is client-side */ }
    finally {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="space-y-5">

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm disabled:opacity-60 ${
            saved ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-mint hover:bg-mint/90'
          }`}
        >
          {saved ? (
            <><CheckCircle className="w-4 h-4" /> Saved!</>
          ) : saving ? (
            <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>

      {/* Model Settings */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
            <Cpu className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Model Settings</h3>
            <p className="text-xs text-gray-400">Core AI model configuration</p>
          </div>
        </div>
        <div className="px-5 py-5 space-y-5">

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Model Version</label>
            <input
              type="text"
              value={modelVersion}
              onChange={(e) => setModelVersion(e.target.value)}
              className={inputCls}
              placeholder="e.g. 2.1.0"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">Confidence Threshold</label>
              <span className="text-sm font-bold text-mint">{confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-mint"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-700">Auto-Retraining</p>
              <p className="text-xs text-gray-400 mt-0.5">Automatically retrain model with new data</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={autoRetrain} onChange={(e) => setAutoRetrain(e.target.checked)} />
              <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-mint/20 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-mint" />
            </label>
          </div>

        </div>
      </div>

      {/* Classification Thresholds */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Classification Thresholds</h3>
            <p className="text-xs text-gray-400">Risk level decision boundaries</p>
          </div>
        </div>
        <div className="px-5 py-5 space-y-5">

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-600">Critical Alert Threshold</label>
              <span className="text-sm font-bold text-critical">{criticalThreshold}</span>
            </div>
            <input
              type="number"
              value={criticalThreshold}
              onChange={(e) => setCriticalThreshold(Number(e.target.value))}
              min="0" max="100"
              className={inputCls}
            />
            <p className="text-xs text-gray-400 mt-1">Scores above this value trigger a RED code alert</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-600">Safe Classification Threshold</label>
              <span className="text-sm font-bold text-safe">{safeThreshold}</span>
            </div>
            <input
              type="number"
              value={safeThreshold}
              onChange={(e) => setSafeThreshold(Number(e.target.value))}
              min="0" max="100"
              className={inputCls}
            />
            <p className="text-xs text-gray-400 mt-1">Scores below this value are classified as GREEN code</p>
          </div>

          {/* Visual threshold bar */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-500 mb-2">Threshold Distribution</p>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full rounded-l-full" style={{ width: `${safeThreshold}%` }} />
              <div className="bg-amber-400 h-full" style={{ width: `${Math.max(0, criticalThreshold - safeThreshold)}%` }} />
              <div className="bg-critical h-full rounded-r-full flex-1" />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
              <span className="text-safe font-medium">Safe ≤ {safeThreshold}</span>
              <span className="text-amber-500 font-medium">Warning</span>
              <span className="text-critical font-medium">Critical ≥ {criticalThreshold}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
