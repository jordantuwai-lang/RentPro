'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';
import { useBranch } from '@/context/BranchContext';

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  padding: '20px',
};

const fieldLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '3px',
};

const fieldVal: React.CSSProperties = {
  fontSize: '14px',
  color: '#0f172a',
};

export default function RecoveriesPage() {
  const { getToken, isLoaded } = useAuth();
  const { selectedBranch } = useBranch();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: claims, isLoading } = useQuery({
    queryKey: ['recoveries', selectedBranch?.id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const url = !selectedBranch
        ? '/claims/recoveries'
        : `/claims/recoveries?branchId=${selectedBranch.id}`;
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    refetchInterval: 30000,
  });

  const markPaid = useMutation({
    mutationFn: async (invoiceId: string) => {
      const token = await getToken();
      const res = await api.patch(
        `/claims/invoices/${invoiceId}/paid`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recoveries'] });
    },
  });

  const totalRecovered = (claims || []).reduce((sum: number, c: any) => {
    const paid = (c.invoices || []).filter((i: any) => i.paidAt);
    return sum + paid.reduce((s: number, i: any) => s + i.amount, 0);
  }, 0);

  const totalOutstanding = (claims || []).reduce((sum: number, c: any) => {
    const unpaid = (c.invoices || []).filter((i: any) => !i.paidAt);
    return sum + unpaid.reduce((s: number, i: any) => s + i.amount, 0);
  }, 0);

  const filtered = (claims || []).filter((c: any) => {
    if (!search) return true;
    const customer = `${c.reservation?.customer?.firstName} ${c.reservation?.customer?.lastName}`.toLowerCase();
    const file = (c.reservation?.fileNumber || '').toLowerCase();
    const claimNum = (c.claimNumber || '').toLowerCase();
    return customer.includes(search.toLowerCase()) || file.includes(search.toLowerCase()) || claimNum.includes(search.toLowerCase());
  });

  const getDaysOnHire = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Recoveries</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Invoiced files — track payment recovery from insurers</p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total files</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>{filtered.length}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recovered</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#01ae42', marginTop: '6px' }}>
            ${totalRecovered.toFixed(2)}
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b', marginTop: '6px' }}>
            ${totalOutstanding.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          style={{ width: '100%', maxWidth: '360px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
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
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔄</div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>No recoveries yet</h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Files will appear here once an invoice has been created in Invoicing.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((claim: any) => {
          const r = claim.reservation;
          const customer = r?.customer;
          const vehicle = r?.vehicle;
          const invoices: any[] = claim.invoices || [];
          const isExpanded = expandedId === claim.id;
          const totalInvoiced = invoices.reduce((s: number, i: any) => s + i.amount, 0);
          const totalPaid = invoices.filter((i: any) => i.paidAt).reduce((s: number, i: any) => s + i.amount, 0);
          const allPaid = invoices.length > 0 && invoices.every((i: any) => i.paidAt);

          return (
            <div key={claim.id} style={{ ...card, border: allPaid ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}>
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => setExpandedId(isExpanded ? null : claim.id)}
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
                      {allPaid ? (
                        <span style={{ fontSize: '12px', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                          ✓ PAID
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                          OUTSTANDING
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '14px', color: '#334155', fontWeight: 500, marginBottom: '8px' }}>
                      {customer?.firstName} {customer?.lastName}
                      {customer?.phone && <span style={{ color: '#64748b', fontWeight: 400 }}> · {customer.phone}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={fieldLabel}>Vehicle</div>
                        <div style={fieldVal}>{vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.registration}` : '—'}</div>
                      </div>
                      <div>
                        <div style={fieldLabel}>Insurer</div>
                        <div style={fieldVal}>{claim.insurer?.name || '—'}</div>
                      </div>
                      {r?.startDate && r?.endDate && (
                        <div>
                          <div style={fieldLabel}>Days on hire</div>
                          <div style={{ ...fieldVal, fontWeight: 600 }}>{getDaysOnHire(r.startDate, r.endDate)}</div>
                        </div>
                      )}
                      <div>
                        <div style={fieldLabel}>Total invoiced</div>
                        <div style={{ ...fieldVal, fontWeight: 700, color: '#01ae42' }}>${totalInvoiced.toFixed(2)}</div>
                      </div>
                      {totalPaid > 0 && (
                        <div>
                          <div style={fieldLabel}>Recovered</div>
                          <div style={{ ...fieldVal, fontWeight: 700, color: '#0ea5e9' }}>${totalPaid.toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '18px', color: '#94a3b8' }}>{isExpanded ? '▲' : '▼'}</div>
                </div>
              </div>

              {/* Expanded: invoices */}
              {isExpanded && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Invoices</div>
                  {invoices.length === 0 && (
                    <p style={{ color: '#94a3b8', fontSize: '13px' }}>No invoices yet.</p>
                  )}
                  {invoices.map((inv: any) => (
                    <div
                      key={inv.id}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                          {inv.invoiceNumber || `Invoice`} — ${inv.amount.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          Created {new Date(inv.createdAt).toLocaleDateString('en-AU')}
                          {inv.dueDate && ` · Due ${new Date(inv.dueDate).toLocaleDateString('en-AU')}`}
                          {inv.notes && ` · ${inv.notes}`}
                        </div>
                      </div>
                      <div>
                        {inv.paidAt ? (
                          <span style={{ fontSize: '12px', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                            ✓ Paid {new Date(inv.paidAt).toLocaleDateString('en-AU')}
                          </span>
                        ) : (
                          <button
                            onClick={() => markPaid.mutate(inv.id)}
                            disabled={markPaid.isPending}
                            style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#0ea5e9', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
