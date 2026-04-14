'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AddressAutocomplete from '@/components/AddressAutocomplete';

// ─── Shared styles ────────────────────────────────────────────────────────────

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
const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' };
const fullSpan: React.CSSProperties = { gridColumn: '1 / -1' };

// ─── Small helpers ────────────────────────────────────────────────────────────

function F({ label, children, full, style }: { label: string; children: React.ReactNode; full?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={{ ...(full ? fullSpan : {}), ...style }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sectionBox}>
      <h3 style={sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />;
}

function ToggleYNU({ value, onChange, labels }: { value: string; onChange: (v: string) => void; labels?: [string, string, string] }) {
  const opts = labels ?? ['Yes', 'No', 'Unknown'];
  const colors: Record<string, string> = { [opts[0]]: '#01ae42', [opts[1]]: '#ef4444', [opts[2]]: '#64748b' };
  const bgs: Record<string, string> = { [opts[0]]: '#f0fdf4', [opts[1]]: '#fef2f2', [opts[2]]: '#f8fafc' };
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {opts.map(o => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(value === o ? '' : o)}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: `1.5px solid ${value === o ? colors[o] : '#e2e8f0'}`,
            background: value === o ? bgs[o] : '#fff',
            color: value === o ? colors[o] : '#64748b',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function RadioGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {options.map(o => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(value === o ? '' : o)}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: `1.5px solid ${value === o ? '#01ae42' : '#e2e8f0'}`,
            background: value === o ? '#f0fdf4' : '#fff',
            color: value === o ? '#01ae42' : '#64748b',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// ─── Reusable person field group ──────────────────────────────────────────────

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
          {['International','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s} value={s}>{s}</option>)}
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
      <F label="Business name"><input style={inp} value={data.name} onChange={e => onChange('name', e.target.value)} /></F>
      <F label="ABN"><input style={inp} value={data.abn} onChange={e => onChange('abn', e.target.value)} /></F>
      <F label="Phone"><input style={inp} value={data.phone} onChange={e => onChange('phone', e.target.value)} /></F>
      <F label="Business address" full><input style={inp} value={data.address} onChange={e => onChange('address', e.target.value)} /></F>
      <F label="Suburb"><input style={inp} value={data.suburb} onChange={e => onChange('suburb', e.target.value)} /></F>
      <F label="Postcode"><input style={inp} value={data.postcode} onChange={e => onChange('postcode', e.target.value)} /></F>
    </div>
  );
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const emptyPerson = { firstName: '', lastName: '', address: '', suburb: '', postcode: '', phone: '', email: '', licenceNumber: '', licenceState: '', licenceExpiry: '', dob: '' };
const emptyBusiness = { name: '', abn: '', phone: '', address: '', suburb: '', postcode: '' };
const emptyCard = { cardType: '', cardNumber: '', expiryDate: '', cardholderName: '' };
const emptyDriver = { firstName: '', lastName: '', licenceNumber: '', licenceExpiry: '', dob: '', phone: '' };

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: number; onChange: (i: number) => void }) {
  const tabs = ['Main', 'Accident & Claims', 'Documents & Admin'];
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', gap: '0' }}>
      {tabs.map((t, i) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(i)}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: active === i ? 600 : 500,
            color: active === i ? '#01ae42' : '#64748b',
            background: 'none',
            border: 'none',
            borderBottom: active === i ? '2px solid #01ae42' : '2px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ─── Vehicle damage diagram ───────────────────────────────────────────────────

function VehicleDiagram({ zones, onToggle }: { zones: Record<string, boolean>; onToggle: (z: string) => void }) {
  const zoneList = [
    { key: 'front', x: 248, y: 44, w: 184, h: 27, lx: 340, ly: 62, label: 'Front' },
    { key: 'rear', x: 248, y: 269, w: 184, h: 27, lx: 340, ly: 287, label: 'Rear' },
    { key: 'roof', x: 258, y: 138, w: 164, h: 64, lx: 340, ly: 174, label: 'Roof / interior' },
  ];
  return (
    <svg width="100%" viewBox="0 0 680 340" role="img" style={{ display: 'block' }}>
      <title>Vehicle damage selector</title>
      <rect x="220" y="40" width="240" height="260" rx="30" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="240" y="65" width="200" height="55" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1" />
      <rect x="240" y="220" width="200" height="55" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1" />
      <rect x="250" y="130" width="180" height="80" rx="4" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
      {[195, 455].map(x => [65, 220].map(y => (
        <rect key={`${x}-${y}`} x={x} y={y} width="30" height="55" rx="8" fill="#475569" stroke="#334155" strokeWidth="1" />
      )))}
      {zoneList.map(z => (
        <g key={z.key} onClick={() => onToggle(z.key)} style={{ cursor: 'pointer' }}>
          <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="5" fill={zones[z.key] ? '#dcfce7' : '#f0fdf4'} stroke={zones[z.key] ? '#01ae42' : '#e2e8f0'} strokeWidth="1.5" opacity={zones[z.key] ? 1 : 0.7} />
          <text x={z.lx} y={z.ly} textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#64748b" fontWeight="600">{z.label}</text>
        </g>
      ))}
      <g onClick={() => onToggle('passenger')} style={{ cursor: 'pointer' }}>
        <rect x="218" y="133" width="34" height="74" rx="5" fill={zones['passenger'] ? '#dcfce7' : '#f0fdf4'} stroke={zones['passenger'] ? '#01ae42' : '#e2e8f0'} strokeWidth="1.5" opacity={zones['passenger'] ? 1 : 0.7} />
        <text x="235" y="168" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#64748b" fontWeight="600" transform="rotate(-90 235 168)">Passenger side</text>
      </g>
      <g onClick={() => onToggle('driver')} style={{ cursor: 'pointer' }}>
        <rect x="427" y="133" width="34" height="74" rx="5" fill={zones['driver'] ? '#dcfce7' : '#f0fdf4'} stroke={zones['driver'] ? '#01ae42' : '#e2e8f0'} strokeWidth="1.5" opacity={zones['driver'] ? 1 : 0.7} />
        <text x="445" y="168" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#64748b" fontWeight="600" transform="rotate(90 445 168)">Driver side</text>
      </g>
      <text x="340" y="18" textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#94a3b8">▲ Front</text>
      <text x="340" y="330" textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#94a3b8">▼ Rear</text>
      <text x="172" y="172" textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#94a3b8">Passenger</text>
      <text x="508" y="172" textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#94a3b8">Driver</text>
    </svg>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewReservationPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [rezNumber, setRezNumber] = useState('');

  // ── Tab 1: Main ──
  const [sourceOfBusiness, setSourceOfBusiness] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [branchId, setBranchId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driver, setDriver] = useState({ ...emptyPerson });
  const [showDriverBusiness, setShowDriverBusiness] = useState(false);
  const [driverBusiness, setDriverBusiness] = useState({ ...emptyBusiness });

  const updDriver = (f: string, v: string) => setDriver(p => ({ ...p, [f]: v }));
  const updDriverBusiness = (f: string, v: string) => setDriverBusiness(p => ({ ...p, [f]: v }));

  // ── Tab 2: Accident & Claims ──
  const [typeOfCover, setTypeOfCover] = useState('');
  const [hireType, setHireType] = useState('');

  // Registered owner / NAF vehicle
  const [owner, setOwner] = useState({ ...emptyPerson, insuranceProvider: '', claimNumber: '' });
  const [sameAsDriver, setSameAsDriver] = useState(false);
  const updOwner = (f: string, v: string) => setOwner(p => ({ ...p, [f]: v }));
  const handleSameAsDriver = (checked: boolean) => {
    setSameAsDriver(checked);
    if (checked) setOwner(o => ({ ...o, ...driver }));
  };

  // NAF vehicle
  const [nafVehicle, setNafVehicle] = useState({ registration: '', registrationState: '', make: '', model: '', year: '', colour: '' });
  const updNafVehicle = (f: string, v: string) => setNafVehicle(p => ({ ...p, [f]: v }));

  // Vehicle damage
  const [vehicleDriveable, setVehicleDriveable] = useState('');
  const [towIn, setTowIn] = useState('');
  const [totalLoss, setTotalLoss] = useState('');
  const [damageZones, setDamageZones] = useState<Record<string, boolean>>({});
  const [damageComponents, setDamageComponents] = useState<Set<string>>(new Set());
  const [damageDescription, setDamageDescription] = useState('');
  const toggleDamageZone = (zone: string) => setDamageZones(p => ({ ...p, [zone]: !p[zone] }));
  const toggleDamageComponent = (name: string) => setDamageComponents(p => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n; });

  // Accident details
  const [accident, setAccident] = useState({ date: '', locationType: '', location: '', suburb: '', description: '' });
  const updAccident = (f: string, v: string) => setAccident(p => ({ ...p, [f]: v }));

  // Repairer
  const [repairer, setRepairer] = useState({ businessName: '', phone: '', address: '', suburb: '', contact: '', invoiceNo: '', invoiceAmt: '' });
  const updRepairer = (f: string, v: string) => setRepairer(p => ({ ...p, [f]: v }));
  const [repairStartDate, setRepairStartDate] = useState('');
  const [repairEndDate, setRepairEndDate] = useState('');
  const [estimateDate, setEstimateDate] = useState('');
  const [assessmentDate, setAssessmentDate] = useState('');
  const [settlementReceived, setSettlementReceived] = useState('');
  const [thirdPartyRecovery, setThirdPartyRecovery] = useState('');

  // At fault party
  const [atFault, setAtFault] = useState({ ...emptyPerson, vehicleRegistration: '', vehicleYear: '', vehicleMake: '', vehicleModel: '', insuranceProvider: '', claimNumber: '' });
  const updAtFault = (f: string, v: string) => setAtFault(p => ({ ...p, [f]: v }));
  const [showAtFaultBusiness, setShowAtFaultBusiness] = useState(false);
  const [atFaultBusiness, setAtFaultBusiness] = useState({ ...emptyBusiness });
  const updAtFaultBusiness = (f: string, v: string) => setAtFaultBusiness(p => ({ ...p, [f]: v }));

  // Witness
  const [witnessName, setWitnessName] = useState('');
  const [witnessPhone, setWitnessPhone] = useState('');

  // Police
  const [policeContactName, setPoliceContactName] = useState('');
  const [policePhone, setPolicePhone] = useState('');
  const [policeEventNo, setPoliceEventNo] = useState('');

  // ── Tab 3: Documents & Admin ──
  const [cards, setCards] = useState([{ ...emptyCard }]);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [additionalDrivers, setAdditionalDrivers] = useState<any[]>([]);

  const updCard = (i: number, f: string, v: string) => setCards(cards.map((c, idx) => idx === i ? { ...c, [f]: v } : c));
  const addCard = () => setCards([...cards, { ...emptyCard }]);
  const removeCard = (i: number) => setCards(cards.filter((_, idx) => idx !== i));
  const updAdditionalDriver = (i: number, f: string, v: string) => setAdditionalDrivers(additionalDrivers.map((d, idx) => idx === i ? { ...d, [f]: v } : d));
  const addAdditionalDriver = () => setAdditionalDrivers([...additionalDrivers, { ...emptyDriver }]);
  const removeAdditionalDriver = (i: number) => setAdditionalDrivers(additionalDrivers.filter((_, idx) => idx !== i));

  // ── Queries ──
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

  // ── Mutation ──
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
        typeOfCover: typeOfCover || undefined,
        hireType: hireType || undefined,
        towIn: towIn || undefined,
        totalLoss: totalLoss || undefined,
        settlementReceived: settlementReceived || undefined,
        repairStartDate: repairStartDate || undefined,
        repairEndDate: repairEndDate || undefined,
        estimateDate: estimateDate || undefined,
        assessmentDate: assessmentDate || undefined,
        repairerInvoiceNo: repairer.invoiceNo || undefined,
        repairerInvoiceAmt: repairer.invoiceAmt ? parseFloat(repairer.invoiceAmt) : undefined,
        thirdPartyRecovery: thirdPartyRecovery || undefined,
        witnessName: witnessName || undefined,
        witnessPhone: witnessPhone || undefined,
        policeContactName: policeContactName || undefined,
        policePhone: policePhone || undefined,
        policeEventNo: policeEventNo || undefined,
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

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>New Reservation</h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
          {rezNumber || 'Loading...'}
        </p>
      </div>

      {/* Partner Modal */}
      {showPartnerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '480px', maxHeight: '70vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Select {sourceOfBusiness === 'Repairer' ? 'Repairer' : 'Tow Operator'}</h2>
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
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{r.suburb}{r.state ? ` · ${r.state}` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* ══════════════════════════════════════════════════════════ TAB 1: MAIN */}
      {activeTab === 0 && (
        <>
          {/* Source of Business */}
          <SectionBlock title="Source of Business">
            <div style={grid2}>
              <F label="Source *">
                <select style={inp} value={sourceOfBusiness} onChange={e => {
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
                    style={{ ...inp, cursor: 'pointer', color: selectedPartner ? '#0f172a' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span>{selectedPartner || `Select ${sourceOfBusiness.toLowerCase()}...`}</span>
                    <span style={{ color: '#01ae42', fontSize: '12px' }}>Change</span>
                  </div>
                </F>
              )}
            </div>
          </SectionBlock>

          {/* Booking Details */}
          <SectionBlock title="Booking Details">
            <div style={grid2}>
              <F label="Reservation number">
                <input style={{ ...inp, background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }} value={rezNumber || 'Loading...'} readOnly />
              </F>
              <F label="Branch">
                <select style={inp} value={branchId} onChange={e => setBranchId(e.target.value)}>
                  <option value="">Select branch...</option>
                  <option value="KPK">Keilor Park (KPK)</option>
                  <option value="COB">Coburg (COB)</option>
                </select>
              </F>
              <F label="Hire start date">
                <input type="date" style={inp} value={startDate} onChange={e => setStartDate(e.target.value)} />
              </F>
            </div>
          </SectionBlock>

          {/* Driver Details */}
          <SectionBlock title="Driver Details">
            <PersonFields data={driver} onChange={updDriver} />
          </SectionBlock>

          {/* Business Details (optional) */}
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setShowDriverBusiness(!showDriverBusiness)}
              style={{
                padding: '10px 20px', borderRadius: '8px', border: '1px dashed #cbd5e1',
                background: showDriverBusiness ? '#f0fdf4' : '#fff',
                color: showDriverBusiness ? '#01ae42' : '#64748b',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left',
              }}
            >
              {showDriverBusiness ? '— Remove business details' : '+ Add business details (driving on behalf of a business)'}
            </button>
          </div>
          {showDriverBusiness && (
            <SectionBlock title="Business Details">
              <BusinessFields data={driverBusiness} onChange={updDriverBusiness} />
            </SectionBlock>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════ TAB 2: ACCIDENT & CLAIMS */}
      {activeTab === 1 && (
        <>
          {/* Cover & Hire Type */}
          <SectionBlock title="Cover & Hire Type">
            <div style={{ display: 'grid', gap: '20px' }}>
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

          {/* Registered Owner / NAF Vehicle Owner */}
          <SectionBlock title="Registered Owner (NAF Vehicle)">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                <input type="checkbox" checked={sameAsDriver} onChange={e => handleSameAsDriver(e.target.checked)} />
                Same as driver
              </label>
            </div>
            <PersonFields data={owner} onChange={updOwner} />
            <div style={{ ...grid2, marginTop: '16px' }}>
              <F label="Insurance provider"><input style={inp} value={owner.insuranceProvider} onChange={e => updOwner('insuranceProvider', e.target.value)} /></F>
              <F label="Claim number"><input style={inp} value={owner.claimNumber} onChange={e => updOwner('claimNumber', e.target.value)} /></F>
            </div>
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
              <F label="Year"><input style={inp} value={nafVehicle.year} onChange={e => updNafVehicle('year', e.target.value)} /></F>
              <F label="Make"><input style={inp} value={nafVehicle.make} onChange={e => updNafVehicle('make', e.target.value)} /></F>
              <F label="Model"><input style={inp} value={nafVehicle.model} onChange={e => updNafVehicle('model', e.target.value)} /></F>
              <F label="Colour"><input style={inp} value={nafVehicle.colour} onChange={e => updNafVehicle('colour', e.target.value)} /></F>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={{ ...lbl, marginBottom: '10px' }}>Vehicle driveable?</label>
                <ToggleYNU value={vehicleDriveable} onChange={setVehicleDriveable} labels={['Driveable', 'Not driveable', 'Unknown']} />
              </div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={{ ...lbl, marginBottom: '10px' }}>Tow in?</label>
                <ToggleYNU value={towIn} onChange={setTowIn} />
              </div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={{ ...lbl, marginBottom: '10px' }}>Total loss?</label>
                <ToggleYNU value={totalLoss} onChange={setTotalLoss} />
              </div>
            </div>
          </SectionBlock>

          {/* Vehicle Damage */}
          <SectionBlock title="Vehicle Damage">
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px' }}>Click a zone to highlight the damage area.</p>
            <VehicleDiagram zones={damageZones} onToggle={toggleDamageZone} />
            <Divider />
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
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px',
                        border: `1px solid ${damageComponents.has(item) ? '#01ae42' : '#e2e8f0'}`,
                        background: damageComponents.has(item) ? '#f0fdf4' : '#fff',
                        cursor: 'pointer', fontSize: '13px',
                        color: damageComponents.has(item) ? '#166534' : '#374151',
                        fontWeight: damageComponents.has(item) ? 500 : 400,
                      }}
                    >
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1.5px solid ${damageComponents.has(item) ? '#01ae42' : '#cbd5e1'}`, background: damageComponents.has(item) ? '#01ae42' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {damageComponents.has(item) && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>}
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {damageComponents.size > 0 && (
              <>
                <Divider />
                <div style={{ marginBottom: '16px' }}>
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
              </>
            )}
            <Divider />
            <F label="Damage description">
              <textarea style={{ ...inp, height: '80px', resize: 'vertical' }} placeholder="Describe the damage in detail..." value={damageDescription} onChange={e => setDamageDescription(e.target.value)} />
            </F>
          </SectionBlock>

          {/* Accident Details */}
          <SectionBlock title="Accident Details">
            <div style={grid2}>
              <F label="Date of accident"><input type="date" style={inp} value={accident.date} onChange={e => updAccident('date', e.target.value)} /></F>
              <F label="Location type">
                <select style={inp} value={accident.locationType} onChange={e => updAccident('locationType', e.target.value)}>
                  <option value="">Select type...</option>
                  {['Road', 'Intersection', 'Car Park', 'Private Property', 'Other'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </F>
              <F label="Accident location" full>
                <AddressAutocomplete
                  value={accident.location}
                  onChange={(v: string) => updAccident('location', v)}
                  onSelect={(r: any) => { updAccident('location', r.address); updAccident('suburb', r.suburb); }}
                  style={inp}
                  placeholder="Search for accident location..."
                />
              </F>
              <F label="Suburb"><input style={inp} value={accident.suburb} onChange={e => updAccident('suburb', e.target.value)} /></F>
              <F label="Accident description" full>
                <textarea style={{ ...inp, height: '80px', resize: 'vertical' }} value={accident.description} onChange={e => updAccident('description', e.target.value)} />
              </F>
            </div>
          </SectionBlock>

          {/* Repairer Details */}
          <SectionBlock title="Repairer Details">
            <div style={grid2}>
              <F label="Business name"><input style={inp} value={repairer.businessName} onChange={e => updRepairer('businessName', e.target.value)} /></F>
              <F label="Phone"><input style={inp} value={repairer.phone} onChange={e => updRepairer('phone', e.target.value)} /></F>
              <F label="Address" full><input style={inp} value={repairer.address} onChange={e => updRepairer('address', e.target.value)} /></F>
              <F label="Suburb"><input style={inp} value={repairer.suburb} onChange={e => updRepairer('suburb', e.target.value)} /></F>
              <F label="Contact name"><input style={inp} value={repairer.contact} onChange={e => updRepairer('contact', e.target.value)} /></F>
              <F label="Estimate date"><input type="date" style={inp} value={estimateDate} onChange={e => setEstimateDate(e.target.value)} /></F>
              <F label="Assessment date"><input type="date" style={inp} value={assessmentDate} onChange={e => setAssessmentDate(e.target.value)} /></F>
              <F label="Repair start date"><input type="date" style={inp} value={repairStartDate} onChange={e => setRepairStartDate(e.target.value)} /></F>
              <F label="Repair end date"><input type="date" style={inp} value={repairEndDate} onChange={e => setRepairEndDate(e.target.value)} /></F>
              <F label="Invoice number"><input style={inp} value={repairer.invoiceNo} onChange={e => updRepairer('invoiceNo', e.target.value)} /></F>
              <F label="Invoice amount"><input style={inp} type="number" value={repairer.invoiceAmt} onChange={e => updRepairer('invoiceAmt', e.target.value)} placeholder="0.00" /></F>
            </div>
            <div style={{ display: 'flex', gap: '24px', marginTop: '20px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ ...lbl, marginBottom: '10px' }}>Settlement letter received?</label>
                <ToggleYNU value={settlementReceived} onChange={setSettlementReceived} />
              </div>
              <div>
                <label style={{ ...lbl, marginBottom: '10px' }}>3rd party recovery?</label>
                <ToggleYNU value={thirdPartyRecovery} onChange={setThirdPartyRecovery} />
              </div>
            </div>
          </SectionBlock>

          {/* At Fault Party */}
          <SectionBlock title="At Fault Party">
            <PersonFields data={atFault} onChange={updAtFault} />
            <div style={{ ...grid2, marginTop: '16px' }}>
              <F label="Vehicle registration"><input style={inp} value={atFault.vehicleRegistration} onChange={e => updAtFault('vehicleRegistration', e.target.value)} /></F>
              <F label="Vehicle year"><input style={inp} value={atFault.vehicleYear} onChange={e => updAtFault('vehicleYear', e.target.value)} /></F>
              <F label="Vehicle make"><input style={inp} value={atFault.vehicleMake} onChange={e => updAtFault('vehicleMake', e.target.value)} /></F>
              <F label="Vehicle model"><input style={inp} value={atFault.vehicleModel} onChange={e => updAtFault('vehicleModel', e.target.value)} /></F>
              <F label="Insurance provider"><input style={inp} value={atFault.insuranceProvider} onChange={e => updAtFault('insuranceProvider', e.target.value)} /></F>
              <F label="Claim number"><input style={inp} value={atFault.claimNumber} onChange={e => updAtFault('claimNumber', e.target.value)} /></F>
            </div>
            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowAtFaultBusiness(!showAtFaultBusiness)}
                style={{
                  padding: '10px 20px', borderRadius: '8px', border: '1px dashed #cbd5e1',
                  background: showAtFaultBusiness ? '#f0fdf4' : '#fff',
                  color: showAtFaultBusiness ? '#01ae42' : '#64748b',
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left', marginBottom: '16px',
                }}
              >
                {showAtFaultBusiness ? '— Remove business details' : '+ Add business details (at fault party driving on behalf of a business)'}
              </button>
              {showAtFaultBusiness && <BusinessFields data={atFaultBusiness} onChange={updAtFaultBusiness} />}
            </div>
          </SectionBlock>

          {/* Witness */}
          <SectionBlock title="Witness">
            <div style={grid2}>
              <F label="Witness name"><input style={inp} value={witnessName} onChange={e => setWitnessName(e.target.value)} /></F>
              <F label="Witness phone"><input style={inp} value={witnessPhone} onChange={e => setWitnessPhone(e.target.value)} /></F>
            </div>
          </SectionBlock>

          {/* Police */}
          <SectionBlock title="Police">
            <div style={grid2}>
              <F label="Contact name"><input style={inp} value={policeContactName} onChange={e => setPoliceContactName(e.target.value)} /></F>
              <F label="Phone"><input style={inp} value={policePhone} onChange={e => setPolicePhone(e.target.value)} /></F>
              <F label="Event number"><input style={inp} value={policeEventNo} onChange={e => setPoliceEventNo(e.target.value)} /></F>
            </div>
          </SectionBlock>
        </>
      )}

      {/* ══════════════════════════════════════════ TAB 3: DOCUMENTS & ADMIN */}
      {activeTab === 2 && (
        <>
          {/* Payment Cards */}
          <SectionBlock title="Payment Cards">
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
                    <select style={inp} value={card.cardType} onChange={e => updCard(i, 'cardType', e.target.value)}>
                      <option value="">Select type...</option>
                      {['Visa Credit', 'Visa Debit', 'Mastercard Credit', 'Mastercard Debit', 'American Express'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </F>
                  <F label="Cardholder name"><input style={inp} value={card.cardholderName} onChange={e => updCard(i, 'cardholderName', e.target.value)} /></F>
                  <F label="Card number"><input style={inp} value={card.cardNumber} onChange={e => updCard(i, 'cardNumber', e.target.value)} placeholder="**** **** **** ****" /></F>
                  <F label="Expiry date"><input style={inp} value={card.expiryDate} onChange={e => updCard(i, 'expiryDate', e.target.value)} placeholder="MM/YY" /></F>
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
                    style={{
                      padding: '8px 20px', borderRadius: '8px', border: 'none',
                      background: (!card.cardType || !card.cardNumber || !card.cardholderName || !card.expiryDate) ? '#86efac' : '#01ae42',
                      color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    Save card
                  </button>
                </div>
              </div>
            ))}
          </SectionBlock>

          {/* Additional Drivers */}
          <SectionBlock title="Additional Drivers">
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
                  <F label="First name *"><input style={inp} value={d.firstName} onChange={e => updAdditionalDriver(i, 'firstName', e.target.value)} /></F>
                  <F label="Last name *"><input style={inp} value={d.lastName} onChange={e => updAdditionalDriver(i, 'lastName', e.target.value)} /></F>
                  <F label="Licence number *"><input style={inp} value={d.licenceNumber} onChange={e => updAdditionalDriver(i, 'licenceNumber', e.target.value)} /></F>
                  <F label="Phone"><input style={inp} value={d.phone} onChange={e => updAdditionalDriver(i, 'phone', e.target.value)} /></F>
                  <F label="Licence expiry"><input type="date" style={inp} value={d.licenceExpiry} onChange={e => updAdditionalDriver(i, 'licenceExpiry', e.target.value)} /></F>
                  <F label="Date of birth"><input type="date" style={inp} value={d.dob} onChange={e => updAdditionalDriver(i, 'dob', e.target.value)} /></F>
                </div>
              </div>
            ))}
          </SectionBlock>

          {/* Notes placeholder */}
          <SectionBlock title="Notes">
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Notes can be added after the reservation is created.</p>
          </SectionBlock>
        </>
      )}

      {/* ── Error ── */}
      {mutation.isError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
          Something went wrong. Please check all required fields and try again.
        </div>
      )}

      {/* ── Action buttons — always visible ── */}
      <div style={{
        display: 'flex', gap: '10px', paddingBottom: '40px', flexWrap: 'wrap',
        position: 'sticky', bottom: 0, background: '#f8fafc',
        padding: '16px 0 24px', borderTop: '1px solid #e2e8f0', marginTop: '8px',
      }}>
        <button
          onClick={() => router.push('/dashboard/reservations')}
          style={{ padding: '11px 22px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate('DRAFT')}
          disabled={mutation.isPending}
          style={{ padding: '11px 22px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#0f172a', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          {mutation.isPending ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={() => mutation.mutate('PENDING')}
          disabled={mutation.isPending || !driver.firstName || !driver.lastName || !driver.phone}
          style={{
            padding: '11px 22px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            opacity: !driver.firstName || !driver.lastName || !driver.phone ? 0.6 : 1,
          }}
        >
          Email Application
        </button>
        <button
          onClick={() => {}}
          style={{ padding: '11px 22px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
        >
          Add to Schedule
        </button>
        <button
          onClick={() => {}}
          style={{ padding: '11px 22px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
        >
          Log Contact
        </button>
      </div>
    </div>
  );
}
