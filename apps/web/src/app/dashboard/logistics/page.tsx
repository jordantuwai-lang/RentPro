'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';

const statusColors: Record<string, string> = {
  SCHEDULED: '#01ae42',
  DISPATCHED: '#f59e0b',
  EN_ROUTE: '#8b5cf6',
  DELIVERED: '#10b981',
  FAILED: '#ef4444',
};

export default function LogisticsPage() {
  const { getToken, isLoaded } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['logistics'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/logistics/today', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#0a2e14', margin: 0 }}>Logistics</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Today's deliveries and driver dispatch</p>
        </div>
        <button style={{
          background: '#01ae42',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
        }}>
          + Schedule delivery
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {['Customer', 'Vehicle', 'Address', 'Driver', 'Scheduled', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : data?.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No deliveries scheduled today.</td></tr>
            ) : data?.map((d: any) => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0a2e14' }}>
                  {d.reservation?.customer?.firstName} {d.reservation?.customer?.lastName}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0a2e14' }}>
                  {d.reservation?.vehicle?.make} {d.reservation?.vehicle?.model}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                  {d.address}, {d.suburb}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                  {d.driver?.firstName} {d.driver?.lastName}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                  {new Date(d.scheduledAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    background: statusColors[d.status] + '20',
                    color: statusColors[d.status],
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>{d.status.replace('_', ' ')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
