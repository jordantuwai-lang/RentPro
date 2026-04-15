'use client';
import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';

// ─── Styles ───────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  color: '#0f172a',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
};
const section: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  padding: '20px 24px',
  marginBottom: '16px',
};
const heading: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  margin: '0 0 16px 0',
};
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' };
const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' };
const full: React.CSSProperties = { gridColumn: '1 / -1' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function F({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div style={span ? full : {}}>
      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px', fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ background: color + '20', color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
      {label}
    </span>
  );
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  CLOSED: '#64748b',
};
const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  CLOSED: 'Closed',
};
const LIABILITY_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  ACCEPTED: '#01ae42',
  DISPUTED: '#ef4444',
  DENIED: '#64748b',
};

const daysOnHire = (claim: any) => {
  if (!claim?.reservation?.startDate) return 0;
  const start = new Date(claim.reservation.startDate);
  const end = claim.reservation.endDate ? new Date(claim.reservation.endDate) : new Date();
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
};

const fmt = (d?: string | null) => d ? new Date(d).toISOString().split('T')[0] : '';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [detailTab, setDetailTab] = useState<'overview' | 'accident' | 'atfault' | 'repair' | 'notes' | 'documents'>('overview');
  const [overviewForm, setOverviewForm] = useState<any>(null);
  const [accidentForm, setAccidentForm] = useState<any>(null);
  const [atFaultForm, setAtFaultForm] = useState<any>(null);
  const [repairForm, setRepairForm] = useState<any>(null);
  const [noteText, setNoteText] = useState('');

  // ─── Fetch claim ──────────────────────────────────────────────────────────

  const { data: claim, isLoading } = useQuery({
    queryKey: ['claim', id],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/claims/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const c = res.data;

      // Initialise all forms from fetched data
      setOverviewForm({
        status: c.status,
        claimReference: c.claimReference || '',
        claimHandlerName: c.claimHandlerName || '',
        claimHandlerPhone: c.claimHandlerPhone || '',
        claimHandlerEmail: c.claimHandlerEmail || '',
        sourceOfBusiness: c.sourceOfBusiness || '',
        hireType: c.hireType || '',
        typeOfCover: c.typeOfCover || '',
        policyNumber: c.policyNumber || '',
        excessAmount: c.excessAmount || '',
        liabilityStatus: c.liabilityStatus || 'PENDING',
        liabilityNotes: c.liabilityNotes || '',
        totalLoss: c.totalLoss ?? false,
        towIn: c.towIn ?? false,
        settlementReceived: c.settlementReceived ?? false,
        isDriverOwner: c.isDriverOwner ?? true,
        insurerId: c.insurerId || '',
        repairerId: c.repairerId || '',
      });

      setAccidentForm({
        accidentDate: fmt(c.accidentDetails?.accidentDate),
        accidentTime: c.accidentDetails?.accidentTime || '',
        accidentLocation: c.accidentDetails?.accidentLocation || '',
        accidentDescription: c.accidentDetails?.accidentDescription || '',
        policeAttended: c.accidentDetails?.policeAttended ?? false,
        policeEventNo: c.accidentDetails?.policeEventNo || '',
        policeStation: c.accidentDetails?.policeStation || '',
        policeContactName: c.accidentDetails?.policeContactName || '',
        policePhone: c.accidentDetails?.policePhone || '',
        witnessName: c.accidentDetails?.witnessName || '',
        witnessPhone: c.accidentDetails?.witnessPhone || '',
        witnessStatement: c.accidentDetails?.witnessStatement || '',
      });

      setAtFaultForm({
        firstName: c.atFaultParty?.firstName || '',
        lastName: c.atFaultParty?.lastName || '',
        phone: c.atFaultParty?.phone || '',
        email: c.atFaultParty?.email || '',
        dateOfBirth: c.atFaultParty?.dateOfBirth || '',
        streetAddress: c.atFaultParty?.streetAddress || '',
        suburb: c.atFaultParty?.suburb || '',
        state: c.atFaultParty?.state || '',
        postcode: c.atFaultParty?.postcode || '',
        licenceNumber: c.atFaultParty?.licenceNumber || '',
        licenceState: c.atFaultParty?.licenceState || '',
        licenceExpiry: c.atFaultParty?.licenceExpiry || '',
        vehicleRego: c.atFaultParty?.vehicleRego || '',
        vehicleMake: c.atFaultParty?.vehicleMake || '',
        vehicleModel: c.atFaultParty?.vehicleModel || '',
        vehicleYear: c.atFaultParty?.vehicleYear || '',
        vehicleColour: c.atFaultParty?.vehicleColour || '',
        theirInsurer: c.atFaultParty?.theirInsurer || '',
        theirPolicyNo: c.atFaultParty?.theirPolicyNo || '',
        theirClaimNo: c.atFaultParty?.theirClaimNo || '',
        companyName: c.atFaultParty?.companyName || '',
        companyABN: c.atFaultParty?.companyABN || '',
        companyPhone: c.atFaultParty?.companyPhone || '',
      });

      setRepairForm({
        estimateDate: fmt(c.repairDetails?.estimateDate),
        assessmentDate: fmt(c.repairDetails?.assessmentDate),
        repairStartDate: fmt(c.repairDetails?.repairStartDate),
        repairEndDate: fmt(c.repairDetails?.repairEndDate),
        invoiceNumber: c.repairDetails?.invoiceNumber || '',
        invoiceAmount: c.repairDetails?.invoiceAmount || '',
        authorisedAmount: c.repairDetails?.authorisedAmount || '',
        thirdPartyRecovery: c.repairDetails?.thirdPartyRecovery ?? false,
        recoveryAmount: c.repairDetails?.recoveryAmount || '',
        repairNotes: c.repairDetails?.repairNotes || '',
      });

      return c;
    },
  });

  const { data: insurers } = useQuery({
    queryKey: ['insurers'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/insurers', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: repairers } = useQuery({
    queryKey: ['repairers'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/repairers', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  // ─── Mutations ────────────────────────────────────────────────────────────

  const updateOverview = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await api.patch(`/claims/${id}`, overviewForm, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['claim', id] }),
  });

  const saveAccident = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await api.patch(`/claims/${id}/accident-details`, accidentForm, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['claim', id] }),
  });

  const saveAtFault = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await api.patch(`/claims/${id}/at-fault-party`, atFaultForm, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['claim', id] }),
  });

  const saveRepair = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await api.patch(`/claims/${id}/repair-details`, repairForm, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['claim', id] }),
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const authorName = user ? `${user.firstName} ${user.lastName}` : 'Staff';
      const res = await api.post(`/claims/${id}/notes`, { note: noteText, authorName }, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: () => {
      setNoteText('');
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
    },
  });

  // ─── Tab style ────────────────────────────────────────────────────────────

  const detailTabBtn = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: '0',
    border: 'none',
    borderBottom: active ? '2px solid #01ae42' : '2px solid transparent',
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    background: 'transparent',
    color: active ? '#0a2e14' : '#64748b',
    marginBottom: '-1px',
  });

  const saveBtn = (pending: boolean): React.CSSProperties => ({
    background: '#01ae42',
    color: '#fff',
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 500,
    cursor: pending ? 'not-allowed' : 'pointer',
    opacity: pending ? 0.7 : 1,
  });

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoading || !claim || !overviewForm) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
        Loading claim...
      </div>
    );
  }

  const days = daysOnHire(claim);
  const isOverdue = days >= 60;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <button
            onClick={() => router.push('/dashboard/claims')}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', padding: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            ← Back to claims
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#0a2e14', margin: 0 }}>{claim.claimNumber}</h1>
            <Badge label={STATUS_LABELS[claim.status] || claim.status} color={STATUS_COLORS[claim.status] || '#64748b'} />
            <Badge label={claim.liabilityStatus || 'PENDING'} color={LIABILITY_COLORS[claim.liabilityStatus] || '#f59e0b'} />
            {isOverdue && <Badge label={`${days}d — Overdue`} color="#ef4444" />}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            {claim.reservation?.customer?.firstName} {claim.reservation?.customer?.lastName}
            {claim.reservation?.fileNumber && <span> · File {claim.reservation.fileNumber}</span>}
            {claim.insurer && <span> · {claim.insurer.name}</span>}
            <span> · {days} days on hire</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', background: '#fff', borderRadius: '12px 12px 0 0', padding: '0 8px' }}>
        {([
          ['overview', 'Overview'],
          ['accident', 'Accident Details'],
          ['atfault', 'At Fault Party'],
          ['repair', 'Repair Details'],
          ['notes', `Notes (${claim.notes?.length || 0})`],
          ['documents', `Documents (${claim.documents?.length || 0})`],
        ] as [string, string][]).map(([key, label]) => (
          <button key={key} style={detailTabBtn(detailTab === key)} onClick={() => setDetailTab(key as any)}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW ══════════════ */}
      {detailTab === 'overview' && (
        <div>
          <div style={section}>
            <h2 style={heading}>Claim details</h2>
            <div style={grid2}>
              <F label="Insurer claim reference">
                <input style={inp} value={overviewForm.claimReference} onChange={e => setOverviewForm({ ...overviewForm, claimReference: e.target.value })} placeholder="e.g. AAMI-2026-48821" />
              </F>
              <F label="Status">
                <select style={inp} value={overviewForm.status} onChange={e => setOverviewForm({ ...overviewForm, status: e.target.value })}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </F>
              <F label="Insurer">
                <select style={inp} value={overviewForm.insurerId} onChange={e => setOverviewForm({ ...overviewForm, insurerId: e.target.value })}>
                  <option value="">Select insurer</option>
                  {(insurers || []).map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </F>
              <F label="Repairer">
                <select style={inp} value={overviewForm.repairerId} onChange={e => setOverviewForm({ ...overviewForm, repairerId: e.target.value })}>
                  <option value="">Select repairer</option>
                  {(repairers || []).map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </F>
              <F label="Hire type">
                <select style={inp} value={overviewForm.hireType} onChange={e => setOverviewForm({ ...overviewForm, hireType: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="CREDIT_HIRE">Credit Hire</option>
                  <option value="DIRECT_HIRE">Direct Hire</option>
                </select>
              </F>
              <F label="Type of cover">
                <select style={inp} value={overviewForm.typeOfCover} onChange={e => setOverviewForm({ ...overviewForm, typeOfCover: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="CTP">CTP</option>
                  <option value="TPP">TPP</option>
                  <option value="COMP">Comprehensive</option>
                </select>
              </F>
              <F label="Policy number">
                <input style={inp} value={overviewForm.policyNumber} onChange={e => setOverviewForm({ ...overviewForm, policyNumber: e.target.value })} />
              </F>
              <F label="Excess amount ($)">
                <input style={inp} type="number" value={overviewForm.excessAmount} onChange={e => setOverviewForm({ ...overviewForm, excessAmount: e.target.value })} placeholder="0.00" />
              </F>
              <F label="Source of business">
                <select style={inp} value={overviewForm.sourceOfBusiness} onChange={e => setOverviewForm({ ...overviewForm, sourceOfBusiness: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="Repairer">Repairer</option>
                  <option value="Tow Operator">Tow Operator</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Corporate Partnerships">Corporate Partnerships</option>
                </select>
              </F>
              <F label="Liability status">
                <select style={inp} value={overviewForm.liabilityStatus} onChange={e => setOverviewForm({ ...overviewForm, liabilityStatus: e.target.value })}>
                  <option value="PENDING">Pending</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="DISPUTED">Disputed</option>
                  <option value="DENIED">Denied</option>
                </select>
              </F>
              <F label="Liability notes" span>
                <textarea style={{ ...inp, height: '60px', resize: 'none', fontFamily: 'inherit' }} value={overviewForm.liabilityNotes} onChange={e => setOverviewForm({ ...overviewForm, liabilityNotes: e.target.value })} />
              </F>
            </div>
          </div>

          <div style={section}>
            <h2 style={heading}>Claim handler (insurer)</h2>
            <div style={grid3}>
              <F label="Handler name">
                <input style={inp} value={overviewForm.claimHandlerName} onChange={e => setOverviewForm({ ...overviewForm, claimHandlerName: e.target.value })} placeholder="Jane Smith" />
              </F>
              <F label="Handler phone">
                <input style={inp} value={overviewForm.claimHandlerPhone} onChange={e => setOverviewForm({ ...overviewForm, claimHandlerPhone: e.target.value })} />
              </F>
              <F label="Handler email">
                <input style={inp} value={overviewForm.claimHandlerEmail} onChange={e => setOverviewForm({ ...overviewForm, claimHandlerEmail: e.target.value })} />
              </F>
            </div>
          </div>

          <div style={section}>
            <h2 style={heading}>Flags</h2>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {([
                ['totalLoss', 'Total loss'],
                ['towIn', 'Tow in'],
                ['settlementReceived', 'Settlement received'],
                ['isDriverOwner', 'Driver is vehicle owner'],
              ] as [string, string][]).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={overviewForm[key] ?? false} onChange={e => setOverviewForm({ ...overviewForm, [key]: e.target.checked })} style={{ width: '15px', height: '15px', accentColor: '#01ae42' }} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => updateOverview.mutate()} disabled={updateOverview.isPending} style={saveBtn(updateOverview.isPending)}>
              {updateOverview.isPending ? 'Saving...' : 'Save overview'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ ACCIDENT DETAILS ══════════════ */}
      {detailTab === 'accident' && accidentForm && (
        <div>
          <div style={section}>
            <h2 style={heading}>Accident details</h2>
            <div style={grid2}>
              <F label="Accident date"><input style={inp} type="date" value={accidentForm.accidentDate} onChange={e => setAccidentForm({ ...accidentForm, accidentDate: e.target.value })} /></F>
              <F label="Accident time"><input style={inp} type="time" value={accidentForm.accidentTime} onChange={e => setAccidentForm({ ...accidentForm, accidentTime: e.target.value })} /></F>
              <F label="Accident location" span><input style={inp} value={accidentForm.accidentLocation} onChange={e => setAccidentForm({ ...accidentForm, accidentLocation: e.target.value })} placeholder="Street, suburb, state" /></F>
              <F label="Accident description" span>
                <textarea style={{ ...inp, height: '80px', resize: 'none', fontFamily: 'inherit' }} value={accidentForm.accidentDescription} onChange={e => setAccidentForm({ ...accidentForm, accidentDescription: e.target.value })} />
              </F>
            </div>
          </div>

          <div style={section}>
            <h2 style={heading}>Police details</h2>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={accidentForm.policeAttended ?? false} onChange={e => setAccidentForm({ ...accidentForm, policeAttended: e.target.checked })} style={{ width: '15px', height: '15px', accentColor: '#01ae42' }} />
                Police attended the scene
              </label>
            </div>
            <div style={grid2}>
              <F label="Event number"><input style={inp} value={accidentForm.policeEventNo} onChange={e => setAccidentForm({ ...accidentForm, policeEventNo: e.target.value })} /></F>
              <F label="Police station"><input style={inp} value={accidentForm.policeStation} onChange={e => setAccidentForm({ ...accidentForm, policeStation: e.target.value })} /></F>
              <F label="Contact name"><input style={inp} value={accidentForm.policeContactName} onChange={e => setAccidentForm({ ...accidentForm, policeContactName: e.target.value })} /></F>
              <F label="Contact phone"><input style={inp} value={accidentForm.policePhone} onChange={e => setAccidentForm({ ...accidentForm, policePhone: e.target.value })} /></F>
            </div>
          </div>

          <div style={section}>
            <h2 style={heading}>Witness details</h2>
            <div style={grid2}>
              <F label="Witness name"><input style={inp} value={accidentForm.witnessName} onChange={e => setAccidentForm({ ...accidentForm, witnessName: e.target.value })} /></F>
              <F label="Witness phone"><input style={inp} value={accidentForm.witnessPhone} onChange={e => setAccidentForm({ ...accidentForm, witnessPhone: e.target.value })} /></F>
              <F label="Witness statement" span>
                <textarea style={{ ...inp, height: '70px', resize: 'none', fontFamily: 'inherit' }} value={accidentForm.witnessStatement} onChange={e => setAccidentForm({ ...accidentForm, witnessStatement: e.target.value })} />
              </F>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => saveAccident.mutate()} disabled={saveAccident.isPending} style={saveBtn(saveAccident.isPending)}>
              {saveAccident.isPending ? 'Saving...' : 'Save accident details'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ AT FAULT PARTY ══════════════ */}
      {detailTab === 'atfault' && atFaultForm && (
        <div>
          <div style={section}>
            <h2 style={heading}>At fault driver</h2>
            <div style={grid3}>
              <F label="First name"><input style={inp} value={atFaultForm.firstName} onChange={e => setAtFaultForm({ ...atFaultForm, firstName: e.target.value })} /></F>
              <F label="Last name"><input style={inp} value={atFaultForm.lastName} onChange={e => setAtFaultForm({ ...atFaultForm, lastName: e.target.value })} /></F>
              <F label="Date of birth"><input style={inp} value={atFaultForm.dateOfBirth} onChange={e => setAtFaultForm({ ...atFaultForm, dateOfBirth: e.target.value })} placeholder="DD/MM/YYYY" /></F>
              <F label="Phone"><input style={inp} value={atFaultForm.phone} onChange={e => setAtFaultForm({ ...atFaultForm, phone: e.target.value })} /></F>
              <F label="Email"><input style={inp} value={atFaultForm.email} onChange={e => setAtFaultForm({ ...atFaultForm, email: e.target.value })} /></F>
              <div />
              <F label="Street address" span><input style={inp} value={atFaultForm.streetAddress} onChange={e => setAtFaultForm({ ...atFaultForm, streetAddress: e.target.value })} /></F>
              <F label="Suburb"><input style={inp} value={atFaultForm.suburb} onChange={e => setAtFaultForm({ ...atFaultForm, suburb: e.target.value })} /></F>
              <F label="State"><input style={inp} value={atFaultForm.state} onChange={e => setAtFaultForm({ ...atFaultForm, state: e.target.value })} placeholder="VIC" /></F>
              <F label="Postcode"><input style={inp} value={atFaultForm.postcode} onChange={e => setAtFaultForm({ ...atFaultForm, postcode: e.target.value })} /></F>
            </div>
          </div>

          <div style={section}>
            <h2 style={heading}>Licence</h2>
            <div style={grid3}>
              <F label="Licence number"><input style={inp} value={atFaultForm.licenceNumber} onChange={e => setAtFaultForm({ ...atFaultForm, licenceNumber: e.target.value })} /></F>
              <F label="Licence state"><input style={inp} value={atFaultForm.licenceState} onChange={e => setAtFaultForm({ ...atFaultForm, licenceState: e.target.value })} placeholder="VIC" /></F>
              <F label="Licence expiry"><input style={inp} value={atFaultForm.licenceExpiry} onChange={e => setAtFaultForm({ ...atFaultForm, licenceExpiry: e.target.value })} placeholder="DD/MM/YYYY" /></F>
            </div>
          </div>

          <div style={section}>
            <h2 style={heading}>Their vehicle</h2>
            <div style={grid3}>
              <F label="Registration"><input style={inp} value={atFaultForm.vehicleRego} onChange={e => setAtFaultForm({ ...atFaultForm, vehicleRego: e.target.value })} /></F>
              <F label="Make"><input style={inp} value={atFaultForm.vehicleMake} onChange={e => setAtFaultForm({ ...atFaultForm, vehicleMake: e.target.value })} /></F>
              <F label="Model"><input style={inp} value={atFaultForm.vehicleModel} onChange={e => setAtFaultForm({ ...atFaultForm, vehicleModel: e.target.value })} /></F>
              <F label="Year"><input style={inp} type="number" value={atFaultForm.vehicleYear} onChange={e => setAtFaultForm({ ...atFaultForm, vehicleYear: e.target.value })} /></F>
              <F label="Colour"><input style={inp} value={atFaultForm.vehicleColour} onChange={e => setAtFaultForm({ ...atFaultForm, vehicleColour: e.target.value })} /></F>
            </div>
          </div>

          <div style={section}>
            <h2 style={heading}>Their insurance</h2>
            <div style={grid3}>
              <F label="Their insurer"><input style={inp} value={atFaultForm.theirInsurer} onChange={e => setAtFaultForm({ ...atFaultForm, theirInsurer: e.target.value })} /></F>
              <F label="Their policy #"><input style={inp} value={atFaultForm.theirPolicyNo} onChange={e => setAtFaultForm({ ...atFaultForm, theirPolicyNo: e.target.value })} /></F>
              <F label="Their claim #"><input style={inp} value={atFaultForm.theirClaimNo} onChange={e => setAtFaultForm({ ...atFaultForm, theirClaimNo: e.target.value })} /></F>
            </div>
          </div>

          <div style={section}>
            <h2 style={heading}>Company (if business vehicle)</h2>
            <div style={grid3}>
              <F label="Company name"><input style={inp} value={atFaultForm.companyName} onChange={e => setAtFaultForm({ ...atFaultForm, companyName: e.target.value })} /></F>
              <F label="ABN"><input style={inp} value={atFaultForm.companyABN} onChange={e => setAtFaultForm({ ...atFaultForm, companyABN: e.target.value })} /></F>
              <F label="Company phone"><input style={inp} value={atFaultForm.companyPhone} onChange={e => setAtFaultForm({ ...atFaultForm, companyPhone: e.target.value })} /></F>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => saveAtFault.mutate()} disabled={saveAtFault.isPending} style={saveBtn(saveAtFault.isPending)}>
              {saveAtFault.isPending ? 'Saving...' : 'Save at fault party'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ REPAIR DETAILS ══════════════ */}
      {detailTab === 'repair' && repairForm && (
        <div>
          <div style={section}>
            <h2 style={heading}>Repair timeline</h2>
            <div style={grid2}>
              <F label="Estimate date"><input style={inp} type="date" value={repairForm.estimateDate} onChange={e => setRepairForm({ ...repairForm, estimateDate: e.target.value })} /></F>
              <F label="Assessment date"><input style={inp} type="date" value={repairForm.assessmentDate} onChange={e => setRepairForm({ ...repairForm, assessmentDate: e.target.value })} /></F>
              <F label="Repair start date"><input style={inp} type="date" value={repairForm.repairStartDate} onChange={e => setRepairForm({ ...repairForm, repairStartDate: e.target.value })} /></F>
              <F label="Repair end date"><input style={inp} type="date" value={repairForm.repairEndDate} onChange={e => setRepairForm({ ...repairForm, repairEndDate: e.target.value })} /></F>
            </div>
          </div>

          <div style={section}>
            <h2 style={heading}>Invoice & financials</h2>
            <div style={grid2}>
              <F label="Invoice number"><input style={inp} value={repairForm.invoiceNumber} onChange={e => setRepairForm({ ...repairForm, invoiceNumber: e.target.value })} /></F>
              <F label="Invoice amount ($)"><input style={inp} type="number" value={repairForm.invoiceAmount} onChange={e => setRepairForm({ ...repairForm, invoiceAmount: e.target.value })} placeholder="0.00" /></F>
              <F label="Authorised amount ($)"><input style={inp} type="number" value={repairForm.authorisedAmount} onChange={e => setRepairForm({ ...repairForm, authorisedAmount: e.target.value })} placeholder="0.00" /></F>
              <F label="Recovery amount ($)"><input style={inp} type="number" value={repairForm.recoveryAmount} onChange={e => setRepairForm({ ...repairForm, recoveryAmount: e.target.value })} placeholder="0.00" /></F>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', marginTop: '24px' }}>
                  <input type="checkbox" checked={repairForm.thirdPartyRecovery ?? false} onChange={e => setRepairForm({ ...repairForm, thirdPartyRecovery: e.target.checked })} style={{ width: '15px', height: '15px', accentColor: '#01ae42' }} />
                  Third party recovery
                </label>
              </div>
            </div>
            <div style={{ marginTop: '14px' }}>
              <F label="Repair notes">
                <textarea style={{ ...inp, height: '70px', resize: 'none', fontFamily: 'inherit' }} value={repairForm.repairNotes} onChange={e => setRepairForm({ ...repairForm, repairNotes: e.target.value })} />
              </F>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => saveRepair.mutate()} disabled={saveRepair.isPending} style={saveBtn(saveRepair.isPending)}>
              {saveRepair.isPending ? 'Saving...' : 'Save repair details'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ NOTES ══════════════ */}
      {detailTab === 'notes' && (
        <div style={section}>
          <h2 style={heading}>Notes</h2>
          <div style={{ marginBottom: '16px' }}>
            {(!claim.notes || claim.notes.length === 0) && (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>No notes yet.</p>
            )}
            {(claim.notes || []).map((n: any) => (
              <div key={n.id} style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 14px', marginBottom: '10px', borderLeft: '3px solid #01ae42' }}>
                <div style={{ fontSize: '13px', color: '#0f172a', lineHeight: 1.6 }}>{n.note}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  {n.authorName} · {new Date(n.createdAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            ))}
          </div>
          <textarea
            style={{ ...inp, height: '80px', resize: 'none', fontFamily: 'inherit', marginBottom: '10px' }}
            placeholder="Add a note..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { if (noteText.trim()) addNote.mutate(); }}
              disabled={!noteText.trim() || addNote.isPending}
              style={{ background: noteText.trim() ? '#01ae42' : '#e2e8f0', color: noteText.trim() ? '#fff' : '#94a3b8', padding: '8px 20px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 500, cursor: noteText.trim() ? 'pointer' : 'not-allowed' }}
            >
              {addNote.isPending ? 'Saving...' : 'Add note'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ DOCUMENTS ══════════════ */}
      {detailTab === 'documents' && (
        <div style={section}>
          <h2 style={heading}>Documents</h2>
          {(!claim.documents || claim.documents.length === 0) ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>No documents attached yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(claim.documents || []).map((doc: any) => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{doc.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{doc.type}</div>
                  </div>
                  <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#01ae42', fontWeight: 500, textDecoration: 'none' }}>View</a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
