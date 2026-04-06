'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  ACTIVE: '#10b981',
  COMPLETED: '#64748b',
  CANCELLED: '#ef4444',
};

export default function ReservationsPage() {
  const { getToken, isLoaded } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['reservations'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/reservations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Reservations</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>All active and past hire reservations</p>
        </div>
        <Link href="/dashboard/reservations/new" style={{
          background: '#3b82f6',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          + New reservation
        </Link>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {['Customer', 'Vehicle', 'Branch', 'Start date', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : data?.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No reservations yet.</td></tr>
            ) : data?.map((r: any) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0f172a' }}>
                  {r.customer.firstName} {r.customer.lastName}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0f172a' }}>
                  {r.vehicle.make} {r.vehicle.model} · {r.vehicle.registration}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                  {r.vehicle.branch?.code}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                  {new Date(r.startDate).toLocaleDateString('en-AU')}
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
    </div>
  );
}
