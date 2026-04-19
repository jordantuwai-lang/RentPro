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
  fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '16px',
  textTransform: 'uppercase', letterSpacing: '0.1em',
};

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' };

const input: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
  fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box',
};

const btn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: '8px', border: 'none',
  background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
};

const btnCancel: React.CSSProperties = { ...btn, background: '#ef4444' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div style={wide ? { gridColumn: '1 / -1' } : {}}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
        {label}
      </div>
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

function fmt(date?: string | null) {
  if (!date) return undefined;
  return new Date(date).toLocaleDateString('en-AU');
}

function fmtDateTime(date?: string | null) {
  if (!date) return undefined;
  return new Date(date).toLocaleString('en-AU');
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
    <div style={{ maxWidth: '860px' }}>

      {/* ── Cancel Modal ── */}
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
              <button onClick={() => { setShowCancelModal(false); setCancelReason(''); setCancelComment(''); }} style={{ ...btn, flex: 1, background: '#f1f5f9', color: '#0f172a' }}>
                Go back
              </button>
              <button
                onClick={() => cancelReservation.mutate()}
                disabled={!cancelReason || (cancelReason === 'Other' && !cancelComment.trim()) || cancelReservation.isPending}
                style={{ ...btnCancel, flex: 1, opacity: !cancelReason || (cancelReason === 'Other' && !cancelComment.trim()) ? 0.5 : 1 }}
              >
                {cancelReservation.isPending ? 'Cancelling...' : 'Confirm cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notes Modal ── */}
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
            <button onClick={() => addNote.mutate()} disabled={!newNote.trim() || addNote.isPending} style={{ ...btn, opacity: !newNote.trim() ? 0.5 : 1 }}>
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

      {/* ── Schedule Modal ── */}
      {showScheduleModal && (
        <Modal title="Add to delivery schedule" onClose={() => setShowScheduleModal(false)}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Delivery address *</label>
              <AddressAutocomplete
                value={scheduleForm.address}
                onChange={val => setScheduleForm(f => ({ ...f, address: val }))}
                onSelect={({ address, suburb, postcode }) => setScheduleForm(f => ({ ...f, address, suburb, postcode }))}
                placeholder="Start typing address..."
              />
            </div>
            <div style={grid2}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Suburb</label>
                <input style={input} value={scheduleForm.suburb} onChange={e => setScheduleForm(f => ({ ...f, suburb: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Postcode</label>
                <input style={input} value={scheduleForm.postcode} onChange={e => setScheduleForm(f => ({ ...f, postcode: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Scheduled date & time *</label>
              <input type="datetime-local" style={input} value={scheduleForm.scheduledAt} onChange={e => setScheduleForm(f => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Assign driver</label>
              <select style={input} value={scheduleForm.driverId} onChange={e => setScheduleForm(f => ({ ...f, driverId: e.target.value }))}>
                <option value="">Unassigned</option>
                {drivers?.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => addToSchedule.mutate()}
              disabled={!scheduleForm.address || !scheduleForm.scheduledAt || addToSchedule.isPending}
              style={{ ...btn, opacity: !scheduleForm.address || !scheduleForm.scheduledAt ? 0.5 : 1 }}
            >
              {addToSchedule.isPending ? 'Scheduling...' : 'Add to schedule'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '24px' }}>
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

      {/* ── 1. Booking Details ── */}
      <div style={section}>
        <h2 style={heading}>Booking Details</h2>
        <div style={grid3}>
          <Field label="Source of business" value={r.sourceOfBusiness} />
          <Field label="Partner / repairer" value={r.partnerName} />
          <Field label="Hire type" value={r.hireType} />
          <Field label="Type of cover" value={r.typeOfCover} />
          <Field label="Hire start" value={fmt(r.startDate)} />
          <Field label="Hire end" value={fmt(r.endDate)} />
        </div>
      </div>

      {/* ── 2. Driver / Customer ── */}
      <div style={section}>
        <h2 style={heading}>Driver / Customer</h2>
        <div style={grid3}>
          <Field label="First name" value={r.customer?.firstName} />
          <Field label="Last name" value={r.customer?.lastName} />
          <Field label="Phone" value={r.customer?.phone} />
          <Field label="Email" value={r.customer?.email} />
          <Field label="Licence number" value={r.customer?.licenceNumber} />
        </div>
      </div>

      {/* ── 3. Replacement Vehicle ── */}
      <div style={section}>
        <h2 style={heading}>Replacement Vehicle</h2>
        <div style={grid3}>
          <Field label="Registration" value={r.vehicle?.registration} />
          <Field label="Make" value={r.vehicle?.make} />
          <Field label="Model" value={r.vehicle?.model} />
          <Field label="Year" value={r.vehicle?.year?.toString()} />
          <Field label="Category" value={r.vehicle?.category} />
          <Field label="Branch" value={r.vehicle?.branch?.name} />
        </div>
      </div>

      {/* ── 4. Claim ── */}
      {r.claim && (
        <div style={section}>
          <h2 style={heading}>Claim</h2>
          <div style={grid3}>
            <Field label="Claim number" value={r.claim.claimNumber} />
            <Field label="Claim reference" value={r.claim.claimReference} />
            <Field label="Status" value={r.claim.status} />
            <Field label="Insurer" value={r.claim.insurer?.name} />
            <Field label="Repairer" value={r.claim.repairer?.name} />
          </div>
        </div>
      )}

      {/* ── 5. Accident Details ── */}
      {(r.towIn || r.totalLoss || r.settlementReceived || r.thirdPartyRecovery) && (
        <div style={section}>
          <h2 style={heading}>Accident Details</h2>
          <div style={grid3}>
            <Field label="Tow in?" value={r.towIn} />
            <Field label="Total loss?" value={r.totalLoss} />
            <Field label="Settlement received?" value={r.settlementReceived} />
            <Field label="3rd party recovery?" value={r.thirdPartyRecovery} />
          </div>
        </div>
      )}

      {/* ── 6. Repair Details ── */}
      {(r.repairStartDate || r.repairEndDate || r.estimateDate || r.assessmentDate || r.repairerInvoiceNo || r.repairerInvoiceAmt) && (
        <div style={section}>
          <h2 style={heading}>Repair Details</h2>
          <div style={grid3}>
            <Field label="Repair start" value={fmt(r.repairStartDate)} />
            <Field label="Repair end" value={fmt(r.repairEndDate)} />
            <Field label="Estimate date" value={fmt(r.estimateDate)} />
            <Field label="Assessment date" value={fmt(r.assessmentDate)} />
            <Field label="Repairer invoice #" value={r.repairerInvoiceNo} />
            <Field label="Repairer invoice amount" value={r.repairerInvoiceAmt ? `$${parseFloat(r.repairerInvoiceAmt).toFixed(2)}` : undefined} />
          </div>
        </div>
      )}

      {/* ── 7. Witness & Police ── */}
      {(r.witnessName || r.witnessPhone || r.policeContactName || r.policePhone || r.policeEventNo) && (
        <div style={section}>
          <h2 style={heading}>Witness & Police</h2>
          {(r.witnessName || r.witnessPhone) && (
            <>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '12px' }}>Witness</div>
              <div style={{ ...grid3, marginBottom: '20px' }}>
                <Field label="Name" value={r.witnessName} />
                <Field label="Phone" value={r.witnessPhone} />
              </div>
            </>
          )}
          {(r.policeContactName || r.policePhone || r.policeEventNo) && (
            <>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '12px' }}>Police</div>
              <div style={grid3}>
                <Field label="Contact name" value={r.policeContactName} />
                <Field label="Phone" value={r.policePhone} />
                <Field label="Event number" value={r.policeEventNo} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 8. Delivery ── */}
      {r.delivery && (
        <div style={section}>
          <h2 style={heading}>Delivery</h2>
          <div style={grid3}>
            <Field label="Address" value={r.delivery.address} />
            <Field label="Suburb" value={r.delivery.suburb} />
            <Field label="Job type" value={r.delivery.jobType} />
            <Field label="Scheduled" value={fmtDateTime(r.delivery.scheduledAt)} />
            <Field label="Delivered" value={fmtDateTime(r.delivery.deliveredAt)} />
            <Field label="Status" value={r.delivery.status} />
            {r.delivery.notes && <Field label="Notes" value={r.delivery.notes} wide />}
          </div>
        </div>
      )}

      {/* ── 9. Payment Cards ── */}
      {r.paymentCards?.length > 0 && (
        <div style={section}>
          <h2 style={heading}>Payment Cards</h2>
          {r.paymentCards.map((card: any) => (
            <div key={card.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{card.cardType} — {card.cardholderName}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Ref: <strong style={{ color: '#01ae42' }}>{card.referenceCode}</strong>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Expires {card.expiryDate}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── 10. Additional Drivers ── */}
      {r.additionalDrivers?.length > 0 && (
        <div style={section}>
          <h2 style={heading}>Additional Drivers</h2>
          <div style={grid2}>
            {r.additionalDrivers.map((d: any) => (
              <div key={d.id} style={{ padding: '14px 16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '10px' }}>{d.firstName} {d.lastName}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <Field label="Licence" value={d.licenceNumber} />
                  {d.licenceExpiry && <Field label="Expiry" value={d.licenceExpiry} />}
                  {d.dob && <Field label="Date of birth" value={d.dob} />}
                  {d.phone && <Field label="Phone" value={d.phone} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 11. Notes ── */}
      {notes?.length > 0 && (
        <div style={section}>
          <h2 style={heading}>Notes ({notes.length})</h2>
          {notes.map((note: any) => (
            <div key={note.id} style={{ padding: '12px 16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#01ae42' }}>{note.authorName}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(note.createdAt).toLocaleString('en-AU')}</span>
              </div>
              <p style={{ fontSize: '14px', color: '#0f172a', margin: 0 }}>{note.note}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── 12. Cancellation — only shown if cancelled ── */}
      {r.status === 'CANCELLED' && (r.cancellationReason || r.cancellationComment) && (
        <div style={{ ...section, borderColor: '#fecaca', background: '#fff5f5' }}>
          <h2 style={{ ...heading, color: '#ef4444' }}>Cancellation</h2>
          <div style={grid2}>
            <Field label="Reason" value={r.cancellationReason} />
            {r.cancellationComment && <Field label="Comment" value={r.cancellationComment} />}
          </div>
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
        <button onClick={() => setShowNotesModal(true)} style={btn}>
          Notes {notes?.length > 0 ? `(${notes.length})` : ''}
        </button>

        {r.status !== 'ACTIVE' && r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && r.vehicle && (
          <button onClick={() => markOnHire.mutate()} disabled={markOnHire.isPending} style={{ ...btn, opacity: markOnHire.isPending ? 0.7 : 1 }}>
            {markOnHire.isPending ? 'Processing...' : 'On Hire'}
          </button>
        )}

        <button onClick={() => setShowScheduleModal(true)} style={btn}>
          Add to Schedule
        </button>

        <button onClick={() => router.push(`/dashboard/reservations/${id}/edit`)} style={btn}>
          Continue editing
        </button>

        {r.status === 'DRAFT' && (
          <button onClick={() => updateStatus.mutate('PENDING')} style={btn}>
            Activate
          </button>
        )}

        {r.status === 'PENDING' && (
          <button onClick={() => updateStatus.mutate('ACTIVE')} style={btn}>
            Mark active
          </button>
        )}

        {(r.status === 'ACTIVE' || r.status === 'PENDING') && (
          <button onClick={() => updateStatus.mutate('COMPLETED')} style={btn}>
            Complete
          </button>
        )}

        {r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
          <button onClick={() => setShowCancelModal(true)} style={btnCancel}>
            Cancel reservation
          </button>
        )}

        <button onClick={() => router.push('/dashboard/reservations')} style={btn}>
          Back
        </button>
      </div>

    </div>
  );
}