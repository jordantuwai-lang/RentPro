'use client';
import { use } from 'react';
import { useReservation } from '@/hooks/useReservation';
import ReservationDetail from '@/components/reservation-detail/ReservationDetail';

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: reservation, isLoading } = useReservation(id);

  if (isLoading || !reservation) {
    return <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>Loading...</div>;
  }

  return <ReservationDetail reservationId={id} initialData={reservation} />;
}
