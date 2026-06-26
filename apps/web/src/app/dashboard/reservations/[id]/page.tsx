'use client';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';
import TSDReservationDetail from '@/components/TSDReservationDetail';

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken, isLoaded } = useAuth();

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  if (isLoading || !reservation) {
    return <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>Loading...</div>;
  }

  return <TSDReservationDetail initialData={reservation} reservationId={id} />;
}