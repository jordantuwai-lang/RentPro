'use client';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

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

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};

const full: React.CSSProperties = { gridColumn: '1 / -1' };

function F({ label: l, children, full: f }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={f ? full : {}}>
      <label style={labelStyle}>{l}</label>
      {children}
    </div>
  );
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
    <button onClick={onToggle} style={{
      padding: '10px 20px',
      borderRadius: '8px',
      border: '1px dashed #cbd5e1',
      background: show ? '#eff6ff' : '#fff',
      color: show ? '#3b82f6' : '#64748b',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left',
      marginBottom: '20px',
    }}>
      {show ? `— Remove ${label}` : `+ Add ${label}`}
    </button>
  );
}

export default function NewReservationPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sameAsDriver, setSameAsDriver] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [showAtFaultBusiness, setShowAtFaultBusiness] = useState(false);

  const emptyPerson = {
    firstName: '', lastName: '', address: '', suburb: '', postcode: '',
    phone: '', email: '', licenceNumber: '', licenceExpiry: '', dob: '',
  };

  const [driver, setDriver] = useState({ ...emptyPerson });
  const [owner, setOwner] = useState({ ...emptyPerson, insuranceProvider: '', claimNumber: '' });
  const [atFault, setAtFault] = useState({ ...emptyPerson, vehicleRegistration: '', insuranceProvider: '', claimNumber: '' });
  const [accidentVehicle, setAccidentVehicle] = useState({ registration: '', make: '', model: '', year: '', damage: '' });
  const [accident, setAccident] = useState({ date: '', location: '', description: '' });
  const [repairer, setRepairer] = useState({ businessName: '', phone: '', address: '', suburb: '', contact: '' });
  const [business, setBusiness] = useState({ name: '', address: '', suburb: '', postcode: '', phone: '' });
  const [atFaultBusiness, setAtFaultBusiness] = useState({ name: '', address: '', suburb: '', postcode: '', phone: '' });
  const [vehicleId, setVehicleId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [startDate, setStartDate] = useState('');

  const updDriver = (f: string, v: string) => setDriver(p => ({ ...p, [f]: v }));
  const updOwner = (f: string, v: string) => setOwner(p => ({ ...p, [f]: v }));
  const updAtFault = (f: string, v: string) => setAtFault(p => ({ ...p, [f]: v }));
  const updAccidentVehicle = (f: string, v: string) => setAccidentVehicle(p => ({ ...p, [f]: v }));
  const updAccident = (f: string, v: string) => setAccident(p => ({ ...p, [f]: v }));
  const updRepairer = (f: string, v: string) => setRepairer(p => ({ ...p, [f]: v }));
  const updBusiness = (f: string, v: string) => setBusiness(p => ({ ...p, [f]: v }));
  const updAtFaultBusiness = (f: string, v: string) => setAtFaultBusiness(p => ({ ...p, [f]: v }));

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
      return res.data.filter((v: any) => v.status === 'AVAILABLE');
    },
  });

  const handleSameAsDriver = (checked: boolean) => {
    setSameAsDriver(checked);
    if (checked) setOwner(o => ({ ...o, ...driver }));
  };

  const mutation = useMutation({
    mutationFn: async (status: string) => {
      const token = await getToken();
      return api.post('/reservations', {
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
      }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      router.push('/dashboard/reservations');
    },
  });

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>New reservation</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Accident replacement vehicle intake form</p>
      </div>

      <div style={section}>
        <h2 style={heading}>Driver details</h2>
        <PersonFields data={driver} onChange={updDriver} />
      </div>

      <ToggleButton show={showBusiness} onToggle={() => setShowBusiness(!showBusiness)} label="business details (if driving on behalf of a business)" />

      {showBusiness && (
        <div style={section}>
          <h2 style={heading}>Business details</h2>
          <BusinessFields data={business} onChange={updBusiness} />
        </div>
      )}

      <div style={section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ ...heading, marginBottom: 0 }}>Registered owner</h2>
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
      </div>

      <div style={section}>
        <h2 style={heading}>Vehicle details</h2>
        <div style={grid2}>
          <F label="Registration"><input style={input} value={accidentVehicle.registration} onChange={e => updAccidentVehicle('registration', e.target.value)} /></F>
          <F label="Year"><input style={input} value={accidentVehicle.year} onChange={e => updAccidentVehicle('year', e.target.value)} /></F>
          <F label="Make"><input style={input} value={accidentVehicle.make} onChange={e => updAccidentVehicle('make', e.target.value)} /></F>
          <F label="Model"><input style={input} value={accidentVehicle.model} onChange={e => updAccidentVehicle('model', e.target.value)} /></F>
          <F label="Damage description" full>
            <textarea style={{ ...input, height: '80px', resize: 'vertical' }} value={accidentVehicle.damage} onChange={e => updAccidentVehicle('damage', e.target.value)} />
          </F>
        </div>
      </div>

      <div style={section}>
        <h2 style={heading}>Accident details</h2>
        <div style={grid2}>
          <F label="Date of accident"><input type="date" style={input} value={accident.date} onChange={e => updAccident('date', e.target.value)} /></F>
          <F label="Accident location"><input style={input} value={accident.location} onChange={e => updAccident('location', e.target.value)} /></F>
          <F label="Accident description" full>
            <textarea style={{ ...input, height: '80px', resize: 'vertical' }} value={accident.description} onChange={e => updAccident('description', e.target.value)} />
          </F>
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
        <h2 style={heading}>Replacement vehicle</h2>
        <div style={grid2}>
          <F label="Branch *">
            <select style={input} value={branchId} onChange={e => setBranchId(e.target.value)}>
              <option value="">Select branch...</option>
              {branches?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
          </F>
          <F label="Hire start date *">
            <input type="date" style={input} value={startDate} onChange={e => setStartDate(e.target.value)} />
          </F>
          <F label="Vehicle *" full>
            <select style={input} value={vehicleId} onChange={e => setVehicleId(e.target.value)} disabled={!branchId}>
              <option value="">Select vehicle...</option>
              {vehicles?.map((v: any) => (
                <option key={v.id} value={v.id}>{v.make} {v.model} · {v.registration} · {v.category}</option>
              ))}
            </select>
          </F>
        </div>
      </div>

      {mutation.isError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
          Something went wrong. Please check all required fields and try again.
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', paddingBottom: '40px' }}>
        <button onClick={() => router.push('/dashboard/reservations')} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
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
          style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: mutation.isPending ? '#93c5fd' : '#3b82f6', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: mutation.isPending ? 'not-allowed' : 'pointer' }}
        >
          {mutation.isPending ? 'Creating...' : 'Create reservation'}
        </button>
      </div>
    </div>
  );
}
