'use client';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import AddressAutocomplete from '@/components/AddressAutocomplete';

const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' };
const section: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px' };
const heading: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.1em' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const full: React.CSSProperties = { gridColumn: '1 / -1' };

function F({ label: l, children, full: f }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div style={f ? full : {}}><label style={labelStyle}>{l}</label>{children}</div>;
}

export default function BranchesPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', code: '', address: '', suburb: '', postcode: '', state: '' });
  const [success, setSuccess] = useState(false);
  const upd = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));
  const [editBranch, setEditBranch] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', code: '', address: '', suburb: '', postcode: '', state: '' });
  const updEdit = (f: string, v: string) => setEditForm(p => ({ ...p, [f]: v }));
  const [editSuccess, setEditSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/branches', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.post('/branches', form, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setForm({ name: '', code: '', address: '', suburb: '', postcode: '', state: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.patch(`/branches/${editBranch.id}`, editForm, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setEditBranch(null);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return api.delete(`/branches/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setConfirmDelete(null);
    },
  });

  const isValid = form.name && form.code && form.address && form.suburb;
  const isEditValid = editForm.name && editForm.code && editForm.address && editForm.suburb;

  return (
    <div style={{ maxWidth: '700px' }}>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '0 0 12px' }}>Remove Branch</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 8px' }}>Are you sure you want to remove <strong style={{ color: '#0f172a' }}>{confirmDelete.name}</strong>?</p>
            <p style={{ fontSize: '13px', color: '#ef4444', margin: '0 0 24px' }}>This action cannot be undone.</p>
            {deleteMutation.isError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
                Could not remove branch. It may have active staff or vehicles assigned.
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete.id)}
                disabled={deleteMutation.isPending}
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: deleteMutation.isPending ? 0.6 : 1 }}
              >
                {deleteMutation.isPending ? 'Removing...' : 'Remove Branch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editBranch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Edit Branch</h2>
              <button onClick={() => setEditBranch(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div style={grid2}>
              <F label="Branch name *" full><input style={input} value={editForm.name} onChange={e => updEdit('name', e.target.value)} /></F>
              <F label="Branch code *"><input style={input} value={editForm.code} onChange={e => updEdit('code', e.target.value.toUpperCase())} /></F>
              <F label="State">
                <select style={input} value={editForm.state} onChange={e => updEdit('state', e.target.value)}>
                  <option value="">Select state...</option>
                  <option value="NSW">NSW</option>
                  <option value="NT">NT</option>
                  <option value="QLD">QLD</option>
                  <option value="SA">SA</option>
                  <option value="TAS">TAS</option>
                  <option value="VIC">VIC</option>
                  <option value="WA">WA</option>
                </select>
              </F>
              <F label="Address *" full>
                <AddressAutocomplete
                  value={editForm.address}
                  onChange={v => updEdit('address', v)}
                  onSelect={result => {
                    updEdit('address', result.address);
                    updEdit('suburb', result.suburb);
                    updEdit('postcode', result.postcode);
                  }}
                  style={input}
                  placeholder="Start typing address..."
                />
              </F>
              <F label="Suburb *"><input style={input} value={editForm.suburb} onChange={e => updEdit('suburb', e.target.value)} /></F>
              <F label="Postcode"><input style={input} value={editForm.postcode} onChange={e => updEdit('postcode', e.target.value)} /></F>
            </div>
            {editMutation.isError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginTop: '16px', color: '#dc2626', fontSize: '14px' }}>
                Something went wrong. Please try again.
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditBranch(null)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={() => editMutation.mutate()}
                disabled={!isEditValid || editMutation.isPending}
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: !isEditValid || editMutation.isPending ? '#86efac' : '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: !isEditValid ? 'not-allowed' : 'pointer' }}
              >
                {editMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Branches</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage Right2Drive branch locations</p>
      </div>

      <div style={section}>
        <h2 style={heading}>Current branches</h2>
        {branches?.map((b: any) => (
          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{b.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{b.code} · {b.address}{b.suburb ? `, ${b.suburb}` : ''}{b.state ? ` ${b.state}` : ''}{b.postcode ? ` ${b.postcode}` : ''}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: '#01ae42' + '20', color: '#01ae42', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{b.code}</span>
              <button
                onClick={() => { setEditBranch(b); setEditForm({ name: b.name, code: b.code, address: b.address || '', suburb: b.suburb || '', postcode: b.postcode || '', state: b.state || '' }); }}
                style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmDelete(b)}
                style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={section}>
        <h2 style={heading}>Add new branch</h2>
        <div style={grid2}>
          <F label="Branch name *" full><input style={input} value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Keilor Park" /></F>
          <F label="Branch code *"><input style={input} value={form.code} onChange={e => upd('code', e.target.value.toUpperCase())} placeholder="KPK" /></F>
          <F label="State">
            <select style={input} value={form.state} onChange={e => upd('state', e.target.value)}>
              <option value="">Select state...</option>
              <option value="NSW">NSW</option>
              <option value="NT">NT</option>
              <option value="QLD">QLD</option>
              <option value="SA">SA</option>
              <option value="TAS">TAS</option>
              <option value="VIC">VIC</option>
              <option value="WA">WA</option>
            </select>
          </F>
          <F label="Address *" full><input style={input} value={form.address} onChange={e => upd('address', e.target.value)} placeholder="2 Trantara Court" /></F>
          <F label="Suburb *"><input style={input} value={form.suburb} onChange={e => upd('suburb', e.target.value)} placeholder="Keilor Park" /></F>
          <F label="Postcode"><input style={input} value={form.postcode} onChange={e => upd('postcode', e.target.value)} placeholder="3042" /></F>
        </div>

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginTop: '16px', color: '#065f46', fontSize: '14px' }}>
            Branch added successfully!
          </div>
        )}

        {mutation.isError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginTop: '16px', color: '#dc2626', fontSize: '14px' }}>
            Something went wrong. The branch code may already exist.
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: !isValid || mutation.isPending ? '#86efac' : '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: !isValid ? 'not-allowed' : 'pointer' }}
          >
            {mutation.isPending ? 'Adding...' : 'Add branch'}
          </button>
        </div>
      </div>
    </div>
  );
}
