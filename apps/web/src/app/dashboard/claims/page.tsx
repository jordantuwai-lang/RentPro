'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import api from '@/lib/api';
import { useBranch } from '@/context/BranchContext';

const statusColors: Record<string, string> = {
  OPEN: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  CLOSED: '#64748b',
};

const statusLabels: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  CLOSED: 'Closed',
};

const input: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  color: '#0f172a',
  background: '#fff',
  outline: 'none',
};

const fieldInput: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  color: '#0f172a',
  background: '#fff',
  outline: 'none',
};

export default function ClaimsPage() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const { selectedBranch, isAllBranches } = useBranch();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [noteText, setNoteText] = useState('');
  const [showOpenModal, setShowOpenModal] = useState(false);

  // New claim form state
  const [newClaim, setNewClaim] = useState({
    reservationId: '',
    insurerId: '',
    repairerId: '',
    claimReference: '',
    sourceOfBusiness: '',
    claimHandlerId: '',
  });

  // Fetch claims
  const { data, isLoading } = useQuery({
    queryKey: ['claims', selectedBranch?.id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const url = isAllBranches || !selectedBranch
        ? '/claims'
        : `/claims?branchId=${selectedBranch.id}`;
      const res = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Fetch insurers for dropdowns
  const { data: insurers } = useQuery({
    queryKey: ['insurers'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/insurers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Fetch repairers for dropdowns
  const { data: repairers } = useQuery({
    queryKey: ['repairers'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/repairers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Fetch active reservations for open claim modal
  const { data: reservations } = useQuery({
    queryKey: ['reservations-active'],
    enabled: showOpenModal,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/reservations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.filter((r: any) =>
        r.status === 'ACTIVE' || r.status === 'COMPLETED'
      );
    },
  });

  // Fetch users for handler dropdown
  const { data: users } = useQuery({
    queryKey: ['users'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Update claim mutation
  const updateClaim = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      const res = await api.patch(`/claims/${selectedClaim.id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: (updated) => {
      setSelectedClaim(updated);
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    },
  });

  // Add note mutation
  const addNote = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const authorName = user
        ? `${user.firstName} ${user.lastName}`
        : 'Staff';
      const res = await api.post(
        `/claims/${selectedClaim.id}/notes`,
        { note: noteText, authorName },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return res.data;
    },
    onSuccess: () => {
      setNoteText('');
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      // Refresh selected claim notes
      const updated = data?.find((c: any) => c.id === selectedClaim.id);
      if (updated) setSelectedClaim(updated);
    },
  });

  // Create claim mutation
  const createClaim = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await api.post('/claims', newClaim, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      setShowOpenModal(false);
      setSelectedClaim(created);
      setNewClaim({
        reservationId: '',
        insurerId: '',
        repairerId: '',
        claimReference: '',
        sourceOfBusiness: '',
        claimHandlerId: '',
      });
    },
  });

  // Filter claims
  const filtered = (data || []).filter((c: any) => {
    const customer = `${c.reservation?.customer?.firstName} ${c.reservation?.customer?.lastName}`.toLowerCase();
    const clmNum = (c.claimNumber || '').toLowerCase();
    const fileNum = (c.reservation?.fileNumber || '').toLowerCase();
    const matchSearch = !search ||
      customer.includes(search.toLowerCase()) ||
      clmNum.includes(search.toLowerCase()) ||
      fileNum.includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Days on hire calculation
  const daysOnHire = (claim: any) => {
    if (!claim?.reservation?.startDate) return '—';
    const start = new Date(claim.reservation.startDate);
    const end = claim.reservation.endDate
      ? new Date(claim.reservation.endDate)
      : new Date();
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const authorName = user ? `${user.firstName} ${user.lastName}` : 'Staff';

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#0a2e14', margin: 0 }}>Claims</h1>
          <button
            onClick={() => setShowOpenModal(true)}
            style={{ background: '#01ae42', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
          >
            + Open claim
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            style={{ ...input, minWidth: '200px', flex: 1 }}
            placeholder="Search by claim #, file #, customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={input} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CLOSED">Closed</option>
          </select>
          {(search || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); }}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '13px', cursor: 'pointer' }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                {['Claim #', 'File #', 'Customer', 'Insurer', 'Repairer', 'Handler', 'Days', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No claims found.</td></tr>
              ) : filtered.map((c: any) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedClaim(c)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selectedClaim?.id === c.id ? '#f0fdf4' : '#fff' }}
                  onMouseEnter={e => { if (selectedClaim?.id !== c.id) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (selectedClaim?.id !== c.id) e.currentTarget.style.background = '#fff'; }}
                >
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#01ae42' }}>{c.claimNumber || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0a2e14' }}>{c.reservation?.fileNumber || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0a2e14' }}>
                    {c.reservation?.customer?.firstName} {c.reservation?.customer?.lastName}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{c.insurer?.name || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{c.repairer?.name || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{c.claimHandlerId || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '20px', fontSize: '12px', background: '#f1f5f9', color: '#64748b' }}>
                      {daysOnHire(c)}d
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: statusColors[c.status] + '20', color: statusColors[c.status], padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                      {statusLabels[c.status] || c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && (
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '12px' }}>
            Showing {filtered.length} of {data?.length || 0} claims
          </p>
        )}
      </div>

      {/* Detail panel */}
      {selectedClaim && (
        <div style={{ width: '300px', flexShrink: 0, background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', position: 'sticky', top: '24px' }}>

          {/* Panel header */}
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#0a2e14' }}>{selectedClaim.claimNumber}</span>
              <span style={{ background: statusColors[selectedClaim.status] + '20', color: statusColors[selectedClaim.status], padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                {statusLabels[selectedClaim.status]}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Opened {new Date(selectedClaim.createdAt).toLocaleDateString('en-AU')} · {selectedClaim.reservation?.fileNumber || '—'}
            </div>
          </div>

          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>

            {/* Linked file */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Linked file</div>
              {[
                ['Customer', `${selectedClaim.reservation?.customer?.firstName} ${selectedClaim.reservation?.customer?.lastName}`],
                ['Phone', selectedClaim.reservation?.customer?.phone || '—'],
                ['Vehicle', selectedClaim.reservation?.vehicle ? `${selectedClaim.reservation.vehicle.make} ${selectedClaim.reservation.vehicle.model} · ${selectedClaim.reservation.vehicle.registration}` : '—'],
                ['Branch', selectedClaim.reservation?.vehicle?.branch?.name || '—'],
                ['Start date', selectedClaim.reservation?.startDate ? new Date(selectedClaim.reservation.startDate).toLocaleDateString('en-AU') : '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>{label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#0a2e14', textAlign: 'right', maxWidth: '160px' }}>{val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Days on hire</span>
                <span style={{ fontSize: '20px', fontWeight: '600', color: '#01ae42' }}>{daysOnHire(selectedClaim)}</span>
              </div>
            </div>

            {/* Claim details */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Claim details</div>

              {/* Status */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Status</div>
                <select
                  style={fieldInput}
                  value={selectedClaim.status}
                  onChange={e => setSelectedClaim({ ...selectedClaim, status: e.target.value })}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {/* Insurer */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Insurer</div>
                <select
                  style={fieldInput}
                  value={selectedClaim.insurerId || ''}
                  onChange={e => setSelectedClaim({ ...selectedClaim, insurerId: e.target.value })}
                >
                  <option value="">Select insurer</option>
                  {insurers?.map((i: any) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              {/* Insurer claim reference */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Insurer claim reference</div>
                <input
                  style={fieldInput}
                  value={selectedClaim.claimReference || ''}
                  onChange={e => setSelectedClaim({ ...selectedClaim, claimReference: e.target.value })}
                  placeholder="e.g. AAMI-2026-48821"
                />
              </div>

              {/* Repairer */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Repairer</div>
                <select
                  style={fieldInput}
                  value={selectedClaim.repairerId || ''}
                  onChange={e => setSelectedClaim({ ...selectedClaim, repairerId: e.target.value })}
                >
                  <option value="">Select repairer</option>
                  {repairers?.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Source of business */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Source of business</div>
                <select
                  style={fieldInput}
                  value={selectedClaim.sourceOfBusiness || ''}
                  onChange={e => setSelectedClaim({ ...selectedClaim, sourceOfBusiness: e.target.value })}
                >
                  <option value="">Select source</option>
                  <option value="Repairer">Repairer</option>
                  <option value="Tow Operator">Tow Operator</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Corporate Partnerships">Corporate Partnerships</option>
                </select>
              </div>

              {/* Claims handler */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Claims handler</div>
                <select
                  style={fieldInput}
                  value={selectedClaim.claimHandlerId || ''}
                  onChange={e => setSelectedClaim({ ...selectedClaim, claimHandlerId: e.target.value })}
                >
                  <option value="">Select handler</option>
                  {users?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Notes</div>
              {selectedClaim.notes?.length === 0 && (
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>No notes yet.</p>
              )}
              {selectedClaim.notes?.map((n: any) => (
                <div key={n.id} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', color: '#0a2e14', lineHeight: 1.5 }}>{n.note}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    {n.authorName} · {new Date(n.createdAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              ))}
              <textarea
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#0f172a', resize: 'none', height: '70px', outline: 'none', fontFamily: 'inherit' }}
                placeholder="Add a note…"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
            </div>
          </div>

          {/* Panel footer */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { if (noteText.trim()) addNote.mutate(); }}
              disabled={!noteText.trim() || addNote.isPending}
              style={{ flex: 1, background: '#fff', color: '#0a2e14', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
            >
              {addNote.isPending ? 'Saving...' : 'Add note'}
            </button>
            <button
              onClick={() => updateClaim.mutate({
                status: selectedClaim.status,
                claimReference: selectedClaim.claimReference,
                sourceOfBusiness: selectedClaim.sourceOfBusiness,
                claimHandlerId: selectedClaim.claimHandlerId,
                insurerId: selectedClaim.insurerId,
                repairerId: selectedClaim.repairerId,
              })}
              disabled={updateClaim.isPending}
              style={{ flex: 1, background: '#01ae42', color: '#fff', padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
            >
              {updateClaim.isPending ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* Open claim modal */}
      {showOpenModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', width: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0a2e14', margin: 0 }}>Open claim</h2>
              <button onClick={() => setShowOpenModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Reservation select */}
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Linked file (Active / Completed reservations)</div>
                <select
                  style={{ ...fieldInput }}
                  value={newClaim.reservationId}
                  onChange={e => {
                    const res = reservations?.find((r: any) => r.id === e.target.value);
                    setNewClaim({
                      ...newClaim,
                      reservationId: e.target.value,
                      sourceOfBusiness: res?.sourceOfBusiness || '',
                    });
                  }}
                >
                  <option value="">Select a file...</option>
                  {reservations?.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.fileNumber || r.reservationNumber} — {r.customer?.firstName} {r.customer?.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Insurer */}
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Insurer</div>
                <select style={fieldInput} value={newClaim.insurerId} onChange={e => setNewClaim({ ...newClaim, insurerId: e.target.value })}>
                  <option value="">Select insurer</option>
                  {insurers?.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>

              {/* Claim reference */}
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Insurer claim reference</div>
                <input style={fieldInput} placeholder="e.g. AAMI-2026-48821" value={newClaim.claimReference} onChange={e => setNewClaim({ ...newClaim, claimReference: e.target.value })} />
              </div>

              {/* Repairer */}
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Repairer</div>
                <select style={fieldInput} value={newClaim.repairerId} onChange={e => setNewClaim({ ...newClaim, repairerId: e.target.value })}>
                  <option value="">Select repairer</option>
                  {repairers?.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              {/* Source of business */}
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Source of business</div>
                <select style={fieldInput} value={newClaim.sourceOfBusiness} onChange={e => setNewClaim({ ...newClaim, sourceOfBusiness: e.target.value })}>
                  <option value="">Select source</option>
                  <option value="Repairer">Repairer</option>
                  <option value="Tow Operator">Tow Operator</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Corporate Partnerships">Corporate Partnerships</option>
                </select>
              </div>

              {/* Handler */}
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Claims handler</div>
                <select style={fieldInput} value={newClaim.claimHandlerId} onChange={e => setNewClaim({ ...newClaim, claimHandlerId: e.target.value })}>
                  <option value="">Select handler</option>
                  {users?.map((u: any) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                </select>
              </div>
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowOpenModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '14px', cursor: 'pointer', color: '#0a2e14' }}>
                Cancel
              </button>
              <button
                onClick={() => createClaim.mutate()}
                disabled={!newClaim.reservationId || createClaim.isPending}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: !newClaim.reservationId ? '#e2e8f0' : '#01ae42', color: !newClaim.reservationId ? '#94a3b8' : '#fff', fontSize: '14px', fontWeight: '500', cursor: newClaim.reservationId ? 'pointer' : 'not-allowed' }}
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