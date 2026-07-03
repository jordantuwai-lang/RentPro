'use client';
import { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { SectionBlock, F, inp, grid2, grid3 } from '../shared/styles';

const STATUS_COLORS: Record<string, string> = { OPEN: '#f59e0b', IN_PROGRESS: '#3b82f6', CLOSED: '#64748b' };

export function ClaimsTab({ reservationId, claim }: { reservationId: string; claim: any }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [claimForm, setClaimForm] = useState<any>({});
  const [editingClaim, setEditingClaim] = useState(false);

  const c = claim || {};

  const { data: insurers = [] } = useQuery({
    queryKey: ['insurers'],
    queryFn: async () => { const token = await getToken(); const res = await api.get('/claims/insurers', { headers: { Authorization: `Bearer ${token}` } }); return res.data; },
  });

  const { data: repairers = [] } = useQuery({
    queryKey: ['repairers'],
    queryFn: async () => { const token = await getToken(); const res = await api.get('/claims/repairers', { headers: { Authorization: `Bearer ${token}` } }); return res.data; },
  });

  const updateClaim = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      if (!c.id) return;
      return api.patch(`/claims/${c.id}`, data, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reservation', reservationId] }); setEditingClaim(false); },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!c.id) return;
      const authorName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Staff';
      return api.post(`/claims/${c.id}/notes`, { note: noteText, authorName }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => { setNoteText(''); qc.invalidateQueries({ queryKey: ['reservation', reservationId] }); },
  });

  return (
    <>
      <SectionBlock title="Claim Details">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {c.status && <span style={{ background: (STATUS_COLORS[c.status] || '#64748b') + '20', color: STATUS_COLORS[c.status] || '#64748b', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{c.status?.replace('_', ' ')}</span>}
          </div>
          <button onClick={() => { setClaimForm({ claimNumber: c.claimNumber || '', claimReference: c.claimReference || '', insurerId: c.insurerId || '', repairerId: c.repairerId || '', status: c.status || 'OPEN' }); setEditingClaim(true); }}
            style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
        </div>
        {editingClaim ? (
          <div style={grid2}>
            <F label="Claim number"><input style={inp} value={claimForm.claimNumber || ''} onChange={e => setClaimForm((f: any) => ({ ...f, claimNumber: e.target.value }))} /></F>
            <F label="Claim reference"><input style={inp} value={claimForm.claimReference || ''} onChange={e => setClaimForm((f: any) => ({ ...f, claimReference: e.target.value }))} /></F>
            <F label="Status">
              <select style={inp} value={claimForm.status} onChange={e => setClaimForm((f: any) => ({ ...f, status: e.target.value }))}>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOSED">Closed</option>
              </select>
            </F>
            <F label="Insurer">
              <select style={inp} value={claimForm.insurerId} onChange={e => setClaimForm((f: any) => ({ ...f, insurerId: e.target.value }))}>
                <option value="">Select...</option>
                {insurers.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </F>
            <F label="Repairer">
              <select style={inp} value={claimForm.repairerId} onChange={e => setClaimForm((f: any) => ({ ...f, repairerId: e.target.value }))}>
                <option value="">Select...</option>
                {repairers.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </F>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingClaim(false)} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => updateClaim.mutate(claimForm)} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        ) : (
          <div style={grid2}>
            {[['Claim number', c.claimNumber], ['Claim reference', c.claimReference], ['Insurer', c.insurer?.name], ['Repairer', c.repairer?.name]].map(([label, value]) => (
              <div key={label as string}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: value ? '#0f172a' : '#cbd5e1' }}>{(value as string) || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </SectionBlock>

      <SectionBlock title="Repair Timeline">
        <div style={grid3}>
          {[
            ['Estimate date', c.repairDetails?.estimateDate],
            ['Assessment date', c.repairDetails?.assessmentDate],
            ['Repair start', c.repairDetails?.repairStartDate],
            ['Repair end', c.repairDetails?.repairEndDate],
            ['Invoice #', c.repairDetails?.invoiceNumber],
            ['Invoice amount', c.repairDetails?.invoiceAmount ? `$${parseFloat(c.repairDetails.invoiceAmount).toFixed(2)}` : null],
          ].map(([label, value]) => (
            <div key={label as string}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '13px', color: value ? '#0f172a' : '#cbd5e1' }}>{typeof value === 'string' && value.includes('T') ? new Date(value).toLocaleDateString('en-AU') : (value as string) || '—'}</div>
            </div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Claim Notes">
        <div style={{ marginBottom: '16px' }}>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a claim note..." style={{ ...inp, height: '80px', resize: 'vertical', marginBottom: '8px' }} />
          <button onClick={() => addNote.mutate()} disabled={!noteText.trim() || addNote.isPending}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: noteText.trim() ? '#01ae42' : '#e2e8f0', color: noteText.trim() ? '#fff' : '#94a3b8', fontSize: '13px', cursor: noteText.trim() ? 'pointer' : 'not-allowed' }}>
            {addNote.isPending ? 'Adding...' : 'Add note'}
          </button>
        </div>
        {(c.notes || []).length === 0 ? <p style={{ color: '#94a3b8', fontSize: '13px' }}>No claim notes yet.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...(c.notes || [])].reverse().map((n: any) => (
              <div key={n.id} style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 14px', borderLeft: '3px solid #01ae42' }}>
                <div style={{ fontSize: '13px', color: '#0f172a', marginBottom: '6px', lineHeight: 1.5 }}>{n.note}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{n.authorName} · {new Date(n.createdAt).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
          </div>
        )}
      </SectionBlock>
    </>
  );
}
