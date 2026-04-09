'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';

const section: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px' };
const heading: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' };
const statCard = (color: string): React.CSSProperties => ({ background: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', borderTop: `3px solid ${color}` });

function exportToExcel(data: any[], filename: string) {
  const headers = Object.keys(data[0] || {});
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { getToken, isLoaded } = useAuth();
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [fromDate, setFromDate] = useState(firstOfMonth.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0]);

  const { data: reservations } = useQuery({
    queryKey: ['reservations'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/reservations', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: fleet } = useQuery({
    queryKey: ['fleet'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/fleet', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: claims } = useQuery({
    queryKey: ['claims'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: deliveries } = useQuery({
    queryKey: ['logistics'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/logistics', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: cancellations } = useQuery({
    queryKey: ['cancellations', fromDate, toDate],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/cancellations?from=${fromDate}&to=${toDate}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: repairers } = useQuery({
    queryKey: ['repairers'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/repairers', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const from = new Date(fromDate);
  const to = new Date(toDate);
  to.setHours(23, 59, 59);

  const filteredReservations = reservations?.filter((r: any) => {
    const d = new Date(r.createdAt);
    return d >= from && d <= to;
  }) || [];

  const filteredDeliveries = deliveries?.filter((d: any) => {
    const date = new Date(d.scheduledAt);
    return date >= from && date <= to;
  }) || [];

  const activeHires = filteredReservations.filter((r: any) => r.status === 'ACTIVE');
  const kpkHires = activeHires.filter((r: any) => r.vehicle?.branch?.code === 'KPK');
  const cobHires = activeHires.filter((r: any) => r.vehicle?.branch?.code === 'COB');

  const totalVehicles = fleet?.length || 0;
  const onHire = fleet?.filter((v: any) => v.status === 'ON_HIRE').length || 0;
  const utilisationRate = totalVehicles > 0 ? Math.round((onHire / totalVehicles) * 100) : 0;

  const completedReservations = filteredReservations.filter((r: any) => r.status === 'COMPLETED' && r.endDate);
  const avgDuration = completedReservations.length > 0
    ? Math.round(completedReservations.reduce((acc: number, r: any) => {
        const days = (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24);
        return acc + days;
      }, 0) / completedReservations.length)
    : 0;

  const reservationsByStatus = ['DRAFT', 'PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(status => ({
    status,
    count: filteredReservations.filter((r: any) => r.status === status).length,
  }));

  const claimsByInsurer = claims?.reduce((acc: any, c: any) => {
    const name = c.insurer?.name || 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {}) || {};

  const claimsByRepairerData = claims?.reduce((acc: any, c: any) => {
    const name = c.repairer?.name || 'Unassigned';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {}) || {};

  const completedDeliveries = filteredDeliveries.filter((d: any) => d.status === 'DELIVERED').length;

  const statusColors: Record<string, string> = {
    DRAFT: '#94a3b8', PENDING: '#f59e0b', ACTIVE: '#01ae42', COMPLETED: '#64748b', CANCELLED: '#ef4444',
  };

  const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff' };

  const handleExportReservations = () => {
    const data = filteredReservations.map((r: any) => ({
      'Rez #': r.reservationNumber,
      'Customer': `${r.customer?.firstName} ${r.customer?.lastName}`,
      'Phone': r.customer?.phone || '',
      'Vehicle': r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : '',
      'Registration': r.vehicle?.registration || '',
      'Branch': r.vehicle?.branch?.code || '',
      'Start Date': new Date(r.startDate).toLocaleDateString('en-AU'),
      'End Date': r.endDate ? new Date(r.endDate).toLocaleDateString('en-AU') : '',
      'Status': r.status,
      'Created': new Date(r.createdAt).toLocaleDateString('en-AU'),
    }));
    exportToExcel(data, `rentpro-reservations-${fromDate}-to-${toDate}`);
  };

  const handleExportClaims = () => {
    const data = (claims || []).map((c: any) => ({
      'Claim #': c.claimNumber || '',
      'Customer': `${c.reservation?.customer?.firstName} ${c.reservation?.customer?.lastName}`,
      'Insurer': c.insurer?.name || '',
      'Repairer': c.repairer?.name || '',
      'Status': c.status,
      'Created': new Date(c.createdAt).toLocaleDateString('en-AU'),
    }));
    exportToExcel(data, `rentpro-claims-${fromDate}-to-${toDate}`);
  };

  const handleExportDeliveries = () => {
    const data = filteredDeliveries.map((d: any) => ({
      'Customer': `${d.reservation?.customer?.firstName} ${d.reservation?.customer?.lastName}`,
      'Vehicle': d.reservation?.vehicle ? `${d.reservation.vehicle.make} ${d.reservation.vehicle.model}` : '',
      'Address': `${d.address}, ${d.suburb}`,
      'Driver': `${d.driver?.firstName} ${d.driver?.lastName}`,
      'Scheduled': new Date(d.scheduledAt).toLocaleString('en-AU'),
      'Status': d.status,
    }));
    exportToExcel(data, `rentpro-deliveries-${fromDate}-to-${toDate}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Reports</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>RentPro performance overview</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '13px', color: '#64748b' }}>From</label>
          <input type="date" style={inputStyle} value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <label style={{ fontSize: '13px', color: '#64748b' }}>To</label>
          <input type="date" style={inputStyle} value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total reservations', value: filteredReservations.length, color: '#01ae42' },
          { label: 'Active hires', value: activeHires.length, color: '#01ae42' },
          { label: 'Fleet utilisation', value: `${utilisationRate}%`, color: '#f59e0b' },
          { label: 'Avg hire duration', value: `${avgDuration} days`, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} style={statCard(s.color)}>
            <div style={{ fontSize: '26px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ ...heading, marginBottom: 0 }}>Active hires by branch</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { branch: 'KPK — Keilor Park', count: kpkHires.length },
              { branch: 'COB — Coburg', count: cobHires.length },
            ].map(b => (
              <div key={b.branch} style={{ padding: '16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#01ae42' }}>{b.count}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{b.branch}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={section}>
          <h2 style={heading}>Reservations by status</h2>
          {reservationsByStatus.map(s => (
            <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColors[s.status], display: 'inline-block' }} />
                <span style={{ fontSize: '13px', color: '#0f172a' }}>{s.status}</span>
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={section}>
          <h2 style={heading}>Claims by insurer</h2>
          {Object.keys(claimsByInsurer).length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No claims yet.</p>
          ) : Object.entries(claimsByInsurer).map(([insurer, count]: any) => (
            <div key={insurer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '13px', color: '#0f172a' }}>{insurer}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{count}</span>
            </div>
          ))}
        </div>

        <div style={section}>
          <h2 style={heading}>Claims by repairer</h2>
          {Object.keys(claimsByRepairerData).length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No claims yet.</p>
          ) : Object.entries(claimsByRepairerData).map(([repairer, count]: any) => (
            <div key={repairer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '13px', color: '#0f172a' }}>{repairer}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ ...heading, marginBottom: 0 }}>Deliveries</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'Total scheduled', value: filteredDeliveries.length },
            { label: 'Completed', value: completedDeliveries },
            { label: 'Completion rate', value: filteredDeliveries.length > 0 ? `${Math.round((completedDeliveries / filteredDeliveries.length) * 100)}%` : '—' },
          ].map(s => (
            <div key={s.label} style={{ padding: '16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#01ae42' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ ...heading, marginBottom: 0 }}>Cancellation reasons</h2>
          {cancellations && cancellations.length > 0 && (
            <button
              onClick={() => {
                const data = cancellations.map((c: any) => ({
                  'Rez #': c.reservationNumber,
                  'File #': c.fileNumber || '',
                  'Customer': c.customer,
                  'Phone': c.phone || '',
                  'Branch': c.branch || '',
                  'Reason': c.reason,
                  'Cancelled': new Date(c.cancelledAt).toLocaleDateString('en-AU'),
                }));
                exportToExcel(data, `rentpro-cancellations-${fromDate}-to-${toDate}`);
              }}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #01ae42', background: '#fff', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              Export cancellations
            </button>
          )}
        </div>
        {!cancellations || cancellations.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No cancellations in this period.</p>
        ) : (
          <>
            <div style={{ marginBottom: '16px' }}>
              {(() => {
                const reasonCounts: Record<string, number> = {};
                cancellations.forEach((c: any) => {
                  reasonCounts[c.reason] = (reasonCounts[c.reason] || 0) + 1;
                });
                return Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                  <div key={reason} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '13px', color: '#0f172a' }}>{reason}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: `${Math.min((count / cancellations.length) * 150, 150)}px`, height: '6px', background: '#ef4444', borderRadius: '3px' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', minWidth: '20px' }}>{count}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  {['Rez #', 'Customer', 'Branch', 'Reason', 'Date'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cancellations.map((c: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#01ae42', fontWeight: 600 }}>{c.reservationNumber}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#0f172a' }}>{c.customer}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#64748b' }}>{c.branch || '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#0f172a' }}>{c.reason}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(c.cancelledAt).toLocaleDateString('en-AU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div style={section}>
        <h2 style={heading}>Export data</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={handleExportReservations} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #01ae42', background: '#fff', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Export reservations
          </button>
          <button onClick={handleExportClaims} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #01ae42', background: '#fff', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Export claims
          </button>
          <button onClick={handleExportDeliveries} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #01ae42', background: '#fff', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Export deliveries
          </button>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '12px', marginBottom: 0 }}>Files are exported as CSV which can be opened directly in Microsoft Excel.</p>
      </div>
    </div>
  );
}
