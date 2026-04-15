'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { useBranch } from '@/context/BranchContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const MANAGER_ROLES = ['ADMIN', 'OPS_MANAGER', 'CLAIMS_MANAGER'];

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
const filterInp: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  color: '#0f172a',
  background: '#fff',
  outline: 'none',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
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

const daysOnHire = (claim: any) => {
  if (!claim?.reservation?.startDate) return 0;
  const start = new Date(claim.reservation.startDate);
  const end = claim.reservation.endDate ? new Date(claim.reservation.endDate) : new Date();
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClaimsPage() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const { selectedBranch, isAllBranches } = useBranch();
  const queryClient = useQueryClient();
  const router = useRouter();

  const userRole = (user?.publicMetadata?.role as string) || '';
  const isManager = MANAGER_ROLES.includes(userRole);

  const [listTab, setListTab] = useState<'all' | 'manager'>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showOpenModal, setShowOpenModal] = useState(false);

  const [newClaim, setNewClaim] = useState({
    reservationId: '',
    insurerId: '',
    repairerId: '',
    claimReference: '',
    sourceOfBusiness: '',
    hireType: '',
    typeOfCover: '',
  });

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: claims, isLoading } = useQuery({
    queryKey: ['claims', selectedBranch?.id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const url = isAllBranches || !selectedBranch ? '/claims' : `/claims?branchId=${selectedBranch.id}`;
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: insurers } = useQuery({
    queryKey: ['insurers'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/insurers', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: repairers } = useQuery({
    queryKey: ['repairers'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/repairers', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: reservations } = useQuery({
    queryKey: ['reservations-for-claim'],
    enabled: showOpenModal,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/reservations', { headers: { Authorization: `Bearer ${token}` } });
      return res.data.filter((r: any) => !r.claim && (r.status === 'ACTIVE' || r.status === 'PENDING' || r.status === 'COMPLETED'));
    },
  });

  // ─── Mutations ────────────────────────────────────────────────────────────

  const createClaim = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await api.post('/claims', newClaim, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      setShowOpenModal(false);
      setNewClaim({ reservationId: '', insurerId: '', repairerId: '', claimReference: '', sourceOfBusiness: '', hireType: '', typeOfCover: '' });
      router.push(`/dashboard/claims/${created.id}`);
    },
  });

  // ─── Filtered lists ───────────────────────────────────────────────────────

  const filtered = (claims || []).filter((c: any) => {
    const customer = `${c.reservation?.customer?.firstName} ${c.reservation?.customer?.lastName}`.toLowerCase();
    const clmNum = (c.claimNumber || '').toLowerCase();
    const fileNum = (c.reservation?.fileNumber || '').toLowerCase();
    const matchSearch = !search || customer.includes(search.toLowerCase()) || clmNum.includes(search.toLowerCase()) || fileNum.includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const managerClaims = (claims || [])
    .filter((c: any) => c.status === 'OPEN' || c.status === 'IN_PROGRESS')
    .sort((a: any, b: any) => daysOnHire(b) - daysOnHire(a));

  // ─── Tab styles ───────────────────────────────────────────────────────────

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 18px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    background: active ? '#0a2e14' : 'transparent',
    color: active ? '#fff' : '#64748b',
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0a2e14', margin: 0 }}>Claims</h1>
        <button
          onClick={() => setShowOpenModal(true)}
          style={{ background: '#01ae42', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
        >
          + Open claim
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '10px', padding: '4px', marginBottom: '20px', width: 'fit-content' }}>
        <button style={tabBtn(listTab === 'all')} onClick={() => setListTab('all')}>All claims</button>
        {isManager && <button style={tabBtn(listTab === 'manager')} onClick={() => setListTab('manager')}>Manager view</button>}
      </div>

      {/* ══ ALL CLAIMS TAB ══ */}
      {listTab === 'all' && (
        <>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              style={{ ...filterInp, minWidth: '220px', flex: 1 }}
              placeholder="Search claim #, file #, customer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select style={filterInp} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CLOSED">Closed</option>
            </select>
            {(search || statusFilter) && (
              <button onClick={() => { setSearch(''); setStatusFilter(''); }} style={{ ...filterInp, color: '#64748b', cursor: 'pointer' }}>
                Clear
              </button>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading claims...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No claims found.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Claim #', 'Customer', 'File #', 'Insurer', 'Liability', 'Days', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c: any) => {
                    const days = daysOnHire(c);
                    const overdue = days >= 60;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => router.push(`/dashboard/claims/${c.id}`)}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#0a2e14' }}>{c.claimNumber}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#0f172a' }}>
                          {c.reservation?.customer?.firstName} {c.reservation?.customer?.lastName}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>{c.reservation?.fileNumber || '—'}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>{c.insurer?.name || '—'}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <Badge label={c.liabilityStatus || 'PENDING'} color={LIABILITY_COLORS[c.liabilityStatus] || '#f59e0b'} />
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ background: overdue ? '#fee2e2' : '#f1f5f9', color: overdue ? '#ef4444' : '#64748b', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: overdue ? 600 : 400 }}>
                            {overdue && '⚠ '}{days}d
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <Badge label={STATUS_LABELS[c.status] || c.status} color={STATUS_COLORS[c.status] || '#64748b'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '10px' }}>
            Showing {filtered.length} of {claims?.length || 0} claims
          </p>
        </>
      )}

      {/* ══ MANAGER VIEW TAB ══ */}
      {listTab === 'manager' && isManager && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Open', count: (claims || []).filter((c: any) => c.status === 'OPEN').length, color: '#f59e0b' },
              { label: 'In Progress', count: (claims || []).filter((c: any) => c.status === 'IN_PROGRESS').length, color: '#3b82f6' },
              { label: 'Overdue (60+ days)', count: (claims || []).filter((c: any) => c.status !== 'CLOSED' && daysOnHire(c) >= 60).length, color: '#ef4444' },
              { label: 'Unassigned handler', count: (claims || []).filter((c: any) => !c.claimHandlerName && c.status !== 'CLOSED').length, color: '#64748b' },
            ].map(card => (
              <div key={card.label} style={{ flex: 1, background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' }}>
                <div style={{ fontSize: '28px', fontWeight: 600, color: card.color }}>{card.count}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{card.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Claim #', 'Customer', 'Insurer', 'Handler', 'Liability', 'Days', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {managerClaims.map((c: any) => {
                  const days = daysOnHire(c);
                  const overdue = days >= 60;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/dashboard/claims/${c.id}`)}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#0a2e14' }}>{c.claimNumber}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px' }}>{c.reservation?.customer?.firstName} {c.reservation?.customer?.lastName}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>{c.insurer?.name || '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>
                        {c.claimHandlerName || <span style={{ color: '#ef4444' }}>Unassigned</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Badge label={c.liabilityStatus || 'PENDING'} color={LIABILITY_COLORS[c.liabilityStatus] || '#f59e0b'} />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: overdue ? '#fee2e2' : '#f1f5f9', color: overdue ? '#ef4444' : '#64748b', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: overdue ? 600 : 400 }}>
                          {overdue && '⚠ '}{days}d
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Badge label={STATUS_LABELS[c.status] || c.status} color={STATUS_COLORS[c.status] || '#64748b'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══ OPEN CLAIM MODAL ══ */}
      {showOpenModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0a2e14', margin: 0 }}>Open claim</h2>
              <button onClick={() => setShowOpenModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <F label="Linked reservation *">
                <select style={inp} value={newClaim.reservationId} onChange={e => {
                  const r = reservations?.find((r: any) => r.id === e.target.value);
                  setNewClaim({ ...newClaim, reservationId: e.target.value, sourceOfBusiness: r?.sourceOfBusiness || '' });
                }}>
                  <option value="">Select a reservation...</option>
                  {(reservations || []).map((r: any) => (
                    <option key={r.id} value={r.id}>{r.fileNumber || r.reservationNumber} — {r.customer?.firstName} {r.customer?.lastName}</option>
                  ))}
                </select>
              </F>
              <F label="Insurer">
                <select style={inp} value={newClaim.insurerId} onChange={e => setNewClaim({ ...newClaim, insurerId: e.target.value })}>
                  <option value="">Select insurer</option>
                  {(insurers || []).map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </F>
              <F label="Insurer claim reference">
                <input style={inp} placeholder="e.g. AAMI-2026-48821" value={newClaim.claimReference} onChange={e => setNewClaim({ ...newClaim, claimReference: e.target.value })} />
              </F>
              <F label="Hire type">
                <select style={inp} value={newClaim.hireType} onChange={e => setNewClaim({ ...newClaim, hireType: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="CREDIT_HIRE">Credit Hire</option>
                  <option value="DIRECT_HIRE">Direct Hire</option>
                </select>
              </F>
              <F label="Type of cover">
                <select style={inp} value={newClaim.typeOfCover} onChange={e => setNewClaim({ ...newClaim, typeOfCover: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="CTP">CTP</option>
                  <option value="TPP">TPP</option>
                  <option value="COMP">Comprehensive</option>
                </select>
              </F>
              <F label="Source of business">
                <select style={inp} value={newClaim.sourceOfBusiness} onChange={e => setNewClaim({ ...newClaim, sourceOfBusiness: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="Repairer">Repairer</option>
                  <option value="Tow Operator">Tow Operator</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Corporate Partnerships">Corporate Partnerships</option>
                </select>
              </F>
              <F label="Repairer">
                <select style={inp} value={newClaim.repairerId} onChange={e => setNewClaim({ ...newClaim, repairerId: e.target.value })}>
                  <option value="">Select repairer</option>
                  {(repairers || []).map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </F>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowOpenModal(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '14px', cursor: 'pointer', color: '#0a2e14' }}
              >
                Cancel
              </button>
              <button
                onClick={() => createClaim.mutate()}
                disabled={!newClaim.reservationId || createClaim.isPending}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: newClaim.reservationId ? '#01ae42' : '#e2e8f0', color: newClaim.reservationId ? '#fff' : '#94a3b8', fontSize: '14px', fontWeight: 500, cursor: newClaim.reservationId ? 'pointer' : 'not-allowed' }}
              >
                {createClaim.isPending ? 'Opening...' : 'Open claim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
