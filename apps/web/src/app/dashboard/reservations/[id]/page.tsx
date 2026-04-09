'use client';
import { use, useState } from 'react';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const statusColors: Record<string, string> = {
  DRAFT: '#94a3b8',
  PENDING: '#f59e0b',
  ACTIVE: '#01ae42',
  COMPLETED: '#64748b',
  CANCELLED: '#ef4444',
};

const section: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px',
};

const heading: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em',
};

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };

const input: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box',
};

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: value ? '#0f172a' : '#cbd5e1' }}>{value || '—'}</div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '500px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken, isLoaded, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelComment, setCancelComment] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [scheduleForm, setScheduleForm] = useState({ address: '', suburb: '', postcode: '', scheduledAt: '', driverId: '' });

  const { data: r, isLoading } = useQuery({
    queryKey: ['reservation', id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ['reservation-notes', id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${id}/notes`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/users', { headers: { Authorization: `Bearer ${token}` } });
      return res.data.filter((u: any) => u.role === 'DRIVER');
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const token = await getToken();
      return api.patch(`/reservations/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });

  const cancelReservation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      await api.patch(`/reservations/${id}`, { status: 'CANCELLED' }, { headers: { Authorization: `Bearer ${token}` } });
      const authorName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Staff';
      const noteText = cancelReason === 'Other' ? `Cancellation reason: ${cancelComment}` : `Cancellation reason: ${cancelReason}`;
      await api.post(`/reservations/${id}/notes`, { note: noteText, authorName }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setShowCancelModal(false);
      setCancelReason('');
      setCancelComment('');
    },
  });

  const markOnHire = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.post(`/reservations/${id}/on-hire`, {}, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const authorName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.firstName || 'Staff';
      return api.post(`/reservations/${id}/notes`, { note: newNote, authorName }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      setNewNote('');
      refetchNotes();
    },
  });

  const addToSchedule = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.post('/logistics', {
        reservationId: id,
        driverId: scheduleForm.driverId || undefined,
        address: scheduleForm.address,
        suburb: scheduleForm.suburb,
        scheduledAt: scheduleForm.scheduledAt,
        notes: `Delivery for ${r?.reservationNumber}`,
      }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      setShowScheduleModal(false);
      setScheduleForm({ address: '', suburb: '', postcode: '', scheduledAt: '', driverId: '' });
    },
  });

  if (isLoading) return <div style={{ padding: '40px', color: '#94a3b8' }}>Loading...</div>;
  if (!r) return <div style={{ padding: '40px', color: '#94a3b8' }}>Reservation not found.</div>;

  return (
    <div style={{ maxWidth: '800px' }}>

      {showCancelModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginTop: 0, marginBottom: '8px' }}>Cancel reservation</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Please provide a reason for cancelling this reservation.</p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Cancellation reason *</label>
              <select
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' as const }}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              >
                <option value="">Select reason...</option>
                <option value="Intercepted by Insurer">Intercepted by Insurer</option>
                <option value="Has access to another vehicle">Has access to another vehicle</option>
                <option value="Does not have enough at fault details">Does not have enough at fault details</option>
                <option value="Liability dispute">Liability dispute</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {cancelReason === 'Other' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Comment *</label>
                <textarea
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' as const, height: '100px', resize: 'vertical' }}
                  value={cancelComment}
                  onChange={e => setCancelComment(e.target.value)}
                  placeholder="Please describe the reason for cancellation..."
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); setCancelComment(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                Go back
              </button>
              <button
                onClick={() => cancelReservation.mutate()}
                disabled={!cancelReason || (cancelReason === 'Other' && !cancelComment.trim()) || cancelReservation.isPending}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: !cancelReason || (cancelReason === 'Other' && !cancelComment.trim()) ? '#fca5a5' : '#ef4444', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                {cancelReservation.isPending ? 'Cancelling...' : 'Confirm cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotesModal && (
        <Modal title="Notes" onClose={() => setShowNotesModal(false)}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Add a note</label>
            <textarea
              style={{ ...input, height: '100px', resize: 'vertical', marginBottom: '10px' }}
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Enter your note here..."
            />
            <button
              onClick={() => addNote.mutate()}
              disabled={!newNote.trim() || addNote.isPending}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: !newNote.trim() ? '#86efac' : '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              {addNote.isPending ? 'Saving...' : 'Save note'}
            </button>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Previous notes</div>
            {!notes || notes.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>No notes yet.</p>
            ) : notes.map((note: any) => (
              <div key={note.id} style={{ padding: '12px 16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#01ae42' }}>{note.authorName}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(note.createdAt).toLocaleString('en-AU')}</span>
                </div>
                <p style={{ fontSize: '14px', color: '#0f172a', margin: 0 }}>{note.note}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {showScheduleModal && (
        <Modal title="Add to delivery schedule" onClose={() => setShowScheduleModal(false)}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Delivery address *</label>
              <AddressAutocomplete
                value={scheduleForm.address}
                onChange={v => setScheduleForm(p => ({ ...p, address: v }))}
                onSelect={result => setScheduleForm(p => ({ ...p, address: result.address, suburb: result.suburb, postcode: result.postcode }))}
                style={input}
                placeholder="Start typing address..."
              />
            </div>
            <div style={grid2}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Suburb *</label>
                <input style={input} value={scheduleForm.suburb} onChange={e => setScheduleForm(p => ({ ...p, suburb: e.target.value }))} placeholder="Keilor Park" />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Postcode</label>
                <input style={input} value={scheduleForm.postcode} onChange={e => setScheduleForm(p => ({ ...p, postcode: e.target.value }))} placeholder="3042" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Scheduled date & time *</label>
              <input type="datetime-local" style={input} value={scheduleForm.scheduledAt} onChange={e => setScheduleForm(p => ({ ...p, scheduledAt: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Assign driver (optional)</label>
              <select style={input} value={scheduleForm.driverId} onChange={e => setScheduleForm(p => ({ ...p, driverId: e.target.value }))}>
                <option value="">Select driver...</option>
                {drivers?.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => addToSchedule.mutate()}
              disabled={!scheduleForm.address || !scheduleForm.suburb || !scheduleForm.scheduledAt || addToSchedule.isPending}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
            >
              {addToSchedule.isPending ? 'Scheduling...' : 'Add to schedule'}
            </button>
          </div>
        </Modal>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.reservationNumber}</h1>
            {r.fileNumber && (
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#01ae42', background: '#f0fdf4', padding: '4px 10px', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                {r.fileNumber}
              </span>
            )}
            <span style={{ background: statusColors[r.status] + '20', color: statusColors[r.status], padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
              {r.status}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Created {new Date(r.createdAt).toLocaleDateString('en-AU')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowNotesModal(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Notes {notes?.length > 0 ? `(${notes.length})` : ''}
          </button>
          {r.status !== 'ACTIVE' && r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && r.vehicle && (
            <button
              onClick={() => markOnHire.mutate()}
              disabled={markOnHire.isPending}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              {markOnHire.isPending ? 'Processing...' : 'On Hire'}
            </button>
          )}
          <button onClick={() => setShowScheduleModal(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #01ae42', background: '#fff', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Add to Schedule
          </button>
          <button onClick={() => router.push(`/dashboard/reservations/${id}/edit`)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#0f172a', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Continue editing
          </button>
          {r.status === 'DRAFT' && (
            <button onClick={() => updateStatus.mutate('PENDING')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              Activate
            </button>
          )}
          {r.status === 'PENDING' && (
            <button onClick={() => updateStatus.mutate('ACTIVE')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              Mark active
            </button>
          )}
          {(r.status === 'ACTIVE' || r.status === 'PENDING') && (
            <button onClick={() => updateStatus.mutate('COMPLETED')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              Complete
            </button>
          )}
          {r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
            <button onClick={() => setShowCancelModal(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
          )}
          <button onClick={() => router.push('/dashboard/reservations')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Back
          </button>
        </div>
      </div>

      <div style={section}>
        <h2 style={heading}>Customer</h2>
        <div style={grid2}>
          <Field label="First name" value={r.customer?.firstName} />
          <Field label="Last name" value={r.customer?.lastName} />
          <Field label="Phone" value={r.customer?.phone} />
          <Field label="Email" value={r.customer?.email} />
          <Field label="Licence number" value={r.customer?.licenceNumber} />
        </div>
      </div>

      <div style={section}>
        <h2 style={heading}>Replacement vehicle</h2>
        <div style={grid2}>
          <Field label="Registration" value={r.vehicle?.registration} />
          <Field label="Vehicle" value={r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : undefined} />
          <Field label="Year" value={r.vehicle?.year?.toString()} />
          <Field label="Category" value={r.vehicle?.category} />
          <Field label="Branch" value={r.vehicle?.branch?.name} />
          <Field label="Hire start" value={r.startDate ? new Date(r.startDate).toLocaleDateString('en-AU') : undefined} />
          {r.endDate && <Field label="Hire end" value={new Date(r.endDate).toLocaleDateString('en-AU')} />}
        </div>
      </div>

      {r.paymentCards?.length > 0 && (
        <div style={section}>
          <h2 style={heading}>Payment cards</h2>
          {r.paymentCards.map((card: any) => (
            <div key={card.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{card.cardType} — {card.cardholderName}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Ref: <strong style={{ color: '#01ae42' }}>{card.referenceCode}</strong></div>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{card.expiryDate}</div>
            </div>
          ))}
        </div>
      )}

      {r.additionalDrivers?.length > 0 && (
        <div style={section}>
          <h2 style={heading}>Additional drivers</h2>
          <div style={grid2}>
            {r.additionalDrivers.map((d: any) => (
              <div key={d.id} style={{ padding: '12px 16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{d.firstName} {d.lastName}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Licence: {d.licenceNumber}</div>
                {d.phone && <div style={{ fontSize: '12px', color: '#64748b' }}>Phone: {d.phone}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {r.claim && (
        <div style={section}>
          <h2 style={heading}>Claim</h2>
          <div style={grid2}>
            <Field label="Claim number" value={r.claim.claimNumber} />
            <Field label="Status" value={r.claim.status} />
            <Field label="Insurer" value={r.claim.insurer?.name} />
            <Field label="Repairer" value={r.claim.repairer?.name} />
          </div>
        </div>
      )}

      {r.delivery && (
        <div style={section}>
          <h2 style={heading}>Delivery</h2>
          <div style={grid2}>
            <Field label="Address" value={r.delivery.address} />
            <Field label="Suburb" value={r.delivery.suburb} />
            <Field label="Scheduled" value={r.delivery.scheduledAt ? new Date(r.delivery.scheduledAt).toLocaleString('en-AU') : undefined} />
            <Field label="Status" value={r.delivery.status} />
          </div>
        </div>
      )}
    </div>
  );
}
