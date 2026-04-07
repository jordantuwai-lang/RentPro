'use client';
import { use, useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const input: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a',
  background: '#fff', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' };
const section: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px' };
const heading: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.1em' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const full: React.CSSProperties = { gridColumn: '1 / -1' };

function F({ label: l, children, full: f }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div style={f ? full : {}}><label style={labelStyle}>{l}</label>{children}</div>;
}

function PersonFields({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <div style={grid2}>
      <F label="First name *"><input style={input} value={data.firstName} onChange={e => onChange('firstName', e.target.value)} /></F>
      <F label="Last name *"><input style={input} value={data.lastName} onChange={e => onChange('lastName', e.target.value)} /></F>
      <F label="Address" full><input style={input} value={data.address} onChange={e => onChange('address', e.target.value)} /></F>
      <F label="Suburb"><input style={input} value={data.suburb} onChange={e => onChange('suburb', e.target.value)} /></F>
      <F label="Postcode"><input style={input} value={data.postcode} onChange={e => onChange('postcode', e.target.value)} /></F>
      <F label="Contact number *"><input style={input} value={data.phone} onChange={e => onChange('phone', e.target.value)} /></F>
      <F label="Email"><input style={input} value={data.email} onChange={e => onChange('email', e.target.value)} /></F>
      <F label="Licence number"><input style={input} value={data.licenceNumber} onChange={e => onChange('licenceNumber', e.target.value)} /></F>
      <F label="Licence expiry"><input type="date" style={input} value={data.licenceExpiry} onChange={e => onChange('licenceExpiry', e.target.value)} /></F>
      <F label="Date of birth"><input type="date" style={input} value={data.dob} onChange={e => onChange('dob', e.target.value)} /></F>
    </div>
  );
}

function BusinessFields({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <div style={grid2}>
      <F label="Business name"><input style={input} value={data.name} onChange={e => onChange('name', e.target.value)} /></F>
      <F label="Phone number"><input style={input} value={data.phone} onChange={e => onChange('phone', e.target.value)} /></F>
      <F label="Business address" full><input style={input} value={data.address} onChange={e => onChange('address', e.target.value)} /></F>
      <F label="Suburb"><input style={input} value={data.suburb} onChange={e => onChange('suburb', e.target.value)} /></F>
      <F label="Postcode"><input style={input} value={data.postcode} onChange={e => onChange('postcode', e.target.value)} /></F>
    </div>
  );
}

function ToggleButton({ show, onToggle, label }: { show: boolean; onToggle: () => void; label: string }) {
  return (
    <button onClick={onToggle} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: show ? '#f0fdf4' : '#fff', color: show ? '#01ae42' : '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left', marginBottom: '20px' }}>
      {show ? `— Remove ${label}` : `+ Add ${label}`}
    </button>
  );
}

const emptyCard = { cardType: '', cardNumber: '', expiryDate: '', cardholderName: '' };
const emptyDriver = { firstName: '', lastName: '', licenceNumber: '', licenceExpiry: '', dob: '', phone: '' };
const emptyPerson = { firstName: '', lastName: '', address: '', suburb: '', postcode: '', phone: '', email: '', licenceNumber: '', licenceExpiry: '', dob: '' };

