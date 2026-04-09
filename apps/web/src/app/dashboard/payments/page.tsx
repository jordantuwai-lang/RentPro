'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';

const section: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px' };
const heading: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };

export default function PaymentsPage() {
  const { getToken, isLoaded, user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState<any>(null);
  const [chargeForm, setChargeForm] = useState({ chargeType: '', description: '', amount: '', cardReference: '' });
  const [processMethod, setProcessMethod] = useState<'card' | 'manual'>('card');

  const { data: searchResults } = useQuery({
    queryKey: ['payment-search', search],
    enabled: search.length > 2,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/payments/search?q=${search}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: chargeTypes } = useQuery({
    queryKey: ['charge-types'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/payments/charge-types', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: payments, refetch: refetchPayments } = useQuery({
    queryKey: ['payments', selectedReservation?.id],
    enabled: !!selectedReservation,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/payments?reservationId=${selectedReservation.id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const addCharge = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.post('/payments', {
        reservationId: selectedReservation.id,
        chargeType: chargeForm.chargeType,
        description: chargeForm.description || undefined,
        amount: chargeForm.amount,
        cardReference: chargeForm.cardReference || undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      refetchPayments();
      setShowAddCharge(false);
      setChargeForm({ chargeType: '', description: '', amount: '', cardReference: '' });
    },
  });

  const processPayment = useMutation({
    mutationFn: async ({ id, method }: { id: string; method: string }) => {
      const token = await getToken();
      const processedBy = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Staff';
      return api.patch(`/payments/${id}/process`, { method, processedBy }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      refetchPayments();
      setShowProcessModal(null);
    },
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return api.delete(`/payments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => refetchPayments(),
  });

  const handleChargeTypeChange = (type: string) => {
    const ct = chargeTypes?.find((c: any) => c.name === type);
    setChargeForm(p => ({ ...p, chargeType: type, amount: ct?.defaultAmount?.toString() || '' }));
  };

  const totalPending = payments?.filter((p: any) => p.status === 'PENDING').reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
  const totalPaid = payments?.filter((p: any) => p.status === 'PAID').reduce((acc: number, p: any) => acc + p.amount, 0) || 0;

  return (
    <div>
      {showProcessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '420px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: '8px' }}>Process payment</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              {showProcessModal.chargeType} — <strong>${showProcessModal.amount.toFixed(2)}</strong>
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button onClick={() => setProcessMethod('card')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${processMethod === 'card' ? '#01ae42' : '#e2e8f0'}`, background: processMethod === 'card' ? '#f0fdf4' : '#fff', color: processMethod === 'card' ? '#01ae42' : '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Card charge
              </button>
              <button onClick={() => setProcessMethod('manual')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${processMethod === 'manual' ? '#01ae42' : '#e2e8f0'}`, background: processMethod === 'manual' ? '#f0fdf4' : '#fff', color: processMethod === 'manual' ? '#01ae42' : '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Manual
              </button>
            </div>
            {processMethod === 'card' && showProcessModal.cardReference && (
              <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Card reference</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#01ae42' }}>{showProcessModal.cardReference}</div>
              </div>
            )}
            {processMethod === 'card' && !showProcessModal.cardReference && (
              <div style={{ padding: '12px 16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '16px', color: '#dc2626', fontSize: '13px' }}>
                No card reference on file. Please use manual payment.
              </div>
            )}
            {processMethod === 'manual' && (
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', color: '#64748b', fontSize: '13px' }}>
                Mark as manually collected — cash, bank transfer or other method.
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowProcessModal(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={() => processPayment.mutate({ id: showProcessModal.id, method: processMethod === 'card' ? `Card - ${showProcessModal.cardReference}` : 'Manual' })}
                disabled={processMethod === 'card' && !showProcessModal.cardReference}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                {processPayment.isPending ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Payments</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Search a file to add and process charges</p>
      </div>

      <div style={section}>
        <h2 style={heading}>Search file</h2>
        <input
          style={input}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by file number, rez number or customer name..."
        />
        {searchResults && searchResults.length > 0 && !selectedReservation && (
          <div style={{ marginTop: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            {searchResults.map((r: any) => (
              <div
                key={r.id}
                onClick={() => { setSelectedReservation(r); setSearch(''); }}
                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    {r.fileNumber || r.reservationNumber} — {r.customer?.firstName} {r.customer?.lastName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {r.vehicle?.make} {r.vehicle?.model} · {r.vehicle?.branch?.code}
                  </div>
                </div>
                <span style={{ background: r.status === 'ACTIVE' ? '#f0fdf4' : '#f1f5f9', color: r.status === 'ACTIVE' ? '#01ae42' : '#64748b', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
        {search.length > 2 && searchResults?.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>No files found.</p>
        )}
      </div>

      {selectedReservation && (
        <>
          <div style={{ ...section, border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#065f46' }}>
                  {selectedReservation.fileNumber || selectedReservation.reservationNumber} — {selectedReservation.customer?.firstName} {selectedReservation.customer?.lastName}
                </div>
                <div style={{ fontSize: '13px', color: '#059669', marginTop: '4px' }}>
                  {selectedReservation.vehicle?.make} {selectedReservation.vehicle?.model} · {selectedReservation.vehicle?.registration} · {selectedReservation.vehicle?.branch?.name}
                </div>
              </div>
              <button onClick={() => { setSelectedReservation(null); setShowAddCharge(false); }} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #bbf7d0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
                Clear
              </button>
            </div>
          </div>

          <div style={section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ ...heading, marginBottom: 0 }}>Charges</h2>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Pending: <strong style={{ color: '#ef4444' }}>${totalPending.toFixed(2)}</strong>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Paid: <strong style={{ color: '#01ae42' }}>${totalPaid.toFixed(2)}</strong>
                </div>
                <button onClick={() => setShowAddCharge(!showAddCharge)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                  + Add charge
                </button>
              </div>
            </div>

            {showAddCharge && (
              <div style={{ background: '#f8fdf9', borderRadius: '8px', border: '1px solid #dcfce7', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={labelStyle}>Charge type *</label>
                    <select style={input} value={chargeForm.chargeType} onChange={e => handleChargeTypeChange(e.target.value)}>
                      <option value="">Select...</option>
                      {chargeTypes?.map((ct: any) => (
                        <option key={ct.id} value={ct.name}>{ct.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Amount ($) *</label>
                    <input style={input} type="number" value={chargeForm.amount} onChange={e => setChargeForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div>
                    <label style={labelStyle}>Card reference</label>
                    <select style={input} value={chargeForm.cardReference} onChange={e => setChargeForm(p => ({ ...p, cardReference: e.target.value }))}>
                      <option value="">Select card...</option>
                      {selectedReservation.paymentCards?.map((card: any) => (
                        <option key={card.id} value={card.referenceCode}>{card.referenceCode} — {card.cardType}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Description (optional)</label>
                  <input style={input} value={chargeForm.description} onChange={e => setChargeForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Fuel charge — returned on empty" />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowAddCharge(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                  <button
                    onClick={() => addCharge.mutate()}
                    disabled={!chargeForm.chargeType || !chargeForm.amount || addCharge.isPending}
                    style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                  >
                    {addCharge.isPending ? 'Adding...' : 'Add charge'}
                  </button>
                </div>
              </div>
            )}

            {!payments || payments.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No charges added yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    {['Charge type', 'Description', 'Amount', 'Card ref', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{p.chargeType}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#64748b' }}>{p.description || '—'}</td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>${p.amount.toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#01ae42', fontWeight: 600 }}>{p.cardReference || '—'}</td>
                      <td style={{ padding: '12px' }}>
                        {p.status === 'PAID' ? (
                          <div>
                            <span style={{ background: '#f0fdf4', color: '#01ae42', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>PAID</span>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{p.method} · {p.processedBy}</div>
                          </div>
                        ) : (
                          <span style={{ background: '#fef2f2', color: '#ef4444', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>PENDING</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {p.status === 'PENDING' && (
                            <button onClick={() => setShowProcessModal(p)} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                              Process
                            </button>
                          )}
                          {p.status === 'PENDING' && (
                            <button onClick={() => deletePayment.mutate(p.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
