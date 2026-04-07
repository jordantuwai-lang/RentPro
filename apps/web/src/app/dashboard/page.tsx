'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function DashboardPage() {
  const { getToken, isLoaded, user } = useAuth();
  const router = useRouter();

  const { data: reservations } = useQuery({
    queryKey: ['reservations'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/reservations', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: fleetSummary } = useQuery({
    queryKey: ['fleet-summary'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/fleet/summary', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: deliveries } = useQuery({
    queryKey: ['logistics'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/logistics/today', { headers: { Authorization: `Bearer ${token}` } });
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

  const activeHires = reservations?.filter((r: any) => r.status === 'ACTIVE').length ?? '—';
  const openClaims = claims?.filter((c: any) => c.status === 'OPEN' || c.status === 'PENDING_APPROVAL').length ?? '—';
  const todayDeliveries = deliveries?.length ?? '—';
  const availableVehicles = fleetSummary?.available ?? '—';

  const recentReservations = reservations?.slice(0, 5) ?? [];
  const todayJobs = deliveries?.slice(0, 5) ?? [];

  const statusColors: Record<string, string> = {
    DRAFT: '#94a3b8',
    PENDING: '#f59e0b',
    ACTIVE: '#10b981',
    COMPLETED: '#64748b',
    CANCELLED: '#ef4444',
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#0a2e14', margin: 0 }}>
          Good morning, {user?.firstName || 'there'} 👋
        </h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
          Here's what's happening across Right2Drive today.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Active hires', value: activeHires, color: '#01ae42', href: '/dashboard/reservations' },
          { label: 'Available vehicles', value: availableVehicles, color: '#10b981', href: '/dashboard/fleet' },
          { label: 'Open claims', value: openClaims, color: '#f59e0b', href: '/dashboard/claims' },
          { label: "Today's deliveries", value: todayDeliveries, color: '#8b5cf6', href: '/dashboard/logistics' },
        ].map((stat) => (
          <div
            key={stat.label}
            onClick={() => router.push(stat.href)}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px 24px',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0a2e14', margin: 0 }}>Recent reservations</h2>
            <span onClick={() => router.push('/dashboard/reservations')} style={{ fontSize: '13px', color: '#01ae42', cursor: 'pointer' }}>View all</span>
          </div>
          {recentReservations.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No reservations yet.</p>
          ) : recentReservations.map((r: any) => (
            <div
              key={r.id}
              onClick={() => router.push(`/dashboard/reservations/${r.id}`)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#01ae42' }}>{r.reservationNumber}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{r.customer?.firstName} {r.customer?.lastName}</div>
              </div>
              <span style={{
                background: statusColors[r.status] + '20',
                color: statusColors[r.status],
                padding: '3px 8px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '500',
              }}>{r.status}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0a2e14', margin: 0 }}>Today's deliveries</h2>
            <span onClick={() => router.push('/dashboard/logistics')} style={{ fontSize: '13px', color: '#01ae42', cursor: 'pointer' }}>View all</span>
          </div>
          {todayJobs.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No deliveries scheduled today.</p>
          ) : todayJobs.map((d: any) => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#0a2e14' }}>{d.reservation?.customer?.firstName} {d.reservation?.customer?.lastName}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{d.suburb} · {new Date(d.scheduledAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{d.driver?.firstName}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
