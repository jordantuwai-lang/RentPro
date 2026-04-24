'use client';
import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ReservationDetail from '@/components/ReservationDetail';

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px', display: 'block' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };

export default function OnHireDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState({ returnDate: '', odometer: '', fuelLevel: '' });

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const returnVehicle = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const authorName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Staff';
      await api.patch(`/reservations/${id}`, { status: 'COMPLETED', endDate: returnForm.returnDate }, { headers: { Authorization: `Bearer ${token}` } });
      await api.post(`/reservations/${id}/notes`, {
        note: `Vehicle returned. Odometer: ${returnForm.odometer}km. Fuel: ${returnForm.fuelLevel}.`,
        authorName,
      }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      queryClient.invalidateQueries({ queryKey: ['on-hire'] });
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      setShowReturnModal(false);
      router.push('/dashboard/on-hire');
    },
  });

  const getDaysOnHire = (startDate: string) => {
    const days = Math.floor((new Date().getTime() - new Date(startDate).getTime()) / 86400000);
    return days === 0 ? 'Day 1' : `${days + 1} days`;
  };

  if (isLoading || !reservation) {
    return <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>Loading...</div>;
  }

  const r = reservation;

  return (
    <div>
      {/* Return modal */}
      {showReturnModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Return Vehicle</h2>
              <button onClick={() => setShowReturnModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '14px', marginBottom: '24px' }}>
              <div>
                <label style={lbl}>Return date *</label>
                <input type="date" style={inp} value={returnForm.returnDate} onChange={e => setReturnForm(p => ({ ...p, returnDate: e.target.value }))} />
              </div>
              <div style={grid2}>
                <div>
                  <label style={lbl}>Odometer (km) *</label>
                  <input type="number" style={inp} value={returnForm.odometer} onChange={e => setReturnForm(p => ({ ...p, odometer: e.target.value }))} placeholder="e.g. 45230" />
                </div>
                <div>
                  <label style={lbl}>Fuel level *</label>
                  <select style={inp} value={returnForm.fuelLevel} onChange={e => setReturnForm(p => ({ ...p, fuelLevel: e.target.value }))}>
                    <option value="">Select...</option>
                    {['Full', '3/4', '1/2', '1/4', 'Empty'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowReturnModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={() => returnVehicle.mutate()}
                disabled={!returnForm.returnDate || !returnForm.odometer || !returnForm.fuelLevel || returnVehicle.isPending}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: (!returnForm.returnDate || !returnForm.odometer || !returnForm.fuelLevel) ? 0.5 : 1 }}>
                {returnVehicle.isPending ? 'Processing...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.fileNumber}</h1>
          <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '6px', padding: '3px 10px', fontSize: '13px', fontWeight: 600, color: '#01ae42' }}>
            ON HIRE
          </span>
          <span style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px 10px' }}>
            {getDaysOnHire(r.startDate)}
          </span>
        </div>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
          {r.reservationNumber} · {r.customer?.firstName} {r.customer?.lastName} · {r.vehicle?.make} {r.vehicle?.model} {r.vehicle?.registration}
        </p>
      </div>

      <ReservationDetail
        reservationId={id}
        reservation={reservation}
        onSaveSuccess={() => queryClient.invalidateQueries({ queryKey: ['on-hire'] })}
      />

      {/* Sticky bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 50 }}>
        <button onClick={() => router.push('/dashboard/on-hire')}
          style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
          ← Back
        </button>
        <div style={{ flex: 1 }} />
        {r.claim && (
          <button onClick={() => router.push(`/dashboard/claims/${r.claim.id}`)}
            style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #01ae42', background: '#fff', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            View Claim
          </button>
        )}
        <button onClick={() => setShowReturnModal(true)}
          style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          Return Vehicle
        </button>
      </div>
    </div>
  );
}
