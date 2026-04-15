
'use client';
 
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import AddressAutocomplete from '@/components/AddressAutocomplete';
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
const emptyPerson = {
  firstName: '', lastName: '', address: '', suburb: '', postcode: '',
  phone: '', email: '', licenceNumber: '', licenceState: '', licenceExpiry: '', dob: '',
};
 
const emptyBusiness = {
  name: '', abn: '', contactName: '', contactPhone: '',
};
 
const emptyCard = {
  cardType: '', cardNumber: '', expiryDate: '', cardholderName: '',
};
 
const emptyAdditionalDriver = {
  firstName: '', lastName: '', licenceNumber: '', licenceExpiry: '', dob: '', phone: '',
};
 
// ─── Styles ───────────────────────────────────────────────────────────────────
 
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '8px',
  border: '1.5px solid #e2e8f0', fontSize: '14px', color: '#0f172a',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
};
 
const lbl: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px',
};
 
const grid2: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
};
 
// ─── Reusable components ──────────────────────────────────────────────────────
 
function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}
 
function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
      padding: '20px', marginBottom: '16px',
    }}>
      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
 
function RadioGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const colors: Record<string, string> = { CTP: '#ef4444', TPP: '#f59e0b', COMP: '#01ae42', 'Credit Hire': '#6366f1', 'Direct Hire': '#0ea5e9' };
  const bgs: Record<string, string> = { CTP: '#fef2f2', TPP: '#fffbeb', COMP: '#f0fdf4', 'Credit Hire': '#eef2ff', 'Direct Hire': '#f0f9ff' };
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(value === o ? '' : o)} style={{
          padding: '8px 18px', borderRadius: '8px',
          border: `1.5px solid ${value === o ? (colors[o] || '#01ae42') : '#e2e8f0'}`,
          background: value === o ? (bgs[o] || '#f0fdf4') : '#fff',
          color: value === o ? (colors[o] || '#01ae42') : '#64748b',
          fontSize: '13px', fontWeight: 500, cursor: 'pointer',
        }}>
          {o}
        </button>
      ))}
    </div>
  );
}
 
