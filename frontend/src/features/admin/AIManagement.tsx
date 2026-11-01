import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Search, X, Database, HelpCircle } from 'lucide-react';
import { clinicalService } from '@services/clinical.service';
import type { SymptomRecord } from '@/types/index';

const SEVERITY_BADGE: Record<string, string> = {
  High:   'bg-red-50 text-critical border border-red-100',
  Medium: 'bg-amber-50 text-amber-600 border border-amber-100',
  Low:    'bg-emerald-50 text-safe border border-emerald-100',
};

const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint/50 bg-gray-50/50 transition-all';

export const AIManagement = () => {
  const [activeTab, setActiveTab]       = useState<'symptoms' | 'questions'>('symptoms');
  const [symptoms, setSymptoms]         = useState<SymptomRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editingSymptom, setEditingSymptom] = useState<SymptomRecord | null>(null);
  const [search, setSearch]             = useState('');
  const [form, setForm]                 = useState({ symptom: '', category: '', severity: 'Medium', description: '', status: true });
  const [formError, setFormError]       = useState('');

  const loadSymptoms = async () => {
    try { setSymptoms(await clinicalService.getSymptoms()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadSymptoms(); }, []);

  const openCreate = () => {
    setEditingSymptom(null);
    setForm({ symptom: '', category: '', severity: 'Medium', description: '', status: true });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (s: SymptomRecord) => {
    setEditingSymptom(s);
    setForm({ symptom: s.symptom, category: s.category, severity: s.severity, description: s.description || '', status: s.status });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    try {
      if (editingSymptom) {
        await clinicalService.updateSymptom(editingSymptom.id, form);
      } else {
        await clinicalService.createSymptom(form);
      }
      setShowModal(false);
      loadSymptoms();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this symptom?')) return;
    try {
      await clinicalService.deleteSymptom(id);
      setSymptoms((prev) => prev.filter((s) => s.id !== id));
    } catch { /* ignore */ }
  };

  const handleToggle = async (s: SymptomRecord) => {
    try {
      const updated = await clinicalService.updateSymptom(s.id, { status: !s.status });
      setSymptoms((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
    } catch { /* ignore */ }
  };

  const filtered = symptoms.filter((s) =>
    s.symptom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(['symptoms', 'questions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'symptoms' ? 'Symptoms' : 'Health Questions'}
          </button>
        ))}
      </div>

      {/* Toolbar — only for symptoms tab */}
      {activeTab === 'symptoms' && (
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symptoms..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mint/30 transition-all"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-mint hover:bg-mint/90 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Symptom
        </button>
      </div>
      )}

      {/* Health Questions placeholder */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-xl shadow-card border border-gray-100 flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <HelpCircle className="w-7 h-7 opacity-40" />
          </div>
          <p className="text-sm font-medium text-gray-500">Health Questions</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
            This section will display the intake questionnaire items used during patient assessment. Coming soon.
          </p>
        </div>
      )}

      {/* Symptoms Table */}
      {activeTab === 'symptoms' && (
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[2fr_1.5fr_100px_2fr_80px_72px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
              {['Symptom', 'Category', 'Severity', 'Description', 'Status', 'Actions'].map((h) => (
                <span key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
              ))}
            </div>

            <div className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Database className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No symptoms found.</p>
                </div>
              ) : filtered.map((symptom) => (
                <div key={symptom.id} className="grid grid-cols-[2fr_1.5fr_100px_2fr_80px_72px] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/60 transition-colors">

                  <p className="font-semibold text-gray-900 text-sm truncate">{symptom.symptom}</p>
                  <p className="text-sm text-gray-500 truncate">{symptom.category}</p>

                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${SEVERITY_BADGE[symptom.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                    {symptom.severity}
                  </span>

                  <p className="text-xs text-gray-500 truncate">{symptom.description}</p>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={symptom.status} onChange={() => handleToggle(symptom)} />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-mint/20 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-mint" />
                  </label>

                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(symptom)} className="p-1.5 rounded-lg text-gray-400 hover:text-mint hover:bg-mint/10 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(symptom.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-critical hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400">{filtered.length} of {symptoms.length} symptoms</p>
            </div>
          </>
        )}
      </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{editingSymptom ? 'Edit Symptom' : 'Add Symptom'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editingSymptom ? 'Update symptom details' : 'Add a new symptom to the AI model'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Symptom Name</label>
                <input type="text" value={form.symptom} onChange={(e) => setForm((f) => ({ ...f, symptom: e.target.value }))} className={inputCls} placeholder="e.g. Chest Pain" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                <input type="text" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={inputCls} placeholder="e.g. Cardiovascular" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Severity</label>
                <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} className={inputCls}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Brief description..." />
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-critical text-sm">
                  <X className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-mint hover:bg-mint/90 rounded-xl text-sm font-semibold text-white transition-colors">
                {editingSymptom ? 'Save Changes' : 'Add Symptom'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