export default function EditReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [sameAsDriver, setSameAsDriver] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [showAtFaultBusiness, setShowAtFaultBusiness] = useState(false);
  const [driver, setDriver] = useState({ ...emptyPerson });
  const [owner, setOwner] = useState({ ...emptyPerson, insuranceProvider: '', claimNumber: '' });
  const [atFault, setAtFault] = useState({ ...emptyPerson, vehicleRegistration: '', insuranceProvider: '', claimNumber: '' });
  const [accidentVehicle, setAccidentVehicle] = useState({ registration: '', make: '', model: '', year: '', damage: '' });
  const [accident, setAccident] = useState({ date: '', location: '', description: '' });
  const [repairer, setRepairer] = useState({ businessName: '', phone: '', address: '', suburb: '', contact: '' });
  const [business, setBusiness] = useState({ name: '', address: '', suburb: '', postcode: '', phone: '' });
  const [atFaultBusiness, setAtFaultBusiness] = useState({ name: '', address: '', suburb: '', postcode: '', phone: '' });
  const [cards, setCards] = useState([{ ...emptyCard }]);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [existingCards, setExistingCards] = useState<any[]>([]);
  const [additionalDrivers, setAdditionalDrivers] = useState<any[]>([]);
  const [existingDrivers, setExistingDrivers] = useState<any[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [loaded, setLoaded] = useState(false);

  const { data: reservation } = useQuery({
    queryKey: ['reservation', id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  useEffect(() => {
    if (reservation && !loaded) {
      setDriver({ firstName: reservation.customer?.firstName || '', lastName: reservation.customer?.lastName || '', address: '', suburb: '', postcode: '', phone: reservation.customer?.phone || '', email: reservation.customer?.email || '', licenceNumber: reservation.customer?.licenceNumber || '', licenceExpiry: '', dob: '' });
      setVehicleId(reservation.vehicleId || '');
      setBranchId(reservation.vehicle?.branchId || '');
      setStartDate(reservation.startDate ? reservation.startDate.split('T')[0] : '');
      setExistingCards(reservation.paymentCards || []);
      setExistingDrivers(reservation.additionalDrivers || []);
      setLoaded(true);
    }
  }, [reservation, loaded]);

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/branches', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ['available-vehicles', branchId],
    enabled: !!branchId,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/fleet?branchId=${branchId}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data.filter((v: any) => v.status === 'AVAILABLE' || v.id === vehicleId);
    },
  });

  const updDriver = (f: string, v: string) => setDriver(p => ({ ...p, [f]: v }));
  const updOwner = (f: string, v: string) => setOwner(p => ({ ...p, [f]: v }));
  const updAtFault = (f: string, v: string) => setAtFault(p => ({ ...p, [f]: v }));
  const updAccidentVehicle = (f: string, v: string) => setAccidentVehicle(p => ({ ...p, [f]: v }));
  const updAccident = (f: string, v: string) => setAccident(p => ({ ...p, [f]: v }));
  const updRepairer = (f: string, v: string) => setRepairer(p => ({ ...p, [f]: v }));
  const updBusiness = (f: string, v: string) => setBusiness(p => ({ ...p, [f]: v }));
  const updAtFaultBusiness = (f: string, v: string) => setAtFaultBusiness(p => ({ ...p, [f]: v }));

  const updCard = (i: number, f: string, v: string) => setCards(cards.map((c, idx) => idx === i ? { ...c, [f]: v } : c));
  const addCard = () => setCards([...cards, { ...emptyCard }]);
  const removeCard = (i: number) => setCards(cards.filter((_, idx) => idx !== i));

  const updAdditionalDriver = (i: number, f: string, v: string) => setAdditionalDrivers(additionalDrivers.map((d, idx) => idx === i ? { ...d, [f]: v } : d));
  const addAdditionalDriver = () => setAdditionalDrivers([...additionalDrivers, { ...emptyDriver }]);
  const removeAdditionalDriver = (i: number) => setAdditionalDrivers(additionalDrivers.filter((_, idx) => idx !== i));

  const saveCard = (i: number) => {
    const card = cards[i];
    if (!card.cardType || !card.cardNumber || !card.cardholderName || !card.expiryDate) return;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'CARD-';
    for (let j = 0; j < 6; j++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setSavedCards(prev => [...prev, { ...card, referenceCode: code }]);
    removeCard(i);
    if (cards.length === 1) setCards([{ ...emptyCard }]);
  };

  const mutation = useMutation({
    mutationFn: async (status: string) => {
      const token = await getToken();
      await api.patch(`/reservations/${id}`, {
        status, vehicleId: vehicleId || undefined,
        startDate: startDate || undefined,
        customer: { firstName: driver.firstName, lastName: driver.lastName, phone: driver.phone, email: driver.email || undefined, licenceNumber: driver.licenceNumber || undefined },
      }, { headers: { Authorization: `Bearer ${token}` } });

      for (const card of savedCards) {
        await api.post(`/reservations/${id}/cards`, card, { headers: { Authorization: `Bearer ${token}` } });
      }
      for (const card of cards) {
        if (card.cardType && card.cardNumber && card.cardholderName && card.expiryDate) {
          await api.post(`/reservations/${id}/cards`, card, { headers: { Authorization: `Bearer ${token}` } });
        }
      }
      for (const d of additionalDrivers) {
        if (d.firstName && d.lastName && d.licenceNumber) {
          await api.post(`/reservations/${id}/drivers`, d, { headers: { Authorization: `Bearer ${token}` } });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      router.push(`/dashboard/reservations/${id}`);
    },
  });

  if (!loaded) return <div style={{ padding: '40px', color: '#94a3b8' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{reservation?.reservationNumber}</h1>
            <span style={{ fontSize: '13px', color: '#64748b' }}>— Edit reservation</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Accident replacement vehicle intake form</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => router.push(`/dashboard/reservations/${id}`)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>View details</button>
        </div>
      </div>

      <div style={section}>
        <h2 style={heading}>Driver details</h2>
        <PersonFields data={driver} onChange={updDriver} />
      </div>

      <ToggleButton show={showBusiness} onToggle={() => setShowBusiness(!showBusiness)} label="business details (if driving on behalf of a business)" />
      {showBusiness && <div style={section}><h2 style={heading}>Business details</h2><BusinessFields data={business} onChange={updBusiness} /></div>}

      <div style={section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ ...heading, marginBottom: 0 }}>Registered owner</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
            <input type="checkbox" checked={sameAsDriver} onChange={e => { setSameAsDriver(e.target.checked); if (e.target.checked) setOwner(o => ({ ...o, ...driver })); }} />
            Same as driver
          </label>
        </div>
        <PersonFields data={owner} onChange={updOwner} />
        <div style={{ ...grid2, marginTop: '16px' }}>
          <F label="Insurance provider"><input style={input} value={owner.insuranceProvider} onChange={e => updOwner('insuranceProvider', e.target.value)} /></F>
          <F label="Claim number"><input style={input} value={owner.claimNumber} onChange={e => updOwner('claimNumber', e.target.value)} /></F>
        </div>
      </div>

      <div style={section}>
        <h2 style={heading}>Vehicle details</h2>
        <div style={grid2}>
          <F label="Registration"><input style={input} value={accidentVehicle.registration} onChange={e => updAccidentVehicle('registration', e.target.value)} /></F>
          <F label="Year"><input style={input} value={accidentVehicle.year} onChange={e => updAccidentVehicle('year', e.target.value)} /></F>
          <F label="Make"><input style={input} value={accidentVehicle.make} onChange={e => updAccidentVehicle('make', e.target.value)} /></F>
          <F label="Model"><input style={input} value={accidentVehicle.model} onChange={e => updAccidentVehicle('model', e.target.value)} /></F>
          <F label="Damage description" full><textarea style={{ ...input, height: '80px', resize: 'vertical' }} value={accidentVehicle.damage} onChange={e => updAccidentVehicle('damage', e.target.value)} /></F>
        </div>
      </div>

      <div style={section}>
        <h2 style={heading}>Accident details</h2>
        <div style={grid2}>
          <F label="Date of accident"><input type="date" style={input} value={accident.date} onChange={e => updAccident('date', e.target.value)} /></F>
          <F label="Accident location"><input style={input} value={accident.location} onChange={e => updAccident('location', e.target.value)} /></F>
          <F label="Accident description" full><textarea style={{ ...input, height: '80px', resize: 'vertical' }} value={accident.description} onChange={e => updAccident('description', e.target.value)} /></F>
        </div>
      </div>

      <div style={section}>
        <h2 style={heading}>At fault party details</h2>
        <PersonFields data={atFault} onChange={updAtFault} />
        <div style={{ ...grid2, marginTop: '16px' }}>
          <F label="Vehicle registration"><input style={input} value={atFault.vehicleRegistration} onChange={e => updAtFault('vehicleRegistration', e.target.value)} /></F>
          <F label="Insurance provider"><input style={input} value={atFault.insuranceProvider} onChange={e => updAtFault('insuranceProvider', e.target.value)} /></F>
          <F label="Claim number" full><input style={input} value={atFault.claimNumber} onChange={e => updAtFault('claimNumber', e.target.value)} /></F>
        </div>
        <div style={{ marginTop: '16px' }}>
          <ToggleButton show={showAtFaultBusiness} onToggle={() => setShowAtFaultBusiness(!showAtFaultBusiness)} label="business details (if at fault party was driving on behalf of a business)" />
          {showAtFaultBusiness && <BusinessFields data={atFaultBusiness} onChange={updAtFaultBusiness} />}
        </div>
      </div>

      <div style={section}>
        <h2 style={heading}>Repairer details</h2>
        <div style={grid2}>
          <F label="Business name"><input style={input} value={repairer.businessName} onChange={e => updRepairer('businessName', e.target.value)} /></F>
          <F label="Phone number"><input style={input} value={repairer.phone} onChange={e => updRepairer('phone', e.target.value)} /></F>
          <F label="Address" full><input style={input} value={repairer.address} onChange={e => updRepairer('address', e.target.value)} /></F>
          <F label="Suburb"><input style={input} value={repairer.suburb} onChange={e => updRepairer('suburb', e.target.value)} /></F>
          <F label="Contact number"><input style={input} value={repairer.contact} onChange={e => updRepairer('contact', e.target.value)} /></F>
        </div>
      </div>

      <div style={section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ ...heading, marginBottom: 0 }}>Payment cards</h2>
          <button onClick={addCard} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>+ Add card</button>
        </div>
        {existingCards.map((ec, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>{ec.cardType} — {ec.cardholderName}</div>
              <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px' }}>Reference: <strong>{ec.referenceCode}</strong></div>
            </div>
          </div>
        ))}
        {savedCards.map((sc, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>{sc.cardType} — {sc.cardholderName}</div>
              <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px' }}>Reference: <strong>{sc.referenceCode}</strong></div>
            </div>
          </div>
        ))}
        {cards.map((card, i) => (
          <div key={i} style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>New card</span>
              {(cards.length > 1 || existingCards.length > 0 || savedCards.length > 0) && (
                <button onClick={() => removeCard(i)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
              )}
            </div>
            <div style={grid2}>
              <F label="Card type">
                <select style={input} value={card.cardType} onChange={e => updCard(i, 'cardType', e.target.value)}>
                  <option value="">Select type...</option>
                  <option value="Visa Credit">Visa Credit</option>
                  <option value="Visa Debit">Visa Debit</option>
                  <option value="Mastercard Credit">Mastercard Credit</option>
                  <option value="Mastercard Debit">Mastercard Debit</option>
                  <option value="American Express">American Express</option>
                </select>
              </F>
              <F label="Cardholder name"><input style={input} value={card.cardholderName} onChange={e => updCard(i, 'cardholderName', e.target.value)} /></F>
              <F label="Card number"><input style={input} value={card.cardNumber} onChange={e => updCard(i, 'cardNumber', e.target.value)} placeholder="**** **** **** ****" /></F>
              <F label="Expiry date"><input style={input} value={card.expiryDate} onChange={e => updCard(i, 'expiryDate', e.target.value)} placeholder="MM/YY" /></F>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => saveCard(i)}
                disabled={!card.cardType || !card.cardNumber || !card.cardholderName || !card.expiryDate}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: (!card.cardType || !card.cardNumber || !card.cardholderName || !card.expiryDate) ? '#86efac' : '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                Save card
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ ...heading, marginBottom: 0 }}>Additional drivers</h2>
          <button onClick={addAdditionalDriver} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>+ Add driver</button>
        </div>
        {existingDrivers.map((ed, i) => (
          <div key={i} style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>{ed.firstName} {ed.lastName}</div>
            <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px' }}>Licence: {ed.licenceNumber}</div>
          </div>
        ))}
        {additionalDrivers.length === 0 && existingDrivers.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No additional drivers added.</p>
        )}
        {additionalDrivers.map((d, i) => (
          <div key={i} style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Driver {existingDrivers.length + i + 1}</span>
              <button onClick={() => removeAdditionalDriver(i)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
            </div>
            <div style={grid2}>
              <F label="First name *"><input style={input} value={d.firstName} onChange={e => updAdditionalDriver(i, 'firstName', e.target.value)} /></F>
              <F label="Last name *"><input style={input} value={d.lastName} onChange={e => updAdditionalDriver(i, 'lastName', e.target.value)} /></F>
              <F label="Licence number *"><input style={input} value={d.licenceNumber} onChange={e => updAdditionalDriver(i, 'licenceNumber', e.target.value)} /></F>
              <F label="Phone"><input style={input} value={d.phone} onChange={e => updAdditionalDriver(i, 'phone', e.target.value)} /></F>
              <F label="Licence expiry"><input type="date" style={input} value={d.licenceExpiry} onChange={e => updAdditionalDriver(i, 'licenceExpiry', e.target.value)} /></F>
              <F label="Date of birth"><input type="date" style={input} value={d.dob} onChange={e => updAdditionalDriver(i, 'dob', e.target.value)} /></F>
            </div>
          </div>
        ))}
      </div>

      <div style={section}>
        <h2 style={heading}>Replacement vehicle</h2>
        <div style={grid2}>
          <F label="Branch *">
            <select style={input} value={branchId} onChange={e => setBranchId(e.target.value)}>
              <option value="">Select branch...</option>
              {branches?.map((b: any) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
            </select>
          </F>
          <F label="Hire start date *">
            <input type="date" style={input} value={startDate} onChange={e => setStartDate(e.target.value)} />
          </F>
          <F label="Vehicle *" full>
            <select style={input} value={vehicleId} onChange={e => setVehicleId(e.target.value)} disabled={!branchId}>
              <option value="">Select vehicle...</option>
              {vehicles?.map((v: any) => <option key={v.id} value={v.id}>{v.make} {v.model} · {v.registration} · {v.category}</option>)}
            </select>
          </F>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', paddingBottom: '40px' }}>
        <button onClick={() => router.push(`/dashboard/reservations/${id}`)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate('DRAFT')}
          disabled={!driver.firstName || !driver.lastName || !driver.phone || mutation.isPending}
          style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
        >
          Save draft
        </button>
        <button
          onClick={() => mutation.mutate('PENDING')}
          disabled={!driver.firstName || !driver.lastName || !driver.phone || !vehicleId || !startDate || mutation.isPending}
          style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: mutation.isPending ? '#86efac' : '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: mutation.isPending ? 'not-allowed' : 'pointer' }}
        >
          {mutation.isPending ? 'Saving...' : 'Save reservation'}
        </button>
      </div>
    </div>
  );
}
