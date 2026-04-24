'use client';
import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ReservationDetail from '@/components/ReservationDetail';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', PENDING: '#f59e0b', ACTIVE: '#01ae42', COMPLETED: '#3b82f6', CANCELLED: '#ef4444',
};

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const token = await getToken();
      return api.patch(`/reservations/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservation', id] }),
  });

  if (isLoading || !reservation) {
    return <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>Loading...</div>;
  }

  const r = reservation;
  const status = r.status;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.reservationNumber}</h1>
          <span style={{ display: 'inline-flex', alignItems: 'center', background: STATUS_COLORS[status] + '20', border: `1.5px solid ${STATUS_COLORS[status]}`, borderRadius: '6px', padding: '3px 10px', fontSize: '13px', fontWeight: 600, color: STATUS_COLORS[status] }}>
            {status}
          </span>
          {r.fileNumber && (
            <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '6px', padding: '3px 10px', fontSize: '13px', fontWeight: 600, color: '#01ae42', fontFamily: 'monospace' }}>
              {r.fileNumber}
            </span>
          )}
        </div>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
          {r.customer?.firstName} {r.customer?.lastName} · Created {new Date(r.createdAt).toLocaleDateString('en-AU')}
        </p>
      </div>

      {/* Shared detail component */}
      <ReservationDetail
        reservationId={id}
        reservation={reservation}
        onSaveSuccess={() => queryClient.invalidateQueries({ queryKey: ['reservations'] })}
      />

      {/* Sticky bottom action bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '1px solid #e2e8f0',
        padding: '12px 24px', display: 'flex', alignItems: 'center',
        gap: '10px', zIndex: 50,
      }}>
        <button onClick={() => router.push('/dashboard/reservations')}
          style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
          ← Back
        </button>

        <div style={{ flex: 1 }} />

        {status === 'DRAFT' && (
          <button onClick={() => updateStatus.mutate('PENDING')}
            style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Mark Pending
          </button>
        )}
        {status === 'PENDING' && r.vehicle && (
          <button onClick={() => updateStatus.mutate('ACTIVE')}
            style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Mark On Hire
          </button>
        )}
        {(status === 'PENDING' || status === 'ACTIVE') && (
          <button onClick={() => updateStatus.mutate('COMPLETED')}
            style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Complete
          </button>
        )}
        {status !== 'CANCELLED' && status !== 'COMPLETED' && (
          <button onClick={() => updateStatus.mutate('CANCELLED')}
            style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}