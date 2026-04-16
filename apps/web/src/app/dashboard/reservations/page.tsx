'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import api from '@/lib/api';
import { useBranch } from '@/context/BranchContext';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  DRAFT: '#94a3b8',
  PENDING: '#f59e0b',
  ACTIVE: '#10b981',
  COMPLETED: '#64748b',
  CANCELLED: '#ef4444',
};

const input: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  color: '#0f172a',
  background: '#fff',
  outline: 'none',
};

export default function ReservationsPage() {
  const { getToken, isLoaded } = useAuth();
  const { selectedBranch, isAllBranches } = useBranch();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', selectedBranch?.id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const url = isAllBranches || !selectedBranch ? '/reservations' : `/reservations?branchId=${selectedBranch.id}`;
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const filtered = (data || []).filter((r: any) => {
    const customerName = `${r.customer.firstName} ${r.customer.lastName}`.toLowerCase();
    const rezNum = (r.reservationNumber || '').toLowerCase();
    const matchSearch = !search || customerName.includes(search.toLowerCase()) || rezNum.includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchSource = !sourceFilter || r.sourceOfBusiness === sourceFilter;
    const createdAt = new Date(r.createdAt);
    const matchFrom = !dateFrom || createdAt >= new Date(dateFrom);
    const matchTo = !dateTo || createdAt <= new Date(dateTo + 'T23:59:59');
    return matchSearch && matchStatus && matchSource && matchFrom && matchTo;
  });

  const hasFilters = search || statusFilter || sourceFilter || dateFrom || dateTo;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#0a2e14', margin: 0 }}>Reservations</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/dashboard/reservations/new/credit-hire" style={{
            background: '#01ae42', color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
          }}>
            + Credit Hire
          </Link>
          <Link href="/dashboard/reservations/new/direct-hire" style={{
            background: '#fff', color: '#01ae42',
            padding: '10px 20px',
            borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
            border: '1px solid #01ae42',
          }}>
            + Direct Hire
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{ ...input, minWidth: '200px', flex: 1 }}
          placeholder="Search by name or REZ#..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={input} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select style={input} value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
          <option value="">All sources</option>
          <option value="Repairer">Repairer</option>
          <option value="Tow Operator">Tow Operator</option>
          <option value="Marketing">Marketing</option>
          <option value="Corporate Partnerships">Corporate Partnerships</option>
        </select>
        <input type="date" style={input} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
        <input type="date" style={input} value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" />
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setSourceFilter(''); setDateFrom(''); setDateTo(''); }}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {['Rez #', 'Date Created', 'Customer', 'Customer Vehicle', 'Source', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No reservations found.</td></tr>
            ) : filtered.map((r: any) => (
              <tr
                key={r.id}
                onClick={() => window.location.href = `/dashboard/reservations/${r.id}`}
                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#01ae42' }}>
                  {r.reservationNumber}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                  {new Date(r.createdAt).toLocaleDateString('en-AU')}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0a2e14' }}>
                  {r.customer.firstName} {r.customer.lastName}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0a2e14' }}>
                  {r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : '—'}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                  {r.sourceOfBusiness === 'Repairer' || r.sourceOfBusiness === 'Tow Operator'
                    ? r.partnerName || r.sourceOfBusiness
                    : r.sourceOfBusiness || '—'}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    background: statusColors[r.status] + '20',
                    color: statusColors[r.status],
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Result count */}
      {!isLoading && (
        <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '12px' }}>
          Showing {filtered.length} of {data?.length || 0} reservations
        </p>
      )}
    </div>
  );
}
