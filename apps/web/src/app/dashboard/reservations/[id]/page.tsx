'use client';
import React from 'react';
import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// ─── Styles ───────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  DRAFT: '#94a3b8', PENDING: '#f59e0b', ACTIVE: '#01ae42', COMPLETED: '#64748b', CANCELLED: '#ef4444',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
  fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box',
};

const sectionBox: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px',
};

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const fullSpan: React.CSSProperties = { gridColumn: '1 / -1' };
const lbl: React.CSSProperties = { fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' };

// ─── Read-only Field ──────────────────────────────────────────────────────────

function Field({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div style={full ? fullSpan : {}}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: value ? '#0f172a' : '#cbd5e1', minHeight: '20px' }}>{value || '—'}</div>
    </div>
  );
}

// ─── Editable Field ───────────────────────────────────────────────────────────

function EField({ label, value, onChange, full, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; full?: boolean; type?: string;
}) {
  return (
    <div style={full ? fullSpan : {}}>
      <label style={lbl}>{label}</label>
      <input type={type} style={inp} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function ESelect({ label, value, onChange, options, full }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; full?: boolean;
}) {
  return (
    <div style={full ? fullSpan : {}}>
      <label style={lbl}>{label}</label>
      <select style={inp} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ETextarea({ label, value, onChange, full }: {
  label: string; value: string; onChange: (v: string) => void; full?: boolean;
}) {
  return (
    <div style={full ? fullSpan : {}}>
      <label style={lbl}>{label}</label>
      <textarea style={{ ...inp, height: '80px', resize: 'vertical' }} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

// ─── SectionBlock with inline edit toggle ─────────────────────────────────────

function SectionBlock({
  title, editing, onEdit, onSave, onCancel, saving, children,
}: {
  title: string;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={sectionBox}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {editing ? (
            <>
              <button
                onClick={onCancel}
                style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: saving ? '#86efac' : '#01ae42', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
            >
              Edit
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TABS = ['Main', 'Customer', 'At Fault', 'Accident', 'Damage', 'Support', 'Cards'];

function TabBar({ active, onChange }: { active: number; onChange: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
      {TABS.map((t, i) => (
        <button key={t} type="button" onClick={() => onChange(i)} style={{
          padding: '12px 24px', fontSize: '14px', fontWeight: active === i ? 600 : 500,
          color: active === i ? '#01ae42' : '#64748b', background: 'none', border: 'none',
          borderBottom: active === i ? '2px solid #01ae42' : '2px solid transparent',
          marginBottom: '-2px', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
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

// ─── ToggleYNU read-only display ──────────────────────────────────────────────

function YNUDisplay({ label, value }: { label: string; value?: string | null }) {
  const color = value === 'Yes' || value === 'Driveable' ? '#01ae42'
    : value === 'No' || value === 'Not driveable' ? '#ef4444' : '#64748b';
  const bg = value === 'Yes' || value === 'Driveable' ? '#f0fdf4'
    : value === 'No' || value === 'Not driveable' ? '#fef2f2' : '#f8fafc';
  return (
    <div>
      <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '10px' }}>{label}</div>
      {value ? (
        <span style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, display: 'inline-block', border: `1.5px solid ${color}`, background: bg, color }}>
          {value}
        </span>
      ) : <span style={{ fontSize: '14px', color: '#cbd5e1' }}>—</span>}
    </div>
  );
}

function YNUEdit({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options?: string[];
}) {
  const opts = options ?? ['Yes', 'No', 'Unknown'];
  const colors: Record<string, string> = { [opts[0]]: '#01ae42', [opts[1]]: '#ef4444', [opts[2]]: '#64748b' };
  const bgs: Record<string, string> = { [opts[0]]: '#f0fdf4', [opts[1]]: '#fef2f2', [opts[2]]: '#f8fafc' };
  return (
    <div>
      <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '10px' }}>{label}</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {opts.map(o => (
          <button key={o} type="button" onClick={() => onChange(value === o ? '' : o)} style={{
            padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            border: `1.5px solid ${value === o ? colors[o] : '#e2e8f0'}`,
            background: value === o ? bgs[o] : '#fff',
            color: value === o ? colors[o] : '#64748b',
          }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────


// ─── Signature Pad ────────────────────────────────────────────────────────────
function SignaturePad({ onSave, onClear, existingSig }: { onSave: (s: string) => void; onClear: () => void; existingSig: string | null }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const drawing = React.useRef(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    canvas.width = containerRef.current?.offsetWidth || 480;
    canvas.height = 150;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    if (existingSig) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = existingSig;
    }
  }, [existingSig]);

  const pos = (e: any) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const t = e.touches?.[0] || e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };

  const start = (e: any) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
  };

  const move = (e: any) => {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y); ctx.stroke();
  };

  const stop = () => {
    drawing.current = false;
    const sig = canvasRef.current?.toDataURL() || '';
    onSave(sig);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  return (
    <div ref={containerRef}>
      <div style={{ border: '2px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', position: 'relative' }}>
        <canvas ref={canvasRef} style={{ display: 'block', touchAction: 'none', cursor: 'crosshair', width: '100%' }}
          onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={move} onTouchEnd={stop} />
        {!existingSig && (
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', fontSize: '12px', color: '#cbd5e1', pointerEvents: 'none' }}>Sign here</div>
        )}
      </div>
      <button onClick={clear} style={{ marginTop: 8, padding: '4px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>Clear</button>
    </div>
  );
}

// ─── On Hire Docs Modal ───────────────────────────────────────────────────────
function OnHireModal({ docs, loading, activeTab, setActiveTab, authoritySig, setAuthoritySig, rentalSig, setRentalSig, onConfirm, onClose, saving }: any) {
  const bothSigned = !!authoritySig && !!rentalSig;

  const tab = (t: 'authority' | 'rental', label: string, signed: boolean) => (
    <button onClick={() => setActiveTab(t)} style={{
      flex: 1, padding: '12px', border: 'none', borderBottom: activeTab === t ? '2px solid #016631' : '2px solid transparent',
      background: 'transparent', color: activeTab === t ? '#016631' : '#64748b',
      fontWeight: activeTab === t ? 600 : 400, fontSize: '14px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    }}>
      {signed ? '✅' : '📋'} {label}
    </button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Sign Documents</h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Both documents must be signed to proceed</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
          </div>
          {/* Progress */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[['authority', 'Authority to Act', !!authoritySig], ['rental', 'Rental Agreement', !!rentalSig]].map(([, label, signed]) => (
              <div key={label as string} style={{ flex: 1, padding: '7px 12px', borderRadius: 8, background: signed ? '#f0fdf4' : '#f8fafc', border: `1px solid ${signed ? '#bbf7d0' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{signed ? '✅' : '⬜'}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: signed ? '#16a34a' : '#64748b' }}>{label as string}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex' }}>
            {tab('authority', 'Authority to Act', !!authoritySig)}
            {tab('rental', 'Rental Agreement', !!rentalSig)}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              Filling documents from reservation data...
            </div>
          )}

          {!loading && docs && (
            <>
              {/* PDF Preview */}
              <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <iframe
                  src={`data:application/pdf;base64,${activeTab === 'authority' ? docs.authorityBase64 : docs.rentalBase64}`}
                  style={{ width: '100%', height: 280, border: 'none' }}
                  title={activeTab === 'authority' ? 'Authority to Act' : 'Rental Agreement'}
                />
              </div>

              {/* Signature */}
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Customer signature</p>
              <SignaturePad
                existingSig={activeTab === 'authority' ? authoritySig : rentalSig}
                onSave={activeTab === 'authority' ? setAuthoritySig : setRentalSig}
                onClear={activeTab === 'authority' ? () => setAuthoritySig(null) : () => setRentalSig(null)}
              />
              {((activeTab === 'authority' && authoritySig) || (activeTab === 'rental' && rentalSig)) && (
                <div style={{ marginTop: 8, color: '#16a34a', fontSize: 13, fontWeight: 500 }}>
                  ✅ Signed — {activeTab === 'authority' && !rentalSig ? 'now sign the Rental Agreement' : 'ready to confirm'}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!bothSigned || saving || loading}
            style={{ flex: 2, padding: 12, borderRadius: 8, border: 'none', background: bothSigned ? '#016631' : '#e2e8f0', color: bothSigned ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 600, cursor: bothSigned ? 'pointer' : 'not-allowed' }}
          >
            {saving ? 'Processing...' : bothSigned ? '✅ Confirm On Hire' : 'Sign both documents to continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showOnHireModal, setShowOnHireModal] = useState(false);
  const [onHireDocs, setOnHireDocs] = useState<{ authorityBase64: string; rentalBase64: string } | null>(null);
  const [onHireLoading, setOnHireLoading] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<'authority' | 'rental'>('authority');
  const [authoritySig, setAuthoritySig] = useState<string | null>(null);
  const [rentalSig, setRentalSig] = useState<string | null>(null);
  const [savingDocs, setSavingDocs] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ date: '', time: '', addressMode: '', address: '', suburb: '' });
  const [scheduleSaving, setScheduleSaving] = useState(false);

  // ── Which sections are in edit mode ──
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // ── Local draft state per section ──
  const [draftBooking, setDraftBooking] = useState<any>(null);
  const [draftVehicle, setDraftVehicle] = useState<any>(null);
  const [draftDriver, setDraftDriver] = useState<any>(null);
  const [draftNaf, setDraftNaf] = useState<any>(null);
  const [draftOwner, setDraftOwner] = useState<any>(null);
  const [draftAtFaultVehicle, setDraftAtFaultVehicle] = useState<any>(null);
  const [draftAtFault, setDraftAtFault] = useState<any>(null);
  const [draftAccident, setDraftAccident] = useState<any>(null);
  const [draftDamage, setDraftDamage] = useState<any>(null);
  const [draftRepairer, setDraftRepairer] = useState<any>(null);
  const [draftWitness, setDraftWitness] = useState<any>(null);
  const [draftPolice, setDraftPolice] = useState<any>(null);

  const { data: r, isLoading } = useQuery({
    queryKey: ['reservation', id],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ['reservation-notes', id],
    enabled: !!r,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${id}/notes`, { headers: { Authorization: `Bearer ${token}` } });
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

  const cancelReservation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.patch(`/reservations/${id}`, { status: 'CANCELLED' }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      setShowCancelModal(false);
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.post(`/reservations/${id}/notes`, { note: newNote, authorName: 'Staff' }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => { setNewNote(''); refetchNotes(); },
  });

  // ── Generic patch helper ──
  const patch = async (section: string, body: any) => {
    setSaving(s => ({ ...s, [section]: true }));
    try {
      const token = await getToken();
      await api.patch(`/reservations/${id}`, body, { headers: { Authorization: `Bearer ${token}` } });
      await queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      setEditing(e => ({ ...e, [section]: false }));
    } finally {
      setSaving(s => ({ ...s, [section]: false }));
    }
  };

  // ── Edit/cancel helpers ──
  const startEdit = (section: string, initFn: () => void) => {
    initFn();
    setEditing(e => ({ ...e, [section]: true }));
  };
  const cancelEdit = (section: string) => setEditing(e => ({ ...e, [section]: false }));
  const isEditing = (section: string) => !!editing[section];
  const isSaving = (section: string) => !!saving[section];

  const handleOnHireConfirm = async () => {
    if (!onHireDocs || !authoritySig || !rentalSig) return;
    setSavingDocs(true);
    try {
      const token = await getToken();
      // Save both signed docs to R2
      await Promise.all([
        api.post(`/documents/save-signed/${r.id}`, { docType: 'authority-to-act', base64: onHireDocs.authorityBase64 }, { headers: { Authorization: `Bearer ${token}` } }),
        api.post(`/documents/save-signed/${r.id}`, { docType: 'rental-agreement', base64: onHireDocs.rentalBase64 }, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      // Mark as on hire
      await api.post(`/reservations/${r.id}/on-hire`, {}, { headers: { Authorization: `Bearer ${token}` } });
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setShowOnHireModal(false);
    } catch (e) {
      alert('Something went wrong. Please try again.');
    } finally {
      setSavingDocs(false);
    }
  };

  if (isLoading) return <div style={{ padding: '40px', color: '#94a3b8' }}>Loading...</div>;
  if (!r) return <div style={{ padding: '40px', color: '#ef4444' }}>Reservation not found.</div>;

  const statusColor = statusColors[r.status] || '#94a3b8';
  const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-AU') : undefined;
  const toDateInput = (d?: string | null) => d ? new Date(d).toISOString().split('T')[0] : '';

  const stateOptions = ['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => ({ value: s, label: s }));
  const bodyTypes = ['Sedan','Hatchback','Wagon','SUV','Ute','Van','Coupe','Convertible','People Mover','Truck','Motorcycle','Other'].map(s => ({ value: s, label: s }));
  const locationTypes = ['Road','Intersection','Car Park','Private Property','Other'].map(s => ({ value: s, label: s }));

  return (
    <div style={{ maxWidth: '820px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.reservationNumber}</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            {r.customer?.firstName} {r.customer?.lastName}
            {r.vehicle ? ` · ${r.vehicle.make} ${r.vehicle.model} (${r.vehicle.registration})` : ''}
          </p>
        </div>
        <div style={{ background: statusColor + '20', border: `0.5px solid ${statusColor}60`, borderRadius: '8px', padding: '7px 14px', textAlign: 'right' }}>
          <div style={{ fontSize: '10px', fontWeight: 500, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: statusColor, fontFamily: 'monospace', marginTop: '2px' }}>{r.status}</div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {showOnHireModal && (
          <OnHireModal
            docs={onHireDocs}
            loading={onHireLoading}
            activeTab={activeDocTab}
            setActiveTab={setActiveDocTab}
            authoritySig={authoritySig}
            setAuthoritySig={setAuthoritySig}
            rentalSig={rentalSig}
            setRentalSig={setRentalSig}
            onConfirm={handleOnHireConfirm}
            onClose={() => setShowOnHireModal(false)}
            saving={savingDocs}
          />
        )}
        <button onClick={() => router.push('/dashboard/reservations')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>← Back</button>
        {r.status === 'DRAFT' && <button onClick={() => updateStatus.mutate('PENDING')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Mark pending</button>}
        {r.status === 'PENDING' && <button onClick={() => updateStatus.mutate('ACTIVE')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Mark active</button>}
        {r.status === 'PENDING' && r.vehicle && (
          <button
            onClick={async () => {
              setShowOnHireModal(true);
              setActiveDocTab('authority');
              setAuthoritySig(null);
              setRentalSig(null);
              setOnHireDocs(null);
              setOnHireLoading(true);
              try {
                const token = await getToken();
                const res = await api.post(`/documents/generate/${r.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
                setOnHireDocs(res.data);
              } catch (e) {
                alert('Failed to load documents. Please try again.');
                setShowOnHireModal(false);
              } finally {
                setOnHireLoading(false);
              }
            }}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#016631', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            🔑 On Hire
          </button>
        )}
        {(r.status === 'ACTIVE' || r.status === 'PENDING') && <button onClick={() => updateStatus.mutate('COMPLETED')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Complete</button>}
        {r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && <button onClick={() => setShowCancelModal(true)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Cancel</button>}
        {!r.delivery && r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
          <button onClick={() => { setScheduleForm({ date: '', time: '', addressMode: '', address: '', suburb: '' }); setShowScheduleModal(true); }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            + Add to Schedule
          </button>
        )}
        {r.delivery && (
          <button
            onClick={() => {
              const d = new Date(r.delivery.scheduledAt);
              setScheduleForm({
                date: d.toISOString().split('T')[0],
                time: d.toTimeString().slice(0, 5),
                addressMode: 'manual',
                address: r.delivery.address,
                suburb: r.delivery.suburb,
              });
              setShowEditScheduleModal(true);
            }}
            style={{ padding: '10px 16px', borderRadius: '8px', background: '#01ae42', border: 'none', fontSize: '13px', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            ✓ Scheduled — {new Date(r.delivery.scheduledAt).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
          </button>
        )}
        <button onClick={() => setShowNotesModal(true)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Notes{notes?.length ? ` (${notes.length})` : ''}
        </button>
      </div>

      {/* ── Tab Bar ── */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* ══════════════════════════════════════════════════════════ TAB 0: MAIN */}
      {activeTab === 0 && (
        <>
          {/* Booking Details */}
          <SectionBlock
            title="Booking Details"
            editing={isEditing('booking')}
            onEdit={() => startEdit('booking', () => setDraftBooking({
              sourceOfBusiness: r.sourceOfBusiness || '',
              partnerName: r.partnerName || '',
              startDate: toDateInput(r.startDate),
              endDate: toDateInput(r.endDate),
              typeOfCover: r.typeOfCover || '',
              hireType: r.hireType || '',
            }))}
            onSave={() => patch('booking', {
              sourceOfBusiness: draftBooking.sourceOfBusiness || undefined,
              partnerName: draftBooking.partnerName || undefined,
              startDate: draftBooking.startDate || undefined,
              endDate: draftBooking.endDate || undefined,
              typeOfCover: draftBooking.typeOfCover || undefined,
              hireType: draftBooking.hireType || undefined,
            })}
            onCancel={() => cancelEdit('booking')}
            saving={isSaving('booking')}
          >
            {isEditing('booking') ? (
              <div style={grid2}>
                <ESelect label="Source" value={draftBooking.sourceOfBusiness} onChange={v => setDraftBooking((p: any) => ({ ...p, sourceOfBusiness: v }))}
                  options={['Corporate Partnerships','Marketing','Repairer','Tow Operator'].map(s => ({ value: s, label: s }))} />
                <EField label="Partner name" value={draftBooking.partnerName} onChange={v => setDraftBooking((p: any) => ({ ...p, partnerName: v }))} />
                <EField label="Hire start date" type="date" value={draftBooking.startDate} onChange={v => setDraftBooking((p: any) => ({ ...p, startDate: v }))} />
                <EField label="Hire end date" type="date" value={draftBooking.endDate} onChange={v => setDraftBooking((p: any) => ({ ...p, endDate: v }))} />
                <ESelect label="Type of cover" value={draftBooking.typeOfCover} onChange={v => setDraftBooking((p: any) => ({ ...p, typeOfCover: v }))}
                  options={['CTP','TPP','COMP'].map(s => ({ value: s, label: s }))} />
                <ESelect label="Hire type" value={draftBooking.hireType} onChange={v => setDraftBooking((p: any) => ({ ...p, hireType: v }))}
                  options={['Credit Hire','Direct Hire'].map(s => ({ value: s, label: s }))} />
              </div>
            ) : (
              <div style={grid2}>
                <Field label="Source" value={r.sourceOfBusiness} />
                <Field label="Branch" value={r.vehicle?.branch?.name} />
                {(r.sourceOfBusiness === 'Repairer' || r.sourceOfBusiness === 'Tow Operator') && <Field label={r.sourceOfBusiness} value={r.partnerName} />}
                <Field label="Hire start date" value={fmt(r.startDate)} />
              </div>
            )}
          </SectionBlock>

          {/* Replacement Vehicle — read-only summary, editing via Fleet */}
          <div style={sectionBox}>
            <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Replacement Vehicle</h3>
            {r.vehicle ? (
              <div style={grid2}>
                <Field label="Registration" value={r.vehicle.registration} />
                <Field label="Make & Model" value={`${r.vehicle.make} ${r.vehicle.model}`} />
                <Field label="Year" value={r.vehicle.year?.toString()} />
                <Field label="Category" value={r.vehicle.category} />
                <Field label="Colour" value={r.vehicle.colour} />
                <Field label="Branch" value={r.vehicle.branch?.name} />
              </div>
            ) : <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No vehicle assigned yet.</p>}
          </div>

          {/* File Details */}
          <div style={sectionBox}>
            <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>File Details</h3>
            <div style={grid2}>
              <Field label="Reservation number" value={r.reservationNumber} />
              <Field label="File number" value={r.fileNumber} />
              <Field label="Type of cover" value={r.typeOfCover} />
              <Field label="Hire type" value={r.hireType} />
              {r.endDate && <Field label="Hire end" value={fmt(r.endDate)} />}
              <Field label="Created" value={fmt(r.createdAt)} />
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════ TAB 1: CUSTOMER */}
      {activeTab === 1 && (
        <>
          {/* NAF Vehicle */}
          <SectionBlock
            title="Vehicle Details"
            editing={isEditing('naf')}
            onEdit={() => startEdit('naf', () => setDraftNaf({
              registration: r.nafVehicle?.registration || '',
              registrationState: r.nafVehicle?.registrationState || '',
              year: r.nafVehicle?.year || '',
              make: r.nafVehicle?.make || '',
              model: r.nafVehicle?.model || '',
              bodyType: r.nafVehicle?.bodyType || '',
              colour: r.nafVehicle?.colour || '',
            }))}
            onSave={() => patch('naf', { nafVehicle: draftNaf })}
            onCancel={() => cancelEdit('naf')}
            saving={isSaving('naf')}
          >
            {isEditing('naf') ? (
              <div style={grid2}>
                <ESelect label="State" value={draftNaf.registrationState} onChange={v => setDraftNaf((p: any) => ({ ...p, registrationState: v }))} options={stateOptions} />
                <EField label="Vehicle registration" value={draftNaf.registration} onChange={v => setDraftNaf((p: any) => ({ ...p, registration: v }))} />
                <EField label="Year" value={draftNaf.year} onChange={v => setDraftNaf((p: any) => ({ ...p, year: v }))} />
                <EField label="Make" value={draftNaf.make} onChange={v => setDraftNaf((p: any) => ({ ...p, make: v }))} />
                <EField label="Model" value={draftNaf.model} onChange={v => setDraftNaf((p: any) => ({ ...p, model: v }))} />
                <ESelect label="Body type" value={draftNaf.bodyType} onChange={v => setDraftNaf((p: any) => ({ ...p, bodyType: v }))} options={bodyTypes} />
                <EField label="Colour" value={draftNaf.colour} onChange={v => setDraftNaf((p: any) => ({ ...p, colour: v }))} />
              </div>
            ) : (
              <div style={grid2}>
                <Field label="State" value={r.nafVehicle?.registrationState} />
                <Field label="Vehicle registration" value={r.nafVehicle?.registration} />
                <Field label="Year" value={r.nafVehicle?.year} />
                <Field label="Make" value={r.nafVehicle?.make} />
                <Field label="Model" value={r.nafVehicle?.model} />
                <Field label="Body type" value={r.nafVehicle?.bodyType} />
                <Field label="Colour" value={r.nafVehicle?.colour} />
              </div>
            )}
          </SectionBlock>

          {/* Driver Details */}
          <SectionBlock
            title="Driver Details"
            editing={isEditing('driver')}
            onEdit={() => startEdit('driver', () => setDraftDriver({
              firstName: r.customer?.firstName || '',
              lastName: r.customer?.lastName || '',
              address: r.customer?.address || '',
              suburb: r.customer?.suburb || '',
              postcode: r.customer?.postcode || '',
              phone: r.customer?.phone || '',
              email: r.customer?.email || '',
              licenceNumber: r.customer?.licenceNumber || '',
              licenceState: r.customer?.licenceState || '',
              licenceExpiry: r.customer?.licenceExpiry || '',
              dob: r.customer?.dob || '',
            }))}
            onSave={() => patch('driver', { customer: draftDriver })}
            onCancel={() => cancelEdit('driver')}
            saving={isSaving('driver')}
          >
            {isEditing('driver') ? (
              <div style={grid2}>
                <EField label="First name" value={draftDriver.firstName} onChange={v => setDraftDriver((p: any) => ({ ...p, firstName: v }))} />
                <EField label="Last name" value={draftDriver.lastName} onChange={v => setDraftDriver((p: any) => ({ ...p, lastName: v }))} />
                <EField label="Address" value={draftDriver.address} onChange={v => setDraftDriver((p: any) => ({ ...p, address: v }))} full />
                <EField label="Suburb" value={draftDriver.suburb} onChange={v => setDraftDriver((p: any) => ({ ...p, suburb: v }))} />
                <EField label="Postcode" value={draftDriver.postcode} onChange={v => setDraftDriver((p: any) => ({ ...p, postcode: v }))} />
                <EField label="Phone" value={draftDriver.phone} onChange={v => setDraftDriver((p: any) => ({ ...p, phone: v }))} />
                <EField label="Email" value={draftDriver.email} onChange={v => setDraftDriver((p: any) => ({ ...p, email: v }))} />
                <EField label="Licence number" value={draftDriver.licenceNumber} onChange={v => setDraftDriver((p: any) => ({ ...p, licenceNumber: v }))} />
                <ESelect label="Licence state" value={draftDriver.licenceState} onChange={v => setDraftDriver((p: any) => ({ ...p, licenceState: v }))}
                  options={['International','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => ({ value: s, label: s }))} />
                <EField label="Licence expiry" type="date" value={draftDriver.licenceExpiry} onChange={v => setDraftDriver((p: any) => ({ ...p, licenceExpiry: v }))} />
                <EField label="Date of birth" type="date" value={draftDriver.dob} onChange={v => setDraftDriver((p: any) => ({ ...p, dob: v }))} />
              </div>
            ) : (
              <div style={grid2}>
                <Field label="First name" value={r.customer?.firstName} />
                <Field label="Last name" value={r.customer?.lastName} />
                <Field label="Address" value={r.customer?.address} full />
                <Field label="Suburb" value={r.customer?.suburb} />
                <Field label="Postcode" value={r.customer?.postcode} />
                <Field label="Phone" value={r.customer?.phone} />
                <Field label="Email" value={r.customer?.email} />
                <Field label="Licence number" value={r.customer?.licenceNumber} />
                <Field label="Licence state" value={r.customer?.licenceState} />
                <Field label="Licence expiry" value={r.customer?.licenceExpiry} />
                <Field label="Date of birth" value={r.customer?.dob} />
              </div>
            )}
          </SectionBlock>

          {/* Registered Owner */}
          <SectionBlock
            title="Registered Owner"
            editing={isEditing('owner')}
            onEdit={() => startEdit('owner', () => setDraftOwner({
              firstName: r.owner?.firstName || '',
              lastName: r.owner?.lastName || '',
              address: r.owner?.address || '',
              suburb: r.owner?.suburb || '',
              postcode: r.owner?.postcode || '',
              phone: r.owner?.phone || '',
              email: r.owner?.email || '',
              licenceNumber: r.owner?.licenceNumber || '',
              licenceState: r.owner?.licenceState || '',
              licenceExpiry: r.owner?.licenceExpiry || '',
              dob: r.owner?.dob || '',
              insuranceProvider: r.owner?.insuranceProvider || '',
              claimNumber: r.owner?.claimNumber || '',
            }))}
            onSave={() => patch('owner', { owner: draftOwner })}
            onCancel={() => cancelEdit('owner')}
            saving={isSaving('owner')}
          >
            {isEditing('owner') ? (
              <div style={grid2}>
                <EField label="First name" value={draftOwner.firstName} onChange={v => setDraftOwner((p: any) => ({ ...p, firstName: v }))} />
                <EField label="Last name" value={draftOwner.lastName} onChange={v => setDraftOwner((p: any) => ({ ...p, lastName: v }))} />
                <EField label="Address" value={draftOwner.address} onChange={v => setDraftOwner((p: any) => ({ ...p, address: v }))} full />
                <EField label="Suburb" value={draftOwner.suburb} onChange={v => setDraftOwner((p: any) => ({ ...p, suburb: v }))} />
                <EField label="Postcode" value={draftOwner.postcode} onChange={v => setDraftOwner((p: any) => ({ ...p, postcode: v }))} />
                <EField label="Phone" value={draftOwner.phone} onChange={v => setDraftOwner((p: any) => ({ ...p, phone: v }))} />
                <EField label="Email" value={draftOwner.email} onChange={v => setDraftOwner((p: any) => ({ ...p, email: v }))} />
                <EField label="Licence number" value={draftOwner.licenceNumber} onChange={v => setDraftOwner((p: any) => ({ ...p, licenceNumber: v }))} />
                <ESelect label="Licence state" value={draftOwner.licenceState} onChange={v => setDraftOwner((p: any) => ({ ...p, licenceState: v }))}
                  options={['International','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => ({ value: s, label: s }))} />
                <EField label="Licence expiry" type="date" value={draftOwner.licenceExpiry} onChange={v => setDraftOwner((p: any) => ({ ...p, licenceExpiry: v }))} />
                <EField label="Date of birth" type="date" value={draftOwner.dob} onChange={v => setDraftOwner((p: any) => ({ ...p, dob: v }))} />
                <EField label="Insurance provider" value={draftOwner.insuranceProvider} onChange={v => setDraftOwner((p: any) => ({ ...p, insuranceProvider: v }))} />
                <EField label="Claim number" value={draftOwner.claimNumber} onChange={v => setDraftOwner((p: any) => ({ ...p, claimNumber: v }))} />
              </div>
            ) : r.owner ? (
              <div style={grid2}>
                <Field label="First name" value={r.owner?.firstName} />
                <Field label="Last name" value={r.owner?.lastName} />
                <Field label="Address" value={r.owner?.address} full />
                <Field label="Suburb" value={r.owner?.suburb} />
                <Field label="Postcode" value={r.owner?.postcode} />
                <Field label="Phone" value={r.owner?.phone} />
                <Field label="Email" value={r.owner?.email} />
                <Field label="Licence number" value={r.owner?.licenceNumber} />
                <Field label="Licence state" value={r.owner?.licenceState} />
                <Field label="Licence expiry" value={r.owner?.licenceExpiry} />
                <Field label="Date of birth" value={r.owner?.dob} />
                <Field label="Insurance provider" value={r.owner?.insuranceProvider} />
                <Field label="Claim number" value={r.owner?.claimNumber} />
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No registered owner recorded. Click Edit to add.</p>
            )}
          </SectionBlock>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ TAB 2: AT FAULT */}
      {activeTab === 2 && (
        <>
          <SectionBlock
            title="Vehicle Details"
            editing={isEditing('afVehicle')}
            onEdit={() => startEdit('afVehicle', () => setDraftAtFaultVehicle({
              vehicleState: r.atFaultParty?.vehicleState || '',
              vehicleRegistration: r.atFaultParty?.vehicleRegistration || '',
              vehicleYear: r.atFaultParty?.vehicleYear || '',
              vehicleMake: r.atFaultParty?.vehicleMake || '',
              vehicleModel: r.atFaultParty?.vehicleModel || '',
              vehicleBodyType: r.atFaultParty?.vehicleBodyType || '',
            }))}
            onSave={() => patch('afVehicle', { atFaultParty: { ...r.atFaultParty, ...draftAtFaultVehicle } })}
            onCancel={() => cancelEdit('afVehicle')}
            saving={isSaving('afVehicle')}
          >
            {isEditing('afVehicle') ? (
              <div style={grid2}>
                <ESelect label="State" value={draftAtFaultVehicle.vehicleState} onChange={v => setDraftAtFaultVehicle((p: any) => ({ ...p, vehicleState: v }))} options={stateOptions} />
                <EField label="Vehicle registration" value={draftAtFaultVehicle.vehicleRegistration} onChange={v => setDraftAtFaultVehicle((p: any) => ({ ...p, vehicleRegistration: v }))} />
                <EField label="Year" value={draftAtFaultVehicle.vehicleYear} onChange={v => setDraftAtFaultVehicle((p: any) => ({ ...p, vehicleYear: v }))} />
                <EField label="Make" value={draftAtFaultVehicle.vehicleMake} onChange={v => setDraftAtFaultVehicle((p: any) => ({ ...p, vehicleMake: v }))} />
                <EField label="Model" value={draftAtFaultVehicle.vehicleModel} onChange={v => setDraftAtFaultVehicle((p: any) => ({ ...p, vehicleModel: v }))} />
                <ESelect label="Body type" value={draftAtFaultVehicle.vehicleBodyType} onChange={v => setDraftAtFaultVehicle((p: any) => ({ ...p, vehicleBodyType: v }))} options={bodyTypes} />
              </div>
            ) : (
              <div style={grid2}>
                <Field label="State" value={r.atFaultParty?.vehicleState} />
                <Field label="Vehicle registration" value={r.atFaultParty?.vehicleRegistration} />
                <Field label="Year" value={r.atFaultParty?.vehicleYear} />
                <Field label="Make" value={r.atFaultParty?.vehicleMake} />
                <Field label="Model" value={r.atFaultParty?.vehicleModel} />
                <Field label="Body type" value={r.atFaultParty?.vehicleBodyType} />
              </div>
            )}
          </SectionBlock>

          <SectionBlock
            title="At Fault Party"
            editing={isEditing('atFault')}
            onEdit={() => startEdit('atFault', () => setDraftAtFault({
              firstName: r.atFaultParty?.firstName || '',
              lastName: r.atFaultParty?.lastName || '',
              address: r.atFaultParty?.address || '',
              suburb: r.atFaultParty?.suburb || '',
              postcode: r.atFaultParty?.postcode || '',
              phone: r.atFaultParty?.phone || '',
              email: r.atFaultParty?.email || '',
              licenceNumber: r.atFaultParty?.licenceNumber || '',
              licenceState: r.atFaultParty?.licenceState || '',
              licenceExpiry: r.atFaultParty?.licenceExpiry || '',
              dob: r.atFaultParty?.dob || '',
              insuranceProvider: r.atFaultParty?.insuranceProvider || '',
              claimNumber: r.atFaultParty?.claimNumber || '',
            }))}
            onSave={() => patch('atFault', { atFaultParty: { ...r.atFaultParty, ...draftAtFault } })}
            onCancel={() => cancelEdit('atFault')}
            saving={isSaving('atFault')}
          >
            {isEditing('atFault') ? (
              <div style={grid2}>
                <EField label="First name" value={draftAtFault.firstName} onChange={v => setDraftAtFault((p: any) => ({ ...p, firstName: v }))} />
                <EField label="Last name" value={draftAtFault.lastName} onChange={v => setDraftAtFault((p: any) => ({ ...p, lastName: v }))} />
                <EField label="Address" value={draftAtFault.address} onChange={v => setDraftAtFault((p: any) => ({ ...p, address: v }))} full />
                <EField label="Suburb" value={draftAtFault.suburb} onChange={v => setDraftAtFault((p: any) => ({ ...p, suburb: v }))} />
                <EField label="Postcode" value={draftAtFault.postcode} onChange={v => setDraftAtFault((p: any) => ({ ...p, postcode: v }))} />
                <EField label="Phone" value={draftAtFault.phone} onChange={v => setDraftAtFault((p: any) => ({ ...p, phone: v }))} />
                <EField label="Email" value={draftAtFault.email} onChange={v => setDraftAtFault((p: any) => ({ ...p, email: v }))} />
                <EField label="Licence number" value={draftAtFault.licenceNumber} onChange={v => setDraftAtFault((p: any) => ({ ...p, licenceNumber: v }))} />
                <ESelect label="Licence state" value={draftAtFault.licenceState} onChange={v => setDraftAtFault((p: any) => ({ ...p, licenceState: v }))}
                  options={['International','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => ({ value: s, label: s }))} />
                <EField label="Licence expiry" type="date" value={draftAtFault.licenceExpiry} onChange={v => setDraftAtFault((p: any) => ({ ...p, licenceExpiry: v }))} />
                <EField label="Date of birth" type="date" value={draftAtFault.dob} onChange={v => setDraftAtFault((p: any) => ({ ...p, dob: v }))} />
                <EField label="Insurance provider" value={draftAtFault.insuranceProvider} onChange={v => setDraftAtFault((p: any) => ({ ...p, insuranceProvider: v }))} />
                <EField label="Claim number" value={draftAtFault.claimNumber} onChange={v => setDraftAtFault((p: any) => ({ ...p, claimNumber: v }))} />
              </div>
            ) : r.atFaultParty ? (
              <div style={grid2}>
                <Field label="First name" value={r.atFaultParty?.firstName} />
                <Field label="Last name" value={r.atFaultParty?.lastName} />
                <Field label="Address" value={r.atFaultParty?.address} full />
                <Field label="Suburb" value={r.atFaultParty?.suburb} />
                <Field label="Postcode" value={r.atFaultParty?.postcode} />
                <Field label="Phone" value={r.atFaultParty?.phone} />
                <Field label="Email" value={r.atFaultParty?.email} />
                <Field label="Licence number" value={r.atFaultParty?.licenceNumber} />
                <Field label="Licence state" value={r.atFaultParty?.licenceState} />
                <Field label="Licence expiry" value={r.atFaultParty?.licenceExpiry} />
                <Field label="Date of birth" value={r.atFaultParty?.dob} />
                <Field label="Insurance provider" value={r.atFaultParty?.insuranceProvider} />
                <Field label="Claim number" value={r.atFaultParty?.claimNumber} />
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No at fault party recorded. Click Edit to add.</p>
            )}
          </SectionBlock>
        </>
      )}

      {/* ══════════════════════════════════════════════════════ TAB 3: ACCIDENT */}
      {activeTab === 3 && (
        <SectionBlock
          title="Accident Details"
          editing={isEditing('accident')}
          onEdit={() => startEdit('accident', () => setDraftAccident({
            accidentDate: toDateInput(r.accidentDate),
            accidentLocationType: r.accidentLocationType || '',
            accidentSuburb: r.accidentSuburb || '',
            accidentLocation: r.accidentLocation || '',
            accidentDescription: r.accidentDescription || '',
          }))}
          onSave={() => patch('accident', draftAccident)}
          onCancel={() => cancelEdit('accident')}
          saving={isSaving('accident')}
        >
          {isEditing('accident') ? (
            <div style={grid2}>
              <EField label="Date of accident" type="date" value={draftAccident.accidentDate} onChange={v => setDraftAccident((p: any) => ({ ...p, accidentDate: v }))} />
              <ESelect label="Location type" value={draftAccident.accidentLocationType} onChange={v => setDraftAccident((p: any) => ({ ...p, accidentLocationType: v }))} options={locationTypes} />
              <EField label="Suburb" value={draftAccident.accidentSuburb} onChange={v => setDraftAccident((p: any) => ({ ...p, accidentSuburb: v }))} />
              <EField label="Accident location" value={draftAccident.accidentLocation} onChange={v => setDraftAccident((p: any) => ({ ...p, accidentLocation: v }))} full />
              <ETextarea label="Accident description" value={draftAccident.accidentDescription} onChange={v => setDraftAccident((p: any) => ({ ...p, accidentDescription: v }))} full />
            </div>
          ) : (
            <div style={grid2}>
              <Field label="Date of accident" value={fmt(r.accidentDate)} />
              <Field label="Location type" value={r.accidentLocationType} />
              <Field label="Suburb" value={r.accidentSuburb} />
              <Field label="Accident description" value={r.accidentDescription} full />
              {r.accidentLocation && (
                <div style={fullSpan}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Accident location</div>
                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a' }}>📍 {r.accidentLocation}</div>
                </div>
              )}
            </div>
          )}
        </SectionBlock>
      )}

      {/* ═══════════════════════════════════════════════════════ TAB 4: DAMAGE */}
      {activeTab === 4 && (
        <SectionBlock
          title="Vehicle Damage"
          editing={isEditing('damage')}
          onEdit={() => startEdit('damage', () => setDraftDamage({
            vehicleDriveable: r.vehicleDriveable || '',
            towIn: r.towIn || '',
            totalLoss: r.totalLoss || '',
            damageComponents: new Set<string>(r.damageComponents ?? []),
            damageDescription: r.damageDescription || '',
          }))}
          onSave={() => patch('damage', {
            vehicleDriveable: draftDamage.vehicleDriveable || undefined,
            towIn: draftDamage.towIn || undefined,
            totalLoss: draftDamage.totalLoss || undefined,
            damageComponents: Array.from(draftDamage.damageComponents),
            damageDescription: draftDamage.damageDescription || undefined,
          })}
          onCancel={() => cancelEdit('damage')}
          saving={isSaving('damage')}
        >
          {isEditing('damage') ? (
            <div>
              <div style={{ display: 'flex', gap: '32px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <YNUEdit label="Vehicle driveable" value={draftDamage.vehicleDriveable}
                  onChange={v => setDraftDamage((p: any) => ({ ...p, vehicleDriveable: v }))}
                  options={['Driveable', 'Not driveable', 'Unknown']} />
                <YNUEdit label="Tow in" value={draftDamage.towIn}
                  onChange={v => setDraftDamage((p: any) => ({ ...p, towIn: v }))} />
                <YNUEdit label="Total loss" value={draftDamage.totalLoss}
                  onChange={v => setDraftDamage((p: any) => ({ ...p, totalLoss: v }))} />
              </div>
              {[
                { key: 'front', label: 'Front', items: ['Bonnet','Front bumper','Front grille','Headlight (driver)','Headlight (passenger)','Front windscreen'] },
                { key: 'driver', label: 'Driver side', items: ['Driver door','Driver mirror','Driver rear quarter','Driver front quarter','Driver running board'] },
                { key: 'passenger', label: 'Passenger side', items: ['Passenger door','Passenger mirror','Passenger rear quarter','Passenger front quarter','Passenger running board'] },
                { key: 'rear', label: 'Rear', items: ['Boot / tailgate','Rear bumper','Rear windscreen','Tail light (driver)','Tail light (passenger)'] },
                { key: 'roof', label: 'Roof / other', items: ['Roof panel','Roof rack','Underbody / chassis','Wheels / tyres','Interior'] },
              ].map(zone => {
                const selectedInZone = zone.items.filter(i => draftDamage.damageComponents.has(i));
                return (
                  <div key={zone.key} style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', marginBottom: '6px', overflow: 'hidden' }}>
                    <div style={{ padding: '11px 14px', display: 'flex', justifyContent: 'space-between', background: selectedInZone.length > 0 ? '#EAF3DE' : '#f8fafc' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: selectedInZone.length > 0 ? '#27500A' : '#0f172a' }}>{zone.label}</span>
                      {selectedInZone.length > 0 && <span style={{ fontSize: '11px', color: '#3B6D11' }}>{selectedInZone.length} selected</span>}
                    </div>
                    <div style={{ padding: '12px 14px', borderTop: '0.5px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {zone.items.map(item => {
                        const active = draftDamage.damageComponents.has(item);
                        return (
                          <button key={item} type="button"
                            onClick={() => setDraftDamage((p: any) => {
                              const n = new Set(p.damageComponents);
                              active ? n.delete(item) : n.add(item);
                              return { ...p, damageComponents: n };
                            })}
                            style={{ padding: '5px 12px', borderRadius: '999px', cursor: 'pointer', fontSize: '12px', fontWeight: active ? 500 : 400, border: `1px solid ${active ? '#97C459' : '#e2e8f0'}`, background: active ? '#EAF3DE' : '#fff', color: active ? '#27500A' : '#64748b' }}>
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: '14px' }}>
                <label style={lbl}>Damage description</label>
                <textarea style={{ ...inp, height: '80px', resize: 'vertical' }}
                  value={draftDamage.damageDescription}
                  onChange={e => setDraftDamage((p: any) => ({ ...p, damageDescription: e.target.value }))}
                  placeholder="Describe the damage..." />
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '32px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <YNUDisplay label="Vehicle driveable" value={r.vehicleDriveable} />
                <YNUDisplay label="Tow in" value={r.towIn} />
                <YNUDisplay label="Total loss" value={r.totalLoss} />
              </div>
              {(() => {
                const zoneGroups = [
                  { key: 'front', label: 'Front', items: ['Bonnet','Front bumper','Front grille','Headlight (driver)','Headlight (passenger)','Front windscreen'] },
                  { key: 'driver', label: 'Driver side', items: ['Driver door','Driver mirror','Driver rear quarter','Driver front quarter','Driver running board'] },
                  { key: 'passenger', label: 'Passenger side', items: ['Passenger door','Passenger mirror','Passenger rear quarter','Passenger front quarter','Passenger running board'] },
                  { key: 'rear', label: 'Rear', items: ['Boot / tailgate','Rear bumper','Rear windscreen','Tail light (driver)','Tail light (passenger)'] },
                  { key: 'roof', label: 'Roof / other', items: ['Roof panel','Roof rack','Underbody / chassis','Wheels / tyres','Interior'] },
                ];
                const active = new Set<string>(r.damageComponents ?? []);
                const hasAny = active.size > 0 || r.damageDescription;
                if (!hasAny) return <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No damage recorded.</p>;
                return (
                  <div>
                    {zoneGroups.map(zone => {
                      const sel = zone.items.filter(i => active.has(i));
                      if (!sel.length) return null;
                      return (
                        <div key={zone.key} style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', marginBottom: '6px', overflow: 'hidden' }}>
                          <div style={{ padding: '11px 14px', display: 'flex', justifyContent: 'space-between', background: '#EAF3DE' }}>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#27500A' }}>{zone.label}</span>
                            <span style={{ fontSize: '11px', color: '#3B6D11' }}>{sel.length} selected</span>
                          </div>
                          <div style={{ padding: '12px 14px', borderTop: '0.5px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {sel.map(item => <span key={item} style={{ padding: '5px 12px', borderRadius: '999px', border: '1px solid #97C459', background: '#EAF3DE', color: '#27500A', fontSize: '12px', fontWeight: 500 }}>{item}</span>)}
                          </div>
                        </div>
                      );
                    })}
                    {r.damageDescription && (
                      <div style={{ marginTop: '14px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Damage description</div>
                        <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a' }}>{r.damageDescription}</div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </SectionBlock>
      )}

      {/* ═══════════════════════════════════════════════════════ TAB 5: SUPPORT */}
      {activeTab === 5 && (
        <>
          <SectionBlock
            title="Repairer Details"
            editing={isEditing('repairer')}
            onEdit={() => startEdit('repairer', () => setDraftRepairer({
              businessName: r.repairer?.businessName || '',
              phone: r.repairer?.phone || '',
              address: r.repairer?.address || '',
              suburb: r.repairer?.suburb || '',
              estimateDate: toDateInput(r.estimateDate),
              assessmentDate: toDateInput(r.assessmentDate),
              repairStartDate: toDateInput(r.repairStartDate),
              repairEndDate: toDateInput(r.repairEndDate),
              settlementReceived: r.settlementReceived || '',
              thirdPartyRecovery: r.thirdPartyRecovery || '',
            }))}
            onSave={() => patch('repairer', {
              repairer: { businessName: draftRepairer.businessName, phone: draftRepairer.phone, address: draftRepairer.address, suburb: draftRepairer.suburb },
              estimateDate: draftRepairer.estimateDate || undefined,
              assessmentDate: draftRepairer.assessmentDate || undefined,
              repairStartDate: draftRepairer.repairStartDate || undefined,
              repairEndDate: draftRepairer.repairEndDate || undefined,
              settlementReceived: draftRepairer.settlementReceived || undefined,
              thirdPartyRecovery: draftRepairer.thirdPartyRecovery || undefined,
            })}
            onCancel={() => cancelEdit('repairer')}
            saving={isSaving('repairer')}
          >
            {isEditing('repairer') ? (
              <div>
                <div style={grid2}>
                  <EField label="Repairer name" value={draftRepairer.businessName} onChange={v => setDraftRepairer((p: any) => ({ ...p, businessName: v }))} />
                  <EField label="Contact number" value={draftRepairer.phone} onChange={v => setDraftRepairer((p: any) => ({ ...p, phone: v }))} />
                  <EField label="Address" value={draftRepairer.address} onChange={v => setDraftRepairer((p: any) => ({ ...p, address: v }))} full />
                  <EField label="Suburb" value={draftRepairer.suburb} onChange={v => setDraftRepairer((p: any) => ({ ...p, suburb: v }))} />
                  <EField label="Estimate date" type="date" value={draftRepairer.estimateDate} onChange={v => setDraftRepairer((p: any) => ({ ...p, estimateDate: v }))} />
                  <EField label="Assessment date" type="date" value={draftRepairer.assessmentDate} onChange={v => setDraftRepairer((p: any) => ({ ...p, assessmentDate: v }))} />
                  <EField label="Repair start date" type="date" value={draftRepairer.repairStartDate} onChange={v => setDraftRepairer((p: any) => ({ ...p, repairStartDate: v }))} />
                  <EField label="Repair end date" type="date" value={draftRepairer.repairEndDate} onChange={v => setDraftRepairer((p: any) => ({ ...p, repairEndDate: v }))} />
                </div>
                <div style={{ display: 'flex', gap: '32px', marginTop: '20px', flexWrap: 'wrap' }}>
                  <YNUEdit label="Settlement letter received?" value={draftRepairer.settlementReceived} onChange={v => setDraftRepairer((p: any) => ({ ...p, settlementReceived: v }))} />
                  <YNUEdit label="3rd party recovery?" value={draftRepairer.thirdPartyRecovery} onChange={v => setDraftRepairer((p: any) => ({ ...p, thirdPartyRecovery: v }))} />
                </div>
              </div>
            ) : (
              <div>
                <div style={grid2}>
                  <Field label="Repairer name" value={r.repairer?.businessName} />
                  <Field label="Contact number" value={r.repairer?.phone} />
                  <Field label="Address" value={r.repairer?.address} full />
                  <Field label="Suburb" value={r.repairer?.suburb} />
                  <Field label="Estimate date" value={fmt(r.estimateDate)} />
                  <Field label="Assessment date" value={fmt(r.assessmentDate)} />
                  <Field label="Repair start date" value={fmt(r.repairStartDate)} />
                  <Field label="Repair end date" value={fmt(r.repairEndDate)} />
                </div>
                <div style={{ display: 'flex', gap: '32px', marginTop: '20px', flexWrap: 'wrap' }}>
                  <YNUDisplay label="Settlement letter received?" value={r.settlementReceived} />
                  <YNUDisplay label="3rd party recovery?" value={r.thirdPartyRecovery} />
                </div>
              </div>
            )}
          </SectionBlock>

          <SectionBlock
            title="Witness"
            editing={isEditing('witness')}
            onEdit={() => startEdit('witness', () => setDraftWitness({ witnessName: r.witnessName || '', witnessPhone: r.witnessPhone || '' }))}
            onSave={() => patch('witness', draftWitness)}
            onCancel={() => cancelEdit('witness')}
            saving={isSaving('witness')}
          >
            {isEditing('witness') ? (
              <div style={grid2}>
                <EField label="Witness name" value={draftWitness.witnessName} onChange={v => setDraftWitness((p: any) => ({ ...p, witnessName: v }))} />
                <EField label="Witness phone" value={draftWitness.witnessPhone} onChange={v => setDraftWitness((p: any) => ({ ...p, witnessPhone: v }))} />
              </div>
            ) : (
              <div style={grid2}>
                <Field label="Witness name" value={r.witnessName} />
                <Field label="Witness phone" value={r.witnessPhone} />
              </div>
            )}
          </SectionBlock>

          <SectionBlock
            title="Police"
            editing={isEditing('police')}
            onEdit={() => startEdit('police', () => setDraftPolice({ policeContactName: r.policeContactName || '', policePhone: r.policePhone || '', policeEventNo: r.policeEventNo || '' }))}
            onSave={() => patch('police', draftPolice)}
            onCancel={() => cancelEdit('police')}
            saving={isSaving('police')}
          >
            {isEditing('police') ? (
              <div style={grid2}>
                <EField label="Contact name" value={draftPolice.policeContactName} onChange={v => setDraftPolice((p: any) => ({ ...p, policeContactName: v }))} />
                <EField label="Phone" value={draftPolice.policePhone} onChange={v => setDraftPolice((p: any) => ({ ...p, policePhone: v }))} />
                <EField label="Event number" value={draftPolice.policeEventNo} onChange={v => setDraftPolice((p: any) => ({ ...p, policeEventNo: v }))} />
              </div>
            ) : (
              <div style={grid2}>
                <Field label="Contact name" value={r.policeContactName} />
                <Field label="Phone" value={r.policePhone} />
                <Field label="Event number" value={r.policeEventNo} />
              </div>
            )}
          </SectionBlock>

          {/* Notes */}
          <div style={sectionBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Notes</h3>
              <button onClick={() => setShowNotesModal(true)} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #01ae42', background: '#fff', color: '#01ae42', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>+ Add note</button>
            </div>
            {notes?.length > 0 ? notes.map((note: any) => (
              <div key={note.id} style={{ padding: '12px 16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#01ae42' }}>{note.authorName}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(note.createdAt).toLocaleString('en-AU')}</span>
                </div>
                <p style={{ fontSize: '14px', color: '#0f172a', margin: 0 }}>{note.note}</p>
              </div>
            )) : <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No notes yet.</p>}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════ TAB 6: CARDS */}
      {activeTab === 6 && (
        <>
          <div style={sectionBox}>
            <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Payment Cards</h3>
            {!r.paymentCards?.length ? (
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No payment cards on file.</p>
            ) : r.paymentCards.map((card: any) => (
              <div key={card.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{card.cardType} — {card.cardholderName}</div>
                  {card.referenceCode && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Ref: <strong style={{ color: '#01ae42' }}>{card.referenceCode}</strong></div>}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{card.expiryDate}</div>
              </div>
            ))}
          </div>

          <div style={sectionBox}>
            <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Additional Drivers</h3>
            {!r.additionalDrivers?.length ? (
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No additional drivers.</p>
            ) : (
              <div style={grid2}>
                {r.additionalDrivers.map((d: any) => (
                  <div key={d.id} style={{ padding: '14px 16px', background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{d.firstName} {d.lastName}</div>
                    {d.licenceNumber && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Licence: {d.licenceNumber}</div>}
                    {d.phone && <div style={{ fontSize: '12px', color: '#64748b' }}>Phone: {d.phone}</div>}
                    {d.dob && <div style={{ fontSize: '12px', color: '#64748b' }}>DOB: {d.dob}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Cancel Modal ── */}
      {showCancelModal && (
        <Modal title="Cancel reservation" onClose={() => setShowCancelModal(false)}>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: 0 }}>Are you sure you want to cancel <strong>{r.reservationNumber}</strong>? This cannot be undone.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCancelModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Keep</button>
            <button onClick={() => cancelReservation.mutate()} disabled={cancelReservation.isPending}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: cancelReservation.isPending ? '#fca5a5' : '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              {cancelReservation.isPending ? 'Cancelling...' : 'Confirm cancellation'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Schedule Modal ── */}
      {showEditScheduleModal && r.delivery && (
        <Modal title="Edit Schedule" onClose={() => setShowEditScheduleModal(false)}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Delivery date *</label>
                <input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }} value={scheduleForm.date} onChange={e => setScheduleForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Delivery time *</label>
                <input type="time" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }} value={scheduleForm.time} onChange={e => setScheduleForm(p => ({ ...p, time: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Address *</label>
              <input style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }} value={scheduleForm.address} onChange={e => setScheduleForm(p => ({ ...p, address: e.target.value }))} placeholder="Street address" />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Suburb *</label>
              <input style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }} value={scheduleForm.suburb} onChange={e => setScheduleForm(p => ({ ...p, suburb: e.target.value }))} placeholder="Suburb" />
            </div>
            <button
              disabled={!scheduleForm.date || !scheduleForm.time || !scheduleForm.address || !scheduleForm.suburb || scheduleSaving}
              onClick={async () => {
                if (!scheduleForm.date || !scheduleForm.time || !scheduleForm.address || !scheduleForm.suburb) return;
                setScheduleSaving(true);
                try {
                  const token = await getToken();
                  const scheduledAt = new Date(`${scheduleForm.date}T${scheduleForm.time}:00`).toISOString();
                  await api.patch(`/logistics/${r.delivery.id}`, { address: scheduleForm.address, suburb: scheduleForm.suburb, scheduledAt }, { headers: { Authorization: `Bearer ${token}` } });
                  await queryClient.invalidateQueries({ queryKey: ['reservation', id] });
                  setShowEditScheduleModal(false);
                } finally {
                  setScheduleSaving(false);
                }
              }}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: (!scheduleForm.date || !scheduleForm.time || !scheduleForm.address || !scheduleForm.suburb) ? '#e2e8f0' : '#01ae42', color: (!scheduleForm.date || !scheduleForm.time || !scheduleForm.address || !scheduleForm.suburb) ? '#94a3b8' : '#fff' }}
            >
              {scheduleSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Add to Schedule Modal ── */}
      {showScheduleModal && (
        <Modal title="Add to Schedule" onClose={() => setShowScheduleModal(false)}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Delivery date *</label>
                <input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }} value={scheduleForm.date} onChange={e => setScheduleForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Delivery time *</label>
                <input type="time" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }} value={scheduleForm.time} onChange={e => setScheduleForm(p => ({ ...p, time: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px', display: 'block' }}>Delivery location</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { key: 'customer', label: "Customer's home address", sub: r.customer?.address ? `${r.customer.address}, ${r.customer.suburb || ''}`.trim().replace(/,$/, '') : 'No address on file', disabled: !r.customer?.address },
                  { key: 'repairer', label: 'Repair shop', sub: r.repairer?.address ? `${r.repairer.address}, ${r.repairer.suburb || ''}`.trim().replace(/,$/, '') : 'No repairer address on file', disabled: !r.repairer?.address },
                  { key: 'manual', label: 'Enter address manually', sub: '', disabled: false },
                ].map(opt => (
                  <button key={opt.key} type="button" disabled={opt.disabled}
                    onClick={() => {
                      if (opt.disabled) return;
                      if (opt.key === 'customer') setScheduleForm(p => ({ ...p, addressMode: 'customer', address: r.customer?.address || '', suburb: r.customer?.suburb || '' }));
                      else if (opt.key === 'repairer') setScheduleForm(p => ({ ...p, addressMode: 'repairer', address: r.repairer?.address || '', suburb: r.repairer?.suburb || '' }));
                      else setScheduleForm(p => ({ ...p, addressMode: 'manual', address: '', suburb: '' }));
                    }}
                    style={{ padding: '12px 16px', borderRadius: '8px', textAlign: 'left', cursor: opt.disabled ? 'not-allowed' : 'pointer', border: `1.5px solid ${scheduleForm.addressMode === opt.key ? '#01ae42' : '#e2e8f0'}`, background: scheduleForm.addressMode === opt.key ? '#f0fdf4' : opt.disabled ? '#f8fafc' : '#fff', opacity: opt.disabled ? 0.5 : 1 }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: scheduleForm.addressMode === opt.key ? '#01ae42' : '#0f172a' }}>{opt.label}</div>
                    {opt.sub && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{opt.sub}</div>}
                  </button>
                ))}
              </div>
            </div>
            {scheduleForm.addressMode === 'manual' && (
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Address *</label>
                  <input style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }} value={scheduleForm.address} onChange={e => setScheduleForm(p => ({ ...p, address: e.target.value }))} placeholder="Street address" />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Suburb *</label>
                  <input style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }} value={scheduleForm.suburb} onChange={e => setScheduleForm(p => ({ ...p, suburb: e.target.value }))} placeholder="Suburb" />
                </div>
              </div>
            )}
            {(scheduleForm.addressMode === 'customer' || scheduleForm.addressMode === 'repairer') && scheduleForm.address && (
              <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '13px', color: '#065f46' }}>
                📍 {scheduleForm.address}{scheduleForm.suburb ? `, ${scheduleForm.suburb}` : ''}
              </div>
            )}
            <button
              disabled={!scheduleForm.date || !scheduleForm.time || !scheduleForm.address || !scheduleForm.suburb || scheduleSaving}
              onClick={async () => {
                if (!scheduleForm.date || !scheduleForm.time || !scheduleForm.address || !scheduleForm.suburb) return;
                setScheduleSaving(true);
                try {
                  const token = await getToken();
                  const scheduledAt = new Date(`${scheduleForm.date}T${scheduleForm.time}:00`).toISOString();
                  await api.post('/logistics', { reservationId: id, address: scheduleForm.address, suburb: scheduleForm.suburb, scheduledAt, jobType: 'DELIVERY' }, { headers: { Authorization: `Bearer ${token}` } });
                  await queryClient.invalidateQueries({ queryKey: ['reservation', id] });
                  setShowScheduleModal(false);
                } finally {
                  setScheduleSaving(false);
                }
              }}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: (!scheduleForm.date || !scheduleForm.time || !scheduleForm.address || !scheduleForm.suburb) ? '#e2e8f0' : '#01ae42', color: (!scheduleForm.date || !scheduleForm.time || !scheduleForm.address || !scheduleForm.suburb) ? '#94a3b8' : '#fff' }}
            >
              {scheduleSaving ? 'Scheduling...' : 'Confirm — Add to Schedule'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Notes Modal ── */}
      {showNotesModal && (
        <Modal title="Add note" onClose={() => setShowNotesModal(false)}>
          <label style={lbl}>Note</label>
          <textarea style={{ ...inp, height: '100px', resize: 'vertical', marginBottom: '12px' }} value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Enter your note here..." />
          <button onClick={() => addNote.mutate()} disabled={!newNote.trim() || addNote.isPending}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: !newNote.trim() ? '#86efac' : '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            {addNote.isPending ? 'Saving...' : 'Save note'}
          </button>
        </Modal>
      )}
    </div>
  );
}
