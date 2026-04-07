'use client';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

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

  const isValid = form.name && form.code && form.address && form.suburb;

  return (
    <div style={{ maxWidth: '700px' }}>
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
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{b.code} · {b.address}</div>
            </div>
            <span style={{ background: '#01ae42' + '20', color: '#01ae42', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{b.code}</span>
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
