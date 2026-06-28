'use client';
import { useState } from 'react';

const TABS = ['Main', 'Misc', 'Accident Details', 'At Fault Third Party', 'Card Details'];

const g = {
  // colours
  green600: '#16a34a',
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green200: '#bbf7d0',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0f172a',
  white: '#ffffff',
  red500: '#ef4444',
};

const field: React.CSSProperties = {
  width: '100%',
  height: '36px',
  padding: '0 10px',
  fontSize: '14px',
  color: g.slate900,
  background: g.white,
  border: `1px solid ${g.slate300}`,
  borderRadius: '6px',
  boxSizing: 'border-box',
  outline: 'none',
};

const fieldReadonly: React.CSSProperties = {
  ...field,
  background: g.slate100,
  color: g.slate600,
};

const label: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: g.slate500,
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

function Field({ label: lbl, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={label}>{lbl}</label>
      {children}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: g.white,
      border: `1px solid ${g.slate200}`,
      borderRadius: '10px',
      overflow: 'hidden',
      marginBottom: '16px',
    }}>
      <div style={{
        padding: '10px 16px',
        background: g.slate50,
        borderBottom: `1px solid ${g.slate200}`,
        fontSize: '13px',
        fontWeight: 700,
        color: g.slate700,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ width: '3px', height: '14px', background: g.green600, borderRadius: '2px', display: 'inline-block' }} />
        {title}
      </div>
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px 16px' }}>
        {children}
      </div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { readonly?: boolean }) {
  const { readonly, ...rest } = props;
  return <input style={readonly ? fieldReadonly : field} readOnly={readonly} {...rest} />;
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select style={{ ...field, cursor: 'pointer', appearance: 'auto' }} {...props}>
      {children}
    </select>
  );
}

