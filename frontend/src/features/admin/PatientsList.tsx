import { useState, useEffect } from 'react';
import { Edit, Trash2, UserPlus, X, Search, User } from 'lucide-react';
import { clinicalService } from '@services/clinical.service';
import type { PatientUser } from '@/types/index';

const GENDER_LABEL: Record<string, string> = { M: 'Male', F: 'Female', O: 'Other' };
const GENDER_BADGE: Record<string, string> = {
  M: 'bg-blue-50 text-blue-700 border border-blue-100',
  F: 'bg-pink-50 text-pink-700 border border-pink-100',
  O: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const getInitials = (p: PatientUser) => {
  const f = p.first_name?.[0] ?? '';
  const l = p.last_name?.[0] ?? '';
  return (f + l).toUpperCase() || 'PT';
};

const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint/50 bg-gray-50/50 transition-all';

type FormState = {
  first_name: string; last_name: string; national_id: string;
  date_of_birth: string; gender: string; contact_info: string; password: string;
};

const emptyForm = (): FormState => ({
  first_name: '', last_name: '', national_id: '',
  date_of_birth: '', gender: '', contact_info: '', password: '',
});

export const PatientsList = () => {
  const [patients, setPatients]   = useState<PatientUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<PatientUser | null>(null);
  const [form, setForm]           = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState('');

  const load = async () => {
    try { setPatients(await clinicalService.getPatients()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (p: PatientUser) => {
    setEditing(p);
    setForm({
      first_name:   p.first_name   ?? '',
      last_name:    p.last_name    ?? '',
      national_id:  p.national_id  ?? '',
      date_of_birth: p.date_of_birth ?? '',
      gender:       p.gender       ?? '',
      contact_info: p.contact_info ?? '',
      password:     '',
    });
    setFormError('');
    setShowModal(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    try {
      const payload: Partial<PatientUser & { password: string }> = {
        first_name:    form.first_name   || undefined,
        last_name:     form.last_name    || undefined,
        national_id:   form.national_id  || undefined,
        date_of_birth: form.date_of_birth || undefined,
        gender:        (form.gender as 'M' | 'F' | 'O') || undefined,
        contact_info:  form.contact_info || undefined,
      };
      if (form.password) payload.password = form.password;

      if (editing) {
        await clinicalService.updatePatient(editing.id, payload);
      } else {
        await clinicalService.createPatient(payload);
      }
      setShowModal(false);
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save patient');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this patient? This cannot be undone.')) return;
    try {
      await clinicalService.deletePatient(id);
      setPatients((p) => p.filter((x) => x.id !== id));
    } catch { /* ignore */ }
  };

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      p.national_id?.includes(q) ||
      p.contact_info?.includes(q)
    );
  });

  return (
    <div className="space-y-5">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID or phone..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mint/30 transition-all"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-mint hover:bg-mint/90 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Patient
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[2fr_1.5fr_100px_1.5fr_1fr_72px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
              {['Patient', 'National ID', 'Gender', 'Contact', 'Date of Birth', 'Actions'].map((h) => (
                <span key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
              ))}
            </div>

            <div className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <User className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No patients found.</p>
                </div>
              ) : filtered.map((p) => (
                <div key={p.id} className="grid grid-cols-[2fr_1.5fr_100px_1.5fr_1fr_72px] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/60 transition-colors">

                  {/* Patient */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-mint/40 to-mint/20 rounded-lg flex items-center justify-center text-mint font-bold text-sm flex-shrink-0">
                      {getInitials(p)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-xs text-gray-400">ID #{p.id}</p>
                    </div>
                  </div>

                  {/* National ID */}
                  <p className="text-sm text-gray-600 font-mono truncate">{p.national_id ?? '—'}</p>

                  {/* Gender */}
                  {p.gender ? (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${GENDER_BADGE[p.gender] ?? 'bg-gray-100 text-gray-600'}`}>
                      {GENDER_LABEL[p.gender] ?? p.gender}
                    </span>
                  ) : <span className="text-xs text-gray-400">—</span>}

                  {/* Contact */}
                  <p className="text-sm text-gray-500 truncate">{p.contact_info ?? '—'}</p>

                  {/* DOB */}
                  <p className="text-sm text-gray-500">{p.date_of_birth ?? '—'}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-mint hover:bg-mint/10 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-critical hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400">{filtered.length} of {patients.length} patients</p>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Patient' : 'Add Patient'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editing ? 'Update patient record' : 'Register a new patient'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">First Name</label>
                  <input type="text" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} className={inputCls} placeholder="First name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Last Name</label>
                  <input type="text" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} className={inputCls} placeholder="Last name" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">National ID</label>
                <input type="text" value={form.national_id} onChange={(e) => setForm((f) => ({ ...f, national_id: e.target.value }))} className={inputCls} placeholder="10-digit ID" maxLength={10} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date of Birth</label>
                  <input type="date" value={form.date_of_birth} onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className={inputCls}>
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone / Contact</label>
                <input type="text" value={form.contact_info} onChange={(e) => setForm((f) => ({ ...f, contact_info: e.target.value }))} className={inputCls} placeholder="05XXXXXXXX" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Password {editing && <span className="font-normal text-gray-400">(leave blank to keep current)</span>}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={inputCls} placeholder="••••••••" />
                {!editing && <p className="text-xs text-gray-400 mt-1">Default password will be the National ID if left blank.</p>}
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
                {editing ? 'Save Changes' : 'Add Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
