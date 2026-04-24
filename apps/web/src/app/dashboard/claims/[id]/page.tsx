'use client';
import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ReservationDetail from '@/components/ReservationDetail';

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px', display: 'block' };
const sB: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px' };
const sT: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#64748b', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.1em' };
const g2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
const g3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' };
const SC: Record<string, string> = { OPEN: '#f59e0b', IN_PROGRESS: '#3b82f6', CLOSED: '#64748b' };
const TABS = ['Main', 'Customer', 'At Fault', 'Other Party', 'Accident', 'Damages', 'Photos', 'Additional', 'Claims Panel', 'Documents'];

export default function ClaimsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [claimForm, setClaimForm] = useState<any>({});
  const [editingClaim, setEditingClaim] = useState(false);

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: insurers = [] } = useQuery({
    queryKey: ['insurers'],
    enabled: isLoaded,
    queryFn: async () => { const token = await getToken(); const res = await api.get('/claims/insurers', { headers: { Authorization: `Bearer ${token}` } }); return res.data; },
  });

  const { data: repairers = [] } = useQuery({
    queryKey: ['repairers'],
    enabled: isLoaded,
    queryFn: async () => { const token = await getToken(); const res = await api.get('/claims/repairers', { headers: { Authorization: `Bearer ${token}` } }); return res.data; },
  });

  const updateClaim = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      const claimId = reservation?.claim?.id;
      if (!claimId) return;
      return api.patch(`/claims/${claimId}`, data, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reservation', id] }); setEditingClaim(false); },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const claimId = reservation?.claim?.id;
      if (!claimId) return;
      const authorName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Staff';
      return api.post(`/claims/${claimId}/notes`, { note: noteText, authorName }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => { setNoteText(''); qc.invalidateQueries({ queryKey: ['reservation', id] }); },
  });

  if (isLoading || !reservation) return <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>Loading...</div>;

  const r = reservation;
  const claim = r.claim || {};
  const days = Math.max(0, Math.floor((new Date().getTime() - new Date(r.startDate).getTime()) / 86400000));

  const extraContent = (tabIndex: number) => {
    if (tabIndex === 8) return (
      <>
        <div style={sB}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={sT}>Claim Details</h3>
            <button onClick={() => { setClaimForm({ claimNumber: claim.claimNumber || '', claimReference: claim.claimReference || '', insurerId: claim.insurerId || '', repairerId: claim.repairerId || '', status: claim.status || 'OPEN' }); setEditingClaim(true); }} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            {claim.status && <span style={{ background: SC[claim.status] + '20', color: SC[claim.status], padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{claim.status?.replace('_', ' ')}</span>}
            <span style={{ fontSize: '12px', color: days > 30 ? '#ef4444' : '#64748b' }}>{days > 30 && '⚠ '}{days} days on hire</span>
          </div>
          {editingClaim ? (
            <div style={g2}>
              {[['claimNumber', 'Claim number'], ['claimReference', 'Claim reference']].map(([k, label]) => (
                <div key={k}><label style={lbl}>{label}</label><input style={inp} value={claimForm[k] || ''} onChange={e => setClaimForm((f: any) => ({ ...f, [k]: e.target.value }))} /></div>
              ))}
              <div><label style={lbl}>Status</label><select style={inp} value={claimForm.status} onChange={e => setClaimForm((f: any) => ({ ...f, status: e.target.value }))}><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="CLOSED">Closed</option></select></div>
              <div><label style={lbl}>Insurer</label><select style={inp} value={claimForm.insurerId} onChange={e => setClaimForm((f: any) => ({ ...f, insurerId: e.target.value }))}><option value="">Select...</option>{insurers.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
              <div><label style={lbl}>Repairer</label><select style={inp} value={claimForm.repairerId} onChange={e => setClaimForm((f: any) => ({ ...f, repairerId: e.target.value }))}><option value="">Select...</option>{repairers.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setEditingClaim(false)} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => updateClaim.mutate(claimForm)} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
              </div>
            </div>
          ) : (
            <div style={g2}>
              {[['Claim number', claim.claimNumber], ['Claim reference', claim.claimReference], ['Insurer', claim.insurer?.name], ['Repairer', claim.repairer?.name], ['File number', r.fileNumber]].map(([label, value]) => (
                <div key={label as string}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
                  <div style={{ fontSize: '13px', color: value ? '#0f172a' : '#cbd5e1' }}>{(value as string) || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={sB}>
          <h3 style={sT}>Repair Timeline</h3>
          <div style={g3}>
            {[['Estimate date', claim.repairDetails?.estimateDate], ['Assessment date', claim.repairDetails?.assessmentDate], ['Repair start', claim.repairDetails?.repairStartDate], ['Repair end', claim.repairDetails?.repairEndDate], ['Invoice #', claim.repairDetails?.invoiceNumber], ['Invoice amount', claim.repairDetails?.invoiceAmount ? `$${parseFloat(claim.repairDetails.invoiceAmount).toFixed(2)}` : null]].map(([label, value]) => (
              <div key={label as string}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: value ? '#0f172a' : '#cbd5e1' }}>{typeof value === 'string' && value.includes('T') ? new Date(value).toLocaleDateString('en-AU') : (value as string) || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={sB}>
          <h3 style={sT}>Claim Notes</h3>
          <div style={{ marginBottom: '16px' }}>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a claim note..." style={{ ...inp, height: '80px', resize: 'vertical', marginBottom: '8px' }} />
            <button onClick={() => addNote.mutate()} disabled={!noteText.trim() || addNote.isPending} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: noteText.trim() ? '#01ae42' : '#e2e8f0', color: noteText.trim() ? '#fff' : '#94a3b8', fontSize: '13px', cursor: noteText.trim() ? 'pointer' : 'not-allowed' }}>
              {addNote.isPending ? 'Adding...' : 'Add note'}
            </button>
          </div>
          {(claim.notes || []).length === 0 ? <p style={{ color: '#94a3b8', fontSize: '13px' }}>No claim notes yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...(claim.notes || [])].reverse().map((n: any) => (
                <div key={n.id} style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 14px', borderLeft: '3px solid #01ae42' }}>
                  <div style={{ fontSize: '13px', color: '#0f172a', marginBottom: '6px', lineHeight: 1.5 }}>{n.note}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{n.authorName} · {new Date(n.createdAt).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );

    if (tabIndex === 9) return (
      <>
        {[{ icon: '📋', title: 'Authority to Act' }, { icon: '📝', title: 'Rental Agreement' }].map(doc => (
          <div key={doc.title} style={sB}>
            <h3 style={sT}>{doc.title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', border: '1.5px dashed #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
              <span style={{ fontSize: '28px' }}>{doc.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '3px' }}>{doc.title}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{r.status === 'ACTIVE' ? 'Ready to sign.' : 'Available once on hire.'}</div>
              </div>
              {r.status === 'ACTIVE' && <button style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Sign now</button>}
            </div>
          </div>
        ))}
      </>
    );

    return null;
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{claim.claimNumber || r.reservationNumber}</h1>
          {r.fileNumber && <span style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '6px', padding: '3px 10px', fontSize: '13px', fontWeight: 600, color: '#01ae42', fontFamily: 'monospace' }}>{r.fileNumber}</span>}
          {claim.status && <span style={{ background: SC[claim.status] + '20', color: SC[claim.status], padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{claim.status?.replace('_', ' ')}</span>}
        </div>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{r.customer?.firstName} {r.customer?.lastName} · {days} days on hire · {claim.insurer?.name || 'No insurer'}</p>
      </div>

      <ReservationDetail reservationId={id} reservation={reservation} tabs={TABS} extraTabContent={extraContent} onSaveSuccess={() => qc.invalidateQueries({ queryKey: ['reservation', id] })} />

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 50 }}>
        <button onClick={() => router.push('/dashboard/claims')} style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
      </div>
    </div>
  );
}