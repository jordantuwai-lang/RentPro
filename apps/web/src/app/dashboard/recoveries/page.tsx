'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';
import api from '@/lib/api';

const SC: Record<string, string> = { OPEN: '#f59e0b', IN_PROGRESS: '#3b82f6', CLOSED: '#64748b' };

export default function RecoveriesPage() {
  const { getToken, isLoaded } = useAuth();
  const { selectedBranch, isAllBranches } = useBranch();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['recoveries', selectedBranch?.id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const url = isAllBranches || !selectedBranch ? '/reservations' : `/reservations?branchId=${selectedBranch.id}`;
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
      // Show active and completed reservations that have a claim
      return res.data.filter((r: any) => r.claim && (r.status === 'ACTIVE' || r.status === 'COMPLETED'));
    },
  });

  const filtered = reservations?.filter((r: any) => {
    if (search) {
      const q = search.toLowerCase();
      if (!(`${r.customer?.firstName} ${r.customer?.lastName}`.toLowerCase().includes(q)) &&
          !r.reservationNumber?.toLowerCase().includes(q) &&
          !r.fileNumber?.toLowerCase().includes(q) &&
          !r.claim?.claimNumber?.toLowerCase().includes(q)) return false;
    }
    if (statusFilter && r.claim?.status !== statusFilter) return false;
    return true;
  });

  const getDays = (startDate: string) => Math.floor((new Date().getTime() - new Date(startDate).getTime()) / 86400000);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Recoveries</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: '16px' }}>Active recovery files — {selectedBranch?.name || 'All branches'}</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', minWidth: '220px', flex: 1 }}
            placeholder="Search by name, REZ#, file#, claim#..." value={search} onChange={e => setSearch(e.target.value)} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${statusFilter ? '#01ae42' : '#e2e8f0'}`, fontSize: '13px', color: statusFilter ? '#0f172a' : '#94a3b8', background: '#fff', cursor: 'pointer' }}>
            <option value="">All claim statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CLOSED">Closed</option>
          </select>
          {(search || statusFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); }}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '13px', cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {['File #', 'Claim #', 'Customer', 'At Fault Insurer', 'Days on Hire', 'Claim Status', 'Hire Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : filtered?.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No recovery files found.</td></tr>
            ) : filtered?.map((r: any) => {
              const days = getDays(r.startDate);
              const claim = r.claim || {};
              return (
                <tr key={r.id}
                  onClick={() => router.push(`/dashboard/recoveries/${r.id}`)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#01ae42' }}>{r.fileNumber || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#3b82f6', fontWeight: 500 }}>{claim.claimNumber || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{r.customer?.firstName} {r.customer?.lastName}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>{claim.insurer?.name || claim.atFaultParty?.theirInsurer || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: days > 30 ? '#fef2f2' : '#f0fdf4', color: days > 30 ? '#ef4444' : '#01ae42', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: `1px solid ${days > 30 ? '#fecaca' : '#bbf7d0'}` }}>
                      {days > 30 && '⚠ '}{days} days
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {claim.status ? (
                      <span style={{ background: SC[claim.status] + '20', color: SC[claim.status], padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                        {claim.status.replace('_', ' ')}
                      </span>
                    ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: r.status === 'ACTIVE' ? '#f0fdf4' : '#f8fafc', color: r.status === 'ACTIVE' ? '#01ae42' : '#64748b', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: `1px solid ${r.status === 'ACTIVE' ? '#bbf7d0' : '#e2e8f0'}` }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}