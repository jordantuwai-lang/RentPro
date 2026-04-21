'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useBranch } from '@/context/BranchContext';

const statusColors: Record<string, string> = {
  OPEN: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  CLOSED: '#64748b',
};
const statusLabels: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  CLOSED: 'Closed',
};

function daysOnHire(claim: any) {
  if (!claim?.reservation?.startDate) return 0;
  const start = new Date(claim.reservation.startDate);
  const end = claim.reservation.endDate ? new Date(claim.reservation.endDate) : new Date();
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
}

export default function ClaimsPage() {
  const { getToken, isLoaded } = useAuth();
  const { selectedBranch, isAllBranches } = useBranch();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortByDays, setSortByDays] = useState(false);

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['claims', selectedBranch?.id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const url = isAllBranches || !selectedBranch
        ? '/claims'
        : `/claims?branchId=${selectedBranch.id}`;
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const filtered = claims
    .filter((c: any) => {
      const customer = `${c.reservation?.customer?.firstName} ${c.reservation?.customer?.lastName}`.toLowerCase();
      const matchSearch = !search ||
        customer.includes(search.toLowerCase()) ||
        (c.claimNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.reservation?.fileNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.claimReference || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || c.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a: any, b: any) => sortByDays ? daysOnHire(b) - daysOnHire(a) : 0);

  const counts = {
    OPEN: claims.filter((c: any) => c.status === 'OPEN').length,
    IN_PROGRESS: claims.filter((c: any) => c.status === 'IN_PROGRESS').length,
    CLOSED: claims.filter((c: any) => c.status === 'CLOSED').length,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Claims</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            {selectedBranch?.name || 'All branches'} · {claims.length} total
          </p>
        </div>
      </div>

      {/* Stat pills */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Open', key: 'OPEN', color: '#f59e0b' },
          { label: 'In Progress', key: 'IN_PROGRESS', color: '#3b82f6' },
          { label: 'Closed', key: 'CLOSED', color: '#64748b' },
        ].map(({ label, key, color }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
            style={{
              padding: '10px 18px', borderRadius: '10px', border: `2px solid ${statusFilter === key ? color : '#e2e8f0'}`,
              background: statusFilter === key ? color + '15' : '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{label}</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color }}>{counts[key as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
        <input
          placeholder="Search by customer, file #, claim #..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: '360px', padding: '9px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a' }}
        />
        <button
          onClick={() => setSortByDays(!sortByDays)}
          style={{ padding: '9px 16px', borderRadius: '8px', border: `1px solid ${sortByDays ? '#3b82f6' : '#e2e8f0'}`, background: sortByDays ? '#eff6ff' : '#fff', color: sortByDays ? '#3b82f6' : '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
        >
          {sortByDays ? '↓ Days on hire' : 'Sort by days'}
        </button>
        {(search || statusFilter) && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); }} style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '13px', cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {['Claim #', 'File #', 'Customer', 'Insurer', 'Handler', 'Days', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No claims found.</td></tr>
            ) : filtered.map((c: any) => {
              const days = daysOnHire(c);
              const isOverdue = days > 30 && c.status !== 'CLOSED';
              return (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/dashboard/claims/${c.id}`)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    {c.claimNumber || <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>
                    {c.reservation?.fileNumber || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0f172a' }}>
                    {c.reservation?.customer?.firstName} {c.reservation?.customer?.lastName}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>
                    {c.insurer?.name || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>
                    {c.claimHandlerId ? (c.reservation?.claimHandlerName || '—') : <span style={{ color: '#fca5a5', fontSize: '12px', fontWeight: 500 }}>Unassigned</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: isOverdue ? '#fee2e2' : '#f1f5f9', color: isOverdue ? '#ef4444' : '#64748b' }}>
                      {isOverdue && '⚠ '}{days}d
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: statusColors[c.status] + '20', color: statusColors[c.status], padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
                      {statusLabels[c.status]}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: '#01ae42', fontSize: '13px', fontWeight: 500 }}>View →</span>
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
