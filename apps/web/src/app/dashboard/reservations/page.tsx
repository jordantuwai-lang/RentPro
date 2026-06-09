'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVE:    { bg: '#f0fdf4', color: '#16a34a' },
  CANCELLED: { bg: '#fef2f2', color: '#ef4444' },
  PENDING:   { bg: '#fffbeb', color: '#d97706' },
  DRAFT:     { bg: '#f8fafc', color: '#64748b' },
  COMPLETED: { bg: '#eff6ff', color: '#3b82f6' },
};

const ALL_COLUMNS = [
  { key: 'reservationNumber', label: 'Reservation #',  required: true },
  { key: 'customer',          label: 'Customer',        required: false },
  { key: 'fileNumber',        label: 'File Number',     required: false },
  { key: 'hireType',          label: 'Hire Type',       required: false },
  { key: 'vehicle',           label: 'Customer Vehicle', required: false },
  { key: 'source',            label: 'Source',          required: false },
  { key: 'partnerName',       label: 'Partner',         required: false },
  { key: 'status',            label: 'Status',          required: false },
  { key: 'startDate',         label: 'Start Date',      required: false },
] as const;

type ColumnKey = typeof ALL_COLUMNS[number]['key'];

const DEFAULT_VISIBLE: ColumnKey[] = ['reservationNumber', 'customer', 'vehicle', 'source', 'status', 'startDate'];
const STORAGE_KEY = 'reservations_columns_v1';

function loadColumns(): ColumnKey[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: ColumnKey[] = JSON.parse(stored);
      // Ensure 'reservationNumber' is always present
      if (!parsed.includes('reservationNumber')) parsed.unshift('reservationNumber');
      return parsed;
    }
  } catch {}
  return DEFAULT_VISIBLE;
}

function saveColumns(cols: ColumnKey[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cols)); } catch {}
}

