'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';

const statusColors: Record<string, string> = {
  SCHEDULED: '#01ae42',
  DISPATCHED: '#f59e0b',
  EN_ROUTE: '#8b5cf6',
  DELIVERED: '#10b981',
  FAILED: '#ef4444',
};

const section: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px' };
const heading: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const input: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' };

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: value ? '#0f172a' : '#cbd5e1' }}>{value || '—'}</div>
    </div>
  );
}

function SignatureCanvas({ onSave, onCancel }: { onSave: (data: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawing.current = true;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: any) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => { isDrawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL());
  };

  return (
    <div>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
        Please sign below. By signing you agree to the Authority to Act and Rental Agreement.
      </p>
      <div style={{ border: '2px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', marginBottom: '12px' }}>
        <canvas
          ref={canvasRef}
          width={460}
          height={180}
          style={{ display: 'block', touchAction: 'none', cursor: 'crosshair', width: '100%' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={clear} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
        <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
        <button onClick={save} style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Confirm signature</button>
      </div>
    </div>
  );
}

export default function LogisticsPage() {
  const { getToken, isLoaded } = useAuth();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showOnHireModal, setShowOnHireModal] = useState(false);
  const [signingMode, setSigningMode] = useState<'choose' | 'screen' | 'link' | 'done'>('choose');
  const [linkContact, setLinkContact] = useState('');
  const [linkMethod, setLinkMethod] = useState<'sms' | 'email'>('email');
  const [linkSent, setLinkSent] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [deliveryPhotos, setDeliveryPhotos] = useState<any[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['logistics'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/logistics', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: templates } = useQuery({
    queryKey: ['document-templates'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/documents/templates', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: availableVehicles } = useQuery({
    queryKey: ['available-vehicles', selectedJob?.reservation?.vehicle?.branchId],
    enabled: !!selectedJob?.reservation?.vehicle?.branchId,
    queryFn: async () => {
      const token = await getToken();
      const branchId = selectedJob?.reservation?.vehicle?.branchId;
      const res = await api.get(`/fleet?branchId=${branchId}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data.filter((v: any) => v.status === 'AVAILABLE' || v.id === selectedJob?.reservation?.vehicleId);
    },
  });

  const updateDelivery = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = await getToken();
      return api.patch(`/logistics/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics'] });
      setEditingDate(null);
      setEditingTime(null);
      setEditingVehicle(null);
    },
  });

  const updateVehicle = useMutation({
    mutationFn: async ({ reservationId, vehicleId }: { reservationId: string; vehicleId: string }) => {
      const token = await getToken();
      return api.patch(`/reservations/${reservationId}`, { vehicleId }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics'] });
      setEditingVehicle(null);
    },
  });

  const markOnHire = useMutation({
    mutationFn: async ({ reservationId, signatureData }: { reservationId: string; signatureData: string }) => {
      const token = await getToken();
      await api.post(`/documents/signatures/${reservationId}`, {
        signatureData,
        signingMethod: 'screen',
      }, { headers: { Authorization: `Bearer ${token}` } });
      return api.post(`/reservations/${reservationId}/on-hire`, {}, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setShowOnHireModal(false);
      setSigningMode('choose');
      setSelectedJob(null);
    },
  });

  const handleSignatureSave = (signatureData: string) => {
    if (!selectedJob?.reservation?.id) return;
    markOnHire.mutate({ reservationId: selectedJob.reservation.id, signatureData });
  };

  const handleSaveDate = (job: any) => {
    if (!newDate) return;
    const current = new Date(job.scheduledAt);
    const [year, month, day] = newDate.split('-');
    current.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
    updateDelivery.mutate({ id: job.id, data: { scheduledAt: current.toISOString() } });
  };

  const handleSaveTime = (job: any) => {
    if (!newTime) return;
    const current = new Date(job.scheduledAt);
    const [hours, minutes] = newTime.split(':');
    current.setHours(parseInt(hours), parseInt(minutes));
    updateDelivery.mutate({ id: job.id, data: { scheduledAt: current.toISOString() } });
  };

  const r = selectedJob?.reservation;

  return (
    <div>
      {selectedJob && !showOnHireModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#f8fdf9', zIndex: 100, overflowY: 'auto', padding: '32px' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{r?.reservationNumber}</h1>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                  {selectedJob.address}, {selectedJob.suburb}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    const driverName = selectedJob.driver ? `${selectedJob.driver.firstName} ${selectedJob.driver.lastName}` : 'Your driver';
                    const phone = r?.customer?.phone;
                    if (!phone) { alert('No phone number on file for this customer.'); return; }
                    alert(`SMS would be sent to ${phone}:\n\nHi, it's ${driverName} from Right2Drive. I am on my way and will meet you shortly.`);
                  }}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #01ae42', background: '#fff', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                >
                  SMS Customer
                </button>
                <button
                  onClick={() => setShowPhotosModal(true)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Delivery Photos
                </button>
                <button onClick={() => setShowOnHireModal(true)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  On Hire
                </button>
                <button onClick={() => setSelectedJob(null)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', cursor: 'pointer' }}>
                  Back
                </button>
              </div>
            </div>

            <div style={section}>
              <h2 style={heading}>Customer</h2>
              <div style={grid2}>
                <Field label="Name" value={`${r?.customer?.firstName} ${r?.customer?.lastName}`} />
                <Field label="Phone" value={r?.customer?.phone} />
                <Field label="Email" value={r?.customer?.email} />
                <Field label="Licence number" value={r?.customer?.licenceNumber} />
              </div>
            </div>

            <div style={section}>
              <h2 style={heading}>Delivery details</h2>
              <div style={grid2}>
                <Field label="Address" value={selectedJob.address} />
                <Field label="Suburb" value={selectedJob.suburb} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Scheduled date</div>
                  {editingDate === selectedJob.id ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input type="date" style={{ ...input, flex: 1 }} value={newDate} onChange={e => setNewDate(e.target.value)} />
                      <button onClick={() => handleSaveDate(selectedJob)} style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setEditingDate(null)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  ) : (
                    <div onClick={() => { setEditingDate(selectedJob.id); setNewDate(new Date(selectedJob.scheduledAt).toISOString().split('T')[0]); }} style={{ fontSize: '14px', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {new Date(selectedJob.scheduledAt).toLocaleDateString('en-AU')}
                      <span style={{ fontSize: '11px', color: '#01ae42' }}>Edit</span>
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Scheduled time</div>
                  {editingTime === selectedJob.id ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input type="time" style={{ ...input, flex: 1 }} value={newTime} onChange={e => setNewTime(e.target.value)} />
                      <button onClick={() => handleSaveTime(selectedJob)} style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setEditingTime(null)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  ) : (
                    <div onClick={() => { setEditingTime(selectedJob.id); setNewTime(new Date(selectedJob.scheduledAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })); }} style={{ fontSize: '14px', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {new Date(selectedJob.scheduledAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                      <span style={{ fontSize: '11px', color: '#01ae42' }}>Edit</span>
                    </div>
                  )}
                </div>
                <Field label="Driver" value={selectedJob.driver ? `${selectedJob.driver.firstName} ${selectedJob.driver.lastName}` : undefined} />
              </div>
            </div>

            <div style={section}>
              <h2 style={heading}>Customer vehicle</h2>
              <div style={grid2}>
                <Field label="Make & model" value={r?.customer ? `${r?.vehicle?.make || ''} ${r?.vehicle?.model || ''}`.trim() || '—' : '—'} />
                <Field label="Registration" value={r?.vehicle?.registration} />
              </div>
            </div>

            <div style={section}>
              <h2 style={heading}>Assigned fleet</h2>
              <div style={grid2}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Vehicle</div>
                  {editingVehicle === selectedJob.id ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select
                        style={{ ...input, flex: 1 }}
                        defaultValue={r?.vehicleId}
                        onChange={e => {
                          if (e.target.value) {
                            updateVehicle.mutate({ reservationId: r?.id, vehicleId: e.target.value });
                          }
                        }}
                      >
                        <option value="">Select vehicle...</option>
                        {availableVehicles?.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {v.make} {v.model} · {v.registration} · {v.category}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => setEditingVehicle(null)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  ) : (
                    <div onClick={() => setEditingVehicle(selectedJob.id)} style={{ fontSize: '14px', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {r?.vehicle ? `${r.vehicle.make} ${r.vehicle.model} · ${r.vehicle.registration}` : '—'}
                      <span style={{ fontSize: '11px', color: '#01ae42' }}>Change</span>
                    </div>
                  )}
                </div>
                <Field label="Branch" value={r?.vehicle?.branch?.name} />
                <Field label="Category" value={r?.vehicle?.category} />
              </div>
            </div>

            {r?.paymentCards?.length > 0 && (
              <div style={section}>
                <h2 style={heading}>Payment cards</h2>
                {r.paymentCards.map((card: any) => (
                  <div key={card.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{card.cardType} — {card.cardholderName}</div>
                    <div style={{ fontSize: '12px', color: '#01ae42', fontWeight: 600 }}>{card.referenceCode}</div>
                  </div>
                ))}
              </div>
            )}

            {r?.additionalDrivers?.length > 0 && (
              <div style={section}>
                <h2 style={heading}>Additional drivers</h2>
                <div style={grid2}>
                  {r.additionalDrivers.map((d: any) => (
                    <div key={d.id} style={{ padding: '12px 16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{d.firstName} {d.lastName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Licence: {d.licenceNumber}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showOnHireModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>On Hire — Sign documents</h2>
              <button onClick={() => { setShowOnHireModal(false); setSigningMode('choose'); }} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}>x</button>
            </div>

            {templates && templates.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#065f46', marginBottom: '6px' }}>Documents to be signed:</div>
                {templates.map((t: any) => (
                  <div key={t.id} style={{ fontSize: '13px', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📄</span> {t.name}
                  </div>
                ))}
              </div>
            )}

            {signingMode === 'choose' && (
              <div>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>How would the customer like to sign?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={() => setSigningMode('screen')} style={{ padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Sign on screen</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Customer signs directly on this device</div>
                  </button>
                  <button onClick={() => setSigningMode('link')} style={{ padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Send signing link</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Customer signs on their own phone or email</div>
                  </button>
                </div>
              </div>
            )}

            {signingMode === 'screen' && (
              <SignatureCanvas onSave={handleSignatureSave} onCancel={() => setSigningMode('choose')} />
            )}

            {signingMode === 'link' && (
              <div>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>Send a signing link to the customer:</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button onClick={() => setLinkMethod('email')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${linkMethod === 'email' ? '#01ae42' : '#e2e8f0'}`, background: linkMethod === 'email' ? '#f0fdf4' : '#fff', color: linkMethod === 'email' ? '#01ae42' : '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Email</button>
                  <button onClick={() => setLinkMethod('sms')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${linkMethod === 'sms' ? '#01ae42' : '#e2e8f0'}`, background: linkMethod === 'sms' ? '#f0fdf4' : '#fff', color: linkMethod === 'sms' ? '#01ae42' : '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>SMS</button>
                </div>
                <input
                  style={{ ...input, marginBottom: '12px' }}
                  value={linkContact}
                  onChange={e => setLinkContact(e.target.value)}
                  placeholder={linkMethod === 'email' ? r?.customer?.email || 'customer@email.com' : r?.customer?.phone || '04XX XXX XXX'}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setSigningMode('choose')} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>Back</button>
                  <button onClick={() => { setLinkSent(true); setTimeout(() => { setLinkSent(false); setSigningMode('done'); }, 1500); }} disabled={linkSent} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    {linkSent ? 'Sending...' : `Send via ${linkMethod.toUpperCase()}`}
                  </button>
                </div>
              </div>
            )}

            {signingMode === 'done' && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Link sent!</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>The customer will receive their signing link shortly.</p>
                <button onClick={() => { setShowOnHireModal(false); setSigningMode('choose'); }} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Done</button>
              </div>
            )}

            {markOnHire.isPending && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#01ae42', fontSize: '14px' }}>Processing On Hire...</div>
            )}
          </div>
        </div>
      )}

      {showPhotosModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Delivery photos</h2>
              <button onClick={() => setShowPhotosModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}>x</button>
            </div>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>Take pre-condition photos of the vehicle before delivery. Up to 10 photos.</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={deliveryPhotos.length >= 10}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: deliveryPhotos.length >= 10 ? 'not-allowed' : 'pointer' }}
              >
                Take photo
              </button>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={deliveryPhotos.length >= 10}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: deliveryPhotos.length >= 10 ? 'not-allowed' : 'pointer' }}
              >
                Upload photo
              </button>
            </div>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !selectedJob) return;
              setUploadingPhoto(true);
              const reader = new FileReader();
              reader.onload = async () => {
                const token = await getToken();
                const res = await api.post(`/logistics/${selectedJob.id}/photos`, {
                  url: reader.result as string,
                  key: `delivery-${selectedJob.id}-${Date.now()}`,
                }, { headers: { Authorization: `Bearer ${token}` } });
                setDeliveryPhotos(prev => [...prev, res.data]);
                setUploadingPhoto(false);
              };
              reader.readAsDataURL(file);
              e.target.value = '';
            }} style={{ display: 'none' }} />
            <input ref={photoInputRef} type="file" accept="image/*" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !selectedJob) return;
              setUploadingPhoto(true);
              const reader = new FileReader();
              reader.onload = async () => {
                const token = await getToken();
                const res = await api.post(`/logistics/${selectedJob.id}/photos`, {
                  url: reader.result as string,
                  key: `delivery-${selectedJob.id}-${Date.now()}`,
                }, { headers: { Authorization: `Bearer ${token}` } });
                setDeliveryPhotos(prev => [...prev, res.data]);
                setUploadingPhoto(false);
              };
              reader.readAsDataURL(file);
              e.target.value = '';
            }} style={{ display: 'none' }} />
            {uploadingPhoto && <div style={{ textAlign: 'center', color: '#01ae42', fontSize: '13px', marginBottom: '12px' }}>Uploading...</div>}
            {deliveryPhotos.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No photos yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {deliveryPhotos.map((photo: any, i: number) => (
                  <div key={photo.id} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <img src={photo.url} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'right' }}>{deliveryPhotos.length}/10 photos</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Logistics</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Deliveries and driver dispatch</p>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {['Date', 'Time', 'Customer', 'Contact', 'Delivery Location', 'Customer Vehicle', 'Assigned Fleet', 'Driver', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : data?.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No deliveries scheduled.</td></tr>
            ) : data?.map((d: any) => (
              <tr key={d.id} onClick={() => setSelectedJob(d)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                  {new Date(d.scheduledAt).toLocaleDateString('en-AU')}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                  {new Date(d.scheduledAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap' }}>
                  {d.reservation?.customer?.firstName} {d.reservation?.customer?.lastName}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {d.reservation?.customer?.phone || '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                  {d.address}, {d.suburb}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {d.reservation?.vehicle?.make} {d.reservation?.vehicle?.model}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                  {d.reservation?.vehicle?.registration || '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {d.driver?.firstName} {d.driver?.lastName}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: statusColors[d.status] + '20', color: statusColors[d.status], padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {d.status.replace('_', ' ')}
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
