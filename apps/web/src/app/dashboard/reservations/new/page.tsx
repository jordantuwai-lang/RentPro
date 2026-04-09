'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AddressAutocomplete from '@/components/AddressAutocomplete';

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  color: '#0f172a',
  background: '#fff',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
  marginBottom: '6px',
  display: 'block',
};

const section: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  padding: '24px',
  marginBottom: '20px',
};

const heading: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#64748b',
  marginTop: 0,
  marginBottom: '20px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const full: React.CSSProperties = { gridColumn: '1 / -1' };

function F({ label: l, children, full: f }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={f ? full : {}}>
      <label style={labelStyle}>{l}</label>
      {children}
    </div>
  );
}

function SectionHeader({ title, sectionKey, openState, onToggle }: { title: string; sectionKey: string; openState: Record<string, boolean>; onToggle: (k: string) => void }) {
  return (
    <div
      onClick={() => onToggle(sectionKey)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', userSelect: 'none',
        marginBottom: openState[sectionKey] ? '20px' : '0',
      }}
    >
      <h2 style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</h2>
      <span style={{ color: '#64748b', fontSize: '12px' }}>{openState[sectionKey] ? '▼' : '▶'}</span>
    </div>
  );
}

function PersonFields({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <div style={grid2}>
      <F label="First name *"><input style={input} value={data.firstName} onChange={e => onChange('firstName', e.target.value)} /></F>
      <F label="Last name *"><input style={input} value={data.lastName} onChange={e => onChange('lastName', e.target.value)} /></F>
      <F label="Address" full>
        <AddressAutocomplete
          value={data.address}
          onChange={v => onChange('address', v)}
          onSelect={result => {
            onChange('address', result.address);
            onChange('suburb', result.suburb);
            onChange('postcode', result.postcode);
          }}
          style={input}
          placeholder="Start typing address..."
        />
      </F>
      <F label="Suburb"><input style={input} value={data.suburb} onChange={e => onChange('suburb', e.target.value)} /></F>
      <F label="Postcode"><input style={input} value={data.postcode} onChange={e => onChange('postcode', e.target.value)} /></F>
      <F label="Contact number *"><input style={input} value={data.phone} onChange={e => onChange('phone', e.target.value)} /></F>
      <F label="Email"><input style={input} value={data.email} onChange={e => onChange('email', e.target.value)} /></F>
      <F label="Licence number"><input style={input} value={data.licenceNumber} onChange={e => onChange('licenceNumber', e.target.value)} /></F>
      <F label="Licence state">
        <select style={input} value={data.licenceState || ''} onChange={e => onChange('licenceState', e.target.value)}>
          <option value="">Select state...</option>
          <option value="International">International</option>
          <option value="NSW">NSW</option>
          <option value="NT">NT</option>
          <option value="QLD">QLD</option>
          <option value="SA">SA</option>
          <option value="TAS">TAS</option>
          <option value="VIC">VIC</option>
          <option value="WA">WA</option>
        </select>
      </F>
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
    <button onClick={onToggle} style={{
      padding: '10px 20px', borderRadius: '8px', border: '1px dashed #cbd5e1',
      background: show ? '#f0fdf4' : '#fff', color: show ? '#01ae42' : '#64748b',
      fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left', marginBottom: '20px',
    }}>
      {show ? `— Remove ${label}` : `+ Add ${label}`}
    </button>
  );
}

const emptyCard = { cardType: '', cardNumber: '', expiryDate: '', cardholderName: '' };
const emptyDriver = { firstName: '', lastName: '', licenceNumber: '', licenceExpiry: '', dob: '', phone: '' };
const emptyPerson = { firstName: '', lastName: '', address: '', suburb: '', postcode: '', phone: '', email: '', licenceNumber: '', licenceExpiry: '', dob: '' };

