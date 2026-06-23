'use client';
import { useState } from 'react';

const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
const LICENCE_STATES = ['International', ...STATES];

const inp: React.CSSProperties = {
  width: '100%', padding: '2px 4px', border: '1px solid #cbd5e1',
  borderRadius: '2px', fontSize: '12px', color: '#0f172a',
  background: '#fff', boxSizing: 'border-box',
};
const roInp: React.CSSProperties = { ...inp, background: '#f1f5f9', color: '#64748b' };
const lbl: React.CSSProperties = {
  fontSize: '11px', fontWeight: 500, color: '#374151',
  textAlign: 'right', paddingRight: '6px', whiteSpace: 'nowrap',
  verticalAlign: 'middle', paddingTop: '2px', paddingBottom: '2px',
};
const td: React.CSSProperties = { paddingTop: '2px', paddingBottom: '2px', verticalAlign: 'middle' };
const colHdr: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#fff', background: '#475569',
  padding: '3px 8px', marginBottom: '6px', borderRadius: '3px', letterSpacing: '0.04em',
  display: 'block',
};

const TABS = ['Main', 'Customer', 'At Fault', 'Other Party', 'Accident', 'Damages', 'Photos', 'Additional', 'Notes', 'Card Details', 'Documents'];

function TabBar({ active, onChange }: { active: number; onChange: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '14px', flexWrap: 'wrap' }}>
      {TABS.map((t, i) => (
        <button key={t} type="button" onClick={() => onChange(i)} style={{
          padding: '8px 14px', fontSize: '12px', fontWeight: active === i ? 700 : 500,
          color: active === i ? '#01ae42' : '#64748b', background: 'none', border: 'none',
          borderBottom: active === i ? '2px solid #01ae42' : '2px solid transparent',
          marginBottom: '-2px', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>{t}</button>
      ))}
    </div>
  );
}

