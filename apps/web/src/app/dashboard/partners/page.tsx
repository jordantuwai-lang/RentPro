'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';
import { useState } from 'react';

export default function PartnersPage() {
  const { getToken, isLoaded } = useAuth();
  const [tab, setTab] = useState<'repairers' | 'insurers'>('repairers');

  const { data: repairers, isLoading: loadingRepairers } = useQuery({
    queryKey: ['repairers'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/repairers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: insurers, isLoading: loadingInsurers } = useQuery({
    queryKey: ['insurers'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/insurers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Partners</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Repairers and insurer directory</p>
        </div>
        <button style={{
          background: '#3b82f6',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
        }}>
          + Add partner
        </button>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', borderRadius: '8px', padding: '4px', width: 'fit-content' }}>
        {(['repairers', 'insurers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            background: tab === t ? '#fff' : 'transparent',
            color: tab === t ? '#0f172a' : '#64748b',
            boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'repairers' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                {['Name', 'Phone', 'Email', 'Suburb', 'Territory'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingRepairers ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
              ) : repairers?.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No repairers yet.</td></tr>
              ) : repairers?.map((r: any) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>{r.name}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{r.phone}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{r.email || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{r.suburb}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{r.territory || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'insurers' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                {['Name', 'Code', 'Phone', 'Email'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingInsurers ? (
                <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
              ) : insurers?.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No insurers yet.</td></tr>
              ) : insurers?.map((i: any) => (
                <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>{i.name}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{i.code}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{i.phone || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{i.email || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
