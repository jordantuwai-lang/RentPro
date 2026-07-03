'use client';
import { use } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useReservation } from '@/hooks/useReservation';
import ReservationDetail from '@/components/reservation-detail/ReservationDetail';

const SC: Record<string, string> = { OPEN: '#f59e0b', IN_PROGRESS: '#3b82f6', CLOSED: '#64748b' };

export default function ClaimsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: reservation, isLoading } = useReservation(id);

  if (isLoading || !reservation) return <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>Loading...</div>;

  const r = reservation;
  const claim = r.claim || {};
  const days = Math.max(0, Math.floor((new Date().getTime() - new Date(r.startDate).getTime()) / 86400000));

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{claim.claimNumber || r.reservationNumber}</h1>
          {r.fileNumber && <span style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '6px', padding: '3px 10px', fontSize: '13px', fontWeight: 600, color: '#01ae42', fontFamily: 'monospace' }}>{r.fileNumber}</span>}
          {claim.status && <span style={{ background: SC[claim.status] + '20', color: SC[claim.status], padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{claim.status?.replace('_', ' ')}</span>}
        </div>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{r.customer?.firstName} {r.customer?.lastName} · {days} days on hire · {claim.insurer?.name || 'No insurer'}</p>
      </div>

      <ReservationDetail reservationId={id} initialData={reservation} onSaveSuccess={() => qc.invalidateQueries({ queryKey: ['reservation', id] })} />

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 50 }}>
        <button onClick={() => router.push('/dashboard/claims')} style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
      </div>
    </div>
  );
}
