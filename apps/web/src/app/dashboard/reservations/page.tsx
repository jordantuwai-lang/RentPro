'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  DRAFT:     { label: 'Draft',     bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8' },
  PENDING:   { label: 'Pending',   bg: '#fef9c3', color: '#854d0e', dot: '#eab308' },
  ACTIVE:    { label: 'Active',    bg: '#dcfce7', color: '#166534', dot: '#01ae42' },
  COMPLETED: { label: 'Completed', bg: '#ede9fe', color: '#5b21b6', dot: '#7c3aed' },
  CANCELLED: { label: 'Cancelled', bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px',
      background: cfg.bg, color: cfg.color,
      fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function StatPill({ label, value, active }: { label: string; value: number; active?: boolean }) {
  return (
    <div style={{
      background: active ? 'var(--primary)' : '#fff',
      color: active ? '#fff' : '#0f172a',
      border: `1px solid ${active ? 'var(--primary)' : '#e2e8f0'}`,
      borderRadius: '10px', padding: '10px 18px',
      display: 'flex', flexDirection: 'column', gap: '2px',
      minWidth: '90px',
    }}>
      <span style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '11px', fontWeight: 500, color: active ? 'rgba(255,255,255,0.8)' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
  fontSize: '13px', color: '#0f172a', background: '#fff',
  outline: 'none', height: '36px', boxSizing: 'border-box',
};

const thStyle: React.CSSProperties = {
  padding: '11px 14px', textAlign: 'left',
  fontSize: '11px', fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  whiteSpace: 'nowrap', background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
};

export default function ReservationsPage() {
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const selectedBranchId = typeof window !== 'undefined' ? sessionStorage.getItem('selectedBranchId') : null;

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations', selectedBranchId],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const params = selectedBranchId && selectedBranchId !== 'all'
        ? `?branchId=${selectedBranchId}` : '';
      const res = await api.get(`/reservations${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const filtered = (reservations ?? []).filter((r: any) => {
    const name = `${r.customer?.firstName ?? ''} ${r.customer?.lastName ?? ''}`.toLowerCase();
    const rez = (r.reservationNumber ?? '').toLowerCase();
    const partner = (r.partnerName ?? '').toLowerCase();
    const q = search.toLowerCase();

    if (q && !name.includes(q) && !rez.includes(q) && !partner.includes(q)) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (sourceFilter && r.sourceOfBusiness !== sourceFilter) return false;
    if (dateFrom && new Date(r.createdAt) < new Date(dateFrom)) return false;
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      if (new Date(r.createdAt) > to) return false;
    }
    return true;
  });

  const counts = {
    total: reservations?.length ?? 0,
    active: reservations?.filter((r: any) => r.status === 'ACTIVE').length ?? 0,
    pending: reservations?.filter((r: any) => r.status === 'PENDING').length ?? 0,
    draft: reservations?.filter((r: any) => r.status === 'DRAFT').length ?? 0,
    completed: reservations?.filter((r: any) => r.status === 'COMPLETED').length ?? 0,
    cancelled: reservations?.filter((r: any) => r.status === 'CANCELLED').length ?? 0,
  };

  const hasFilters = search || statusFilter || sourceFilter || dateFrom || dateTo;

  const formatDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ padding: '0' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Reservations</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '3px' }}>
            {isLoading ? 'Loading...' : `${filtered.length} of ${counts.total} reservations`}
          </p>
        </div>
        <Link
          href="/dashboard/reservations/new"
          style={{
            background: '#01ae42', color: '#fff',
            padding: '9px 18px', borderRadius: '8px',
            textDecoration: 'none', fontSize: '13px', fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}
        >
          + New reservation
        </Link>
      </div>

      {/* Summary pills */}
      {!isLoading && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <StatPill label="Total" value={counts.total} active={!statusFilter} />
          <StatPill label="Active" value={counts.active} />
          <StatPill label="Pending" value={counts.pending} />
          <StatPill label="Draft" value={counts.draft} />
          <StatPill label="Completed" value={counts.completed} />
          <StatPill label="Cancelled" value={counts.cancelled} />
        </div>
      )}

      {/* Filter bar */}
      <div style={{
        background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
        padding: '14px 16px', marginBottom: '16px',
        display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
          <input
            style={{ ...inputStyle, paddingLeft: '30px', width: '100%' }}
            placeholder="Search by name, REZ# or repairer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select style={{ ...inputStyle, minWidth: '130px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select style={{ ...inputStyle, minWidth: '140px' }} value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
          <option value="">All sources</option>
          <option value="Repairer">Repairer</option>
          <option value="Tow Operator">Tow Operator</option>
          <option value="Marketing">Marketing</option>
          <option value="Corporate Partnerships">Corporate Partnerships</option>
        </select>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input type="date" style={{ ...inputStyle, minWidth: '130px' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>to</span>
          <input type="date" style={{ ...inputStyle, minWidth: '130px' }} value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" />
        </div>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setSourceFilter(''); setDateFrom(''); setDateTo(''); }}
            style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', height: '36px' }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
            <thead>
              <tr>
                {['Date Created', 'Rez #', 'Source of Business', 'Customer', 'Customer Car', 'Branch', 'Status'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: '13px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '4px', width: j === 3 ? '120px' : '70px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    {hasFilters ? 'No reservations match your filters.' : 'No reservations yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((r: any, idx: number) => {
                  const customerName = r.customer
                    ? `${r.customer.firstName} ${r.customer.lastName}`
                    : '—';
                  const branch = r.vehicle?.branch?.name ?? '—';
                  const isEven = idx % 2 === 0;

                  // Source of Business: show type on line 1, partner name on line 2 if present
                  const sourceLabel = r.sourceOfBusiness ?? '—';
                  const partnerName = r.partnerName ?? null;

                  // Customer Car: not yet stored on reservation — placeholder for future
                  const customerCarLine1 = [r.accidentVehicleYear, r.accidentVehicleMake, r.accidentVehicleModel].filter(Boolean).join(" ") || null;
                  const customerCarLine2 = r.accidentVehicleRegistration ?? null;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => router.push(`/dashboard/reservations/${r.id}`)}
                      style={{
                        background: isEven ? '#fff' : '#fafafa',
                        cursor: 'pointer',
                        transition: 'background 0.12s',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                      onMouseLeave={e => (e.currentTarget.style.background = isEven ? '#fff' : '#fafafa')}
                    >
                      {/* Date Created */}
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>
                        {formatDate(r.createdAt)}
                      </td>

                      {/* Rez # */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '13px' }}>
                          {r.reservationNumber ?? '—'}
                        </span>
                      </td>

                      {/* Source of Business */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>{sourceLabel}</div>
                        {partnerName && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{partnerName}</div>
                        )}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{customerName}</div>
                        {r.customer?.phone && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{r.customer.phone}</div>
                        )}
                      </td>

                      {/* Customer Car */}
                      <td style={{ padding: '12px 14px' }}>
                        {customerCarLine1 ? (
                          <>
                            <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>{customerCarLine1}</div>
                            {customerCarLine2 && (
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{customerCarLine2}</div>
                            )}
                          </>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '12px' }}>—</span>
                        )}
                      </td>

                      {/* Branch */}
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>
                        {branch}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filtered.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', background: '#fafafa', fontSize: '12px', color: '#94a3b8' }}>
            Showing {filtered.length} reservation{filtered.length !== 1 ? 's' : ''}
            {hasFilters ? ` (filtered from ${counts.total} total)` : ''}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