function PersonFields({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <div style={grid2}>
      <F label="First name *"><input style={inp} value={data.firstName} onChange={e => onChange('firstName', e.target.value)} /></F>
      <F label="Last name *"><input style={inp} value={data.lastName} onChange={e => onChange('lastName', e.target.value)} /></F>
      <F label="Address" full>
        <AddressAutocomplete
          value={data.address}
          onChange={(v: string) => onChange('address', v)}
          onSelect={(r: any) => { onChange('address', r.address); onChange('suburb', r.suburb); onChange('postcode', r.postcode); }}
          style={inp}
          placeholder="Start typing address..."
        />
      </F>
      <F label="Suburb"><input style={inp} value={data.suburb} onChange={e => onChange('suburb', e.target.value)} /></F>
      <F label="Postcode"><input style={inp} value={data.postcode} onChange={e => onChange('postcode', e.target.value)} /></F>
      <F label="Phone *"><input style={inp} value={data.phone} onChange={e => onChange('phone', e.target.value)} /></F>
      <F label="Email"><input style={inp} value={data.email} onChange={e => onChange('email', e.target.value)} /></F>
      <F label="Licence number"><input style={inp} value={data.licenceNumber} onChange={e => onChange('licenceNumber', e.target.value)} /></F>
      <F label="Licence state">
        <select style={inp} value={data.licenceState || ''} onChange={e => onChange('licenceState', e.target.value)}>
          <option value="">Select state...</option>
          <option value="International">International</option>
          {['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </F>
      <F label="Licence expiry"><input type="date" style={inp} value={data.licenceExpiry} onChange={e => onChange('licenceExpiry', e.target.value)} /></F>
      <F label="Date of birth"><input type="date" style={inp} value={data.dob} onChange={e => onChange('dob', e.target.value)} /></F>
    </div>
  );
}
 
function BusinessFields({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <div style={grid2}>
      <F label="Business name" full><input style={inp} value={data.name} onChange={e => onChange('name', e.target.value)} /></F>
      <F label="ABN"><input style={inp} value={data.abn} onChange={e => onChange('abn', e.target.value)} /></F>
      <F label="Contact name"><input style={inp} value={data.contactName} onChange={e => onChange('contactName', e.target.value)} /></F>
      <F label="Contact phone"><input style={inp} value={data.contactPhone} onChange={e => onChange('contactPhone', e.target.value)} /></F>
    </div>
  );
}
 
// ─── SVG Damage Diagram ───────────────────────────────────────────────────────
 
function DamageDiagram({ zones, onToggle }: { zones: Record<string, boolean>; onToggle: (z: string) => void }) {
  const fill = (z: string) => zones[z] ? '#dcfce7' : '#f8fafc';
  const stroke = (z: string) => zones[z] ? '#01ae42' : '#e2e8f0';
  return (
    <svg viewBox="0 0 680 340" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '500px', cursor: 'pointer' }}>
      {/* Body */}
      <rect x="200" y="80" width="280" height="180" rx="18" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5" />
      {/* Front */}
      <rect x="220" y="55" width="240" height="40" rx="8" fill={fill('front')} stroke={stroke('front')} strokeWidth="1.5" onClick={() => onToggle('front')} />
      <text x="340" y="80" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600" style={{ pointerEvents: 'none' }}>Front</text>
      {/* Rear */}
      <rect x="220" y="245" width="240" height="40" rx="8" fill={fill('rear')} stroke={stroke('rear')} strokeWidth="1.5" onClick={() => onToggle('rear')} />
      <text x="340" y="270" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600" style={{ pointerEvents: 'none' }}>Rear</text>
      {/* Passenger side */}
      <rect x="155" y="110" width="40" height="120" rx="8" fill={fill('passenger')} stroke={stroke('passenger')} strokeWidth="1.5" onClick={() => onToggle('passenger')} />
      <text x="175" y="172" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600" transform="rotate(-90 175 172)" style={{ pointerEvents: 'none' }}>Passenger</text>
      {/* Driver side */}
      <rect x="485" y="110" width="40" height="120" rx="8" fill={fill('driver')} stroke={stroke('driver')} strokeWidth="1.5" onClick={() => onToggle('driver')} />
      <text x="505" y="172" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600" transform="rotate(90 505 172)" style={{ pointerEvents: 'none' }}>Driver</text>
      {/* Roof */}
      <rect x="250" y="110" width="180" height="120" rx="8" fill={fill('roof')} stroke={stroke('roof')} strokeWidth="1.5" onClick={() => onToggle('roof')} />
      <text x="340" y="176" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600" style={{ pointerEvents: 'none' }}>Roof / Top</text>
      {/* Labels */}
      <text x="340" y="30" textAnchor="middle" fontSize="11" fill="#94a3b8">▲ Front</text>
      <text x="340" y="320" textAnchor="middle" fontSize="11" fill="#94a3b8">▼ Rear</text>
    </svg>
  );
}
 
// ─── Modals ───────────────────────────────────────────────────────────────────
 
