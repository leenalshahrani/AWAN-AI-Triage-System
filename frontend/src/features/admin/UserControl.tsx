import { useState, useEffect } from 'react';
import { Button } from '@components/common/Button';
import { Edit, Trash2, UserPlus, X, Search, Shield } from 'lucide-react';
import { clinicalService } from '@services/clinical.service';
import type { UserRecord } from '@/types/index';

const ROLE_DISPLAY: Record<string, string> = {
  physician: 'Doctor',
  admin: 'Admin',
  staff: 'Staff',
};

const ROLE_BADGE: Record<string, string> = {
  physician: 'bg-blue-50 text-blue-700 border border-blue-100',
  admin:     'bg-violet-50 text-violet-700 border border-violet-100',
  staff:     'bg-amber-50 text-amber-700 border border-amber-100',
};

const ROLE_AVATAR: Record<string, string> = {
  physician: 'from-blue-400 to-blue-600',
  admin:     'from-violet-400 to-violet-600',
  staff:     'from-amber-400 to-amber-600',
};

const getInitials = (name: string) =>
  (name ?? '').split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint/50 bg-gray-50/50 transition-all';

export const UserControl = () => {
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers]         = useState<UserRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail]       = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole]         = useState('physician');
  const [newIsActive, setNewIsActive] = useState(true);
  const [formError, setFormError]     = useState('');

  const loadUsers = async () => {
    try { setUsers(await clinicalService.getUsers()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setNewUsername(''); setNewPassword(''); setNewEmail('');
    setNewFullName(''); setNewRole('physician'); setNewIsActive(true);
    setFormError(''); setShowModal(true);
  };

  const openEdit = (user: UserRecord) => {
    setEditingUser(user);
    setNewEmail(user.email); setNewFullName(user.full_name);
    setNewRole(user.role); setNewIsActive(user.is_active); setNewPassword('');
    setFormError(''); setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    try {
      if (editingUser) {
        const payload: Parameters<typeof clinicalService.updateUser>[1] = {
          email: newEmail, full_name: newFullName, role: newRole, is_active: newIsActive,
        };
        if (newPassword) payload.password = newPassword;
        await clinicalService.updateUser(editingUser.id, payload);
      } else {
        await clinicalService.createUser({ username: newUsername, password: newPassword, email: newEmail, full_name: newFullName, role: newRole });
      }
      setShowModal(false); loadUsers();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save user');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    try { await clinicalService.deleteUser(id); setUsers((p) => p.filter((u) => u.id !== id)); }
    catch { /* ignore */ }
  };

  const handleToggleActive = async (user: UserRecord) => {
    try {
      const updated = await clinicalService.updateUser(user.id, { is_active: !user.is_active });
      setUsers((p) => p.map((u) => (u.id === user.id ? updated : u)));
    } catch { /* ignore */ }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase())
  );

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
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mint/30 transition-all"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-mint hover:bg-mint/90 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[2fr_2fr_120px_80px_80px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
              {['User', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                <span key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
              ))}
            </div>

            <div className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <div key={user.id} className="grid grid-cols-[2fr_2fr_120px_80px_80px] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/60 transition-colors">

                  {/* User */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 bg-gradient-to-br ${ROLE_AVATAR[user.role] ?? 'from-gray-400 to-gray-600'} rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {getInitials(user.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">@{user.username}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>

                  {/* Role */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    <Shield className="w-3 h-3" />
                    {ROLE_DISPLAY[user.role] ?? user.role}
                  </span>

                  {/* Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={user.is_active} onChange={() => handleToggleActive(user)} />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-mint/20 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-mint" />
                  </label>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg text-gray-400 hover:text-mint hover:bg-mint/10 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-critical hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400">{filteredUsers.length} of {users.length} users</p>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{editingUser ? 'Edit User' : 'Create New User'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editingUser ? 'Update account details' : 'Add a new team member'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {!editingUser ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username</label>
                    <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className={inputCls} placeholder="e.g. dr_smith" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    New Password <span className="font-normal text-gray-400">(leave blank to keep current)</span>
                  </label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                <input type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} className={inputCls} placeholder="e.g. Dr. John Smith" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputCls} placeholder="email@hospital.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className={inputCls}>
                  <option value="physician">Doctor</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              {editingUser && (
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Account Active</p>
                    <p className="text-xs text-gray-400">User can log in to the system</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={newIsActive} onChange={(e) => setNewIsActive(e.target.checked)} />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-mint/20 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-mint" />
                  </label>
                </div>
              )}

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
                {editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