export default function NewReservationPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState<Record<string, boolean>>({
    reservationNumber: true,
    sourceOfBusiness: true,
    driverDetails: false,
    businessDetails: false,
    registeredOwner: false,
    vehicleDetails: false,
    vehicleDamage: false,
    accidentDetails: false,
    atFaultParty: false,
    repairerDetails: false,
    paymentCard: false,
    additionalDrivers: false,
  });
  const toggle = (key: string) => setOpen(p => ({ ...p, [key]: !p[key] }));

  const [rezNumber, setRezNumber] = useState('');
  const [sameAsDriver, setSameAsDriver] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [showAtFaultBusiness, setShowAtFaultBusiness] = useState(false);
  const [driver, setDriver] = useState({ ...emptyPerson });
  const [owner, setOwner] = useState({ ...emptyPerson, insuranceProvider: '', claimNumber: '' });
  const [atFault, setAtFault] = useState({ ...emptyPerson, vehicleRegistration: '', insuranceProvider: '', claimNumber: '' });
  const [accidentVehicle, setAccidentVehicle] = useState({ registration: '', registrationState: '', make: '', model: '', year: '', damage: '' });
  const [vehicleDriveable, setVehicleDriveable] = useState<string | null>(null);
  const [damageZones, setDamageZones] = useState<Record<string, boolean>>({});
  const [damageComponents, setDamageComponents] = useState<Set<string>>(new Set());
  const [damageDescription, setDamageDescription] = useState('');

  const toggleDamageZone = (zone: string) => setDamageZones(prev => ({ ...prev, [zone]: !prev[zone] }));
  const toggleDamageComponent = (name: string) => setDamageComponents(prev => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });
  const [accident, setAccident] = useState({ date: '', locationType: '', location: '', suburb: '', description: '' });
  const [repairer, setRepairer] = useState({ businessName: '', phone: '', address: '', suburb: '', contact: '' });
  const [business, setBusiness] = useState({ name: '', address: '', suburb: '', postcode: '', phone: '' });
  const [atFaultBusiness, setAtFaultBusiness] = useState({ name: '', address: '', suburb: '', postcode: '', phone: '' });
  const [cards, setCards] = useState([{ ...emptyCard }]);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [additionalDrivers, setAdditionalDrivers] = useState<any[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [sourceOfBusiness, setSourceOfBusiness] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [showPartnerModal, setShowPartnerModal] = useState(false);

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

  useEffect(() => {
    getToken().then(token => {
      api.get('/reservations/next-number', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setRezNumber(res.data.nextNumber))
        .catch(() => setRezNumber('REZ—'));
    });
  }, []);

  const { data: repairers } = useQuery({
    queryKey: ['repairers'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/repairers', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const handleSameAsDriver = (checked: boolean) => {
    setSameAsDriver(checked);
    if (checked) setOwner(o => ({ ...o, ...driver }));
  };

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
        vehicleId: vehicleId || undefined,
        startDate: startDate || new Date().toISOString(),
        status,
        sourceOfBusiness: sourceOfBusiness || undefined,
        partnerName: selectedPartner || undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const reservationId = res.data.id;

      for (const card of savedCards) {
        await api.post(`/reservations/${reservationId}/cards`, card, { headers: { Authorization: `Bearer ${token}` } });
      }
      for (const card of cards) {
        if (card.cardType && card.cardNumber && card.cardholderName && card.expiryDate) {
          await api.post(`/reservations/${reservationId}/cards`, card, { headers: { Authorization: `Bearer ${token}` } });
        }
      }
      for (const d of additionalDrivers) {
        if (d.firstName && d.lastName) {
          await api.post(`/reservations/${reservationId}/drivers`, d, { headers: { Authorization: `Bearer ${token}` } });
        }
      }

      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      router.push('/dashboard/reservations');
    },
  });

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>New Reservation</h1>
      </div>

      {/* Partner Modal */}
      {showPartnerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '480px', maxHeight: '70vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Select {sourceOfBusiness === 'Repairer' ? 'Repairer' : 'Tow Operator'}
              </h2>
              <button onClick={() => setShowPartnerModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            {!repairers || repairers.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>No partners added yet.</p>
            ) : repairers.map((r: any) => (
              <div
                key={r.id}
                onClick={() => { 
                  setSelectedPartner(r.name); 
                  setShowPartnerModal(false);
                  setRepairer(prev => ({ ...prev, businessName: r.name, phone: r.phone || '' }));
                }}
                style={{
                  padding: '14px 16px', borderRadius: '8px',
                  border: `1px solid ${selectedPartner === r.name ? '#01ae42' : '#e2e8f0'}`,
                  background: selectedPartner === r.name ? '#f0fdf4' : '#fff',
                  marginBottom: '8px', cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{r.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{r.suburb} {r.state ? `· ${r.state}` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reservation Number */}
      <div style={section}>
        <SectionHeader title="Reservation Number" sectionKey="reservationNumber" openState={open} onToggle={toggle} />
        {open.reservationNumber && (
          <div style={grid2}>
            <F label="Reservation number">
              <input
                style={{ ...input, background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                value={rezNumber || 'Loading...'}
                readOnly
              />
            </F>
          </div>
        )}
      </div>

      {/* Source of Business */}
      <div style={section}>
        <SectionHeader title="Source of Business" sectionKey="sourceOfBusiness" openState={open} onToggle={toggle} />
        {open.sourceOfBusiness && (
          <div style={grid2}>
            <F label="Source *">
              <select style={input} value={sourceOfBusiness} onChange={e => {
                setSourceOfBusiness(e.target.value);
                setSelectedPartner('');
                if (e.target.value === 'Repairer' || e.target.value === 'Tow Operator') setShowPartnerModal(true);
              }}>
                <option value="">Select source...</option>
                <option value="Corporate Partnerships">Corporate Partnerships</option>
                <option value="Marketing">Marketing</option>
                <option value="Repairer">Repairer</option>
                <option value="Tow Operator">Tow Operator</option>
              </select>
            </F>
            {(sourceOfBusiness === 'Repairer' || sourceOfBusiness === 'Tow Operator') && (
              <F label={sourceOfBusiness === 'Repairer' ? 'Repairer' : 'Tow Operator'}>
                <div
                  onClick={() => setShowPartnerModal(true)}
                  style={{ ...input, cursor: 'pointer', color: selectedPartner ? '#0f172a' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>{selectedPartner || `Select ${sourceOfBusiness.toLowerCase()}...`}</span>
                  <span style={{ color: '#01ae42', fontSize: '12px' }}>Change</span>
                </div>
              </F>
            )}
          </div>
        )}
      </div>

      {/* Driver Details */}
      <div style={section}>
        <SectionHeader title="Driver Details" sectionKey="driverDetails" openState={open} onToggle={toggle} />
        {open.driverDetails && <PersonFields data={driver} onChange={updDriver} />}
      </div>

      <ToggleButton show={showBusiness} onToggle={() => setShowBusiness(!showBusiness)} label="business details (if driving on behalf of a business)" />
      {showBusiness && (
        <div style={section}>
          <SectionHeader title="Business Details" sectionKey="businessDetails" openState={open} onToggle={toggle} />
          {open.businessDetails && <BusinessFields data={business} onChange={updBusiness} />}
        </div>
      )}

      {/* Registered Owner */}
      <div style={section}>
        <SectionHeader title="Registered Owner" sectionKey="registeredOwner" openState={open} onToggle={toggle} />
        {open.registeredOwner && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                <input type="checkbox" checked={sameAsDriver} onChange={e => handleSameAsDriver(e.target.checked)} />
                Same as driver
              </label>
            </div>
            <PersonFields data={owner} onChange={updOwner} />
            <div style={{ ...grid2, marginTop: '16px' }}>
              <F label="Insurance provider"><input style={input} value={owner.insuranceProvider} onChange={e => updOwner('insuranceProvider', e.target.value)} /></F>
              <F label="Claim number"><input style={input} value={owner.claimNumber} onChange={e => updOwner('claimNumber', e.target.value)} /></F>
            </div>
          </>
        )}
      </div>

      {/* Vehicle Details */}
      <div style={section}>
        <SectionHeader title="Vehicle Details" sectionKey="vehicleDetails" openState={open} onToggle={toggle} />
        {open.vehicleDetails && (
          <>
            <div style={grid2}>
              <F label="Registration"><input style={input} value={accidentVehicle.registration} onChange={e => updAccidentVehicle('registration', e.target.value)} /></F>
              <F label="Registration state">
                <select style={input} value={accidentVehicle.registrationState || ''} onChange={e => updAccidentVehicle('registrationState', e.target.value)}>
                  <option value="">Select state...</option>
                  <option value="ACT">ACT</option>
                  <option value="NSW">NSW</option>
                  <option value="NT">NT</option>
                  <option value="QLD">QLD</option>
                  <option value="SA">SA</option>
                  <option value="TAS">TAS</option>
                  <option value="VIC">VIC</option>
                  <option value="WA">WA</option>
                </select>
              </F>
              <F label="Year"><input style={input} value={accidentVehicle.year} onChange={e => updAccidentVehicle('year', e.target.value)} /></F>
              <F label="Make"><input style={input} value={accidentVehicle.make} onChange={e => updAccidentVehicle('make', e.target.value)} /></F>
              <F label="Model"><input style={input} value={accidentVehicle.model} onChange={e => updAccidentVehicle('model', e.target.value)} /></F>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => {}}
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Confirm
              </button>
            </div>
          </>
        )}
      </div>

      {/* Vehicle Damage */}
      <div style={section}>
        <SectionHeader title="Vehicle Damage" sectionKey="vehicleDamage" openState={open} onToggle={toggle} />
        {open.vehicleDamage && (
          <div>
            {/* Driveable status */}
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Vehicle driveable?</div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <button
                onClick={() => setVehicleDriveable('yes')}
                style={{ padding: '10px 28px', borderRadius: '8px', border: `1.5px solid ${vehicleDriveable === 'yes' ? '#01ae42' : '#e2e8f0'}`, background: vehicleDriveable === 'yes' ? '#f0fdf4' : '#fff', color: vehicleDriveable === 'yes' ? '#01ae42' : '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >✓ Driveable</button>
              <button
                onClick={() => setVehicleDriveable('no')}
                style={{ padding: '10px 28px', borderRadius: '8px', border: `1.5px solid ${vehicleDriveable === 'no' ? '#ef4444' : '#e2e8f0'}`, background: vehicleDriveable === 'no' ? '#fef2f2' : '#fff', color: vehicleDriveable === 'no' ? '#ef4444' : '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >✕ Not driveable</button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0 0 20px' }} />

            {/* Car diagram */}
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Click a zone to highlight the damage area.</p>
            <svg width="100%" viewBox="0 0 680 340" role="img" style={{ display: 'block' }}>
              <title>Vehicle damage selector</title>
              <rect x="220" y="40" width="240" height="260" rx="30" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>
              <rect x="240" y="65" width="200" height="55" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1"/>
              <rect x="240" y="220" width="200" height="55" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1"/>
              <rect x="250" y="130" width="180" height="80" rx="4" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1"/>
              <rect x="195" y="65" width="30" height="55" rx="8" fill="#475569" stroke="#334155" strokeWidth="1"/>
              <rect x="455" y="65" width="30" height="55" rx="8" fill="#475569" stroke="#334155" strokeWidth="1"/>
              <rect x="195" y="220" width="30" height="55" rx="8" fill="#475569" stroke="#334155" strokeWidth="1"/>
              <rect x="455" y="220" width="30" height="55" rx="8" fill="#475569" stroke="#334155" strokeWidth="1"/>
              {[
                { key: 'front', x: 248, y: 44, w: 184, h: 27, lx: 340, ly: 62, label: 'Front' },
                { key: 'rear', x: 248, y: 269, w: 184, h: 27, lx: 340, ly: 287, label: 'Rear' },
                { key: 'roof', x: 258, y: 138, w: 164, h: 64, lx: 340, ly: 174, label: 'Roof / interior' },
              ].map(z => (
                <g key={z.key} onClick={() => toggleDamageZone(z.key)} style={{ cursor: 'pointer' }}>
                  <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="5" fill={damageZones[z.key] ? '#dcfce7' : '#f0fdf4'} stroke={damageZones[z.key] ? '#01ae42' : '#e2e8f0'} strokeWidth="1.5" opacity={damageZones[z.key] ? 1 : 0.6}/>
                  <text x={z.lx} y={z.ly} textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#64748b" fontWeight="600">{z.label}</text>
                </g>
              ))}
              <g onClick={() => toggleDamageZone('passenger')} style={{ cursor: 'pointer' }}>
                <rect x="218" y="133" width="34" height="74" rx="5" fill={damageZones['passenger'] ? '#dcfce7' : '#f0fdf4'} stroke={damageZones['passenger'] ? '#01ae42' : '#e2e8f0'} strokeWidth="1.5" opacity={damageZones['passenger'] ? 1 : 0.6}/>
                <text x="235" y="168" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#64748b" fontWeight="600" transform="rotate(-90 235 168)">Passenger side</text>
              </g>
              <g onClick={() => toggleDamageZone('driver')} style={{ cursor: 'pointer' }}>
                <rect x="427" y="133" width="34" height="74" rx="5" fill={damageZones['driver'] ? '#dcfce7' : '#f0fdf4'} stroke={damageZones['driver'] ? '#01ae42' : '#e2e8f0'} strokeWidth="1.5" opacity={damageZones['driver'] ? 1 : 0.6}/>
                <text x="445" y="168" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#64748b" fontWeight="600" transform="rotate(90 445 168)">Driver side</text>
              </g>
              <text x="340" y="18" textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#94a3b8">▲ Front</text>
              <text x="340" y="330" textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#94a3b8">▼ Rear</text>
              <text x="172" y="172" textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#94a3b8">Passenger</text>
              <text x="508" y="172" textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#94a3b8">Driver</text>
            </svg>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />

            {/* Component checklists */}
            {[
              { label: 'Front', items: ['Bonnet', 'Front bumper', 'Front grille', 'Headlight (driver)', 'Headlight (passenger)', 'Front windscreen'] },
              { label: 'Rear', items: ['Boot', 'Rear bumper', 'Tail light (driver)', 'Tail light (passenger)', 'Rear windscreen', 'Tow bar'] },
              { label: 'Driver side', items: ['Front guard (driver)', 'Front door (driver)', 'Rear door (driver)', 'Rear quarter panel (driver)', 'Side mirror (driver)', 'Side skirt (driver)'] },
              { label: 'Passenger side', items: ['Front guard (passenger)', 'Front door (passenger)', 'Rear door (passenger)', 'Rear quarter panel (passenger)', 'Side mirror (passenger)', 'Side skirt (passenger)'] },
              { label: 'Roof / interior', items: ['Roof panel', 'Sunroof', 'A-pillar', 'B-pillar'] },
              { label: 'Other', items: ['Undercarriage', 'Wheels / tyres'] },
            ].map(group => (
              <div key={group.label} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{group.label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '6px' }}>
                  {group.items.map(item => (
                    <div
                      key={item}
                      onClick={() => toggleDamageComponent(item)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', border: `1px solid ${damageComponents.has(item) ? '#01ae42' : '#e2e8f0'}`, background: damageComponents.has(item) ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: '13px', color: damageComponents.has(item) ? '#166534' : '#374151', fontWeight: damageComponents.has(item) ? 500 : 400 }}
                    >
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1.5px solid ${damageComponents.has(item) ? '#01ae42' : '#cbd5e1'}`, background: damageComponents.has(item) ? '#01ae42' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {damageComponents.has(item) && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />

            {/* Damage summary */}
            {damageComponents.size > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Damage summary</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Array.from(damageComponents).map(name => (
                    <div key={name} style={{ padding: '4px 10px', borderRadius: '99px', background: '#e8f9ee', color: '#0a6b2e', fontSize: '12px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {name}
                      <button onClick={() => toggleDamageComponent(name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0a6b2e', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Damage description */}
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Damage description</div>
            <textarea
              style={{ ...input, height: '80px', resize: 'vertical' }}
              placeholder="Describe the damage in detail..."
              value={damageDescription}
              onChange={e => setDamageDescription(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Accident Details */}
      <div style={section}>
        <SectionHeader title="Accident Details" sectionKey="accidentDetails" openState={open} onToggle={toggle} />
        {open.accidentDetails && (
          <div style={grid2}>
            <F label="Date of accident"><input type="date" style={input} value={accident.date} onChange={e => updAccident('date', e.target.value)} /></F>
            <F label="Location type">
              <select style={input} value={accident.locationType} onChange={e => updAccident('locationType', e.target.value)}>
                <option value="">Select type...</option>
                <option value="Road">Road</option>
                <option value="Intersection">Intersection</option>
                <option value="Car Park">Car Park</option>
                <option value="Private Property">Private Property</option>
                <option value="Other">Other</option>
              </select>
            </F>
            <F label="Accident location" full>
              <AddressAutocomplete
                value={accident.location}
                onChange={v => updAccident('location', v)}
                onSelect={result => {
                  updAccident('location', result.address);
                  updAccident('suburb', result.suburb);
                }}
                style={input}
                placeholder="Search for accident location..."
              />
            </F>
            <F label="Suburb"><input style={input} value={accident.suburb} onChange={e => updAccident('suburb', e.target.value)} /></F>
            <F label="Accident description" full>
              <textarea style={{ ...input, height: '80px', resize: 'vertical' }} value={accident.description} onChange={e => updAccident('description', e.target.value)} />
            </F>
          </div>
        )}
      </div>

      {/* At Fault Party */}
      <div style={section}>
        <SectionHeader title="At Fault Party Details" sectionKey="atFaultParty" openState={open} onToggle={toggle} />
        {open.atFaultParty && (
          <>
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
          </>
        )}
      </div>

      {/* Repairer Details */}
      <div style={section}>
        <SectionHeader title="Repairer Details" sectionKey="repairerDetails" openState={open} onToggle={toggle} />
        {open.repairerDetails && (
          <div style={grid2}>
            <F label="Business name"><input style={input} value={repairer.businessName} onChange={e => updRepairer('businessName', e.target.value)} /></F>
            <F label="Phone number"><input style={input} value={repairer.phone} onChange={e => updRepairer('phone', e.target.value)} /></F>
            <F label="Address" full><input style={input} value={repairer.address} onChange={e => updRepairer('address', e.target.value)} /></F>
            <F label="Suburb"><input style={input} value={repairer.suburb} onChange={e => updRepairer('suburb', e.target.value)} /></F>
            <F label="Contact number"><input style={input} value={repairer.contact} onChange={e => updRepairer('contact', e.target.value)} /></F>
          </div>
        )}
      </div>

      {/* Payment Card */}
      <div style={section}>
        <SectionHeader title="Payment Card" sectionKey="paymentCard" openState={open} onToggle={toggle} />
        {open.paymentCard && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={addCard} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                + Add card
              </button>
            </div>
            {savedCards.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                {savedCards.map((sc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>{sc.cardType} — {sc.cardholderName}</div>
                      <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px' }}>Reference: <strong>{sc.referenceCode}</strong></div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Card saved</div>
                  </div>
                ))}
              </div>
            )}
            {cards.map((card, i) => (
              <div key={i} style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Card {i + 1}</span>
                  {cards.length > 1 && (
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
                    onClick={() => {
                      if (!card.cardType || !card.cardNumber || !card.cardholderName || !card.expiryDate) return;
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                      let code = 'CARD-';
                      for (let j = 0; j < 6; j++) code += chars.charAt(Math.floor(Math.random() * chars.length));
                      setSavedCards(prev => [...prev, { ...card, referenceCode: code }]);
                      removeCard(i);
                      if (cards.length === 1) setCards([{ ...emptyCard }]);
                    }}
                    disabled={!card.cardType || !card.cardNumber || !card.cardholderName || !card.expiryDate}
                    style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: (!card.cardType || !card.cardNumber || !card.cardholderName || !card.expiryDate) ? '#86efac' : '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                  >
                    Save card
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Additional Drivers */}
      <div style={section}>
        <SectionHeader title="Additional Drivers" sectionKey="additionalDrivers" openState={open} onToggle={toggle} />
        {open.additionalDrivers && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={addAdditionalDriver} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                + Add driver
              </button>
            </div>
            {additionalDrivers.length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No additional drivers added.</p>
            )}
            {additionalDrivers.map((d, i) => (
              <div key={i} style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Driver {i + 1}</span>
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
          </>
        )}
      </div>

      {mutation.isError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
          Something went wrong. Please check all required fields and try again.
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', paddingBottom: '40px', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard/reservations')} style={{ padding: '12px 28px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', minWidth: '140px' }}>
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate('DRAFT')}
          disabled={!driver.firstName || !driver.lastName || !driver.phone || mutation.isPending}
          style={{ padding: '12px 28px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: !driver.firstName ? 'not-allowed' : 'pointer', minWidth: '140px', opacity: !driver.firstName || !driver.lastName || !driver.phone ? 0.6 : 1 }}
        >
          {mutation.isPending ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={() => mutation.mutate('PENDING')}
          disabled={!driver.firstName || !driver.lastName || !driver.phone || mutation.isPending}
          style={{ padding: '12px 28px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: mutation.isPending ? 'not-allowed' : 'pointer', minWidth: '140px', opacity: !driver.firstName || !driver.lastName || !driver.phone ? 0.6 : 1 }}
        >
          Email Application
        </button>
        <button
          onClick={() => {}}
          style={{ padding: '12px 28px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', minWidth: '140px' }}
        >
          Log Contact
        </button>
        <button
          onClick={() => {}}
          style={{ padding: '12px 28px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', minWidth: '140px' }}
        >
          Notes
        </button>
        <button
          onClick={() => {}}
          style={{ padding: '12px 28px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', minWidth: '140px' }}
        >
          Add to Schedule
        </button>
      </div>
    </div>
  );
}