function ColumnPicker({ visible, onChange }: { visible: ColumnKey[]; onChange: (cols: ColumnKey[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (key: ColumnKey) => {
    const col = ALL_COLUMNS.find(c => c.key === key)!;
    if (col.required) return;
    const next = visible.includes(key) ? visible.filter(k => k !== key) : [...visible, key];
    // Preserve ALL_COLUMNS order
    const ordered = ALL_COLUMNS.map(c => c.key).filter(k => next.includes(k));
    onChange(ordered);
    saveColumns(ordered);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '9px 16px', borderRadius: '8px',
          border: `1px solid ${open ? '#01ae42' : '#e2e8f0'}`,
          background: open ? '#f0fdf4' : '#fff',
          color: open ? '#01ae42' : '#64748b',
          fontSize: '13px', fontWeight: 500, cursor: 'pointer',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="1" y="3" width="14" height="2" rx="1" /><rect x="1" y="7" width="14" height="2" rx="1" /><rect x="1" y="11" width="14" height="2" rx="1" />
          <circle cx="5" cy="4" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="11" cy="8" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="7" cy="12" r="1.8" fill="currentColor" stroke="none" />
        </svg>
        Columns
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
          background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)', minWidth: '200px', padding: '8px 0',
        }}>
          <div style={{ padding: '6px 14px 8px', fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Show / hide columns
          </div>
          {ALL_COLUMNS.map(col => {
            const checked = visible.includes(col.key);
            return (
              <div
                key={col.key}
                onClick={() => toggle(col.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '7px 14px', cursor: col.required ? 'default' : 'pointer',
                  opacity: col.required ? 0.5 : 1,
                }}
              >
                <div style={{
                  width: '15px', height: '15px', borderRadius: '4px', flexShrink: 0,
                  border: `1.5px solid ${checked ? '#01ae42' : '#cbd5e1'}`,
                  background: checked ? '#01ae42' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked && <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ fontSize: '13px', color: '#0f172a' }}>{col.label}</span>
                {col.required && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#94a3b8' }}>always</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CellValue({ col, res }: { col: ColumnKey; res: any }) {
  switch (col) {
    case 'reservationNumber':
      return <span style={{ fontSize: '12px', fontWeight: 700, color: '#01ae42' }}>{res.reservationNumber || '—'}</span>;
    case 'customer':
      return <span style={{ fontSize: '13px', color: '#0f172a' }}>{res.customer?.firstName} {res.customer?.lastName}</span>;
    case 'fileNumber':
      return <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{res.fileNumber || '—'}</span>;
    case 'hireType':
      return <span style={{ fontSize: '12px', color: '#64748b' }}>{res.hireType || '—'}</span>;
    case 'vehicle':
      return <span style={{ fontSize: '12px', color: '#64748b' }}>{res.nafVehicle?.registration || '—'}</span>;
    case 'source':
      return <span style={{ fontSize: '12px', color: '#64748b' }}>{res.sourceOfBusiness || '—'}</span>;
    case 'partnerName':
      return <span style={{ fontSize: '12px', color: '#64748b' }}>{res.partnerName || '—'}</span>;
    case 'status': {
      const s = STATUS_COLORS[res.status] || { bg: '#f8fafc', color: '#64748b' };
      return (
        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: s.bg, color: s.color }}>
          {res.status}
        </span>
      );
    }
    case 'startDate':
      return <span style={{ fontSize: '12px', color: '#64748b' }}>{res.startDate ? new Date(res.startDate).toLocaleDateString('en-AU') : '—'}</span>;
    default:
      return null;
  }
}

export default function ReservationsPage() {
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACTIVE' | 'CANCELLED'>('PENDING');
  const [visibleCols, setVisibleCols] = useState<ColumnKey[]>(DEFAULT_VISIBLE);

  // Load persisted column prefs after mount (avoids SSR mismatch)
  useEffect(() => { setVisibleCols(loadColumns()); }, []);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/reservations', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const filteredReservations = reservations?.filter((res: any) => {
    const s = search.toLowerCase();
    const matchesSearch = (
      res.fileNumber?.toLowerCase().includes(s) ||
      res.customer?.firstName?.toLowerCase().includes(s) ||
      res.customer?.lastName?.toLowerCase().includes(s) ||
      res.vehicle?.registration?.toLowerCase().includes(s)
    );
    if (!matchesSearch) return false;
    if (activeTab === 'PENDING') return res.status === 'PENDING' || res.status === 'DRAFT';
    return res.status === activeTab;
  }) || [];

  const tabStyle = (tab: typeof activeTab): React.CSSProperties => ({
    padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    border: 'none', background: 'none',
    color: activeTab === tab ? '#01ae42' : '#64748b',
    borderBottom: activeTab === tab ? '2px solid #01ae42' : '2px solid transparent',
    transition: 'all 0.2s',
  });

  const colSpan = visibleCols.length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Reservations</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => router.push('/dashboard/reservations/new/credit-hire')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>+ Credit Hire</button>
          <button onClick={() => router.push('/dashboard/reservations/new/direct-hire')} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #01ae42', background: '#fff', color: '#01ae42', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>+ Direct Hire</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', gap: '8px' }}>
        <button onClick={() => setActiveTab('PENDING')} style={tabStyle('PENDING')}>Pending / Drafts</button>
        <button onClick={() => setActiveTab('ACTIVE')} style={tabStyle('ACTIVE')}>Active Hires</button>
        <button onClick={() => setActiveTab('CANCELLED')} style={tabStyle('CANCELLED')}>Cancelled</button>
      </div>

      {/* Search + Column picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search within this tab..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: '400px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }}
        />
        <ColumnPicker visible={visibleCols} onChange={setVisibleCols} />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {visibleCols.map(key => {
                const col = ALL_COLUMNS.find(c => c.key === key)!;
                return (
                  <th key={key} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={colSpan} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : filteredReservations.length === 0 ? (
              <tr><td colSpan={colSpan} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No {activeTab.toLowerCase()} reservations found.</td></tr>
            ) : (
              filteredReservations.map((res: any) => (
                <tr key={res.id} onClick={() => router.push(`/dashboard/reservations/${res.id}`)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                  {visibleCols.map(key => (
                    <td key={key} style={{ padding: '8px 16px' }}>
                      <CellValue col={key} res={res} />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
