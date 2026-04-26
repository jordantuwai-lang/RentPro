'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';
import api from '@/lib/api';
import { useBranch } from '@/context/BranchContext';

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  padding: '20px',
  cursor: 'pointer',
  transition: 'box-shadow 0.15s',
};

const fieldInput: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  color: '#0f172a',
  background: '#fff',
  boxSizing: 'border-box',
};

const label: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '4px',
};

const val: React.CSSProperties = {
  fontSize: '14px',
  color: '#0f172a',
};

export default function InvoicingPage() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const { selectedBranch } = useBranch();
  const queryClient = useQueryClient();

  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    amount: '',
    dueDate: '',
    invoiceNumber: '',
    notes: '',
  });

  const { data: claims, isLoading } = useQuery({
    queryKey: ['invoicing', selectedBranch?.id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const url = !selectedBranch
        ? '/claims/invoicing'
        : `/claims/invoicing?branchId=${selectedBranch.id}`;
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    refetchInterval: 30000,
  });

  const createInvoice = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await api.post(
        `/claims/${selectedClaim.id}/invoices`,
        {
          amount: parseFloat(form.amount),
          dueDate: form.dueDate || undefined,
          invoiceNumber: form.invoiceNumber || undefined,
          notes: form.notes || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoicing'] });
      queryClient.invalidateQueries({ queryKey: ['recoveries'] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      setShowInvoiceModal(false);
      setSelectedClaim(null);
      setForm({ amount: '', dueDate: '', invoiceNumber: '', notes: '' });
    },
  });

  const getDaysOffHire = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const days = Math.floor((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : `${days}d ago`;
  };

  const getDaysOnHire = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  };

  const filtered = (claims || []).filter((c: any) => {
    if (!search) return true;
    const customer = `${c.reservation?.customer?.firstName} ${c.reservation?.customer?.lastName}`.toLowerCase();
    const file = (c.reservation?.fileNumber || '').toLowerCase();
    const claimNum = (c.claimNumber || '').toLowerCase();
    return customer.includes(search.toLowerCase()) || file.includes(search.toLowerCase()) || claimNum.includes(search.toLowerCase());
  });

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Invoicing</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Files ready to invoice — vehicle has been returned
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#854d0e', fontWeight: 600 }}>
            {filtered.length} pending
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          style={{ ...fieldInput, maxWidth: '360px' }}
          placeholder="Search by customer, file or claim number…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading && (
        <div style={{ color: '#94a3b8', fontSize: '14px', padding: '40px 0' }}>Loading…</div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧾</div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>No files pending invoicing</h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Files will appear here when a vehicle is returned (off-hired).</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((claim: any) => {
          const r = claim.reservation;
          const customer = r?.customer;
          const vehicle = r?.vehicle;
          const daysHired = r?.startDate && r?.endDate
            ? getDaysOnHire(r.startDate, r.endDate)
            : null;

          return (
            <div
              key={claim.id}
              style={card}
              onClick={() => { setSelectedClaim(claim); setShowInvoiceModal(true); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                      {r?.fileNumber || r?.reservationNumber}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                      {claim.claimNumber}
                    </span>
                    <span style={{ fontSize: '12px', color: '#854d0e', background: '#fef9c3', border: '1px solid #fde047', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                      INVOICING
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#334155', marginBottom: '8px', fontWeight: 500 }}>
                    {customer?.firstName} {customer?.lastName}
                    {customer?.phone && <span style={{ color: '#64748b', fontWeight: 400 }}> · {customer.phone}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={label}>Vehicle</div>
                      <div style={val}>{vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.registration}` : '—'}</div>
                    </div>
                    <div>
                      <div style={label}>Insurer</div>
                      <div style={val}>{claim.insurer?.name || '—'}</div>
                    </div>
                    <div>
                      <div style={label}>Repairer</div>
                      <div style={val}>{claim.repairer?.name || '—'}</div>
                    </div>
                    {daysHired !== null && (
                      <div>
                        <div style={label}>Days on hire</div>
                        <div style={{ ...val, fontWeight: 600, color: '#01ae42' }}>{daysHired} days</div>
                      </div>
                    )}
                    {r?.endDate && (
                      <div>
                        <div style={label}>Off-hired</div>
                        <div style={val}>{getDaysOffHire(r.endDate)}</div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setSelectedClaim(claim); setShowInvoiceModal(true); }}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Create Invoice
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && selectedClaim && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', width: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Create invoice</h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                  {selectedClaim.reservation?.fileNumber} — {selectedClaim.reservation?.customer?.firstName} {selectedClaim.reservation?.customer?.lastName}
                </p>
              </div>
              <button onClick={() => { setShowInvoiceModal(false); setSelectedClaim(null); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Summary */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={label}>Insurer</div>
                  <div style={val}>{selectedClaim.insurer?.name || 'Not set'}</div>
                </div>
                <div>
                  <div style={label}>Claim reference</div>
                  <div style={val}>{selectedClaim.claimReference || '—'}</div>
                </div>
                <div>
                  <div style={label}>Hire period</div>
                  <div style={val}>
                    {selectedClaim.reservation?.startDate
                      ? new Date(selectedClaim.reservation.startDate).toLocaleDateString('en-AU')
                      : '—'}
                    {' → '}
                    {selectedClaim.reservation?.endDate
                      ? new Date(selectedClaim.reservation.endDate).toLocaleDateString('en-AU')
                      : '—'}
                  </div>
                </div>
                <div>
                  <div style={label}>Days on hire</div>
                  <div style={{ ...val, fontWeight: 700, color: '#01ae42' }}>
                    {selectedClaim.reservation?.startDate && selectedClaim.reservation?.endDate
                      ? `${getDaysOnHire(selectedClaim.reservation.startDate, selectedClaim.reservation.endDate)} days`
                      : '—'}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500, marginBottom: '6px' }}>Invoice number</div>
                <input
                  style={fieldInput}
                  placeholder="e.g. INV-2026-001 (auto-generated if blank)"
                  value={form.invoiceNumber}
                  onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
                />
              </div>

              <div>
                <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500, marginBottom: '6px' }}>Amount ($) <span style={{ color: '#ef4444' }}>*</span></div>
                <input
                  style={fieldInput}
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                />
              </div>

              <div>
                <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500, marginBottom: '6px' }}>Due date</div>
                <input
                  style={fieldInput}
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>

              <div>
                <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500, marginBottom: '6px' }}>Notes</div>
                <textarea
                  style={{ ...fieldInput, height: '80px', resize: 'none', fontFamily: 'inherit' }}
                  placeholder="Optional notes…"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#166534' }}>
                💡 Creating this invoice will move the file to <strong>Recoveries</strong>.
              </div>
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowInvoiceModal(false); setSelectedClaim(null); }}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '14px', cursor: 'pointer', color: '#0f172a' }}
              >
                Cancel
              </button>
              <button
                onClick={() => createInvoice.mutate()}
                disabled={!form.amount || createInvoice.isPending}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: !form.amount ? '#e2e8f0' : '#01ae42',
                  color: !form.amount ? '#94a3b8' : '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: form.amount ? 'pointer' : 'not-allowed',
                }}
              >
                {createInvoice.isPending ? 'Creating…' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
