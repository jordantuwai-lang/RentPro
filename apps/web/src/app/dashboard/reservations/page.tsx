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

function daysSince(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

function daysLabel(n: number): string {
  if (n === 0) return 'Today';
  if (n === 1) return '1 day';
  return `${n} days`;
}

function DaysOnHireBadge({ startDate }: { startDate: string }) {
  const days = daysSince(startDate);
  const color = days > 30 ? '#ef4444' : days > 14 ? '#f59e0b' : '#10b981';
  return (
    <span style={{
      background: color + '15',
      color,
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {daysLabel(days)}
    </span>
  );
}

export default function ReservationsPage() {
  const { getToken, isLoaded } = useAuth();
  const { selectedBranch, isAllBranches } = useBranch();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'cancelled'>('all');
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
      const url = isAllBranches || !selectedBranch
        ? '/reservations'
        : `/reservations?branchId=${selectedBranch.id}`;
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  // ── Active tab data ───────────────────────────────────────────────────────────
  const activeReservations = (data || []).filter((r: any) => r.status === 'ACTIVE');

  // ── Cancelled tab data ────────────────────────────────────────────────────────
  const cancelledReservations = (data || []).filter((r: any) => r.status === 'CANCELLED');

  // ── All tab data — only DRAFT and PENDING (Active has its own tab) ─────────────
  const filtered = (data || []).filter((r: any) => {
    if (!['DRAFT', 'PENDING'].includes(r.status)) return false;
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

  // ── Tab styles ────────────────────────────────────────────────────────────────
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    background: active ? '#0a2e14' : 'transparent',
    color: active ? '#fff' : '#64748b',
    transition: 'all 0.15s',
  });

  const rowStyle: React.CSSProperties = {
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0a2e14', margin: 0 }}>Reservations</h1>
        <Link href="/dashboard/reservations/new" style={{
          background: '#01ae42', color: '#fff', padding: '10px 20px',
          borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500,
        }}>
          + New reservation
        </Link>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px', background: '#f1f5f9',
        borderRadius: '10px', padding: '4px', marginBottom: '20px', width: 'fit-content',
      }}>
        <button style={tabStyle(activeTab === 'all')} onClick={() => setActiveTab('all')}>
          All reservations
          {!isLoading && data && (
            <span style={{
              marginLeft: '8px', background: activeTab === 'all' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
              color: activeTab === 'all' ? '#fff' : '#64748b',
              borderRadius: '10px', padding: '1px 7px', fontSize: '12px', fontWeight: 600,
            }}>
              {data.filter((r: any) => ['DRAFT', 'PENDING'].includes(r.status)).length}
            </span>
          )}
        </button>
        <button style={tabStyle(activeTab === 'active')} onClick={() => setActiveTab('active')}>
          Active
          {!isLoading && activeReservations.length > 0 && (
            <span style={{
              marginLeft: '8px', background: activeTab === 'active' ? 'rgba(255,255,255,0.2)' : '#dcfce7',
              color: activeTab === 'active' ? '#fff' : '#16a34a',
              borderRadius: '10px', padding: '1px 7px', fontSize: '12px', fontWeight: 600,
            }}>
              {activeReservations.length}
            </span>
          )}
        </button>
        <button style={tabStyle(activeTab === 'cancelled')} onClick={() => setActiveTab('cancelled')}>
          Cancelled
          {!isLoading && cancelledReservations.length > 0 && (
            <span style={{
              marginLeft: '8px', background: activeTab === 'cancelled' ? 'rgba(255,255,255,0.2)' : '#fee2e2',
              color: activeTab === 'cancelled' ? '#fff' : '#ef4444',
              borderRadius: '10px', padding: '1px 7px', fontSize: '12px', fontWeight: 600,
            }}>
              {cancelledReservations.length}
            </span>
          )}
        </button>
      </div>

      {/* ── ALL TAB ─────────────────────────────────────────────────────────────── */}
      {activeTab === 'all' && (
        <>
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

          {/* All Table */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  {['Rez #', 'Date Created', 'Customer', 'Vehicle', 'Source', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
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
                    style={rowStyle}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: '#01ae42' }}>{r.reservationNumber}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{new Date(r.createdAt).toLocaleDateString('en-AU')}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0a2e14' }}>{r.customer.firstName} {r.customer.lastName}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0a2e14' }}>{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                      {r.sourceOfBusiness === 'Repairer' || r.sourceOfBusiness === 'Tow Operator'
                        ? r.partnerName || r.sourceOfBusiness
                        : r.sourceOfBusiness || '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: statusColors[r.status] + '20',
                        color: statusColors[r.status],
                        padding: '4px 10px', borderRadius: '20px',
                        fontSize: '12px', fontWeight: 500,
                      }}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isLoading && (
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '12px' }}>
              Showing {filtered.length} of {data?.filter((r: any) => ['DRAFT', 'PENDING'].includes(r.status)).length || 0} reservations
            </p>
          )}
        </>
      )}

      {/* ── ACTIVE TAB ──────────────────────────────────────────────────────────── */}
      {activeTab === 'active' && (
        <>
          {isLoading ? (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              Loading...
            </div>
          ) : activeReservations.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔑</div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No active hires right now.</p>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    {['File #', 'Rez #', 'Customer', 'Vehicle', 'Source', 'Start Date', 'End Date', 'Days on Hire'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeReservations.map((r: any) => (
                    <tr
                      key={r.id}
                      onClick={() => window.location.href = `/dashboard/reservations/${r.id}`}
                      style={rowStyle}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: '#01ae42' }}>
                        {r.fileNumber || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                        {r.reservationNumber}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0a2e14' }}>
                        {r.customer.firstName} {r.customer.lastName}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0a2e14' }}>
                        {r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : '—'}
                        {r.vehicle?.registration && (
                          <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            {r.vehicle.registration}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                        {r.sourceOfBusiness === 'Repairer' || r.sourceOfBusiness === 'Tow Operator'
                          ? r.partnerName || r.sourceOfBusiness
                          : r.sourceOfBusiness || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {r.startDate ? new Date(r.startDate).toLocaleDateString('en-AU') : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {r.endDate ? new Date(r.endDate).toLocaleDateString('en-AU') : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {r.startDate ? <DaysOnHireBadge startDate={r.startDate} /> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && activeReservations.length > 0 && (
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '12px' }}>
              {activeReservations.length} active {activeReservations.length === 1 ? 'hire' : 'hires'}
            </p>
          )}
        </>
      )}

      {/* ── CANCELLED TAB ────────────────────────────────────────────────────────── */}
      {activeTab === 'cancelled' && (
        <>
          {isLoading ? (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              Loading...
            </div>
          ) : cancelledReservations.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No cancelled reservations.</p>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    {['Rez #', 'Date Created', 'Customer', 'Vehicle', 'Source', 'Cancelled', 'Reason', 'Notes'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cancelledReservations.map((r: any) => (
                    <tr
                      key={r.id}
                      onClick={() => window.location.href = `/dashboard/reservations/${r.id}`}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>{r.reservationNumber}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#94a3b8' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-AU')}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0a2e14' }}>
                        {r.customer.firstName} {r.customer.lastName}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                        {r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                        {r.sourceOfBusiness === 'Repairer' || r.sourceOfBusiness === 'Tow Operator'
                          ? r.partnerName || r.sourceOfBusiness
                          : r.sourceOfBusiness || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(r.updatedAt).toLocaleDateString('en-AU')}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {r.cancellationReason ? (
                          <span style={{
                            background: '#fee2e2', color: '#ef4444',
                            padding: '3px 8px', borderRadius: '12px',
                            fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap',
                          }}>
                            {r.cancellationReason}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '13px' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', maxWidth: '220px' }}>
                        {r.cancellationComment || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && cancelledReservations.length > 0 && (
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '12px' }}>
              {cancelledReservations.length} cancelled {cancelledReservations.length === 1 ? 'reservation' : 'reservations'}
            </p>
          )}
        </>
      )}

    </div>
  );
}
