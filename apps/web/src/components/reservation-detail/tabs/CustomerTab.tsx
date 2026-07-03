'use client';
import { useState } from 'react';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useRezForm } from '../ReservationFormContext';
import { SectionBlock, F, inp, grid3, STATES, LICENCE_STATES, BODY_TYPES } from '../shared/styles';

export function CustomerTab() {
  const {
    firstName, setFirstName, lastName, setLastName, mobile, setMobile, email, setEmail,
    dob, setDob, street1, setStreet1, city, setCity, stateVal, setStateVal, postal, setPostal,
    licNum, setLicNum, licState, setLicState, licExpires, setLicExpires,
    nafRego, setNafRego, nafYear, setNafYear, nafMake, setNafMake, nafModel, setNafModel, nafBodyType, setNafBodyType,
    nafInsCarrier, setNafInsCarrier, nafInsPolicy, setNafInsPolicy, nafInsPhone, setNafInsPhone,
    nafInsAgent, setNafInsAgent, nafInsAgency, setNafInsAgency, nafCoverType, setNafCoverType,
    roFirstName, setRoFirstName, roLastName, setRoLastName, roMobile, setRoMobile, roEmail, setRoEmail,
    roDob, setRoDob, roStreet1, setRoStreet1, roCity, setRoCity, roState, setRoState, roPostal, setRoPostal,
  } = useRezForm();

  const [sameAsDriver, setSameAsDriver] = useState(false);
  const [regoChecking, setRegoChecking] = useState(false);
  const [regoResult, setRegoResult] = useState<{ valid: boolean; message: string } | null>(null);

  async function checkRego() {
    setRegoChecking(true);
    setRegoResult(null);
    try {
      const res = await fetch('/api/check-rego', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rego: nafRego.trim() }),
      });
      const data = await res.json();
      if (data.year) setNafYear(data.year);
      if (data.make) setNafMake(data.make);
      if (data.model) setNafModel(data.model);
      if (data.bodyType) setNafBodyType(data.bodyType);
      setRegoResult(data);
    } catch {
      setRegoResult({ valid: false, message: 'Check failed. Please try again.' });
    } finally {
      setRegoChecking(false);
    }
  }

  return (
    <>
      <SectionBlock title="NAF Vehicle">
        <div style={grid3}>
          <F label="Registration">
            <div style={{ display: 'flex', gap: '6px' }}>
              <input style={inp} value={nafRego} onChange={e => { setNafRego(e.target.value.toUpperCase()); setRegoResult(null); }} />
              <button type="button" disabled={regoChecking || !nafRego.trim()} onClick={checkRego}
                style={{ padding: '0 12px', fontSize: '12px', fontWeight: 600, background: '#01ae42', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap', opacity: (regoChecking || !nafRego.trim()) ? 0.5 : 1 }}>
                {regoChecking ? 'Checking…' : 'Check'}
              </button>
            </div>
          </F>
          <F label="Make"><input style={inp} value={nafMake} onChange={e => setNafMake(e.target.value)} /></F>
          <F label="Model"><input style={inp} value={nafModel} onChange={e => setNafModel(e.target.value)} /></F>
          <F label="Year"><input style={inp} value={nafYear} onChange={e => setNafYear(e.target.value)} /></F>
          <F label="Body type">
            <select style={inp} value={nafBodyType} onChange={e => setNafBodyType(e.target.value)}>
              <option value="">Select...</option>
              {BODY_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </F>
          {regoResult && (
            <div style={{ gridColumn: '1 / -1', fontSize: '13px', padding: '8px 12px', borderRadius: '6px', background: regoResult.valid ? '#dcfce7' : '#fee2e2', color: regoResult.valid ? '#166534' : '#991b1b', border: `1px solid ${regoResult.valid ? '#86efac' : '#fca5a5'}` }}>
              {regoResult.valid ? '✓ ' : '✗ '}{regoResult.message}
            </div>
          )}
        </div>
      </SectionBlock>

      <SectionBlock title="NAF Insurance & Cover">
        <div style={grid3}>
          <F label="Carrier"><input style={inp} value={nafInsCarrier} onChange={e => setNafInsCarrier(e.target.value)} /></F>
          <F label="Policy #"><input style={inp} value={nafInsPolicy} onChange={e => setNafInsPolicy(e.target.value)} /></F>
          <F label="Phone"><input style={inp} value={nafInsPhone} onChange={e => setNafInsPhone(e.target.value)} /></F>
          <F label="Agency"><input style={inp} value={nafInsAgency} onChange={e => setNafInsAgency(e.target.value)} /></F>
          <F label="Agent"><input style={inp} value={nafInsAgent} onChange={e => setNafInsAgent(e.target.value)} /></F>
          <F label="Type of cover">
            <select style={inp} value={nafCoverType} onChange={e => setNafCoverType(e.target.value)}>
              {['CTP', 'TPP', 'COMP'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </F>
        </div>
      </SectionBlock>

      <SectionBlock title="Customer Details">
        <div style={grid3}>
          <F label="First name"><input style={inp} value={firstName} onChange={e => setFirstName(e.target.value)} /></F>
          <F label="Last name"><input style={inp} value={lastName} onChange={e => setLastName(e.target.value)} /></F>
          <F label="Phone"><input style={inp} value={mobile} onChange={e => setMobile(e.target.value)} /></F>
          <F label="Email" span2><input style={inp} value={email} onChange={e => setEmail(e.target.value)} /></F>
          <F label="Date of birth"><input type="date" style={inp} value={dob} onChange={e => setDob(e.target.value)} /></F>
          <F label="Address" full>
            <AddressAutocomplete value={street1} onChange={(v: string) => setStreet1(v)}
              onSelect={(r: any) => { setStreet1(r.address); setCity(r.suburb); setPostal(r.postcode); if (r.state) setStateVal(r.state); }}
              style={inp} placeholder="Start typing address..." />
          </F>
          <F label="Suburb"><input style={inp} value={city} onChange={e => setCity(e.target.value)} /></F>
          <F label="Postcode"><input style={inp} value={postal} onChange={e => setPostal(e.target.value)} /></F>
          <F label="State"><select style={inp} value={stateVal} onChange={e => setStateVal(e.target.value)}><option value="">Select...</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
          <F label="Licence number"><input style={inp} value={licNum} onChange={e => setLicNum(e.target.value)} /></F>
          <F label="Licence state"><select style={inp} value={licState} onChange={e => setLicState(e.target.value)}><option value="">Select...</option>{LICENCE_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
          <F label="Licence expiry"><input type="date" style={inp} value={licExpires} onChange={e => setLicExpires(e.target.value)} /></F>
        </div>
      </SectionBlock>

      <SectionBlock title="Registered Owner">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>
            <input type="checkbox" checked={sameAsDriver} onChange={e => {
              setSameAsDriver(e.target.checked);
              if (e.target.checked) {
                setRoFirstName(firstName); setRoLastName(lastName); setRoMobile(mobile); setRoEmail(email);
                setRoDob(dob); setRoStreet1(street1); setRoCity(city); setRoState(stateVal); setRoPostal(postal);
              }
            }} />
            Same as driver
          </label>
        </div>
        <div style={grid3}>
          <F label="First name"><input style={inp} value={roFirstName} onChange={e => setRoFirstName(e.target.value)} /></F>
          <F label="Last name"><input style={inp} value={roLastName} onChange={e => setRoLastName(e.target.value)} /></F>
          <F label="Phone"><input style={inp} value={roMobile} onChange={e => setRoMobile(e.target.value)} /></F>
          <F label="Email" span2><input style={inp} value={roEmail} onChange={e => setRoEmail(e.target.value)} /></F>
          <F label="Date of birth"><input type="date" style={inp} value={roDob} onChange={e => setRoDob(e.target.value)} /></F>
          <F label="Address" full>
            <AddressAutocomplete value={roStreet1} onChange={(v: string) => setRoStreet1(v)}
              onSelect={(r: any) => { setRoStreet1(r.address); setRoCity(r.suburb); setRoPostal(r.postcode); if (r.state) setRoState(r.state); }}
              style={inp} placeholder="Start typing address..." />
          </F>
          <F label="Suburb"><input style={inp} value={roCity} onChange={e => setRoCity(e.target.value)} /></F>
          <F label="Postcode"><input style={inp} value={roPostal} onChange={e => setRoPostal(e.target.value)} /></F>
          <F label="State"><select style={inp} value={roState} onChange={e => setRoState(e.target.value)}><option value="">Select...</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
        </div>
      </SectionBlock>
    </>
  );
}
