'use client';
import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const statusColors: Record<string, string> = { OPEN: '#f59e0b', IN_PROGRESS: '#3b82f6', CLOSED: '#64748b' };
const statusLabels: Record<string, string> = { OPEN: 'Open', IN_PROGRESS: 'In Progress', CLOSED: 'Closed' };

const section: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px' };
const heading: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.1em' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' };

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: value ? '#0f172a' : '#cbd5e1' }}>{value || '—'}</div>
    </div>
  );
}

function SectionEditButtons({ editing, onEdit, onSave, onCancel, saving }: any) {
  return editing ? (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button onClick={onSave} disabled={saving} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
        {saving ? 'Saving...' : 'Save'}
      </button>
      <button onClick={onCancel} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
    </div>
  ) : (
    <button onClick={onEdit} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>Edit</button>
  );
}

function daysOnHire(claim: any) {
  if (!claim?.reservation?.startDate) return 0;
  const start = new Date(claim.reservation.startDate);
  const end = claim.reservation.endDate ? new Date(claim.reservation.endDate) : new Date();
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
}

const TABS = ['Overview', 'At-Fault Party', 'Repair Timeline', 'Recovery', 'Notes'];

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [noteText, setNoteText] = useState('');

  // Edit states per section
  const [editingOverview, setEditingOverview] = useState(false);
  const [editingAtFault, setEditingAtFault] = useState(false);
  const [editingRepair, setEditingRepair] = useState(false);
  const [editingRecovery, setEditingRecovery] = useState(false);

  const [overviewForm, setOverviewForm] = useState<any>({});
  const [atFaultForm, setAtFaultForm] = useState<any>({});
  const [repairForm, setRepairForm] = useState<any>({});
  const [recoveryForm, setRecoveryForm] = useState<any>({});

  const { data: claim, isLoading } = useQuery({
    queryKey: ['claim', id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/claims/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: insurers = [] } = useQuery({
    queryKey: ['insurers'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/insurers', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: repairers = [] } = useQuery({
    queryKey: ['repairers'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/repairers', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/users', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const claimsStaff = users.filter((u: any) =>
    ['CLAIMS_TEAM_IN', 'CLAIMS_TEAM_OUT', 'CLAIMS_TEAM_LIABILITY', 'CLAIMS_MANAGER', 'OPS_MANAGER', 'ADMIN'].includes(u.role)
  );

  const updateClaim = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      const res = await api.patch(`/claims/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['claim', id] }),
  });

  const updateAtFault = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      const res = await api.patch(`/claims/${id}/at-fault-party`, data, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['claim', id] }),
  });

  const updateRepair = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      const res = await api.patch(`/claims/${id}/repair-details`, data, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['claim', id] }),
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
      qc.invalidateQueries({ queryKey: ['claim', id] });
    },
  });

  function startEditOverview() {
    setOverviewForm({
      claimNumber: claim.claimNumber || '',
      claimReference: claim.claimReference || '',
      insurerId: claim.insurerId || '',
      repairerId: claim.repairerId || '',
      sourceOfBusiness: claim.sourceOfBusiness || '',
      claimHandlerId: claim.claimHandlerId || '',
      status: claim.status || 'OPEN',
    });
    setEditingOverview(true);
  }

  function startEditAtFault() {
    const r = claim.reservation || {};
    setAtFaultForm({
      atFaultFirstName: r.atFaultFirstName || '',
      atFaultLastName: r.atFaultLastName || '',
      atFaultPhone: r.atFaultPhone || '',
      atFaultEmail: r.atFaultEmail || '',
      atFaultVehicleRego: r.atFaultVehicleRego || '',
      atFaultVehicleMake: r.atFaultVehicleMake || '',
      atFaultVehicleModel: r.atFaultVehicleModel || '',
      atFaultInsurer: r.atFaultInsurer || '',
      atFaultClaimNumber: r.atFaultClaimNumber || '',
      atFaultLicence: r.atFaultLicence || '',
    });
    setEditingAtFault(true);
  }

  function startEditRepair() {
    const r = claim.reservation || {};
    setRepairForm({
      repairStartDate: r.repairStartDate ? r.repairStartDate.split('T')[0] : '',
      repairEndDate: r.repairEndDate ? r.repairEndDate.split('T')[0] : '',
      estimateDate: r.estimateDate ? r.estimateDate.split('T')[0] : '',
      assessmentDate: r.assessmentDate ? r.assessmentDate.split('T')[0] : '',
      repairerInvoiceNo: r.repairerInvoiceNo || '',
      repairerInvoiceAmt: r.repairerInvoiceAmt || '',
      totalLoss: r.totalLoss || '',
      settlementReceived: r.settlementReceived || '',
    });
    setEditingRepair(true);
  }

  function startEditRecovery() {
    const r = claim.reservation || {};
    setRecoveryForm({
      thirdPartyRecovery: r.thirdPartyRecovery || '',
      witnessName: r.witnessName || '',
      witnessPhone: r.witnessPhone || '',
      policeContactName: r.policeContactName || '',
      policePhone: r.policePhone || '',
      policeEventNo: r.policeEventNo || '',
    });
    setEditingRecovery(true);
  }

  if (isLoading || !claim) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>;
  }

  const days = daysOnHire(claim);
  const r = claim.reservation || {};
  const customer = r.customer || {};
  const vehicle = r.vehicle || {};

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '14px',
    fontWeight: 500, cursor: 'pointer',
    background: active ? '#0f172a' : 'transparent',
    color: active ? '#fff' : '#64748b',
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <button onClick={() => router.push('/dashboard/claims')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '12px' }}>
            ← Back to Claims
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {claim.claimNumber || 'Unnamed Claim'}
            </h1>
            <span style={{ background: statusColors[claim.status] + '20', color: statusColors[claim.status], padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
              {statusLabels[claim.status]}
            </span>
            <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, background: days > 30 ? '#fee2e2' : '#f1f5f9', color: days > 30 ? '#ef4444' : '#64748b' }}>
              {days > 30 && '⚠ '}{days} days on hire
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
            {r.fileNumber || '—'} · Opened {new Date(claim.createdAt).toLocaleDateString('en-AU')}
            {claim.claimReference && <> · Ref: <strong>{claim.claimReference}</strong></>}
          </p>
        </div>
      </div>

      {/* Quick info bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Customer', value: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '—' },
          { label: 'Vehicle', value: vehicle.make ? `${vehicle.make} ${vehicle.model} · ${vehicle.registration}` : '—' },
          { label: 'Insurer', value: claim.insurer?.name || '—' },
          { label: 'Handler', value: claimsStaff.find((u: any) => u.id === claim.claimHandlerId) ? `${claimsStaff.find((u: any) => u.id === claim.claimHandlerId).firstName} ${claimsStaff.find((u: any) => u.id === claim.claimHandlerId).lastName}` : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} style={tabStyle(activeTab === i)}>{tab}</button>
        ))}
      </div>

      {/* TAB 0: Overview */}
      {activeTab === 0 && (
        <div style={section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ ...heading, margin: 0 }}>Claim Details</h2>
            <SectionEditButtons
              editing={editingOverview}
              onEdit={startEditOverview}
              onSave={() => { updateClaim.mutate(overviewForm); setEditingOverview(false); }}
              onCancel={() => setEditingOverview(false)}
              saving={updateClaim.isPending}
            />
          </div>
          {editingOverview ? (
            <div style={grid2}>
              {[['claimNumber', 'Claim number'], ['claimReference', 'Claim reference']].map(([key, label]) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input style={inputStyle} value={overviewForm[key]} onChange={e => setOverviewForm((f: any) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={overviewForm.status} onChange={e => setOverviewForm((f: any) => ({ ...f, status: e.target.value }))}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Source of business</label>
                <select style={inputStyle} value={overviewForm.sourceOfBusiness} onChange={e => setOverviewForm((f: any) => ({ ...f, sourceOfBusiness: e.target.value }))}>
                  <option value="">Select...</option>
                  <option value="Repairer">Repairer</option>
                  <option value="Tow Operator">Tow Operator</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Corporate Partnerships">Corporate Partnerships</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Insurer</label>
                <select style={inputStyle} value={overviewForm.insurerId} onChange={e => setOverviewForm((f: any) => ({ ...f, insurerId: e.target.value }))}>
                  <option value="">Select insurer...</option>
                  {insurers.map((ins: any) => <option key={ins.id} value={ins.id}>{ins.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Repairer</label>
                <select style={inputStyle} value={overviewForm.repairerId} onChange={e => setOverviewForm((f: any) => ({ ...f, repairerId: e.target.value }))}>
                  <option value="">Select repairer...</option>
                  {repairers.map((rep: any) => <option key={rep.id} value={rep.id}>{rep.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Claims handler</label>
                <select style={inputStyle} value={overviewForm.claimHandlerId} onChange={e => setOverviewForm((f: any) => ({ ...f, claimHandlerId: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {claimsStaff.map((u: any) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div style={grid2}>
              <Field label="Claim number" value={claim.claimNumber} />
              <Field label="Claim reference" value={claim.claimReference} />
              <Field label="Status" value={statusLabels[claim.status]} />
              <Field label="Source of business" value={claim.sourceOfBusiness} />
              <Field label="Insurer" value={claim.insurer?.name} />
              <Field label="Repairer" value={claim.repairer?.name} />
              <Field label="Claims handler" value={claimsStaff.find((u: any) => u.id === claim.claimHandlerId) ? `${claimsStaff.find((u: any) => u.id === claim.claimHandlerId).firstName} ${claimsStaff.find((u: any) => u.id === claim.claimHandlerId).lastName}` : undefined} />
              <Field label="File number" value={r.fileNumber} />
            </div>
          )}

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
            <h3 style={heading}>Linked reservation</h3>
            <div style={grid2}>
              <Field label="Customer" value={`${customer.firstName || ''} ${customer.lastName || ''}`.trim() || undefined} />
              <Field label="Phone" value={customer.phone} />
              <Field label="Vehicle" value={vehicle.make ? `${vehicle.make} ${vehicle.model}` : undefined} />
              <Field label="Registration" value={vehicle.registration} />
              <Field label="Start date" value={r.startDate ? new Date(r.startDate).toLocaleDateString('en-AU') : undefined} />
              <Field label="End date" value={r.endDate ? new Date(r.endDate).toLocaleDateString('en-AU') : undefined} />
              <Field label="Hire type" value={r.hireType} />
              <Field label="Type of cover" value={r.typeOfCover} />
            </div>
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={() => router.push(`/dashboard/reservations/${r.id}`)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                Open reservation →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: At-Fault Party */}
      {activeTab === 1 && (
        <div style={section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ ...heading, margin: 0 }}>At-Fault Party</h2>
            <SectionEditButtons
              editing={editingAtFault}
              onEdit={startEditAtFault}
              onSave={() => { updateAtFault.mutate(atFaultForm); setEditingAtFault(false); }}
              onCancel={() => setEditingAtFault(false)}
              saving={updateAtFault.isPending}
            />
          </div>
          {editingAtFault ? (
            <div>
              <p style={{ ...heading, marginBottom: '12px' }}>Personal details</p>
              <div style={{ ...grid2, marginBottom: '20px' }}>
                {[
                  ['atFaultFirstName', 'First name'],
                  ['atFaultLastName', 'Last name'],
                  ['atFaultPhone', 'Phone'],
                  ['atFaultEmail', 'Email'],
                  ['atFaultLicence', 'Licence number'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input style={inputStyle} value={atFaultForm[key]} onChange={e => setAtFaultForm((f: any) => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <p style={{ ...heading, marginBottom: '12px' }}>Vehicle & insurance</p>
              <div style={grid2}>
                {[
                  ['atFaultVehicleRego', 'Vehicle registration'],
                  ['atFaultVehicleMake', 'Make'],
                  ['atFaultVehicleModel', 'Model'],
                  ['atFaultInsurer', 'Insurance provider'],
                  ['atFaultClaimNumber', 'Their claim number'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input style={inputStyle} value={atFaultForm[key]} onChange={e => setAtFaultForm((f: any) => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p style={{ ...heading, marginBottom: '12px' }}>Personal details</p>
              <div style={{ ...grid2, marginBottom: '20px' }}>
                <Field label="First name" value={r.atFaultFirstName} />
                <Field label="Last name" value={r.atFaultLastName} />
                <Field label="Phone" value={r.atFaultPhone} />
                <Field label="Email" value={r.atFaultEmail} />
                <Field label="Licence number" value={r.atFaultLicence} />
              </div>
              <p style={{ ...heading, marginBottom: '12px' }}>Vehicle & insurance</p>
              <div style={grid2}>
                <Field label="Vehicle registration" value={r.atFaultVehicleRego} />
                <Field label="Make" value={r.atFaultVehicleMake} />
                <Field label="Model" value={r.atFaultVehicleModel} />
                <Field label="Insurance provider" value={r.atFaultInsurer} />
                <Field label="Their claim number" value={r.atFaultClaimNumber} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Repair Timeline */}
      {activeTab === 2 && (
        <div style={section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ ...heading, margin: 0 }}>Repair Timeline</h2>
            <SectionEditButtons
              editing={editingRepair}
              onEdit={startEditRepair}
              onSave={() => { updateRepair.mutate(repairForm); setEditingRepair(false); }}
              onCancel={() => setEditingRepair(false)}
              saving={updateRepair.isPending}
            />
          </div>
          {editingRepair ? (
            <div style={grid2}>
              {[
                ['repairStartDate', 'Repair start date', 'date'],
                ['repairEndDate', 'Repair end date', 'date'],
                ['estimateDate', 'Estimate date', 'date'],
                ['assessmentDate', 'Assessment date', 'date'],
                ['repairerInvoiceNo', 'Repairer invoice #', 'text'],
                ['repairerInvoiceAmt', 'Invoice amount ($)', 'number'],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input type={type} style={inputStyle} value={repairForm[key]} onChange={e => setRepairForm((f: any) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Total loss</label>
                <select style={inputStyle} value={repairForm.totalLoss} onChange={e => setRepairForm((f: any) => ({ ...f, totalLoss: e.target.value }))}>
                  <option value="">Unknown</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Settlement received</label>
                <select style={inputStyle} value={repairForm.settlementReceived} onChange={e => setRepairForm((f: any) => ({ ...f, settlementReceived: e.target.value }))}>
                  <option value="">Unknown</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <div style={grid2}>
                <Field label="Repair start date" value={r.repairStartDate ? new Date(r.repairStartDate).toLocaleDateString('en-AU') : undefined} />
                <Field label="Repair end date" value={r.repairEndDate ? new Date(r.repairEndDate).toLocaleDateString('en-AU') : undefined} />
                <Field label="Estimate date" value={r.estimateDate ? new Date(r.estimateDate).toLocaleDateString('en-AU') : undefined} />
                <Field label="Assessment date" value={r.assessmentDate ? new Date(r.assessmentDate).toLocaleDateString('en-AU') : undefined} />
                <Field label="Repairer invoice #" value={r.repairerInvoiceNo} />
                <Field label="Invoice amount" value={r.repairerInvoiceAmt ? `$${parseFloat(r.repairerInvoiceAmt).toFixed(2)}` : undefined} />
                <Field label="Total loss" value={r.totalLoss} />
                <Field label="Settlement received" value={r.settlementReceived} />
              </div>
              {/* Timeline visual */}
              {(r.repairStartDate || r.repairEndDate) && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                  <p style={heading}>Hire vs repair overlap</p>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#64748b' }}>
                    <div>�� Hire started: <strong style={{ color: '#0f172a' }}>{new Date(r.startDate).toLocaleDateString('en-AU')}</strong></div>
                    {r.repairStartDate && <div>🔧 Repair started: <strong style={{ color: '#0f172a' }}>{new Date(r.repairStartDate).toLocaleDateString('en-AU')}</strong></div>}
                    {r.repairEndDate && <div>✅ Repair ended: <strong style={{ color: '#0f172a' }}>{new Date(r.repairEndDate).toLocaleDateString('en-AU')}</strong></div>}
                    {r.endDate && <div>🔑 Hire ended: <strong style={{ color: '#0f172a' }}>{new Date(r.endDate).toLocaleDateString('en-AU')}</strong></div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Recovery */}
      {activeTab === 3 && (
        <div style={section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ ...heading, margin: 0 }}>Recovery & Witnesses</h2>
            <SectionEditButtons
              editing={editingRecovery}
              onEdit={startEditRecovery}
              onSave={() => { updateClaim.mutate(recoveryForm); setEditingRecovery(false); }}
              onCancel={() => setEditingRecovery(false)}
              saving={updateClaim.isPending}
            />
          </div>
          {editingRecovery ? (
            <div>
              <p style={{ ...heading, marginBottom: '12px' }}>Third party recovery</p>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Recovery status</label>
                <select style={{ ...inputStyle, maxWidth: '300px' }} value={recoveryForm.thirdPartyRecovery} onChange={e => setRecoveryForm((f: any) => ({ ...f, thirdPartyRecovery: e.target.value }))}>
                  <option value="">Unknown</option>
                  <option value="Not Required">Not Required</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Recovered">Recovered</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              <p style={{ ...heading, marginBottom: '12px' }}>Witness details</p>
              <div style={{ ...grid2, marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Witness name</label>
                  <input style={inputStyle} value={recoveryForm.witnessName} onChange={e => setRecoveryForm((f: any) => ({ ...f, witnessName: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Witness phone</label>
                  <input style={inputStyle} value={recoveryForm.witnessPhone} onChange={e => setRecoveryForm((f: any) => ({ ...f, witnessPhone: e.target.value }))} />
                </div>
              </div>
              <p style={{ ...heading, marginBottom: '12px' }}>Police details</p>
              <div style={grid2}>
                <div>
                  <label style={labelStyle}>Officer name</label>
                  <input style={inputStyle} value={recoveryForm.policeContactName} onChange={e => setRecoveryForm((f: any) => ({ ...f, policeContactName: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Police phone</label>
                  <input style={inputStyle} value={recoveryForm.policePhone} onChange={e => setRecoveryForm((f: any) => ({ ...f, policePhone: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Event number</label>
                  <input style={inputStyle} value={recoveryForm.policeEventNo} onChange={e => setRecoveryForm((f: any) => ({ ...f, policeEventNo: e.target.value }))} />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ ...heading, marginBottom: '12px' }}>Third party recovery</p>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{r.thirdPartyRecovery || '—'}</span>
                </div>
              </div>
              <p style={{ ...heading, marginBottom: '12px' }}>Witness details</p>
              <div style={{ ...grid2, marginBottom: '20px' }}>
                <Field label="Witness name" value={r.witnessName} />
                <Field label="Witness phone" value={r.witnessPhone} />
              </div>
              <p style={{ ...heading, marginBottom: '12px' }}>Police details</p>
              <div style={grid2}>
                <Field label="Officer name" value={r.policeContactName} />
                <Field label="Police phone" value={r.policePhone} />
                <Field label="Event number" value={r.policeEventNo} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Notes */}
      {activeTab === 4 && (
        <div style={section}>
          <h2 style={heading}>Notes</h2>
          <div style={{ marginBottom: '20px' }}>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add a note..."
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box' }}
            />
            <button
              onClick={() => addNote.mutate()}
              disabled={!noteText.trim() || addNote.isPending}
              style={{ marginTop: '8px', padding: '9px 20px', borderRadius: '8px', border: 'none', background: !noteText.trim() ? '#e2e8f0' : '#01ae42', color: !noteText.trim() ? '#94a3b8' : '#fff', fontSize: '14px', fontWeight: 500, cursor: noteText.trim() ? 'pointer' : 'not-allowed' }}
            >
              {addNote.isPending ? 'Adding...' : 'Add note'}
            </button>
          </div>
          {(claim.notes || []).length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No notes yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...(claim.notes || [])].reverse().map((n: any) => (
                <div key={n.id} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', borderLeft: '3px solid #01ae42' }}>
                  <div style={{ fontSize: '14px', color: '#0f172a', marginBottom: '8px', lineHeight: '1.5' }}>{n.note}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {n.authorName} · {new Date(n.createdAt).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
