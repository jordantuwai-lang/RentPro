import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useReservation(id: string | undefined) {
  const { getToken, isLoaded } = useAuth();
  return useQuery({
    queryKey: ['reservation', id],
    enabled: isLoaded && !!id,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });
}
