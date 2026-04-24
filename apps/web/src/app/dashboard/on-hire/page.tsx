'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';
import api from '@/lib/api';

export default function OnHirePage() {
  const { getToken, isLoaded } = useAuth();
  const { selectedBranch, isAllBranches } = useBranch();
  const router = useRouter();
  const [filterSource, setFilterSource] = useState('');
  const [filterDays, setFilterDays] = useState('');

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['on-hire', selectedBranch?.id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const url = isAllBranches || !selectedBranch ? '/reservations' : `/reservations?branchId=${selectedBranch.id}`;
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
      return res.data.filter((r: any) => r.status === 'ACTIVE');
    },
  });

  const getDaysOnHire = (startDate: string) => {
    const days = Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Day 1' : `${days + 1} days`;
  };

  const getSourceLabel = (r: any) => {
    if (!r.sourceOfBusiness) return null;
    return (
      <div>
        <div style={{ fontSize: '13px', color: '#64748b' }}>{r.sourceOfBusiness}</div>
        {r.partnerName && <div style={{ fontSize: '12px', color: '#01ae42', marginTop: '2px', fontWeight: 500 }}>{r.partnerName}</div>}
      </div>
    );
  };

  const getAssignedVehicle = (r: any) => {
    if (!r.vehicle) return <span style={{ fontSize: '13px', color: '#cbd5e1' }}>—</span>;
    return (
      <div>
        <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>{r.vehicle.make} {r.vehicle.model}</div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{r.vehicle.registration}</div>
      </div>
    );
  };

  const filteredReservations = reservations?.filter((r: any) => {
    if (filterSource && r.sourceOfBusiness !== filterSource) return false;
    if (filterDays) {
      const days = Math.floor((new Date().getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (filterDays === '1-7' && !(days >= 1 && days <= 7)) return false;
      if (filterDays === '8-14' && !(days >= 8 && days <= 14)) return false;
      if (filterDays === '15-30' && !(days >= 15 && days <= 30)) return false;
      if (filterDays === '30+' && !(days > 30)) return false;
    }
    return true;
  });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>On Hire</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: '16px' }}>Active hire files — {selectedBranch?.name || 'All branches'}</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${filterSource ? '#01ae42' : '#e2e8f0'}`, fontSize: '13px', color: filterSource ? '#0f172a' : '#94a3b8', background: '#fff', cursor: 'pointer' }}>
            <option value="">All sources</option>
            <option value="Repairer">Repairer</option>
            <option value="Tow Operator">Tow Operator</option>
            <option value="Corporate Partnerships">Corporate Partnerships</option>
            <option value="Marketing">Marketing</option>
          </select>
          <select value={filterDays} onChange={e => setFilterDays(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${filterDays ? '#01ae42' : '#e2e8f0'}`, fontSize: '13px', color: filterDays ? '#0f172a' : '#94a3b8', background: '#fff', cursor: 'pointer' }}>
            <option value="">All durations</option>
            <option value="1-7">1–7 days</option>
            <option value="8-14">8–14 days</option>
            <option value="15-30">15–30 days</option>
            <option value="30+">30+ days</option>
          </select>
          {(filterSource || filterDays) && (
            <button onClick={() => { setFilterSource(''); setFilterDays(''); }}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '13px', cursor: 'pointer' }}>
              Clear filters
            </button>
          )}
          {(filterSource || filterDays) && (
            <span style={{ fontSize: '13px', color: '#64748b' }}>{filteredReservations?.length ?? 0} of {reservations?.length ?? 0} files</span>
          )}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {['File #', 'Source', 'Customer', 'Phone', 'Assigned Vehicle', 'Start Date', 'Days on Hire'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : filteredReservations?.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No active hire files.</td></tr>
            ) : filteredReservations?.map((r: any) => (
              <tr key={r.id}
                onClick={() => router.push(`/dashboard/on-hire/${r.id}`)}
                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#01ae42' }}>{r.fileNumber || '—'}</td>
                <td style={{ padding: '14px 16px' }}>{getSourceLabel(r) ?? <span style={{ fontSize: '13px', color: '#cbd5e1' }}>—</span>}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{r.customer?.firstName} {r.customer?.lastName}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>{r.customer?.phone}</td>
                <td style={{ padding: '14px 16px' }}>{getAssignedVehicle(r)}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(r.startDate).toLocaleDateString('en-AU')}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ background: '#f0fdf4', color: '#01ae42', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid #bbf7d0' }}>{getDaysOnHire(r.startDate)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}