export default function TSDReservationDetail() {
  const [activeTab, setActiveTab] = useState(0);

  // Customer fields
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [street, setStreet] = useState('');
  const [suburb, setSuburb] = useState('');
  const [state, setState] = useState('');
  const [postcode, setPostcode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenceNo, setLicenceNo] = useState('');
  const [licenceState, setLicenceState] = useState('');
  const [licenceExpiry, setLicenceExpiry] = useState('');
  const [dob, setDob] = useState('');

  // Hire Details
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [dropOffDate, setDropOffDate] = useState('');
  const [dropOffTime, setDropOffTime] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [nafRego, setNafRego] = useState('');
  const [nafMake, setNafMake] = useState('');
  const [nafModel, setNafModel] = useState('');

  // Admin
  const [source, setSource] = useState('');
  const [repairer, setRepairer] = useState('');
  const [broadcastNote, setBroadcastNote] = useState('');

  // Card Details
  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  return (
    <div style={{ maxWidth: '1200px', paddingBottom: '80px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          New Reservation
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '5px', background: '#fef3c7', color: '#d97706', border: '1.5px solid #fbbf24' }}>DRAFT</span>
        </div>
        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '3px' }}>TSD-style layout — prototype</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px', minHeight: '18px' }}>
        <span style={{ fontSize: '11px', color: '#01ae42', fontWeight: 500 }}></span>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* ── Main Tab ── */}
      {activeTab === 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '110px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '220px' }} />
              <col style={{ width: '110px' }} />
              <col />
            </colgroup>
            <tbody>
              {/* Column headers */}
              <tr>
                <td colSpan={2} style={{ paddingBottom: '6px' }}>
                  <span style={colHdr}>Customer</span>
                </td>
                <td colSpan={2} style={{ paddingBottom: '6px' }}>
                  <span style={colHdr}>Hire Details</span>
                </td>
                <td colSpan={2} style={{ paddingBottom: '6px' }}>
                  <span style={colHdr}>Administration</span>
                </td>
              </tr>

              {/* Row 1 */}
              <tr>
                <td style={lbl}>Last Name</td>
                <td style={td}><input style={inp} value={lastName} onChange={e => setLastName(e.target.value)} /></td>
                <td style={lbl}>Pickup Location</td>
                <td style={td}>
                  <select style={inp}>
                    <option value="">— Select branch —</option>
                  </select>
                </td>
                <td style={lbl}>Rez Number</td>
                <td style={td}><input style={roInp} readOnly value="" /></td>
              </tr>

              {/* Row 2 */}
              <tr>
                <td style={lbl}>First Name</td>
                <td style={td}><input style={inp} value={firstName} onChange={e => setFirstName(e.target.value)} /></td>
                <td style={lbl}>Return Location</td>
                <td style={td}>
                  <select style={inp}>
                    <option value="">Return to pickup</option>
                  </select>
                </td>
                <td style={lbl}>File Number</td>
                <td style={td}><input style={roInp} readOnly value="" /></td>
              </tr>

              {/* Row 3 */}
              <tr>
                <td style={lbl}>Street</td>
                <td style={td}><input style={inp} value={street} onChange={e => setStreet(e.target.value)} /></td>
                <td style={lbl}>Pickup Date</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <input type="date" style={{ ...inp, flex: 1 }} value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
                    <input type="time" style={{ ...inp, width: '76px' }} value={pickupTime} onChange={e => setPickupTime(e.target.value)} />
                  </div>
                </td>
                <td style={lbl}>Status</td>
                <td style={td}><input style={roInp} readOnly value="DRAFT" /></td>
              </tr>

              {/* Row 4 */}
              <tr>
                <td style={lbl}>City / Suburb</td>
                <td style={td}><input style={inp} value={suburb} onChange={e => setSuburb(e.target.value)} /></td>
                <td style={lbl}>Drop Off Date</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <input type="date" style={{ ...inp, flex: 1 }} value={dropOffDate} onChange={e => setDropOffDate(e.target.value)} />
                    <input type="time" style={{ ...inp, width: '76px' }} value={dropOffTime} onChange={e => setDropOffTime(e.target.value)} />
                  </div>
                </td>
                <td style={lbl}>Booked</td>
                <td style={td}><input style={roInp} readOnly value={new Date().toLocaleDateString('en-AU')} /></td>
              </tr>

              {/* Row 5 */}
              <tr>
                <td style={lbl}>State</td>
                <td style={td}>
                  <select style={inp} value={state} onChange={e => setState(e.target.value)}>
                    <option value="">—</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={lbl}>Set Reminder</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <input type="date" style={{ ...inp, flex: 1 }} value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
                    <input type="time" style={{ ...inp, width: '76px' }} value={reminderTime} onChange={e => setReminderTime(e.target.value)} />
                  </div>
                </td>
                <td style={lbl}>Agent Out</td>
                <td style={td}><input style={roInp} readOnly value="" /></td>
              </tr>

              {/* Row 6 */}
              <tr>
                <td style={lbl}>Postcode</td>
                <td style={td}><input style={inp} value={postcode} onChange={e => setPostcode(e.target.value)} /></td>
                <td style={lbl}>Vehicle</td>
                <td style={td}><input style={roInp} readOnly value="" /></td>
                <td style={lbl}>Source</td>
                <td style={td}>
                  <select style={inp} value={source} onChange={e => setSource(e.target.value)}>
                    <option value="">— Select —</option>
                    <option value="Repairer">Repairer</option>
                    <option value="Tow Operator">Tow Operator</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Corporate Partnerships">Corporate Partnerships</option>
                  </select>
                </td>
              </tr>

              {/* Row 7 */}
              <tr>
                <td style={lbl}>Mobile Phone</td>
                <td style={td}><input style={inp} value={phone} onChange={e => setPhone(e.target.value)} /></td>
                <td style={lbl}>Registration</td>
                <td style={td}><input style={roInp} readOnly value="" /></td>
                <td style={lbl}>Repairer</td>
                <td style={td}>
                  <select style={inp} value={repairer} onChange={e => setRepairer(e.target.value)}>
                    <option value="">— Select repairer —</option>
                  </select>
                </td>
              </tr>

              {/* Row 8 */}
              <tr>
                <td style={lbl}>E-Mail</td>
                <td style={td}><input style={inp} value={email} onChange={e => setEmail(e.target.value)} /></td>
                <td style={lbl}>Category</td>
                <td style={td}><input style={roInp} readOnly value="" /></td>
                {/* Charges table starts here — rowspan 6 */}
                <td colSpan={2} rowSpan={6} style={{ verticalAlign: 'top', paddingTop: '2px' }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ background: '#475569' }}>
                          <th style={{ padding: '4px 8px', color: '#fff', textAlign: 'left', fontWeight: 600 }}>Description</th>
                          <th style={{ padding: '4px 8px', color: '#fff', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ background: '#f8fafc' }}>
                          <td style={{ padding: '3px 8px', color: '#94a3b8' }} colSpan={2}>No charges yet</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#e2e8f0' }}>
                          <td style={{ padding: '4px 8px', fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>Total</td>
                          <td style={{ padding: '4px 8px', fontWeight: 700, fontSize: '12px', color: '#0f172a', textAlign: 'right' }}>0.00</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {/* Broadcast Note */}
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ ...colHdr, marginBottom: '4px' }}>Broadcast Note</span>
                    <textarea
                      style={{ ...inp, height: '72px', resize: 'vertical', width: '100%' }}
                      value={broadcastNote}
                      onChange={e => setBroadcastNote(e.target.value)}
                      placeholder="Broadcast message visible to all staff..."
                    />
                  </div>
                </td>
              </tr>

              {/* Row 9 */}
              <tr>
                <td style={lbl}>Licence #</td>
                <td style={td}><input style={inp} value={licenceNo} onChange={e => setLicenceNo(e.target.value)} /></td>
                <td style={lbl}>NAF Rego</td>
                <td style={td}><input style={inp} value={nafRego} onChange={e => setNafRego(e.target.value)} placeholder="Not-at-fault vehicle" /></td>
              </tr>

              {/* Row 10 */}
              <tr>
                <td style={lbl}>Lic State</td>
                <td style={td}>
                  <select style={inp} value={licenceState} onChange={e => setLicenceState(e.target.value)}>
                    <option value="">—</option>
                    {LICENCE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={lbl}>NAF Make</td>
                <td style={td}><input style={inp} value={nafMake} onChange={e => setNafMake(e.target.value)} /></td>
              </tr>

              {/* Row 11 */}
              <tr>
                <td style={lbl}>Lic Expiry</td>
                <td style={td}><input type="date" style={inp} value={licenceExpiry} onChange={e => setLicenceExpiry(e.target.value)} /></td>
                <td style={lbl}>NAF Model</td>
                <td style={td}><input style={inp} value={nafModel} onChange={e => setNafModel(e.target.value)} /></td>
              </tr>

              {/* Row 12 */}
              <tr>
                <td style={lbl}>Date of Birth</td>
                <td style={td}><input type="date" style={inp} value={dob} onChange={e => setDob(e.target.value)} /></td>
                <td colSpan={2} style={td}></td>
              </tr>

              {/* Row 13 — spacer so rowspan fills */}
              <tr>
                <td colSpan={4} style={{ height: '6px' }}></td>
              </tr>

            </tbody>
          </table>
        </div>
      )}

      {/* ── Card Details Tab ── */}
      {activeTab === 9 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
          <div style={{ maxWidth: '420px' }}>
            <div style={{ padding: '10px 12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', marginBottom: '14px', fontSize: '11px', color: '#92400e' }}>
              Card details are stored locally and not transmitted without explicit action.
            </div>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <colgroup>
                <col style={{ width: '120px' }} />
                <col />
              </colgroup>
              <tbody>
                {[
                  { label: 'Cardholder Name', node: <input style={inp} value={cardName} onChange={e => setCardName(e.target.value)} placeholder="As it appears on card" /> },
                  { label: 'Card Type', node: (
                    <select style={inp} value={cardType} onChange={e => setCardType(e.target.value)}>
                      <option value="">— Select —</option>
                      <option>Visa</option><option>Mastercard</option>
                      <option>American Express</option><option>eftpos</option><option>Other</option>
                    </select>
                  )},
                  { label: 'Card Number', node: <input style={inp} value={cardNumber} onChange={e => { const d = e.target.value.replace(/\D/g,'').slice(0,16); setCardNumber(d.replace(/(.{4})/g,'$1 ').trim()); }} placeholder="•••• •••• •••• ••••" maxLength={19} inputMode="numeric" /> },
                  { label: 'Expiry', node: <input style={{ ...inp, width: '90px' }} value={cardExpiry} onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,4); setCardExpiry(v.length > 2 ? v.slice(0,2)+'/'+v.slice(2) : v); }} placeholder="MM/YY" maxLength={5} inputMode="numeric" /> },
                  { label: 'CVV', node: <input style={{ ...inp, width: '70px' }} value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="•••" maxLength={4} inputMode="numeric" type="password" /> },
                ].map(({ label, node }) => (
                  <tr key={label}>
                    <td style={{ ...lbl, paddingBottom: '5px', paddingTop: '5px' }}>{label}</td>
                    <td style={{ ...td, paddingBottom: '5px' }}>{node}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Placeholder for other tabs */}
      {activeTab !== 0 && activeTab !== 9 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
          {TABS[activeTab]} tab — coming soon
        </div>
      )}

      {/* Action bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 50 }}>
        <button style={{ padding: '8px 18px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b' }}>← Back</button>
        <div style={{ flex: 1 }} />
        <button style={{ padding: '8px 18px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#f59e0b', color: '#fff' }}>Mark On Hire</button>
        <button style={{ padding: '8px 18px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid #fecaca', background: '#fff', color: '#ef4444' }}>Cancel</button>
      </div>
    </div>
  );
}
