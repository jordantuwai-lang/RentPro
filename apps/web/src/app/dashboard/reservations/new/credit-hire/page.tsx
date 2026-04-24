'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs'; // Corrected Clerk import
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
          onSelect={(r: any) => { 
            onChange('address', r.address); 
            onChange('suburb', r.suburb); 
            onChange('postcode', r.postcode); 
            if (r.state) onChange('state', r.state);
          }}
          style={inp}
          placeholder="Start typing address..."
        />
      </F>
      <F label="Suburb"><input style={inp} value={data.suburb} onChange={e => onChange('suburb', e.target.value)} /></F>
      <F label="State"><input style={inp} value={data.state} onChange={e => onChange('state', e.target.value)} /></F>
      <F label="Postcode"><input style={inp} value={data.postcode} onChange={e => onChange('postcode', e.target.value)} /></F>
      <F label="Phone *"><input style={inp} value={data.phone} onChange={e => onChange('phone', e.target.value)} /></F>
      <F label="Email"><input style={inp} value={data.email} onChange={e => onChange('email', e.target.value)} /></F>
      <F label="Licence number"><input style={inp} value={data.licenceNumber} onChange={e => onChange('licenceNumber', e.target.value)} /></F>
      <F label="Licence state">
        <select style={inp} value={data.licenceState || ''} onChange={e => onChange('licenceState', e.target.value)}>
          <option value="">Select state...</option>
          {['International', 'ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'].map(s => <option key={s} value={s}>{s}</option>)}
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

const emptyPerson = { firstName: '', lastName: '', address: '', suburb: '', state: '', postcode: '', phone: '', email: '', licenceNumber: '', licenceState: '', licenceExpiry: '', dob: '' };
const emptyBusiness = { name: '', abn: '', phone: '', address: '', suburb: '', postcode: '' };
const emptyCard = { cardType: '', cardNumber: '', expiryDate: '', cardholderName: '' };
const emptyDriver = { firstName: '', lastName: '', licenceNumber: '', licenceState: '', licenceExpiry: '', dob: '', phone: '' };

const DOC_TYPES = [
  'Driver Licence', 'Insurance Certificate', 'Claim Form', 'Police Report', 'Repair Estimate', 
  'Assessment Report', 'Settlement Letter', 'Medical Certificate', 'Witness Statement', 'Tow Invoice', 'Other',
];

// ─── Tab Bar ───

