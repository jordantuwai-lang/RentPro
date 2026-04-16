'use client';
import { useState, useEffect, useRef } from 'react';
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

// ─── Person field group ───────────────────────────────────────────────────────

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
          {['International', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'].map(s => <option key={s} value={s}>{s}</option>)}
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

// ─── Vehicle diagram ──────────────────────────────────────────────────────────

function VehicleDiagram({ zones, onToggle }: { zones: Record<string, boolean>; onToggle: (z: string) => void }) {
  return (
    <svg viewBox="0 0 680 340" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '480px', display: 'block', margin: '0 auto' }}>
      {/* Body */}
      <rect x="220" y="40" width="240" height="260" rx="30" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
      {/* Front */}
      <g onClick={() => onToggle('front')} style={{ cursor: 'pointer' }}>
        <rect x="255" y="40" width="170" height="50" rx="10" fill={zones['front'] ? '#dcfce7' : '#f0fdf4'} stroke={zones['front'] ? '#01ae42' : '#e2e8f0'} strokeWidth="1.5" opacity={zones['front'] ? 1 : 0.7} />
        <text x="340" y="71" textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#64748b" fontWeight="600">Front</text>
      </g>
      {/* Rear */}
      <g onClick={() => onToggle('rear')} style={{ cursor: 'pointer' }}>
        <rect x="255" y="250" width="170" height="50" rx="10" fill={zones['rear'] ? '#dcfce7' : '#f0fdf4'} stroke={zones['rear'] ? '#01ae42' : '#e2e8f0'} strokeWidth="1.5" opacity={zones['rear'] ? 1 : 0.7} />
        <text x="340" y="281" textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#64748b" fontWeight="600">Rear</text>
      </g>
      {/* Roof */}
      <g onClick={() => onToggle('roof')} style={{ cursor: 'pointer' }}>
        <rect x="270" y="110" width="140" height="120" rx="8" fill={zones['roof'] ? '#dcfce7' : '#f0fdf4'} stroke={zones['roof'] ? '#01ae42' : '#e2e8f0'} strokeWidth="1.5" opacity={zones['roof'] ? 1 : 0.7} />
        <text x="340" y="175" textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#64748b" fontWeight="600">Roof / Interior</text>
      </g>
      {/* Passenger side */}
      <g onClick={() => onToggle('passenger')} style={{ cursor: 'pointer' }}>
        <rect x="219" y="133" width="34" height="74" rx="5" fill={zones['passenger'] ? '#dcfce7' : '#f0fdf4'} stroke={zones['passenger'] ? '#01ae42' : '#e2e8f0'} strokeWidth="1.5" opacity={zones['passenger'] ? 1 : 0.7} />
        <text x="235" y="168" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#64748b" fontWeight="600" transform="rotate(-90 235 168)">Passenger side</text>
      </g>
      {/* Driver side */}
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
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewReservationPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [rezNumber, setRezNumber] = useState('');

  // ── Licence scan state ──
  const licenceScanRef = useRef<HTMLInputElement>(null);
  const [licenceScan, setLicenceScan] = useState<{
    status: 'idle' | 'scanning' | 'done' | 'error';
    message?: string;
  }>({ status: 'idle' });

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
  const [showOwner, setShowOwner] = useState(false);

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
  const toggleDamageComponent = (name: string) => setDamageComponents(p => {
    const n = new Set(p);
    n.has(name) ? n.delete(name) : n.add(name);
    return n;
  });

  // Accident
  const [accident, setAccident] = useState({ date: '', location: '', suburb: '', locationType: '', description: '' });
  const updAccident = (f: string, v: string) => setAccident(p => ({ ...p, [f]: v }));

  // At fault
  const [atFault, setAtFault] = useState({ ...emptyPerson, vehicleRegistration: '', vehicleYear: '', vehicleMake: '', vehicleModel: '', insuranceProvider: '', claimNumber: '' });
  const updAtFault = (f: string, v: string) => setAtFault(p => ({ ...p, [f]: v }));
  const [showAtFaultBusiness, setShowAtFaultBusiness] = useState(false);
  const [atFaultBusiness, setAtFaultBusiness] = useState({ ...emptyBusiness });
  const updAtFaultBusiness = (f: string, v: string) => setAtFaultBusiness(p => ({ ...p, [f]: v }));

  // Misc flags
  const [settlementReceived, setSettlementReceived] = useState('');
  const [thirdPartyRecovery, setThirdPartyRecovery] = useState('');
  const [repairStartDate, setRepairStartDate] = useState('');
  const [repairEndDate, setRepairEndDate] = useState('');
  const [estimateDate, setEstimateDate] = useState('');
  const [assessmentDate, setAssessmentDate] = useState('');

  // Repairer
  const [repairer, setRepairer] = useState({ businessName: '', phone: '', address: '', suburb: '', contact: '', invoiceNo: '', invoiceAmt: '' });
  const updRepairer = (f: string, v: string) => setRepairer(p => ({ ...p, [f]: v }));

  // Witness / police
  const [witnessName, setWitnessName] = useState('');
  const [witnessPhone, setWitnessPhone] = useState('');
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

  // ── Fetch next reservation number ──
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

  // ── Licence scan handler ──
  // When Credit Hire is selected, staff can tap this button to take or upload a
  // photo of the customer's licence. It is sent to Claude Vision, which extracts
  // the relevant fields and auto-populates the Driver Details section directly.
  // The image itself is never stored — only the text output is used.
  const handleLicenceScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLicenceScan({ status: 'scanning' });

    // Step 1: Convert the image file to a base64 string so it can be sent in
    // the API request. We strip the "data:image/...;base64," prefix because
    // the Anthropic API expects only the raw base64 data portion.
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    try {
      // Step 2: Send image + extraction prompt to Claude Vision.
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: file.type as any, data: base64 },
                },
                {
                  type: 'text',
                  text: `This is an Australian driver's licence. Extract the following fields and return ONLY a valid JSON object with no markdown, no explanation, and no backticks:
{
  "firstName": "",
  "lastName": "",
  "licenceNumber": "",
  "licenceExpiry": "YYYY-MM-DD",
  "dob": "YYYY-MM-DD",
  "address": "",
  "suburb": "",
  "postcode": ""
}
If a field cannot be clearly found, leave it as an empty string. All dates must be in YYYY-MM-DD format.`,
                },
              ],
            },
          ],
        }),
      });

      const data = await res.json();
      const rawText = data.content?.find((b: any) => b.type === 'text')?.text ?? '';

      // Step 3: Parse the JSON response. Strip any accidental markdown fences
      // just in case the model includes them despite the prompt instruction.
      let parsed: any = {};
      try {
        parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      } catch {
        throw new Error('Could not parse licence data from response');
      }

      // Step 4: Map extracted fields into driver state. Only update fields
      // where Claude actually found a value — leave blanks untouched so staff
      // can still fill them in manually if anything was missed.
      if (parsed.firstName)     updDriver('firstName', parsed.firstName);
      if (parsed.lastName)      updDriver('lastName', parsed.lastName);
      if (parsed.licenceNumber) updDriver('licenceNumber', parsed.licenceNumber);
      if (parsed.licenceExpiry) updDriver('licenceExpiry', parsed.licenceExpiry);
      if (parsed.dob)           updDriver('dob', parsed.dob);
      if (parsed.address)       updDriver('address', parsed.address);
      if (parsed.suburb)        updDriver('suburb', parsed.suburb);
      if (parsed.postcode)      updDriver('postcode', parsed.postcode);

      setLicenceScan({ status: 'done', message: 'Licence scanned — check fields below' });
      setTimeout(() => setLicenceScan({ status: 'idle' }), 5000);
    } catch {
      setLicenceScan({ status: 'error', message: 'Scan failed — please fill in manually' });
      setTimeout(() => setLicenceScan({ status: 'idle' }), 5000);
    }

    // Reset so the same file can be re-scanned if needed
    if (licenceScanRef.current) licenceScanRef.current.value = '';
  };

  // ── Submit ──
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
        owner: (owner.firstName || owner.lastName) ? {
          firstName: owner.firstName,
          lastName: owner.lastName,
          phone: owner.phone || undefined,
          email: owner.email || undefined,
          address: owner.address || undefined,
          suburb: owner.suburb || undefined,
          postcode: owner.postcode || undefined,
          licenceNumber: owner.licenceNumber || undefined,
          insuranceProvider: owner.insuranceProvider || undefined,
          claimNumber: owner.claimNumber || undefined,
        } : undefined,
        nafVehicle: nafVehicle.registration ? nafVehicle : undefined,
        atFault: (atFault.firstName || atFault.lastName) ? atFault : undefined,
        accident: accident.date ? accident : undefined,
        repairer: repairer.businessName ? repairer : undefined,
        damageZones: Object.keys(damageZones).filter(k => damageZones[k]),
        damageComponents: Array.from(damageComponents),
        damageDescription: damageDescription || undefined,
        witness: witnessName ? { name: witnessName, phone: witnessPhone } : undefined,
        police: policeEventNo ? { contactName: policeContactName, phone: policePhone, eventNo: policeEventNo } : undefined,
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

  // ── Render ──
  return (
    <div style={{ maxWidth: '820px' }}>
      {/* Spinner keyframe for scan button loading state */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>New Reservation</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Accident replacement vehicle intake form</p>
        </div>
        {rezNumber && (
          <div style={{
            background: '#EAF3DE',
            border: '0.5px solid #C0DD97',
            borderRadius: '8px',
            padding: '7px 14px',
            textAlign: 'right',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: '10px', fontWeight: 500, color: '#3B6D11', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rez no.</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#27500A', fontFamily: 'monospace', marginTop: '2px' }}>{rezNumber}</div>
          </div>
        )}
      </div>

      {/* Partner picker modal */}
      {showPartnerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
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
          {/* Booking Details — merged with Source of Business */}
          <SectionBlock title="Booking Details">
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
              <F label="Branch">
                <select style={inp} value={branchId} onChange={e => setBranchId(e.target.value)}>
                  <option value="">Select branch...</option>
                  <option value="KPK">Keilor Park (KPK)</option>
                  <option value="COB">Coburg (COB)</option>
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
              <F label="Hire start date">
                <input type="date" style={inp} value={startDate} onChange={e => setStartDate(e.target.value)} />
              </F>
            </div>
          </SectionBlock>

          {/* Driver Details
              ─────────────────────────────────────────────────────────────────
              When Credit Hire is selected (on Tab 2), a licence scan button
              appears at the top of this section. Tapping it opens the camera
              (or file picker on desktop), sends the image to Claude Vision,
              and auto-fills the fields below with the extracted data.
          */}
          <SectionBlock title="Driver Details">
            {hireType === 'Credit Hire' && (
              <div style={{ marginBottom: '20px' }}>
                {/* Hidden file input — triggered by the scan button below.
                    capture="environment" opens the rear camera on mobile devices
                    which is optimal for photographing a physical licence card. */}
                <input
                  ref={licenceScanRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleLicenceScan}
                />
                <button
                  type="button"
                  onClick={() => licenceScanRef.current?.click()}
                  disabled={licenceScan.status === 'scanning'}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    borderRadius: '8px',
                    border: `2px dashed ${licenceScan.status === 'error' ? '#fca5a5' : '#01ae42'}`,
                    background:
                      licenceScan.status === 'done' ? '#f0fdf4' :
                      licenceScan.status === 'error' ? '#fef2f2' :
                      '#f8fafc',
                    color: licenceScan.status === 'error' ? '#dc2626' : '#01ae42',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: licenceScan.status === 'scanning' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s',
                  }}
                >
                  {licenceScan.status === 'scanning' && (
                    <span style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid #01ae42',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                      flexShrink: 0,
                    }} />
                  )}
                  {licenceScan.status === 'idle'     && '📷  Scan Driver\'s Licence'}
                  {licenceScan.status === 'scanning' && 'Scanning licence...'}
                  {licenceScan.status === 'done'     && `✓  ${licenceScan.message}`}
                  {licenceScan.status === 'error'    && `✗  ${licenceScan.message}`}
                </button>
                {licenceScan.status === 'idle' && (
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0', textAlign: 'center' }}>
                    Credit Hire — take a photo of the customer's licence to auto-fill fields below
                  </p>
                )}
              </div>
            )}
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

          {/* Registered Owner — collapsed by default since driver is owner in most cases */}
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setShowOwner(!showOwner)}
              style={{
                padding: '10px 20px', borderRadius: '8px', border: '1px dashed #cbd5e1',
                background: showOwner ? '#f0fdf4' : '#fff',
                color: showOwner ? '#01ae42' : '#64748b',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left',
              }}
            >
              {showOwner ? '— Remove registered owner details' : '+ Add registered owner (if different from driver)'}
            </button>
          </div>
          {showOwner && (
            <SectionBlock title="Registered Owner">
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
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════ TAB 2: ACCIDENT & CLAIMS */}
      {activeTab === 1 && (
        <>
    
          {/* NAF Vehicle Details */}
          <SectionBlock title="NAF Vehicle Details">
            <div style={grid2}>
              <F label="Registration"><input style={inp} value={nafVehicle.registration} onChange={e => updNafVehicle('registration', e.target.value)} /></F>
              <F label="Registration state">
                <select style={inp} value={nafVehicle.registrationState} onChange={e => updNafVehicle('registrationState', e.target.value)}>
                  <option value="">Select state...</option>
                  {['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'].map(s => <option key={s} value={s}>{s}</option>)}
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
            {[
              { key: 'front', label: 'Front', items: ['Bonnet', 'Front bumper', 'Front grille', 'Headlight (driver)', 'Headlight (passenger)', 'Front windscreen'] },
              { key: 'driver', label: 'Driver side', items: ['Driver door', 'Driver mirror', 'Driver rear quarter', 'Driver front quarter', 'Driver running board'] },
              { key: 'passenger', label: 'Passenger side', items: ['Passenger door', 'Passenger mirror', 'Passenger rear quarter', 'Passenger front quarter', 'Passenger running board'] },
              { key: 'rear', label: 'Rear', items: ['Boot / tailgate', 'Rear bumper', 'Rear windscreen', 'Tail light (driver)', 'Tail light (passenger)'] },
              { key: 'roof', label: 'Roof / other', items: ['Roof panel', 'Roof rack', 'Underbody / chassis', 'Wheels / tyres', 'Interior'] },
            ].map(zone => {
              const selectedInZone = zone.items.filter(item => damageComponents.has(item));
              const isOpen = damageZones[zone.key];
              return (
                <div key={zone.key} style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', marginBottom: '6px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => toggleDamageZone(zone.key)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: selectedInZone.length > 0 ? '#EAF3DE' : 'var(--color-background-primary)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 500, color: selectedInZone.length > 0 ? '#27500A' : '#0f172a' }}>
                      {zone.label}
                    </span>
                    <span style={{ fontSize: '11px', color: selectedInZone.length > 0 ? '#3B6D11' : '#94a3b8' }}>
                      {selectedInZone.length > 0
                        ? `${selectedInZone.length} selected  ${isOpen ? '▾' : '▸'}`
                        : isOpen ? '▾' : '▸'}
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '12px 14px', borderTop: '0.5px solid #e2e8f0', background: '#fff' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {zone.items.map(item => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleDamageComponent(item)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '999px',
                              border: `1px solid ${damageComponents.has(item) ? '#97C459' : '#e2e8f0'}`,
                              background: damageComponents.has(item) ? '#EAF3DE' : '#fff',
                              color: damageComponents.has(item) ? '#27500A' : '#64748b',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: damageComponents.has(item) ? 500 : 400,
                            }}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ marginTop: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Damage description</label>
              <textarea
                style={{ ...inp, height: '80px', resize: 'vertical' }}
                value={damageDescription}
                onChange={e => setDamageDescription(e.target.value)}
                placeholder="Describe the damage in detail..."
              />
            </div>
          </SectionBlock>

          {/* Repair Dates */}
          <SectionBlock title="Repair Dates">
            <div style={grid2}>
              <F label="Estimate date"><input type="date" style={inp} value={estimateDate} onChange={e => setEstimateDate(e.target.value)} /></F>
              <F label="Assessment date"><input type="date" style={inp} value={assessmentDate} onChange={e => setAssessmentDate(e.target.value)} /></F>
              <F label="Repair start date"><input type="date" style={inp} value={repairStartDate} onChange={e => setRepairStartDate(e.target.value)} /></F>
              <F label="Repair end date"><input type="date" style={inp} value={repairEndDate} onChange={e => setRepairEndDate(e.target.value)} /></F>
            </div>
            <div style={{ display: 'flex', gap: '32px', marginTop: '20px', flexWrap: 'wrap' }}>
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
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Saved cards</p>
                {savedCards.map((card, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{card.cardType} — {card.cardholderName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Ref: <strong style={{ color: '#01ae42' }}>{card.referenceCode}</strong></div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{card.expiryDate}</div>
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

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: '12px', paddingBottom: '40px', flexWrap: 'wrap' }}>
        <button
          onClick={() => router.push('/dashboard/reservations')}
          style={{ padding: '12px 28px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate('DRAFT')}
          disabled={!driver.firstName || !driver.lastName || !driver.phone || mutation.isPending}
          style={{
            padding: '12px 28px', borderRadius: '8px', border: 'none',
            background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600,
            cursor: !driver.firstName || !driver.lastName || !driver.phone ? 'not-allowed' : 'pointer',
            minWidth: '140px',
            opacity: !driver.firstName || !driver.lastName || !driver.phone ? 0.6 : 1,
          }}
        >
          {mutation.isPending ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={() => mutation.mutate('PENDING')}
          disabled={!driver.firstName || !driver.lastName || !driver.phone || mutation.isPending}
          style={{
            padding: '12px 28px', borderRadius: '8px', border: 'none',
            background: '#0f172a', color: '#fff', fontSize: '14px', fontWeight: 600,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            minWidth: '140px',
            opacity: !driver.firstName || !driver.lastName || !driver.phone ? 0.6 : 1,
          }}
        >
          {mutation.isPending ? 'Creating...' : 'Create Reservation'}
        </button>
      </div>
    </div>
  );
}