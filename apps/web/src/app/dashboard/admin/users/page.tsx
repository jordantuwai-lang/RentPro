'use client';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };

const ALL_ROLES: { value: string; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'LEADERSHIP', label: 'Leadership' },
  { value: 'OPS_MANAGER', label: 'Ops Manager' },
  { value: 'BRANCH_MANAGER', label: 'Branch Manager' },
  { value: 'RECOVERY_MANAGER', label: 'Recovery Manager' },
  { value: 'CLAIMS_MANAGER', label: 'Claims Manager' },
  { value: 'SALES_MANAGER', label: 'Sales Manager' },
  { value: 'FLEET_MANAGER', label: 'Fleet Manager' },
  { value: 'FINANCE_MANAGER', label: 'Finance Manager' },
  { value: 'CLAIMS_TEAM_IN', label: 'Claims Team (Inbound)' },
  { value: 'CLAIMS_TEAM_OUT', label: 'Claims Team (Outbound)' },
  { value: 'CLAIMS_TEAM_LIABILITY', label: 'Claims Team (Liability)' },
  { value: 'CSE_DRIVER', label: 'CSE Driver' },
  { value: 'SALES_REP', label: 'Sales Rep' },
  { value: 'RECOVERY_AGENT', label: 'Recovery Agent' },
  { value: 'FLEET_COORDINATOR', label: 'Fleet Coordinator' },
];

const roleColors: Record<string, string> = {
  ADMIN: '#ef4444',
  LEADERSHIP: '#0ea5e9',
  OPS_MANAGER: '#f59e0b',
  BRANCH_MANAGER: '#f97316',
  RECOVERY_MANAGER: '#ec4899',
  CLAIMS_MANAGER: '#8b5cf6',
  SALES_MANAGER: '#06b6d4',
  FLEET_MANAGER: '#84cc16',
  FINANCE_MANAGER: '#14b8a6',
  CLAIMS_TEAM_IN: '#a78bfa',
  CLAIMS_TEAM_OUT: '#c084fc',
  CLAIMS_TEAM_LIABILITY: '#e879f9',
  CSE_DRIVER: '#01ae42',
  SALES_REP: '#6366f1',
  RECOVERY_AGENT: '#f43f5e',
  FLEET_COORDINATOR: '#22c55e',
};

