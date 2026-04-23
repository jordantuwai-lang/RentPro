'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs'; // Corrected: Both hooks imported
import { useRouter } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';
import api from '@/lib/api';

const section: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px' };
const heading: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' };

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: value ? '#0f172a' : '#cbd5e1' }}>{value || '—'}</div>
    </div>
  );
}

export default function OnHirePage() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser(); // Hook correctly initialized
  const { selectedBranch, isAllBranches } = useBranch();
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [returnForm, setReturnForm] = useState({ returnDate: '', odometer: '', fuelLevel: '' });
  const [returnPhotos, setReturnPhotos] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [filterSource, setFilterSource] = useState('');
  const [filterDays, setFilterDays] = useState('');

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['on-hire', selectedBranch?.id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const url = isAllBranches || !selectedBranch
        ? '/reservations'
        : `/reservations?branchId=${selectedBranch.id}`;
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
      return res.data.filter((r: any) => r.status === 'ACTIVE');
    },
  });

  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ['reservation-notes', selectedFile?.id],
    enabled: !!selectedFile,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${selectedFile.id}/notes`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const authorName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Staff';
      return api.post(`/reservations/${selectedFile.id}/notes`, { note: newNote, authorName }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      setNewNote('');
      refetchNotes();
    },
  });

  const returnVehicle = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      await api.patch(`/reservations/${selectedFile.id}`, {
        status: 'COMPLETED',
        endDate: returnForm.returnDate,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const authorName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Staff';
      await api.post(`/reservations/${selectedFile.id}/notes`, {
        note: `Vehicle returned. Odometer: ${returnForm.odometer}km. Fuel level: ${returnForm.fuelLevel}.`,
        authorName,
      }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['on-hire'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      setShowReturnModal(false);
      setSelectedFile(null);
      setReturnForm({ returnDate: '', odometer: '', fuelLevel: '' });
      setReturnPhotos([]);
    },
  });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReturnPhotos(prev => [...prev, reader.result as string]);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const getDaysOnHire = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Day 1' : `${days + 1} days`;
  };

  const getSourceLabel = (r: any) => {
    if (!r.sourceOfBusiness) return null;
    return (
      <div>
        <div style={{ fontSize: '13px', color: '#64748b' }}>{r.sourceOfBusiness}</div>
        {r.partnerName && (
          <div style={{ fontSize: '12px', color: '#01ae42', marginTop: '2px', fontWeight: 500 }}>{r.partnerName}</div>
        )}
      </div>
    );
  };

  const getAssignedVehicle = (r: any) => {
    if (!r.vehicle) return <span style={{ fontSize: '13px', color: '#cbd5e1' }}>—</span>;
    return (
      <div>
        <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>{r.vehicle.make} {r.vehicle.model}</div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{r.vehicle.registration}</div>
      </div>
    );
  };

  const filteredReservations = reservations?.filter((r: any) => {
    if (filterSource && r.sourceOfBusiness !== filterSource) return false;
    if (filterDays) {
      const start = new Date(r.startDate);
      const days = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (filterDays === '1-7' && !(days >= 1 && days <= 7)) return false;
      if (filterDays === '8-14' && !(days >= 8 && days <= 14)) return false;
      if (filterDays === '15-30' && !(days >= 15 && days <= 30)) return false;
      if (filterDays === '30+' && !(days > 30)) return false;
    }
    return true;
  });

  return (
    <div>
      {/* ── Detail panel ── */}
      {selectedFile && !showReturnModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#f8fdf9', zIndex: 100, overflowY: 'auto', padding: '32px' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{selectedFile.fileNumber}</h1>
                  <span style={{ background: '#f0fdf4', color: '#01ae42', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid #bbf7d0' }}>ON HIRE</span>
                </div>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>{selectedFile.reservationNumber} · {getDaysOnHire(selectedFile.startDate)}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedFile.claim && (
                  <button
                    onClick={() => router.push('/dashboard/claims')}
                    style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #01ae42', background: '#fff', color: '#01ae42', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    View Claim
                  </button>
                )}
                <button
                  onClick={() => setShowReturnModal(true)}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Return Vehicle
                </button>
                <button onClick={() => setSelectedFile(null)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', cursor: 'pointer' }}>
                  Back
                </button>
              </div>
            </div>

            <div style={section}>
              <h2 style={heading}>Customer</h2>
              <div style={grid2}>
                <Field label="Name" value={`${selectedFile.customer?.firstName} ${selectedFile.customer?.lastName}`} />
                <Field label="Phone" value={selectedFile.customer?.phone} />
                <Field label="Email" value={selectedFile.customer?.email} />
                <Field label="Licence" value={selectedFile.customer?.licenceNumber} />
              </div>
            </div>

            <div style={section}>
              <h2 style={heading}>Hire details</h2>
              <div style={grid2}>
                <Field label="File number" value={selectedFile.fileNumber} />
                <Field label="Rez number" value={selectedFile.reservationNumber} />
                <Field label="Start date" value={new Date(selectedFile.startDate).toLocaleDateString('en-AU')} />
                <Field label="Days on hire" value={getDaysOnHire(selectedFile.startDate)} />
                <Field label="Branch" value={selectedFile.vehicle?.branch?.name} />
                <Field label="Assigned vehicle" value={selectedFile.vehicle ? `${selectedFile.vehicle.make} ${selectedFile.vehicle.model} · ${selectedFile.vehicle.registration}` : undefined} />
                <Field label="Source" value={selectedFile.sourceOfBusiness} />
                {selectedFile.partnerName && <Field label="Partner" value={selectedFile.partnerName} />}
              </div>
            </div>

            {selectedFile.paymentCards?.length > 0 && (
              <div style={section}>
                <h2 style={heading}>Payment cards</h2>
                {selectedFile.paymentCards.map((card: any) => (
                  <div key={card.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{card.cardType} — {card.cardholderName}</div>
                    <div style={{ fontSize: '12px', color: '#01ae42', fontWeight: 600 }}>{card.referenceCode}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={section}>
              <h2 style={heading}>Notes</h2>
              <div style={{ marginBottom: '16px' }}>
                <textarea
                  style={{ ...input, height: '80px', resize: 'vertical', marginBottom: '8px' }}
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                />
                <button
                  onClick={() => addNote.mutate()}
                  disabled={!newNote.trim() || addNote.isPending}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: !newNote.trim() ? '#86efac' : '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                >
                  {addNote.isPending ? 'Saving...' : 'Add note'}
                </button>
              </div>
              {!notes || notes.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>No notes yet.</p>
              ) : notes.map((note: any) => (
                <div key={note.id} style={{ padding: '12px 16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#01ae42' }}>{note.authorName}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(note.createdAt).toLocaleString('en-AU')}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#0f172a', margin: 0 }}>{note.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Return modal ── */}
      {showReturnModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Return Vehicle</h2>
              <button onClick={() => setShowReturnModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Return date *</label>
                <input type="date" style={input} value={returnForm.returnDate} onChange={e => setReturnForm(p => ({ ...p, returnDate: e.target.value }))} />
              </div>
              <div style={grid2}>
                <div>
                  <label style={labelStyle}>Odometer (km) *</label>
                  <input style={input} type="number" value={returnForm.odometer} onChange={e => setReturnForm(p => ({ ...p, odometer: e.target.value }))} placeholder="e.g. 45230" />
                </div>
                <div>
                  <label style={labelStyle}>Fuel level *</label>
                  <select style={input} value={returnForm.fuelLevel} onChange={e => setReturnForm(p => ({ ...p, fuelLevel: e.target.value }))}>
                    <option value="">Select...</option>
                    <option value="Full">Full</option>
                    <option value="3/4">3/4</option>
                    <option value="1/2">1/2</option>
                    <option value="1/4">1/4</option>
                    <option value="Empty">Empty</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Return photos (optional)</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button onClick={() => cameraInputRef.current?.click()} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#01ae42', fontSize: '13px', cursor: 'pointer' }}>Take photo</button>
                  <button onClick={() => photoInputRef.current?.click()} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>Upload photo</button>
                </div>
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
                <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                {returnPhotos.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {returnPhotos.map((photo, i) => (
                      <img key={i} src={photo} alt={`Return photo ${i + 1}`} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowReturnModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={() => returnVehicle.mutate()}
                disabled={!returnForm.returnDate || !returnForm.odometer || !returnForm.fuelLevel || returnVehicle.isPending}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: !returnForm.returnDate || !returnForm.odometer || !returnForm.fuelLevel ? '#fca5a5' : '#ef4444', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                {returnVehicle.isPending ? 'Processing...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header + filters ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>On Hire</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: '16px' }}>Active hire files — {selectedBranch?.name || 'All branches'}</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${filterSource ? '#01ae42' : '#e2e8f0'}`, fontSize: '13px', color: filterSource ? '#0f172a' : '#94a3b8', background: '#fff', cursor: 'pointer' }}
          >
            <option value="">All sources</option>
            <option value="Repairer">Repairer</option>
            <option value="Tow Operator">Tow Operator</option>
            <option value="Corporate Partnerships">Corporate Partnerships</option>
            <option value="Marketing">Marketing</option>
          </select>
          <select
            value={filterDays}
            onChange={e => setFilterDays(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${filterDays ? '#01ae42' : '#e2e8f0'}`, fontSize: '13px', color: filterDays ? '#0f172a' : '#94a3b8', background: '#fff', cursor: 'pointer' }}
          >
            <option value="">All durations</option>
            <option value="1-7">1–7 days</option>
            <option value="8-14">8–14 days</option>
            <option value="15-30">15–30 days</option>
            <option value="30+">30+ days</option>
          </select>
          {(filterSource || filterDays) && (
            <button
              onClick={() => { setFilterSource(''); setFilterDays(''); }}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '13px', cursor: 'pointer' }}
            >
              Clear filters
            </button>
          )}
          {(filterSource || filterDays) && (
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              {filteredReservations?.length ?? 0} of {reservations?.length ?? 0} files
            </span>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {['File #', 'Source', 'Customer', 'Phone', 'Assigned Vehicle', 'Start Date', 'Days on Hire'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : filteredReservations?.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>{filterSource || filterDays ? 'No files match the selected filters.' : 'No active hire files.'}</td></tr>
            ) : filteredReservations?.map((r: any) => (
              <tr
                key={r.id}
                onClick={() => setSelectedFile(r)}
                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#01ae42' }}>{r.fileNumber || '—'}</td>
                <td style={{ padding: '14px 16px' }}>
                  {getSourceLabel(r) ?? <span style={{ fontSize: '13px', color: '#cbd5e1' }}>—</span>}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{r.customer?.firstName} {r.customer?.lastName}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>{r.customer?.phone}</td>
                <td style={{ padding: '14px 16px' }}>{getAssignedVehicle(r)}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(r.startDate).toLocaleDateString('en-AU')}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ background: '#f0fdf4', color: '#01ae42', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid #bbf7d0' }}>
                    {getDaysOnHire(r.startDate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}