'use client';
import { useState } from 'react';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useRezForm } from '../ReservationFormContext';
import { SectionBlock, F, inp, grid3, STATES } from '../shared/styles';

const THIRD_PARTY_TYPES = [
  'PLEASE SELECT', 'ACCEPTED', 'LIABILITY DISPUTE', 'FAILED TO MEET POLICY OBLIGATIONS',
  'PENDING FROM BUSINESS BROKER', 'IN REVIEW', 'LIABILITY DENIED',
  'PENDING INSURER DETAILS FROM TP', 'UNINSURED', 'INSURED - PENDING CLAIM NUMBER',
  'BUSINESS TP', 'EBO (EACH BARE OWN)', '3 DAY VALIDATION', 'PENDING FROM INSURER',
];

export function AtFaultTab() {
  const {
    tpFirstName, setTpFirstName, tpLastName, setTpLastName, tpPhone, setTpPhone, tpEmail, setTpEmail,
    tpAddress, setTpAddress, tpSuburb, setTpSuburb, tpPostal, setTpPostal, tpState, setTpState,
    tpVehRego, setTpVehRego, tpVehMake, setTpVehMake, tpVehModel, setTpVehModel, tpVehYear, setTpVehYear,
    tpInsCarrier, setTpInsCarrier, tpClaimNo, setTpClaimNo,
  } = useRezForm();

  const [insAgency, setInsAgency] = useState('');
  const [insAgent, setInsAgent] = useState('');
  const [policyNo, setPolicyNo] = useState('');
  const [coverType, setCoverType] = useState('CTP');
  const [thirdPartyType, setThirdPartyType] = useState('PLEASE SELECT');
  const [atFault, setAtFault] = useState('');
  const [validated, setValidated] = useState(false);

  return (
    <>
      <SectionBlock title="At Fault Vehicle">
        <div style={grid3}>
          <F label="Registration"><input style={inp} value={tpVehRego} onChange={e => setTpVehRego(e.target.value)} /></F>
          <F label="Year"><input style={inp} value={tpVehYear} onChange={e => setTpVehYear(e.target.value)} /></F>
          <F label="Make"><input style={inp} value={tpVehMake} onChange={e => setTpVehMake(e.target.value)} /></F>
          <F label="Model"><input style={inp} value={tpVehModel} onChange={e => setTpVehModel(e.target.value)} /></F>
        </div>
      </SectionBlock>

      <SectionBlock title="At Fault Party">
        <div style={grid3}>
          <F label="First name"><input style={inp} value={tpFirstName} onChange={e => setTpFirstName(e.target.value)} /></F>
          <F label="Last name"><input style={inp} value={tpLastName} onChange={e => setTpLastName(e.target.value)} /></F>
          <F label="Phone"><input style={inp} value={tpPhone} onChange={e => setTpPhone(e.target.value)} /></F>
          <F label="Email"><input style={inp} value={tpEmail} onChange={e => setTpEmail(e.target.value)} /></F>
          <F label="Address" full>
            <AddressAutocomplete value={tpAddress} onChange={(v: string) => setTpAddress(v)}
              onSelect={(r: any) => { setTpAddress(r.address); setTpSuburb(r.suburb); setTpPostal(r.postcode); if (r.state) setTpState(r.state); }}
              style={inp} placeholder="Start typing address..." />
          </F>
          <F label="Suburb"><input style={inp} value={tpSuburb} onChange={e => setTpSuburb(e.target.value)} /></F>
          <F label="Postcode"><input style={inp} value={tpPostal} onChange={e => setTpPostal(e.target.value)} /></F>
          <F label="State"><select style={inp} value={tpState} onChange={e => setTpState(e.target.value)}><option value="">Select...</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
        </div>
      </SectionBlock>

      <SectionBlock title="Insurance Details">
        <div style={grid3}>
          <F label="Carrier"><input style={inp} value={tpInsCarrier} onChange={e => setTpInsCarrier(e.target.value)} /></F>
          <F label="Agency"><input style={inp} value={insAgency} onChange={e => setInsAgency(e.target.value)} /></F>
          <F label="Agent"><input style={inp} value={insAgent} onChange={e => setInsAgent(e.target.value)} /></F>
          <F label="Policy #"><input style={inp} value={policyNo} onChange={e => setPolicyNo(e.target.value)} /></F>
          <F label="Claim number"><input style={inp} value={tpClaimNo} onChange={e => setTpClaimNo(e.target.value)} /></F>
          <F label="Type of cover">
            <select style={inp} value={coverType} onChange={e => setCoverType(e.target.value)}>
              {['CTP', 'TPP', 'COMP'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </F>
          <F label="At fault">
            <select style={inp} value={atFault} onChange={e => setAtFault(e.target.value)}>
              <option value="">—</option>
              <option value="N">No</option>
              <option value="Y">Yes</option>
            </select>
          </F>
          <F label="Third party type" span2>
            <select style={inp} value={thirdPartyType} onChange={e => setThirdPartyType(e.target.value)}>
              {THIRD_PARTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </F>
          <F label="Validated">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#334155', cursor: 'pointer', marginTop: '8px' }}>
              <input type="checkbox" checked={validated} onChange={e => setValidated(e.target.checked)} />
              Validated
            </label>
          </F>
        </div>
      </SectionBlock>
    </>
  );
}