function CardDetailsModal({ onClose, cards, setCards }: any) {
  const [card, setCard] = useState({ ...emptyCard });
  const upd = (f: string, v: string) => setCard(p => ({ ...p, [f]: v }));
 
  const addCard = () => {
    if (!card.cardNumber || !card.cardType) return;
    const ref = 'CARD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setCards((prev: any[]) => [...prev, { ...card, referenceCode: ref }]);
    setCard({ ...emptyCard });
  };
 
  const removeCard = (i: number) => setCards((prev: any[]) => prev.filter((_: any, idx: number) => idx !== i));
 
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '480px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Card Details</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
        </div>
 
        <div style={grid2}>
          <F label="Card type">
            <select style={inp} value={card.cardType} onChange={e => upd('cardType', e.target.value)}>
              <option value="">Select type...</option>
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="Amex">Amex</option>
            </select>
          </F>
          <F label="Card number"><input style={inp} value={card.cardNumber} onChange={e => upd('cardNumber', e.target.value)} placeholder="XXXX XXXX XXXX XXXX" /></F>
          <F label="Expiry date"><input style={inp} value={card.expiryDate} onChange={e => upd('expiryDate', e.target.value)} placeholder="MM/YY" /></F>
          <F label="Cardholder name"><input style={inp} value={card.cardholderName} onChange={e => upd('cardholderName', e.target.value)} /></F>
        </div>
 
        <button onClick={addCard} style={{ marginTop: '16px', padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          + Add Card
        </button>
 
        {cards.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Saved Cards</h4>
            {cards.map((c: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{c.cardType} •••• {c.cardNumber.slice(-4)}</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>{c.referenceCode}</span>
                  <button onClick={() => removeCard(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 
function AdditionalLicenceModal({ onClose, drivers, setDrivers }: any) {
  const [drv, setDrv] = useState({ ...emptyAdditionalDriver });
  const upd = (f: string, v: string) => setDrv(p => ({ ...p, [f]: v }));
 
  const addDriver = () => {
    if (!drv.firstName || !drv.lastName) return;
    setDrivers((prev: any[]) => [...prev, { ...drv }]);
    setDrv({ ...emptyAdditionalDriver });
  };
 
  const removeDrv = (i: number) => setDrivers((prev: any[]) => prev.filter((_: any, idx: number) => idx !== i));
 
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '520px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Additional Licence</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
        </div>
 
        <div style={grid2}>
          <F label="First name *"><input style={inp} value={drv.firstName} onChange={e => upd('firstName', e.target.value)} /></F>
          <F label="Last name *"><input style={inp} value={drv.lastName} onChange={e => upd('lastName', e.target.value)} /></F>
          <F label="Licence number"><input style={inp} value={drv.licenceNumber} onChange={e => upd('licenceNumber', e.target.value)} /></F>
          <F label="Licence expiry"><input type="date" style={inp} value={drv.licenceExpiry} onChange={e => upd('licenceExpiry', e.target.value)} /></F>
          <F label="Date of birth"><input type="date" style={inp} value={drv.dob} onChange={e => upd('dob', e.target.value)} /></F>
          <F label="Phone"><input style={inp} value={drv.phone} onChange={e => upd('phone', e.target.value)} /></F>
        </div>
 
        <button onClick={addDriver} style={{ marginTop: '16px', padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          + Add Driver
        </button>
 
        {drivers.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Added Drivers</h4>
            {drivers.map((d: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{d.firstName} {d.lastName}</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>{d.licenceNumber || 'No licence #'}</span>
                  <button onClick={() => removeDrv(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 
function PartnerModal({ onClose, onSelect }: { onClose: () => void; onSelect: (r: any) => void }) {
  const { getToken } = useAuth();
  const { data: repairers = [] } = useQuery({
    queryKey: ['repairers-modal'],
    queryFn: async () => {
      const token = await getToken();
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/claims/repairers`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });
 
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '480px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Select Partner</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {repairers.map((r: any) => (
            <button key={r.id} onClick={() => { onSelect(r); onClose(); }} style={{
              padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0',
              background: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#0f172a', fontWeight: 500,
            }}>
              {r.name} <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 400 }}>— {r.suburb}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
 
// ─── Tab config ───────────────────────────────────────────────────────────────
 
const TABS = [
  { label: 'Main', icon: '📋' },
  { label: 'Customer', icon: '👤' },
  { label: 'At Fault', icon: '⚠️' },
  { label: 'Accident & Damage', icon: '🚗' },
  { label: 'Repairer', icon: '🔧' },
];
 
// ─── Main page ────────────────────────────────────────────────────────────────
 
export default function NewReservationPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
 
  const [activeTab, setActiveTab] = useState(0);
  const [rezNumber, setRezNumber] = useState('');
  const [showError, setShowError] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showLicenceModal, setShowLicenceModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
 
  // ── Tab 1: Main ──────────────────────────────────────────────────────────────
  const [sourceOfBusiness, setSourceOfBusiness] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [branchId, setBranchId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [typeOfCover, setTypeOfCover] = useState('');
  const [hireType, setHireType] = useState('');
 
  // ── Tab 2: Customer ──────────────────────────────────────────────────────────
  const [driver, setDriver] = useState({ ...emptyPerson });
  const [showDriverBusiness, setShowDriverBusiness] = useState(false);
  const [driverBusiness, setDriverBusiness] = useState({ ...emptyBusiness });
 
  const [sameAsDriver, setSameAsDriver] = useState(false);
  const [owner, setOwner] = useState({ ...emptyPerson, insuranceProvider: '', claimNumber: '' });
 
  const [nafVehicle, setNafVehicle] = useState({
    registration: '', registrationState: '', year: '', make: '', model: '', colour: '', driveable: '',
  });
  const [damageZones, setDamageZones] = useState<Record<string, boolean>>({});
  const [damageComponents, setDamageComponents] = useState<Set<string>>(new Set());
  const [damageDescription, setDamageDescription] = useState('');
 
  const updDriver = (f: string, v: string) => setDriver(p => ({ ...p, [f]: v }));
  const updDriverBusiness = (f: string, v: string) => setDriverBusiness(p => ({ ...p, [f]: v }));
  const updOwner = (f: string, v: string) => setOwner(p => ({ ...p, [f]: v }));
  const updNafVehicle = (f: string, v: string) => setNafVehicle(p => ({ ...p, [f]: v }));
  const toggleDamageZone = (z: string) => setDamageZones(p => ({ ...p, [z]: !p[z] }));
  const toggleDamageComponent = (name: string) => setDamageComponents(prev => {
    const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next;
  });
 
  const damageComponentOptions = ['Bonnet', 'Front Bumper', 'Rear Bumper', 'Left Guard', 'Right Guard', 'Left Door', 'Right Door', 'Left Rear Door', 'Right Rear Door', 'Boot / Tailgate', 'Windscreen', 'Rear Windscreen', 'Left Mirror', 'Right Mirror', 'Roof', 'Underbody'];
 
  // ── Tab 3: At Fault ──────────────────────────────────────────────────────────
  const [atFault, setAtFault] = useState({ ...emptyPerson, vehicleRegistration: '', insuranceProvider: '', claimNumber: '' });
  const [showAtFaultBusiness, setShowAtFaultBusiness] = useState(false);
  const [atFaultBusiness, setAtFaultBusiness] = useState({ ...emptyBusiness });
  const updAtFault = (f: string, v: string) => setAtFault(p => ({ ...p, [f]: v }));
  const updAtFaultBusiness = (f: string, v: string) => setAtFaultBusiness(p => ({ ...p, [f]: v }));
 
  // ── Tab 4: Accident & Damage ─────────────────────────────────────────────────
  const [accident, setAccident] = useState({
    date: '', time: '', locationType: '', location: '', suburb: '', description: '',
    vehiclesInvolved: '', towIn: '', totalLoss: '', settlementLetter: '',
  });
  const [witness, setWitness] = useState({ fullName: '', contactNumber: '', policeId: '' });
  const updAccident = (f: string, v: string) => setAccident(p => ({ ...p, [f]: v }));
  const updWitness = (f: string, v: string) => setWitness(p => ({ ...p, [f]: v }));
 
  // ── Tab 5: Repairer ──────────────────────────────────────────────────────────
  const [repairer, setRepairer] = useState({
    name: '', phone: '', email: '', address: '', suburb: '', postcode: '',
    contact: '', repairStartDate: '', repairEndDate: '', estimateDate: '', assessmentDate: '',
    invoiceNo: '', invoiceAmt: '', thirdPartyRecovery: '',
  });
  const updRepairer = (f: string, v: string) => setRepairer(p => ({ ...p, [f]: v }));
 
  // ── Action bar modals state ──────────────────────────────────────────────────
  const [cards, setCards] = useState<any[]>([]);
  const [additionalDrivers, setAdditionalDrivers] = useState<any[]>([]);
 
  // ── Branches & mutation ──────────────────────────────────────────────────────
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const token = await getToken();
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/branches`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });
 
  const mutation = useMutation({
    mutationFn: async (status: string) => {
      const token = await getToken();
      const payload = {
        status,
        branchId: branchId || null,
        startDate: startDate || null,
        sourceOfBusiness,
        typeOfCover,
        hireType,
        driver,
        driverBusiness: showDriverBusiness ? driverBusiness : null,
        owner: sameAsDriver ? driver : owner,
        nafVehicle,
        damageZones: Object.keys(damageZones).filter(k => damageZones[k]),
        damageComponents: Array.from(damageComponents),
        damageDescription,
        atFault,
        atFaultBusiness: showAtFaultBusiness ? atFaultBusiness : null,
        accident,
        witness,
        repairer,
        cards,
        additionalDrivers,
      };
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/reservations`, payload, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      router.push(`/dashboard/reservations/${data.id}`);
    },
    onError: () => setShowError(true),
  });
 
  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '860px', paddingBottom: '120px' }}>
 
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>New Reservation</h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Accident replacement vehicle intake</p>
      </div>
 
      {/* REZ badge */}
      {rezNumber && (
        <div style={{ display: 'inline-block', padding: '4px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '20px', fontSize: '13px', fontWeight: 600, color: '#01ae42', marginBottom: '16px' }}>
          {rezNumber}
        </div>
      )}
 
      {/* Tab nav */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', overflowX: 'auto' }}>
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              flex: '1 0 auto', padding: '10px 14px', borderRadius: '9px', border: 'none',
              background: activeTab === i ? '#fff' : 'transparent',
              color: activeTab === i ? '#0f172a' : '#64748b',
              fontSize: '13px', fontWeight: activeTab === i ? 700 : 500,
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: activeTab === i ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <span style={{ marginRight: '6px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
 
      {/* ═══════════════════════════════════════════ TAB 1: MAIN */}
      {activeTab === 0 && (
        <>
          {/* Reservation Header */}
          <SectionBlock title="Reservation Header">
            <div style={grid2}>
              <F label="Branch *">
                <select style={inp} value={branchId} onChange={e => setBranchId(e.target.value)}>
                  <option value="">Select branch...</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </F>
              <F label="Booking date">
                <input type="date" style={inp} value={startDate} onChange={e => setStartDate(e.target.value)} />
              </F>
            </div>
          </SectionBlock>
 
          {/* Source of Business */}
          <SectionBlock title="Source of Business">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {['Repairer', 'Tow Operator', 'Marketing', 'Corporate Partnerships'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSourceOfBusiness(sourceOfBusiness === opt ? '' : opt)}
                  style={{
                    padding: '9px 20px', borderRadius: '8px',
                    border: `1.5px solid ${sourceOfBusiness === opt ? '#01ae42' : '#e2e8f0'}`,
                    background: sourceOfBusiness === opt ? '#f0fdf4' : '#fff',
                    color: sourceOfBusiness === opt ? '#01ae42' : '#64748b',
                    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
 
            {(sourceOfBusiness === 'Repairer' || sourceOfBusiness === 'Tow Operator') && (
              <div>
                {selectedPartner ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#01ae42' }}>{selectedPartner}</span>
                    <button onClick={() => { setSelectedPartner(''); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>× Remove</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPartnerModal(true)}
                    style={{ padding: '9px 18px', borderRadius: '8px', border: '1.5px dashed #01ae42', background: '#f0fdf4', color: '#01ae42', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Select {sourceOfBusiness}
                  </button>
                )}
              </div>
            )}
 
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div>
                <label style={{ ...lbl, marginBottom: '10px' }}>Type of cover</label>
                <RadioGroup options={['CTP', 'TPP', 'COMP']} value={typeOfCover} onChange={setTypeOfCover} />
              </div>
              <div>
                <label style={{ ...lbl, marginBottom: '10px' }}>Hire type</label>
                <RadioGroup options={['Credit Hire', 'Direct Hire']} value={hireType} onChange={setHireType} />
              </div>
            </div>
          </SectionBlock>
        </>
      )}
 
      {/* ═══════════════════════════════════════════ TAB 2: CUSTOMER */}
      {activeTab === 1 && (
        <>
          {/* Driver Details */}
          <SectionBlock title="Driver Details">
            <PersonFields data={driver} onChange={updDriver} />
            <button
              onClick={() => setShowDriverBusiness(!showDriverBusiness)}
              style={{
                marginTop: '16px', padding: '9px 16px', borderRadius: '8px',
                border: `1.5px solid ${showDriverBusiness ? '#01ae42' : '#e2e8f0'}`,
                background: showDriverBusiness ? '#f0fdf4' : '#fff',
                color: showDriverBusiness ? '#01ae42' : '#64748b',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              {showDriverBusiness ? '− Remove business details' : '+ Add business details'}
            </button>
            {showDriverBusiness && (
              <div style={{ marginTop: '16px' }}>
                <BusinessFields data={driverBusiness} onChange={updDriverBusiness} />
              </div>
            )}
          </SectionBlock>
 
          {/* Registered Owner */}
          <SectionBlock title="Registered Owner (NAF Vehicle)">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={sameAsDriver}
                  onChange={e => {
                    setSameAsDriver(e.target.checked);
                    if (e.target.checked) setOwner({ ...driver, insuranceProvider: owner.insuranceProvider, claimNumber: owner.claimNumber });
                  }}
                />
                Same as driver
              </label>
            </div>
            <PersonFields data={owner} onChange={updOwner} />
            <div style={{ ...grid2, marginTop: '16px' }}>
              <F label="Insurance provider"><input style={inp} value={owner.insuranceProvider} onChange={e => updOwner('insuranceProvider', e.target.value)} /></F>
              <F label="Claim number"><input style={inp} value={owner.claimNumber} onChange={e => updOwner('claimNumber', e.target.value)} /></F>
            </div>
          </SectionBlock>
 
          {/* Business Details (for owner/business entity) */}
          <SectionBlock title="Business Details (if applicable)">
            <BusinessFields data={driverBusiness} onChange={updDriverBusiness} />
          </SectionBlock>
 
          {/* NAF Vehicle Details */}
          <SectionBlock title="NAF Vehicle Details">
            <div style={grid2}>
              <F label="Registration"><input style={inp} value={nafVehicle.registration} onChange={e => updNafVehicle('registration', e.target.value)} /></F>
              <F label="Registration state">
                <select style={inp} value={nafVehicle.registrationState} onChange={e => updNafVehicle('registrationState', e.target.value)}>
                  <option value="">Select state...</option>
                  {['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </F>
              <F label="Year"><input style={inp} value={nafVehicle.year} onChange={e => updNafVehicle('year', e.target.value)} placeholder="e.g. 2021" /></F>
              <F label="Make"><input style={inp} value={nafVehicle.make} onChange={e => updNafVehicle('make', e.target.value)} /></F>
              <F label="Model"><input style={inp} value={nafVehicle.model} onChange={e => updNafVehicle('model', e.target.value)} /></F>
              <F label="Colour"><input style={inp} value={nafVehicle.colour} onChange={e => updNafVehicle('colour', e.target.value)} /></F>
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={{ ...lbl, marginBottom: '10px' }}>Is vehicle driveable?</label>
              <RadioGroup options={['Yes', 'No', 'Unknown']} value={nafVehicle.driveable} onChange={v => updNafVehicle('driveable', v)} />
            </div>
            <div style={{ marginTop: '20px' }}>
              <label style={lbl}>Damage zones (click to mark)</label>
              <DamageDiagram zones={damageZones} onToggle={toggleDamageZone} />
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={lbl}>Damaged components</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {damageComponentOptions.map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleDamageComponent(name)}
                    style={{
                      padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                      border: `1.5px solid ${damageComponents.has(name) ? '#01ae42' : '#e2e8f0'}`,
                      background: damageComponents.has(name) ? '#f0fdf4' : '#fff',
                      color: damageComponents.has(name) ? '#01ae42' : '#64748b',
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <F label="Damage description">
                <textarea style={{ ...inp, height: '80px', resize: 'vertical' }} value={damageDescription} onChange={e => setDamageDescription(e.target.value)} />
              </F>
            </div>
          </SectionBlock>
        </>
      )}
 
      {/* ═══════════════════════════════════════════ TAB 3: AT FAULT */}
      {activeTab === 2 && (
        <SectionBlock title="At Fault Party Details">
          <PersonFields data={atFault} onChange={updAtFault} />
          <div style={{ ...grid2, marginTop: '16px' }}>
            <F label="Vehicle registration"><input style={inp} value={atFault.vehicleRegistration} onChange={e => updAtFault('vehicleRegistration', e.target.value)} /></F>
            <F label="Insurance provider"><input style={inp} value={atFault.insuranceProvider} onChange={e => updAtFault('insuranceProvider', e.target.value)} /></F>
            <F label="Claim number"><input style={inp} value={atFault.claimNumber} onChange={e => updAtFault('claimNumber', e.target.value)} /></F>
          </div>
          <button
            onClick={() => setShowAtFaultBusiness(!showAtFaultBusiness)}
            style={{
              marginTop: '16px', padding: '9px 16px', borderRadius: '8px',
              border: `1.5px solid ${showAtFaultBusiness ? '#01ae42' : '#e2e8f0'}`,
              background: showAtFaultBusiness ? '#f0fdf4' : '#fff',
              color: showAtFaultBusiness ? '#01ae42' : '#64748b',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            {showAtFaultBusiness ? '− Remove business details' : '+ Add business details'}
          </button>
          {showAtFaultBusiness && (
            <div style={{ marginTop: '16px' }}>
              <BusinessFields data={atFaultBusiness} onChange={updAtFaultBusiness} />
            </div>
          )}
        </SectionBlock>
      )}
 
      {/* ═══════════════════════════════════════════ TAB 4: ACCIDENT & DAMAGE */}
      {activeTab === 3 && (
        <>
          {/* Accident Details */}
          <SectionBlock title="Accident Details">
            <div style={grid2}>
              <F label="Date of accident"><input type="date" style={inp} value={accident.date} onChange={e => updAccident('date', e.target.value)} /></F>
              <F label="Time of accident"><input type="time" style={inp} value={accident.time} onChange={e => updAccident('time', e.target.value)} /></F>
              <F label="Location type">
                <select style={inp} value={accident.locationType} onChange={e => updAccident('locationType', e.target.value)}>
                  <option value="">Select type...</option>
                  <option value="Road">Road</option>
                  <option value="Intersection">Intersection</option>
                  <option value="Car Park">Car Park</option>
                  <option value="Private Property">Private Property</option>
                  <option value="Other">Other</option>
                </select>
              </F>
              <F label="Number of vehicles involved">
                <input style={inp} type="number" min="1" value={accident.vehiclesInvolved} onChange={e => updAccident('vehiclesInvolved', e.target.value)} />
              </F>
              <F label="Accident location" full>
                <AddressAutocomplete
                  value={accident.location}
                  onChange={(v: string) => updAccident('location', v)}
                  onSelect={(r: any) => { updAccident('location', r.address); updAccident('suburb', r.suburb); }}
                  style={inp}
                  placeholder="Search accident location..."
                />
              </F>
              <F label="Suburb"><input style={inp} value={accident.suburb} onChange={e => updAccident('suburb', e.target.value)} /></F>
            </div>
            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ ...lbl, marginBottom: '10px' }}>Tow in?</label>
                <RadioGroup options={['Yes', 'No', 'Unknown']} value={accident.towIn} onChange={v => updAccident('towIn', v)} />
              </div>
              <div>
                <label style={{ ...lbl, marginBottom: '10px' }}>Total loss?</label>
                <RadioGroup options={['Yes', 'No', 'Unknown']} value={accident.totalLoss} onChange={v => updAccident('totalLoss', v)} />
              </div>
              <div>
                <label style={{ ...lbl, marginBottom: '10px' }}>Settlement letter received?</label>
                <RadioGroup options={['Yes', 'No']} value={accident.settlementLetter} onChange={v => updAccident('settlementLetter', v)} />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <F label="Accident description">
                <textarea style={{ ...inp, height: '90px', resize: 'vertical' }} value={accident.description} onChange={e => updAccident('description', e.target.value)} />
              </F>
            </div>
          </SectionBlock>
 
          {/* Witness Details */}
          <SectionBlock title="Witness / Police Details">
            <div style={grid2}>
              <F label="Full name"><input style={inp} value={witness.fullName} onChange={e => updWitness('fullName', e.target.value)} /></F>
              <F label="Contact number"><input style={inp} value={witness.contactNumber} onChange={e => updWitness('contactNumber', e.target.value)} /></F>
              <F label="Police ID / Event no."><input style={inp} value={witness.policeId} onChange={e => updWitness('policeId', e.target.value)} /></F>
            </div>
          </SectionBlock>
        </>
      )}
 
      {/* ═══════════════════════════════════════════ TAB 5: REPAIRER */}
      {activeTab === 4 && (
        <SectionBlock title="Repairer Details">
          <div style={grid2}>
            <F label="Repairer name" full><input style={inp} value={repairer.name} onChange={e => updRepairer('name', e.target.value)} /></F>
            <F label="Phone"><input style={inp} value={repairer.phone} onChange={e => updRepairer('phone', e.target.value)} /></F>
            <F label="Email"><input style={inp} value={repairer.email} onChange={e => updRepairer('email', e.target.value)} /></F>
            <F label="Address" full><input style={inp} value={repairer.address} onChange={e => updRepairer('address', e.target.value)} /></F>
            <F label="Suburb"><input style={inp} value={repairer.suburb} onChange={e => updRepairer('suburb', e.target.value)} /></F>
            <F label="Postcode"><input style={inp} value={repairer.postcode} onChange={e => updRepairer('postcode', e.target.value)} /></F>
            <F label="Repair contact"><input style={inp} value={repairer.contact} onChange={e => updRepairer('contact', e.target.value)} /></F>
          </div>
          <div style={{ ...grid2, marginTop: '16px' }}>
            <F label="Repair start date"><input type="date" style={inp} value={repairer.repairStartDate} onChange={e => updRepairer('repairStartDate', e.target.value)} /></F>
            <F label="Repair end date"><input type="date" style={inp} value={repairer.repairEndDate} onChange={e => updRepairer('repairEndDate', e.target.value)} /></F>
            <F label="Estimate date"><input type="date" style={inp} value={repairer.estimateDate} onChange={e => updRepairer('estimateDate', e.target.value)} /></F>
            <F label="Assessment date"><input type="date" style={inp} value={repairer.assessmentDate} onChange={e => updRepairer('assessmentDate', e.target.value)} /></F>
            <F label="Invoice number"><input style={inp} value={repairer.invoiceNo} onChange={e => updRepairer('invoiceNo', e.target.value)} /></F>
            <F label="Invoice amount"><input style={inp} type="number" value={repairer.invoiceAmt} onChange={e => updRepairer('invoiceAmt', e.target.value)} placeholder="0.00" /></F>
          </div>
          <div style={{ marginTop: '16px' }}>
            <label style={{ ...lbl, marginBottom: '10px' }}>3rd Party Recovery?</label>
            <RadioGroup options={['Yes', 'No', 'Unknown']} value={repairer.thirdPartyRecovery} onChange={v => updRepairer('thirdPartyRecovery', v)} />
          </div>
        </SectionBlock>
      )}
 
      {/* Error message */}
      {showError && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>
          Something went wrong. Please check all required fields and try again.
        </div>
      )}
 
      {/* ── Sticky action bar ── */}
      <div style={{
        position: 'sticky', bottom: 0, background: '#f8fafc',
        borderTop: '1px solid #e2e8f0', padding: '14px 0 20px',
        marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap',
      }}>
        <button
          onClick={() => router.push('/dashboard/reservations')}
          style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate('DRAFT')}
          disabled={mutation.isPending}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#0f172a', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          {mutation.isPending ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={() => mutation.mutate('PENDING')}
          disabled={mutation.isPending || !driver.firstName || !driver.phone}
          style={{
            padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            opacity: !driver.firstName || !driver.phone ? 0.6 : 1,
          }}
        >
          Email Application
        </button>
 
        {/* Separator */}
        <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />
 
        <button
          onClick={() => setShowCardModal(true)}
          style={{
            padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #6366f1',
            background: cards.length > 0 ? '#eef2ff' : '#fff', color: '#6366f1',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          💳 Card Details
          {cards.length > 0 && (
            <span style={{ background: '#6366f1', color: '#fff', borderRadius: '10px', fontSize: '11px', padding: '1px 7px', fontWeight: 700 }}>{cards.length}</span>
          )}
        </button>
 
        <button
          onClick={() => setShowLicenceModal(true)}
          style={{
            padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #0ea5e9',
            background: additionalDrivers.length > 0 ? '#f0f9ff' : '#fff', color: '#0ea5e9',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          🪪 Additional Licence
          {additionalDrivers.length > 0 && (
            <span style={{ background: '#0ea5e9', color: '#fff', borderRadius: '10px', fontSize: '11px', padding: '1px 7px', fontWeight: 700 }}>{additionalDrivers.length}</span>
          )}
        </button>
 
        <button
          onClick={() => {}}
          style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
        >
          Add to Schedule
        </button>
 
        <button
          onClick={() => {}}
          style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
        >
          Log Contact
        </button>
      </div>
 
      {/* Modals */}
      {showCardModal && (
        <CardDetailsModal onClose={() => setShowCardModal(false)} cards={cards} setCards={setCards} />
      )}
      {showLicenceModal && (
        <AdditionalLicenceModal onClose={() => setShowLicenceModal(false)} drivers={additionalDrivers} setDrivers={setAdditionalDrivers} />
      )}
      {showPartnerModal && (
        <PartnerModal
          onClose={() => setShowPartnerModal(false)}
          onSelect={(r: any) => {
            setSelectedPartner(r.name);
            updRepairer('name', r.name);
            updRepairer('phone', r.phone || '');
            updRepairer('email', r.email || '');
            updRepairer('address', r.address || '');
            updRepairer('suburb', r.suburb || '');
            updRepairer('postcode', r.postcode || '');
          }}
        />
      )}
    </div>
  );
}