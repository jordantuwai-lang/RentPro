'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// ─── Styles ───────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  color: '#0f172a',
  background: '#fff',
  boxSizing: 'border-box',
};

const lbl: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
  marginBottom: '6px',
  display: 'block',
};

const sectionBox: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  padding: '24px',
  marginBottom: '20px',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#64748b',
  margin: '0 0 20px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const fullSpan: React.CSSProperties = { gridColumn: '1 / -1' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={full ? fullSpan : {}}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

const emptyCard = { cardType: '', cardNumber: '', expiryDate: '', cardholderName: '' };
const emptyDriver = { licenceNumber: '', licenceExpiry: '' };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DirectHirePage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Reservation number
  const [rezNumber, setRezNumber] = useState('');

  // Hire details
  const [pickupLocationId, setPickupLocationId] = useState('');
  const [returnLocationId, setReturnLocationId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Driver details
  const [driver, setDriver] = useState({
    firstName: '',
    lastName: '',
    address: '',
    suburb: '',
    postcode: '',
    state: '',
    email: '',
    phone: '',
    licenceNumber: '',
    licenceExpiry: '',
    dob: '',
  });
  const updDriver = (f: string, v: string) => setDriver(p => ({ ...p, [f]: v }));

  // Payment card
  const [card, setCard] = useState({ ...emptyCard });
  const updCard = (f: string, v: string) => setCard(p => ({ ...p, [f]: v }));

  // Additional drivers
  const [additionalDrivers, setAdditionalDrivers] = useState<typeof emptyDriver[]>([]);
  const addDriver = () => setAdditionalDrivers(p => [...p, { ...emptyDriver }]);
  const removeDriver = (i: number) => setAdditionalDrivers(p => p.filter((_, idx) => idx !== i));
  const updAdditional = (i: number, f: string, v: string) =>
    setAdditionalDrivers(p => p.map((d, idx) => idx === i ? { ...d, [f]: v } : d));

  // Fetch reservation number on mount
  useEffect(() => {
    getToken().then(token => {
      api.get('/reservations/next-number', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setRezNumber(res.data.nextNumber))
        .catch(() => setRezNumber('REZ—'));
    });
  }, []);

  // Fetch branches for dropdowns
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/branches', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  // Submit
  const mutation = useMutation({
    mutationFn: async (status: string) => {
      const token = await getToken();

      const res = await api.post('/reservations', {
        customer: {
          firstName: driver.firstName,
          lastName: driver.lastName,
          phone: driver.phone,
          email: driver.email || undefined,
          licenceNumber: driver.licenceNumber || undefined,
        },
        startDate: startDate || new Date().toISOString(),
        endDate: endDate || undefined,
        status,
        hireType: 'DIRECT',
        pickupLocationId: pickupLocationId || undefined,
        returnLocationId: returnLocationId || undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const reservationId = res.data.id;

      // Save payment card if filled
      if (card.cardType && card.cardNumber && card.cardholderName && card.expiryDate) {
        await api.post(`/reservations/${reservationId}/cards`, card, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Save additional drivers
      for (const d of additionalDrivers) {
        if (d.licenceNumber) {
          await api.post(`/reservations/${reservationId}/drivers`, d, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      router.push('/dashboard/reservations');
    },
  });

  const isSubmitting = mutation.isPending;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '900px' }}>

     {/* Header */}
     <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/dashboard/reservations')}
          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', cursor: 'pointer', padding: 0, marginBottom: '8px' }}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Direct Hire</h1>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Reservation</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>{rezNumber || 'Loading...'}</div>
          </div>
        </div>
      </div>

      {/* ── Section 1: Hire Details ── */}
      <div style={sectionBox}>
        <h3 style={sectionTitle}>Hire Details</h3>
        <div style={grid2}>
          <F label="Pick Up Location">
            <select
              style={inp}
              value={pickupLocationId}
              onChange={e => setPickupLocationId(e.target.value)}
            >
              <option value="">Select location...</option>
              {(branches || []).map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </F>
          <F label="Return Location">
            <select
              style={inp}
              value={returnLocationId}
              onChange={e => setReturnLocationId(e.target.value)}
            >
              <option value="">Select location...</option>
              {(branches || []).map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </F>
          <F label="Start Date">
            <input
              type="date"
              style={inp}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </F>
          <F label="End Date">
            <input
              type="date"
              style={inp}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </F>
        </div>
      </div>

      {/* ── Section 2: Driver Details ── */}
      <div style={sectionBox}>
        <h3 style={sectionTitle}>Driver Details</h3>
        <div style={grid2}>
          <F label="First Name">
            <input style={inp} value={driver.firstName} onChange={e => updDriver('firstName', e.target.value)} />
          </F>
          <F label="Last Name">
            <input style={inp} value={driver.lastName} onChange={e => updDriver('lastName', e.target.value)} />
          </F>
          <F label="Phone">
            <input style={inp} value={driver.phone} onChange={e => updDriver('phone', e.target.value)} />
          </F>
          <F label="Email">
            <input style={inp} type="email" value={driver.email} onChange={e => updDriver('email', e.target.value)} />
          </F>
          <F label="Address" full>
            <input style={inp} value={driver.address} placeholder="Street address" onChange={e => updDriver('address', e.target.value)} />
          </F>
          <F label="Suburb">
            <input style={inp} value={driver.suburb} onChange={e => updDriver('suburb', e.target.value)} />
          </F>
          <F label="State">
            <select style={inp} value={driver.state} onChange={e => updDriver('state', e.target.value)}>
              <option value="">Select...</option>
              {['VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </F>
          <F label="Postcode">
            <input style={inp} value={driver.postcode} onChange={e => updDriver('postcode', e.target.value)} />
          </F>
          <F label="Licence Number">
            <input style={inp} value={driver.licenceNumber} onChange={e => updDriver('licenceNumber', e.target.value)} />
          </F>
          <F label="Licence Expiry">
            <input style={inp} type="date" value={driver.licenceExpiry} onChange={e => updDriver('licenceExpiry', e.target.value)} />
          </F>
          <F label="Date of Birth">
            <input style={inp} type="date" value={driver.dob} onChange={e => updDriver('dob', e.target.value)} />
          </F>
        </div>
      </div>

      {/* ── Section 3: Payment Card ── */}
      <div style={sectionBox}>
        <h3 style={sectionTitle}>Payment Card</h3>
        <div style={grid2}>
          <F label="Card Type">
            <select style={inp} value={card.cardType} onChange={e => updCard('cardType', e.target.value)}>
              <option value="">Select...</option>
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="Amex">Amex</option>
            </select>
          </F>
          <F label="Card Number">
            <input style={inp} value={card.cardNumber} onChange={e => updCard('cardNumber', e.target.value)} />
          </F>
          <F label="Cardholder Name">
            <input style={inp} value={card.cardholderName} onChange={e => updCard('cardholderName', e.target.value)} />
          </F>
          <F label="Expiry Date">
            <input style={inp} placeholder="MM/YY" value={card.expiryDate} onChange={e => updCard('expiryDate', e.target.value)} />
          </F>
        </div>
      </div>

      {/* ── Section 4: Additional Drivers ── */}
      <div style={sectionBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ ...sectionTitle, margin: 0 }}>Additional Drivers</h3>
          <button
            onClick={addDriver}
            style={{ background: 'none', border: 'none', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer', padding: 0 }}
          >
            + Add driver
          </button>
        </div>

        {additionalDrivers.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No additional drivers added.</p>
        )}

        {additionalDrivers.map((d, i) => (
          <div key={i} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : undefined, paddingTop: i > 0 ? '16px' : undefined, marginTop: i > 0 ? '16px' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Driver {i + 1}</span>
              <button
                onClick={() => removeDriver(i)}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', cursor: 'pointer', padding: 0 }}
              >
                Remove
              </button>
            </div>
            <div style={grid2}>
              <F label="Licence Number">
                <input style={inp} value={d.licenceNumber} onChange={e => updAdditional(i, 'licenceNumber', e.target.value)} />
              </F>
              <F label="Licence Expiry">
                <input style={inp} type="date" value={d.licenceExpiry} onChange={e => updAdditional(i, 'licenceExpiry', e.target.value)} />
              </F>
            </div>
          </div>
        ))}
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingBottom: '40px' }}>
        <button
          onClick={() => router.push('/dashboard/reservations')}
          style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate('DRAFT')}
          disabled={isSubmitting}
          style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: '14px', cursor: 'pointer' }}
        >
          Save as Draft
        </button>
        <button
          onClick={() => mutation.mutate('PENDING')}
          disabled={isSubmitting || !driver.firstName || !driver.lastName}
          style={{
            padding: '12px 24px', borderRadius: '8px', border: 'none',
            background: !driver.firstName || !driver.lastName ? '#e2e8f0' : '#01ae42',
            color: !driver.firstName || !driver.lastName ? '#94a3b8' : '#fff',
            fontSize: '14px', fontWeight: 500, cursor: !driver.firstName || !driver.lastName ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Saving...' : 'Create Reservation'}
        </button>
      </div>
    </div>
  );
}