function F({ label: l, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={labelStyle}>{l}</label>{children}</div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '520px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<any>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: '', branchId: '' });
  const updEdit = (f: string, v: string) => setEditForm(p => ({ ...p, [f]: v }));
  const [passwordMode, setPasswordMode] = useState<'invite' | 'password'>('invite');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: '', branchId: '' });
  const [error, setError] = useState('');
  const upd = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const editMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.patch(`/admin/users/${showEditModal.clerkId}`, editForm, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowEditModal(null);
    },
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/branches', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.post('/admin/users', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: passwordMode === 'password' ? form.password : undefined,
        role: form.role,
        branchId: form.branchId || undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowAddModal(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', role: '', branchId: '' });
      setError('');
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Something went wrong. Please check the details and try again.');
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (clerkId: string) => {
      const token = await getToken();
      return api.delete(`/admin/users/${clerkId}`, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowDeleteConfirm(null);
    },
  });

  const isValid = form.firstName && form.lastName && form.email && form.role && (passwordMode === 'invite' || form.password);

  return (
    <div>
      {showAddModal && (
        <Modal title="Add user" onClose={() => { setShowAddModal(false); setError(''); }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={grid2}>
              <F label="First name *"><input style={input} value={form.firstName} onChange={e => upd('firstName', e.target.value)} placeholder="Jordan" /></F>
              <F label="Last name *"><input style={input} value={form.lastName} onChange={e => upd('lastName', e.target.value)} placeholder="Tuwai" /></F>
            </div>
            <F label="Email address *"><input style={input} value={form.email} onChange={e => upd('email', e.target.value)} placeholder="jordan@right2drive.com.au" /></F>
            <F label="Role *">
              <select style={input} value={form.role} onChange={e => upd('role', e.target.value)}>
                <option value="">Select role...</option>
                {ALL_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </F>
            <F label="Branch">
              <select style={input} value={form.branchId} onChange={e => upd('branchId', e.target.value)}>
                <option value="">Select branch...</option>
                {branches?.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </F>
            <div>
              <label style={labelStyle}>Password setup</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button onClick={() => setPasswordMode('invite')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${passwordMode === 'invite' ? '#01ae42' : '#e2e8f0'}`, background: passwordMode === 'invite' ? '#f0fdf4' : '#fff', color: passwordMode === 'invite' ? '#01ae42' : '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                  Send email invite
                </button>
                <button onClick={() => setPasswordMode('password')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${passwordMode === 'password' ? '#01ae42' : '#e2e8f0'}`, background: passwordMode === 'password' ? '#f0fdf4' : '#fff', color: passwordMode === 'password' ? '#01ae42' : '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                  Set password
                </button>
              </div>
              {passwordMode === 'invite' && (
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0, background: '#f8fdf9', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                  An email invite will be sent to the user to set their own password.
                </p>
              )}
              {passwordMode === 'password' && (
                <F label="Password *">
                  <input type="password" style={input} value={form.password} onChange={e => upd('password', e.target.value)} placeholder="Minimum 8 characters" />
                </F>
              )}
            </div>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', color: '#dc2626', fontSize: '13px' }}>
                {error}
              </div>
            )}
            <button
              onClick={() => createUser.mutate()}
              disabled={!isValid || createUser.isPending}
              style={{ padding: '12px', borderRadius: '8px', border: 'none', background: !isValid || createUser.isPending ? '#86efac' : '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: !isValid ? 'not-allowed' : 'pointer' }}
            >
              {createUser.isPending ? 'Creating...' : 'Create user'}
            </button>
          </div>
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal title="Remove user" onClose={() => setShowDeleteConfirm(null)}>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
            Are you sure you want to remove this user? This action cannot be undone and they will lose access immediately.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowDeleteConfirm(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={() => deleteUser.mutate(showDeleteConfirm)}
              disabled={deleteUser.isPending}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
            >
              {deleteUser.isPending ? 'Removing...' : 'Remove user'}
            </button>
          </div>
        </Modal>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>User Management</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage staff accounts and roles</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowAddModal(true)} style={{ background: '#01ae42', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            + Add user
          </button>
          <button onClick={() => {}} style={{ background: '#01ae42', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            + Bulk Add
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {['Name', 'Email', 'Role', 'Branch', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : users?.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No users yet.</td></tr>
            ) : users?.map((u: any) => (
              <tr key={u.clerkId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{u.firstName} {u.lastName}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{u.email}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ background: (roleColors[u.role] || '#94a3b8') + '20', color: roleColors[u.role] || '#94a3b8', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                    {ALL_ROLES.find(r => r.value === u.role)?.label || u.role || 'No role'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{u.branch || '—'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => { setShowEditModal(u); setEditForm({ firstName: u.firstName, lastName: u.lastName, role: u.role || '', branchId: u.branchId || '' }); }}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    {u.clerkId !== user?.id && (
                      <button
                        onClick={() => setShowDeleteConfirm(u.clerkId)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEditModal && (
        <Modal title="Edit User" onClose={() => setShowEditModal(null)}>
          <div style={grid2}>
            <F label="First name"><input style={input} value={editForm.firstName} onChange={e => updEdit('firstName', e.target.value)} /></F>
            <F label="Last name"><input style={input} value={editForm.lastName} onChange={e => updEdit('lastName', e.target.value)} /></F>
          </div>
          <div style={{ marginTop: '16px' }}>
            <F label="Role">
              <select style={input} value={editForm.role} onChange={e => updEdit('role', e.target.value)}>
                <option value="">Select role...</option>
                {ALL_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </F>
          </div>
          {editMutation.isError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginTop: '16px', color: '#dc2626', fontSize: '14px' }}>
              Something went wrong. Please try again.
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowEditModal(null)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={() => editMutation.mutate()}
              disabled={editMutation.isPending}
              style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: editMutation.isPending ? 0.6 : 1 }}
            >
              {editMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}