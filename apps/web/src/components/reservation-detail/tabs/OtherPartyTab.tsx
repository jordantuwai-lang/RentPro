'use client';
import { useState } from 'react';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { SectionBlock, F, inp, grid3, STATES } from '../shared/styles';

type Party = {
  firstName: string; lastName: string; phone: string; email: string; address: string;
  suburb: string; postcode: string; state: string; vehicleRegistration: string;
  vehicleState: string; vehicleYear: string; vehicleMake: string; vehicleModel: string;
  insuranceProvider: string; claimNumber: string;
};

const emptyParty: Party = { firstName: '', lastName: '', phone: '', email: '', address: '', suburb: '', postcode: '', state: '', vehicleRegistration: '', vehicleState: '', vehicleYear: '', vehicleMake: '', vehicleModel: '', insuranceProvider: '', claimNumber: '' };

function PartyFields({ party, upd }: { party: Party; upd: (f: keyof Party, v: string) => void }) {
  return (
    <>
      <SectionBlock title="Vehicle">
        <div style={grid3}>
          <F label="Registration"><input style={inp} value={party.vehicleRegistration} onChange={e => upd('vehicleRegistration', e.target.value)} /></F>
          <F label="State"><select style={inp} value={party.vehicleState} onChange={e => upd('vehicleState', e.target.value)}><option value="">Select...</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
          <F label="Year"><input style={inp} value={party.vehicleYear} onChange={e => upd('vehicleYear', e.target.value)} /></F>
          <F label="Make"><input style={inp} value={party.vehicleMake} onChange={e => upd('vehicleMake', e.target.value)} /></F>
          <F label="Model"><input style={inp} value={party.vehicleModel} onChange={e => upd('vehicleModel', e.target.value)} /></F>
          <F label="Claim number"><input style={inp} value={party.claimNumber} onChange={e => upd('claimNumber', e.target.value)} /></F>
        </div>
      </SectionBlock>
      <SectionBlock title="Person">
        <div style={grid3}>
          <F label="First name"><input style={inp} value={party.firstName} onChange={e => upd('firstName', e.target.value)} /></F>
          <F label="Last name"><input style={inp} value={party.lastName} onChange={e => upd('lastName', e.target.value)} /></F>
          <F label="Phone"><input style={inp} value={party.phone} onChange={e => upd('phone', e.target.value)} /></F>
          <F label="Email"><input style={inp} value={party.email} onChange={e => upd('email', e.target.value)} /></F>
          <F label="Insurance provider"><input style={inp} value={party.insuranceProvider} onChange={e => upd('insuranceProvider', e.target.value)} /></F>
          <F label="Address" full>
            <AddressAutocomplete value={party.address} onChange={(v: string) => upd('address', v)}
              onSelect={(r: any) => { upd('address', r.address); upd('suburb', r.suburb); upd('postcode', r.postcode); if (r.state) upd('state', r.state); }}
              style={inp} placeholder="Start typing address..." />
          </F>
          <F label="Suburb"><input style={inp} value={party.suburb} onChange={e => upd('suburb', e.target.value)} /></F>
          <F label="Postcode"><input style={inp} value={party.postcode} onChange={e => upd('postcode', e.target.value)} /></F>
          <F label="State"><select style={inp} value={party.state} onChange={e => upd('state', e.target.value)}><option value="">Select...</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
        </div>
      </SectionBlock>
    </>
  );
}

export function OtherPartyTab() {
  const [tp1, setTp1] = useState<Party>(emptyParty);
  const [tp2, setTp2] = useState<Party>(emptyParty);
  const [showTp2, setShowTp2] = useState(false);
  const updTp1 = (f: keyof Party, v: string) => setTp1(p => ({ ...p, [f]: v }));
  const updTp2 = (f: keyof Party, v: string) => setTp2(p => ({ ...p, [f]: v }));

  return (
    <>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', margin: '0 0 8px' }}>Third Party 1</div>
      <PartyFields party={tp1} upd={updTp1} />

      {!showTp2 ? (
        <button type="button" onClick={() => setShowTp2(true)}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px dashed #cbd5e1', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer', marginBottom: '16px' }}>
          + Add Third Party 2
        </button>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Third Party 2</div>
            <button type="button" onClick={() => setShowTp2(false)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
          </div>
          <PartyFields party={tp2} upd={updTp2} />
        </>
      )}
    </>
  );
}
