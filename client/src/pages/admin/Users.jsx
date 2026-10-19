import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../../utils/adminApi';

const API = '';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Editor Form state
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', email: '', role: 'editor', password: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminApi.get(`${API}/users`);
      setUsers(res.data.data);
    } catch (err) {
      setError(err.response?.status === 403 ? 'Access Denied: Only Superadmins can manage users.' : 'Failed to load users.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleEdit = (user) => {
    setForm({ id: user._id, name: user.name, email: user.email, role: user.role, password: '' });
    setIsEditing(true);
    setFormError('');
  };

  const handleCreate = () => {
    setForm({ id: null, name: '', email: '', role: 'editor', password: '' });
    setIsEditing(true);
    setFormError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.role || (!form.id && (!form.email || !form.password))) {
      return setFormError('Please fill all required fields.');
    }
    
    setSaving(true); setFormError('');
    try {
      const payload = { name: form.name, role: form.role };
      if (form.password) payload.password = form.password;

      if (form.id) {
        await adminApi.patch(`${API}/users/${form.id}`, payload);
      } else {
        payload.email = form.email;
        await adminApi.post(`${API}/users`, payload);
      }
      setIsEditing(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save user.');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'reactivate'} ${user.name}?`)) return;
    try {
      if (user.isActive) {
        await adminApi.delete(`${API}/users/${user._id}`);
      } else {
        await adminApi.patch(`${API}/users/${user._id}`, { isActive: true });
      }
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  if (error && error.includes('Access Denied')) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <span className="material-symbols-outlined text-[48px] text-red-500 mb-4">gpp_bad</span>
        <h2 className="text-xl font-bold font-display text-graphite mb-2">Superadmin Access Required</h2>
        <p className="text-soft-grey text-sm max-w-md">You do not have the required permissions to view or modify user accounts. Please contact a superadmin if you need access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-24">
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">User Management</h1>
          <p className="text-sm text-soft-grey mt-1">Manage admin and editor accounts.</p>
        </div>
        {!isEditing && (
          <button onClick={handleCreate} className="text-xs font-bold uppercase tracking-wider bg-brand-blue text-white px-4 py-2 rounded-sm hover:bg-brand-blue-hover transition-colors font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">person_add</span> Add User
          </button>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-sm border border-red-200">{error}</div>}

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white border border-border-neutral rounded-sm max-w-xl">
          <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">{form.id ? 'Edit User' : 'New User'}</h2>
          </div>
          <div className="p-5 space-y-4">
            {formError && <div className="text-xs text-red-600 p-2 bg-red-50 border border-red-100 rounded-sm">{formError}</div>}
            
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Name *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-sm outline-none focus:border-brand-blue" />
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Email {form.id ? '(Immutable)' : '*'}</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={!!form.id} className="w-full px-3 py-2 text-sm border rounded-sm outline-none focus:border-brand-blue disabled:bg-surface-muted disabled:text-soft-grey" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Role *</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-sm outline-none focus:border-brand-blue bg-white">
                <option value="editor">Editor (Limited Access)</option>
                <option value="admin">Admin (Full Write Access)</option>
                {form.role === 'superadmin' && <option value="superadmin">Superadmin (God Mode)</option>}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Password {form.id ? '(Leave blank to keep current)' : '*'}</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-sm outline-none focus:border-brand-blue" placeholder="Min 8 characters" />
            </div>

            <div className="flex gap-2 pt-4">
              <button type="submit" disabled={saving} className="px-5 py-2 bg-brand-blue text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-brand-blue-hover disabled:opacity-50">
                {saving ? 'Saving...' : 'Save User'}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 border border-border-neutral text-soft-grey text-xs font-bold uppercase tracking-wider rounded-sm hover:text-graphite hover:border-graphite transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-white border border-border-neutral rounded-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-soft-grey gap-2 text-sm"><span className="material-symbols-outlined animate-spin">progress_activity</span>Loading...</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="border-b border-border-neutral bg-surface-warm">
                <tr>
                  {['Name / Email', 'Role', 'Status', 'Actions'].map(h => <th key={h} className={`py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display ${h==='Actions' ? 'text-right' : ''}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-neutral">
                {users.map(u => (
                  <tr key={u._id} className={`hover:bg-surface-warm transition-colors ${!u.isActive ? 'opacity-60' : ''}`}>
                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-graphite block">{u.name}</span>
                      <span className="text-xs text-soft-grey">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-5 text-xs font-bold uppercase text-soft-grey">{u.role}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border ${u.isActive ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <button onClick={() => handleEdit(u)} className="text-brand-blue hover:text-brand-blue-hover font-display text-xs font-bold uppercase tracking-wider">Edit</button>
                        <button onClick={() => handleDeactivate(u)} className={`${u.isActive ? 'text-red-500 hover:text-red-600' : 'text-brand-green hover:text-brand-green'} font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1`}>
                          <span className="material-symbols-outlined text-[14px]">{u.isActive ? 'person_remove' : 'person_add'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