function TabBar({ active, onChange }: { active: number; onChange: (i: number) => void }) {
  const tabs = ['Main', 'Customer', 'At Fault', 'Accident', 'Damage', 'Support', 'Cards', 'Documents'];
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', gap: '0', overflowX: 'auto' }}>
      {tabs.map((t, i) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(i)}
          style={{
            padding: '12px 20px',
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewReservationPage() {
  const { getToken } = useAuth();
  const { user } = useUser(); // Fixed hook
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [rezNumber, setRezNumber] = useState('');

  // ── Tab 0: Main ──
  const [sourceOfBusiness, setSourceOfBusiness] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [branchId, setBranchId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [vehicleId, setVehicleId] = useState('');

  // ── Tab 1: Customer ──
  const [driver, setDriver] = useState({ ...emptyPerson });
  const [showDriverBusiness, setShowDriverBusiness] = useState(false);
  const [driverBusiness, setDriverBusiness] = useState({ ...emptyBusiness });
  const [showOwner, setShowOwner] = useState(false);

  const updDriver = (f: string, v: string) => setDriver(p => ({ ...p, [f]: v }));
  const updDriverBusiness = (f: string, v: string) => setDriverBusiness(p => ({ ...p, [f]: v }));

  // ── Tab 2: At Fault ──
  // FIXED: Added vehicleState to satisfy TypeScript error on line 924
  const [atFault, setAtFault] = useState({ 
    ...emptyPerson, 
    vehicleRegistration: '', 
    vehicleYear: '', 
    vehicleMake: '', 
    vehicleModel: '', 
    vehicleState: '', // Fixes the build error
    vehicleBodyType: '',
    insuranceProvider: '', 
    claimNumber: '' 
  });
  const updAtFault = (f: string, v: string) => setAtFault(p => ({ ...p, [f]: v }));
  const [showAtFaultBusiness, setShowAtFaultBusiness] = useState(false);
  const [atFaultBusiness, setAtFaultBusiness] = useState({ ...emptyBusiness });
  const updAtFaultBusiness = (f: string, v: string) => setAtFaultBusiness(p => ({ ...p, [f]: v }));

  // ── Tab 3: Accident ──
  const [accident, setAccident] = useState({ date: '', location: '', suburb: '', locationType: '', description: '' });
  const updAccident = (f: string, v: string) => setAccident(p => ({ ...p, [f]: v }));

  // ── Tab 4: Damage ──
  const [damageZones, setDamageZones] = useState<Record<string, boolean>>({});
  const [damageComponents, setDamageComponents] = useState<Set<string>>(new Set());
  const [damageDescription, setDamageDescription] = useState('');

  // ── Tab 5: Support ──
  const [repairer, setRepairer] = useState({ businessName: '', phone: '', address: '', suburb: '', contact: '', invoiceNo: '', invoiceAmt: '' });
  const [estimateDate, setEstimateDate] = useState('');
  const [assessmentDate, setAssessmentDate] = useState('');
  const [repairStartDate, setRepairStartDate] = useState('');
  const [repairEndDate, setRepairEndDate] = useState('');
  const [settlementReceived, setSettlementReceived] = useState('');
  const [thirdPartyRecovery, setThirdPartyRecovery] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [witnessPhone, setWitnessPhone] = useState('');
  const [policeContactName, setPoliceContactName] = useState('');
  const [policePhone, setPolicePhone] = useState('');
  const [policeEventNo, setPoliceEventNo] = useState('');

  const updRepairer = (f: string, v: string) => setRepairer(p => ({ ...p, [f]: v }));

  // ── Tab 6: Cards ──
  const [cards, setCards] = useState([{ ...emptyCard }]);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [additionalDrivers, setAdditionalDrivers] = useState<any[]>([]);

  const updCard = (i: number, f: string, v: string) => setCards(cards.map((c, idx) => idx === i ? { ...c, [f]: v } : c));
  const removeCard = (i: number) => setCards(cards.filter((_, idx) => idx !== i));
  const addCard = () => setCards([...cards, { ...emptyCard }]);

  // ── Tab 7: Documents ──
  const [documents, setDocuments] = useState<any[]>([]);

  // ── Submit ──
  const mutation = useMutation({
    mutationFn: async (status: string) => {
      const token = await getToken();
      const authorName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Staff';
      
      const payload = {
        status,
        authorName,
        sourceOfBusiness,
        partnerName: selectedPartner,
        branchId,
        startDate,
        vehicleId,
        customer: driver,
        atFault,
        accident,
        repairer,
        damageZones: Object.keys(damageZones).filter(k => damageZones[k]),
        damageComponents: Array.from(damageComponents),
        damageDescription,
      };

      const res = await api.post('/reservations', payload, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      router.push('/dashboard/reservations');
    },
  });

  return (
    <div style={{ maxWidth: '820px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>New Reservation</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Accident replacement vehicle intake form</p>
        </div>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 0 && (
        <SectionBlock title="Booking Details">
          <div style={grid2}>
            <F label="Source *">
              <select style={inp} value={sourceOfBusiness} onChange={e => setSourceOfBusiness(e.target.value)}>
                <option value="">Select source...</option>
                <option value="Repairer">Repairer</option>
                <option value="Tow Operator">Tow Operator</option>
                <option value="Marketing">Marketing</option>
              </select>
            </F>
            <F label="Hire start date"><input type="date" style={inp} value={startDate} onChange={e => setStartDate(e.target.value)} /></F>
          </div>
        </SectionBlock>
      )}

      {activeTab === 1 && (
        <SectionBlock title="Customer Details">
          <PersonFields data={driver} onChange={updDriver} />
        </SectionBlock>
      )}

      {activeTab === 2 && (
        <SectionBlock title="At Fault Details">
          <PersonFields data={atFault} onChange={updAtFault} />
          <div style={{ ...grid2, marginTop: '20px' }}>
            <F label="State">
              <select style={inp} value={atFault.vehicleState || ''} onChange={e => updAtFault('vehicleState', e.target.value)}>
                <option value="">Select state...</option>
                {['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </F>
            <F label="Registration"><input style={inp} value={atFault.vehicleRegistration} onChange={e => updAtFault('vehicleRegistration', e.target.value)} /></F>
          </div>
        </SectionBlock>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', paddingBottom: '40px', marginTop: '24px' }}>
        <button
          onClick={() => router.push('/dashboard/reservations')}
          style={{ padding: '12px 28px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate('PENDING')}
          disabled={mutation.isPending}
          style={{ padding: '12px 28px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          {mutation.isPending ? 'Saving...' : 'Create Reservation'}
        </button>
      </div>
    </div>
  );
}