export default function TSDPreviewPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [homePhone, setHomePhone] = useState('');
  const [email, setEmail] = useState('');
  const [street1, setStreet1] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [postal, setPostal] = useState('');
  const [licNum, setLicNum] = useState('');
  const [licState, setLicState] = useState('');
  const [licExpiry, setLicExpiry] = useState('');
  const [dob, setDob] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [dropDate, setDropDate] = useState('');
  const [source, setSource] = useState('');
  const [hireType, setHireType] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function mockSave() {
    setIsSaving(true);
    setTimeout(() => { setIsSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }, 1000);
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: g.slate50, minHeight: '100vh', paddingBottom: '80px' }}>

      {/* Page header */}
      <div style={{
        background: g.white,
        borderBottom: `1px solid ${g.slate200}`,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: g.green600,
            color: g.white,
            fontWeight: 700,
            fontSize: '13px',
            padding: '4px 10px',
            borderRadius: '6px',
            letterSpacing: '0.05em',
          }}>
            NEW
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: g.slate900, lineHeight: 1.2 }}>
              New Reservation
            </div>
            <div style={{ fontSize: '12px', color: g.slate500 }}>REZ1052 · Draft</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 600, border: `1px solid ${g.slate300}`, borderRadius: '6px', background: g.white, cursor: 'pointer', color: g.slate700 }}>
            Cancel
          </button>
          <button
            onClick={mockSave}
            style={{
              padding: '7px 20px', fontSize: '13px', fontWeight: 600,
              border: 'none', borderRadius: '6px', cursor: 'pointer',
              background: isSaving ? g.slate400 : saved ? '#15803d' : g.green600,
              color: g.white,
              transition: 'background 0.2s',
            }}
          >
            {isSaving ? 'Saving…' : saved ? '✓ Saved' : 'Save Reservation'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        background: g.white,
        borderBottom: `1px solid ${g.slate200}`,
        padding: '0 20px',
        display: 'flex',
        gap: '2px',
      }}>
        {TABS.map((t, i) => {
          const active = activeTab === i;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: active ? 700 : 500,
                color: active ? g.green600 : g.slate500,
                background: 'transparent',
                border: 'none',
                borderBottom: active ? `2px solid ${g.green600}` : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginBottom: '-1px',
                transition: 'color 0.15s',
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {activeTab === 0 && (
          <>
            {/* Reservation Info row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ background: g.white, border: `1px solid ${g.slate200}`, borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: g.slate500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Reservation #</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: g.green600, letterSpacing: '0.03em' }}>REZ1052</div>
              </div>
              <div style={{ background: g.white, border: `1px solid ${g.slate200}`, borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: g.slate500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Pickup Date</div>
                <input
                  type="date"
                  style={{ ...field, border: 'none', padding: 0, fontSize: '15px', fontWeight: 600, color: g.slate900, height: 'auto', background: 'transparent' }}
                  value={pickupDate}
                  onChange={e => setPickupDate(e.target.value)}
                />
              </div>
              <div style={{ background: g.white, border: `1px solid ${g.slate200}`, borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: g.slate500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Return Date</div>
                <input
                  type="date"
                  style={{ ...field, border: 'none', padding: 0, fontSize: '15px', fontWeight: 600, color: g.slate900, height: 'auto', background: 'transparent' }}
                  value={dropDate}
                  onChange={e => setDropDate(e.target.value)}
                />
              </div>
            </div>

            <SectionCard title="Driver Details">
              <Field label="First Name" span={2}>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
              </Field>
              <Field label="Last Name" span={2}>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
              </Field>
              <Field label="Date of Birth" span={2}>
                <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </Field>
              <Field label="Mobile" span={2}>
                <Input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="0400 000 000" />
              </Field>
              <Field label="Home Phone" span={2}>
                <Input type="tel" value={homePhone} onChange={e => setHomePhone(e.target.value)} placeholder="02 0000 0000" />
              </Field>
              <Field label="Email" span={2}>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="driver@email.com" />
              </Field>
            </SectionCard>

            <SectionCard title="Address">
              <Field label="Street Address" span={4}>
                <Input value={street1} onChange={e => setStreet1(e.target.value)} placeholder="123 Example St" />
              </Field>
              <Field label="Suburb" span={2}>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Suburb" />
              </Field>
              <Field label="State" span={1}>
                <Select value={stateVal} onChange={e => setStateVal(e.target.value)}>
                  <option value="">—</option>
                  {['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Postcode" span={1}>
                <Input value={postal} onChange={e => setPostal(e.target.value)} placeholder="2000" maxLength={4} />
              </Field>
            </SectionCard>

            <SectionCard title="Licence">
              <Field label="Licence Number" span={2}>
                <Input value={licNum} onChange={e => setLicNum(e.target.value)} />
              </Field>
              <Field label="Issuing State" span={1}>
                <Select value={licState} onChange={e => setLicState(e.target.value)}>
                  <option value="">—</option>
                  {['International','ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Expiry Date" span={2}>
                <Input type="date" value={licExpiry} onChange={e => setLicExpiry(e.target.value)} />
              </Field>
            </SectionCard>

            <SectionCard title="Hire Details">
              <Field label="Source of Business" span={2}>
                <Select value={source} onChange={e => setSource(e.target.value)}>
                  <option value="">— Select —</option>
                  <option>Insurance</option>
                  <option>Corporate</option>
                  <option>Walk-in</option>
                  <option>Internet</option>
                  <option>Repairer</option>
                </Select>
              </Field>
              <Field label="Hire Type" span={2}>
                <Select value={hireType} onChange={e => setHireType(e.target.value)}>
                  <option value="">— Select —</option>
                  <option value="Credit Hire">Credit Hire</option>
                  <option value="Direct Hire">Direct Hire</option>
                </Select>
              </Field>
            </SectionCard>
          </>
        )}

        {activeTab !== 0 && (
          <div style={{ background: g.white, border: `1px solid ${g.slate200}`, borderRadius: '10px', padding: '40px', textAlign: 'center', color: g.slate400, fontSize: '14px' }}>
            {TABS[activeTab]} tab — preview shows Main tab only
          </div>
        )}
      </div>

      {/* Action bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: g.white,
        borderTop: `1px solid ${g.slate200}`,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 100,
      }}>
        {/* Primary */}
        <button onClick={mockSave} style={{ padding: '7px 18px', fontSize: '13px', fontWeight: 700, borderRadius: '6px', border: 'none', background: g.green600, color: g.white, cursor: 'pointer' }}>
          {isSaving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: g.slate200, margin: '0 4px' }} />

        {/* Secondary actions */}
        {['Notes', 'Payments', 'Addl Drivers', 'Events', 'Print', 'Invoice'].map(lbl => (
          <button key={lbl} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', border: `1px solid ${g.slate200}`, background: g.white, color: g.slate700, cursor: 'pointer' }}>
            {lbl}
          </button>
        ))}

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: g.slate200, margin: '0 4px' }} />

        {/* Scan */}
        <button style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', border: `1px solid ${g.slate200}`, background: g.green50, color: g.green600, cursor: 'pointer' }}>
          📷 Scan Licence
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Destructive */}
        <button style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', border: '1px solid #fca5a5', background: '#fff5f5', color: g.red500, cursor: 'pointer' }}>
          Cancel Reservation
        </button>
      </div>
    </div>
  );
}
