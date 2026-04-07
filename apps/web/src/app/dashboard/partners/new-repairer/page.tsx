'use client';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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

export default function NewRepairerPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', suburb: '', postcode: '', state: '', territory: '', branchId: '' });
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
      return api.post('/claims/repairers', form, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairers'] });
      router.push('/dashboard/partners');
    },
  });

  const isValid = form.name && form.phone && form.address && form.suburb && form.branchId;

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Add repairer</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Add a new repairer to the RentPro partner directory</p>
      </div>

      <div style={section}>
        <h2 style={heading}>Repairer details</h2>
        <div style={grid2}>
          <F label="Business name *" full><input style={input} value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Smith's Panel & Paint" /></F>
          <F label="Phone *"><input style={input} value={form.phone} onChange={e => upd('phone', e.target.value)} placeholder="03 9000 0000" /></F>
          <F label="Email"><input style={input} value={form.email} onChange={e => upd('email', e.target.value)} placeholder="info@smithspanel.com.au" /></F>
          <F label="Address *" full><input style={input} value={form.address} onChange={e => upd('address', e.target.value)} placeholder="123 Repair Street" /></F>
          <F label="Suburb *"><input style={input} value={form.suburb} onChange={e => upd('suburb', e.target.value)} placeholder="Keilor Park" /></F>
          <F label="Postcode"><input style={input} value={form.postcode} onChange={e => upd('postcode', e.target.value)} placeholder="3042" /></F>
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
          <F label="Territory"><input style={input} value={form.territory} onChange={e => upd('territory', e.target.value)} placeholder="North West Melbourne" /></F>
          <F label="Branch *" full>
            <select style={input} value={form.branchId} onChange={e => upd('branchId', e.target.value)}>
              <option value="">Select branch...</option>
              {branches?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
          </F>
        </div>
      </div>

      {mutation.isError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
          Something went wrong. Please check all required fields.
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={() => router.push('/dashboard/partners')} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={!isValid || mutation.isPending}
          style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: !isValid || mutation.isPending ? '#86efac' : '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: !isValid ? 'not-allowed' : 'pointer' }}
        >
          {mutation.isPending ? 'Adding...' : 'Add repairer'}
        </button>
      </div>
    </div>
  );
}
