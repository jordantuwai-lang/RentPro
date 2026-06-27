'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

type ColumnKey = 'reservationNumber' | 'firstName' | 'lastName' | 'carMakeModel' | 'vehicle' | 'source' | 'status' | 'startDate';

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'reservationNumber', label: 'Reservation #' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'carMakeModel', label: 'Car Make & Model' },
  { key: 'vehicle', label: 'Vehicle (Rego)' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
  { key: 'startDate', label: 'Start Date' },
];

const DEFAULT_VISIBLE: ColumnKey[] = ['reservationNumber', 'firstName', 'lastName', 'vehicle', 'source', 'status', 'startDate'];

export default function ReservationsPage() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACTIVE' | 'CANCELLED'>('PENDING');
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(DEFAULT_VISIBLE));
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setShowColumnPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/reservations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
  });

  const filteredReservations = reservations?.filter((res: any) => {
    const searchTerm = search.toLowerCase();
    const matchesSearch = (
      res.fileNumber?.toLowerCase().includes(searchTerm) ||
      res.customer?.firstName?.toLowerCase().includes(searchTerm) ||
      res.customer?.lastName?.toLowerCase().includes(searchTerm) ||
      res.vehicle?.registration?.toLowerCase().includes(searchTerm)
    );
    if (!matchesSearch) return false;
    if (activeTab === 'PENDING') return res.status === 'PENDING' || res.status === 'DRAFT';
    return res.status === activeTab;
  }) || [];

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const visibleColDefs = ALL_COLUMNS.filter(c => visibleColumns.has(c.key));

  const tabStyle = (tab: typeof activeTab): React.CSSProperties => ({
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    color: activeTab === tab ? '#01ae42' : '#64748b',
    borderBottom: activeTab === tab ? '2px solid #01ae42' : '2px solid transparent',
    transition: 'all 0.2s'
  });

  const renderCell = (res: any, key: ColumnKey) => {
    switch (key) {
      case 'reservationNumber':
        return <td key={key} style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 700, color: '#01ae42' }}>{res.reservationNumber || '—'}</td>;
      case 'firstName':
        return <td key={key} style={{ padding: '8px 16px', fontSize: '13px', color: '#0f172a' }}>{res.customer?.firstName || '—'}</td>;
      case 'lastName':
        return <td key={key} style={{ padding: '8px 16px', fontSize: '13px', color: '#0f172a' }}>{res.customer?.lastName || '—'}</td>;
      case 'carMakeModel': {
        const make = res.nafVehicle?.make || res.customer?.vehicle?.make || '—';
        const model = res.nafVehicle?.model || res.customer?.vehicle?.model || '';
        return <td key={key} style={{ padding: '8px 16px', fontSize: '12px', color: '#64748b' }}>{model ? `${make} ${model}` : make}</td>;
      }
      case 'vehicle':
        return <td key={key} style={{ padding: '8px 16px', fontSize: '12px', color: '#64748b' }}>{res.vehicle?.registration || 'TBA'}</td>;
      case 'source':
        return <td key={key} style={{ padding: '8px 16px', fontSize: '12px', color: '#64748b' }}>{res.sourceOfBusiness || '—'}</td>;
      case 'status':
        return (
          <td key={key} style={{ padding: '8px 16px' }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: '20px',
              fontSize: '10px',
              fontWeight: 700,
              background: res.status === 'ACTIVE' ? '#f0fdf4' : res.status === 'CANCELLED' ? '#fef2f2' : '#f8fafc',
              color: res.status === 'ACTIVE' ? '#16a34a' : res.status === 'CANCELLED' ? '#ef4444' : '#64748b'
            }}>{res.status}</span>
          </td>
        );
      case 'startDate':
        return <td key={key} style={{ padding: '8px 16px', fontSize: '12px', color: '#64748b' }}>{new Date(res.startDate).toLocaleDateString('en-AU')}</td>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Reservations</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => router.push('/dashboard/reservations/new/credit-hire')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>+ Credit Hire</button>
          <button onClick={() => router.push('/dashboard/reservations/new/direct-hire')} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #01ae42', background: '#fff', color: '#01ae42', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>+ Direct Hire</button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', gap: '8px' }}>
        <button onClick={() => setActiveTab('PENDING')} style={tabStyle('PENDING')}>Pending / Drafts</button>
        <button onClick={() => setActiveTab('ACTIVE')} style={tabStyle('ACTIVE')}>Active Hires</button>
        <button onClick={() => setActiveTab('CANCELLED')} style={tabStyle('CANCELLED')}>Cancelled</button>
      </div>

      {/* Search + Column Picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search within this tab..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }}
        />

        {/* Column chooser */}
        <div ref={columnPickerRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowColumnPicker(p => !p)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: showColumnPicker ? '#f8fafc' : '#fff',
              fontSize: '14px',
              fontWeight: 500,
              color: '#0f172a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            Columns
          </button>

          {showColumnPicker && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              padding: '8px',
              zIndex: 100,
              minWidth: '200px'
            }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', margin: '4px 8px 8px' }}>Show / Hide Columns</p>
              {ALL_COLUMNS.map(col => (
                <label
                  key={col.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#0f172a',
                    background: visibleColumns.has(col.key) ? '#f0fdf4' : 'transparent',
                    transition: 'background 0.15s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    style={{ accentColor: '#01ae42', width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {visibleColDefs.map(col => (
                <th key={col.key} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={visibleColDefs.length} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : filteredReservations.length === 0 ? (
              <tr><td colSpan={visibleColDefs.length} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No {activeTab.toLowerCase()} reservations found.</td></tr>
            ) : (
              filteredReservations.map((res: any) => (
                <tr key={res.id} onClick={() => router.push(`/dashboard/reservations/${res.id}`)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                  {visibleColDefs.map(col => renderCell(res, col.key))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
