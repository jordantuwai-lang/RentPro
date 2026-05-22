'use client';
import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ReservationDetail from '@/components/ReservationDetail';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', PENDING: '#f59e0b', ACTIVE: '#01ae42', COMPLETED: '#3b82f6', CANCELLED: '#ef4444',
};

const JOB_TYPES = ['DELIVERY', 'RETURN', 'EXCHANGE', 'IN_PROGRESS', 'DOCU_RESIGN'] as const;

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '13px', color: '#0f172a',
  background: '#fff', boxSizing: 'border-box',
};
const lbl: React.CSSProperties = {
  fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px', display: 'block',
};

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    jobType: 'DELIVERY',
    scheduledAt: '',
    driverId: '',
    notes: '',
  });

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    enabled: isLoaded && showScheduleModal,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/users?role=DRIVER', { headers: { Authorization: `Bearer ${token}` } });
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

  const addToSchedule = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.post('/logistics', {
        reservationId: id,
        address: reservation?.customer?.address || '',
        suburb: reservation?.customer?.suburb || '',
        scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
        jobType: scheduleForm.jobType,
        driverId: scheduleForm.driverId || undefined,
        notes: scheduleForm.notes || undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      setShowScheduleModal(false);
      setScheduleForm({ jobType: 'DELIVERY', scheduledAt: '', driverId: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['logistics'] });
    },
  });

  if (isLoading || !reservation) {
    return <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>Loading...</div>;
  }

  const r = reservation;
  const status = r.status;
  const hasDriverInfo = !!(r.customer?.firstName && r.customer?.phone);

  const scheduleFormValid = scheduleForm.scheduledAt !== '';

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

        {/* Add to Schedule button */}
        {status !== 'CANCELLED' && status !== 'COMPLETED' && (
          <button
            onClick={() => setShowScheduleModal(true)}
            style={{ padding: '9px 20px', borderRadius: '8px', border: '1.5px solid #0a2e14', background: '#fff', color: '#0a2e14', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📅 Add to Schedule
          </button>
        )}

        {/* On Hire button */}
        {status === 'PENDING' && r.vehicle && (
          <div style={{ position: 'relative' }} title={!hasDriverInfo ? 'Driver name and phone number are required before marking On Hire' : ''}>
            <button
              onClick={() => hasDriverInfo && updateStatus.mutate('ACTIVE')}
              disabled={!hasDriverInfo}
              style={{
                padding: '9px 20px', borderRadius: '8px', border: 'none',
                background: hasDriverInfo ? '#01ae42' : '#e2e8f0',
                color: hasDriverInfo ? '#fff' : '#94a3b8',
                fontSize: '13px', fontWeight: 600,
                cursor: hasDriverInfo ? 'pointer' : 'not-allowed',
                opacity: hasDriverInfo ? 1 : 0.7,
              }}>
              On Hire
            </button>
          </div>
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

      {/* Add to Schedule Modal */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '20px',
        }} onClick={e => { if (e.target === e.currentTarget) setShowScheduleModal(false); }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '28px',
            width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>
              Add to Schedule
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={lbl}>Job Type</label>
                <select
                  style={inp}
                  value={scheduleForm.jobType}
                  onChange={e => setScheduleForm(f => ({ ...f, jobType: e.target.value }))}>
                  {JOB_TYPES.map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Scheduled Date & Time <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="datetime-local"
                  style={inp}
                  value={scheduleForm.scheduledAt}
                  onChange={e => setScheduleForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              </div>

              <div>
                <label style={lbl}>Assign Driver <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                <select
                  style={inp}
                  value={scheduleForm.driverId}
                  onChange={e => setScheduleForm(f => ({ ...f, driverId: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {drivers.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Notes <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  style={{ ...inp, resize: 'vertical', minHeight: '72px' }}
                  value={scheduleForm.notes}
                  onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any special instructions..." />
              </div>

              {r.customer?.suburb && (
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#64748b' }}>
                  📍 Delivery address: {r.customer.address ? `${r.customer.address}, ` : ''}{r.customer.suburb}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={() => addToSchedule.mutate()}
                disabled={!scheduleFormValid || addToSchedule.isPending}
                style={{
                  padding: '9px 20px', borderRadius: '8px', border: 'none',
                  background: scheduleFormValid ? '#0a2e14' : '#e2e8f0',
                  color: scheduleFormValid ? '#fff' : '#94a3b8',
                  fontSize: '13px', fontWeight: 600,
                  cursor: scheduleFormValid ? 'pointer' : 'not-allowed',
                }}>
                {addToSchedule.isPending ? 'Adding...' : 'Add to Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
