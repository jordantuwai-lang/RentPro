'use client';
import { useState } from 'react';

/* ─── shared styles ─────────────────────────────────────── */
const inp: React.CSSProperties = {
  width: '100%', padding: '1px 3px', border: '1px solid #9ca3af',
  fontSize: '11px', color: '#000', background: '#fff', boxSizing: 'border-box', height: '20px',
};
const roInp: React.CSSProperties = { ...inp, background: '#e5e7eb', color: '#374151' };
const sel: React.CSSProperties = { ...inp, height: '20px' };
const lbl: React.CSSProperties = {
  fontSize: '11px', fontWeight: 400, color: '#111',
  textAlign: 'right', paddingRight: '4px', whiteSpace: 'nowrap',
  verticalAlign: 'middle', padding: '1px 4px 1px 0',
};
const tdc: React.CSSProperties = { padding: '1px 2px', verticalAlign: 'middle' };
const sectionHdr: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, background: '#16a34a', color: '#fff',
  padding: '2px 6px', display: 'block', marginBottom: '2px',
};

const TABS = ['Main', 'Misc', 'Accident Details', 'At Fault Third Party'];

/* ─── Country list (ISO 3166) ───────────────────────────── */
const COUNTRIES = [
  ['',''],['AUS','Australia'],['AFG','Afghanistan'],['ALB','Albania'],['DZA','Algeria'],
  ['AND','Andorra'],['AGO','Angola'],['ARG','Argentina'],['ARM','Armenia'],['AUT','Austria'],
  ['AZE','Azerbaijan'],['BHS','Bahamas'],['BHR','Bahrain'],['BGD','Bangladesh'],['BRB','Barbados'],
  ['BLR','Belarus'],['BEL','Belgium'],['BLZ','Belize'],['BEN','Benin'],['BTN','Bhutan'],
  ['BOL','Bolivia'],['BIH','Bosnia and Herzegovina'],['BWA','Botswana'],['BRA','Brazil'],
  ['BRN','Brunei Darussalam'],['BGR','Bulgaria'],['BFA','Burkina Faso'],['BDI','Burundi'],
  ['KHM','Cambodia'],['CMR','Cameroon'],['CAN','Canada'],['CHL','Chile'],['CHN','China'],
  ['COL','Colombia'],['COG','Congo'],['COD','Congo, Dem. Rep.'],['CRI','Costa Rica'],
  ['HRV','Croatia'],['CUB','Cuba'],['CYP','Cyprus'],['CZE','Czech Republic'],['DNK','Denmark'],
  ['DOM','Dominican Republic'],['ECU','Ecuador'],['EGY','Egypt'],['SLV','El Salvador'],
  ['ERI','Eritrea'],['EST','Estonia'],['ETH','Ethiopia'],['FJI','Fiji'],['FIN','Finland'],
  ['FRA','France'],['GAB','Gabon'],['GMB','Gambia'],['GEO','Georgia'],['DEU','Germany'],
  ['GHA','Ghana'],['GRC','Greece'],['GTM','Guatemala'],['GIN','Guinea'],['GUY','Guyana'],
  ['HTI','Haiti'],['HND','Honduras'],['HKG','Hong Kong'],['HUN','Hungary'],['ISL','Iceland'],
  ['IND','India'],['IDN','Indonesia'],['IRN','Iran'],['IRQ','Iraq'],['IRL','Ireland'],
  ['ISR','Israel'],['ITA','Italy'],['JAM','Jamaica'],['JPN','Japan'],['JOR','Jordan'],
  ['KAZ','Kazakhstan'],['KEN','Kenya'],['KOR','Korea, Republic of'],['KWT','Kuwait'],
  ['LAO','Lao PDR'],['LVA','Latvia'],['LBN','Lebanon'],['LBR','Liberia'],['LBY','Libya'],
  ['LIE','Liechtenstein'],['LTU','Lithuania'],['LUX','Luxembourg'],['MAC','Macao'],
  ['MDG','Madagascar'],['MWI','Malawi'],['MYS','Malaysia'],['MDV','Maldives'],['MLI','Mali'],
  ['MLT','Malta'],['MHL','Marshall Islands'],['MRT','Mauritania'],['MUS','Mauritius'],
  ['MEX','Mexico'],['FSM','Micronesia'],['MDA','Moldova'],['MCO','Monaco'],['MNG','Mongolia'],
  ['MNE','Montenegro'],['MAR','Morocco'],['MOZ','Mozambique'],['MMR','Myanmar'],['NAM','Namibia'],
  ['NPL','Nepal'],['NLD','Netherlands'],['NZL','New Zealand'],['NIC','Nicaragua'],['NER','Niger'],
  ['NGA','Nigeria'],['NOR','Norway'],['OMN','Oman'],['PAK','Pakistan'],['PLW','Palau'],
  ['PAN','Panama'],['PNG','Papua New Guinea'],['PRY','Paraguay'],['PER','Peru'],
  ['PHL','Philippines'],['POL','Poland'],['PRT','Portugal'],['QAT','Qatar'],['ROU','Romania'],
  ['RUS','Russian Federation'],['RWA','Rwanda'],['SAU','Saudi Arabia'],['SEN','Senegal'],
  ['SRB','Serbia'],['SYC','Seychelles'],['SLE','Sierra Leone'],['SGP','Singapore'],
  ['SVK','Slovakia'],['SVN','Slovenia'],['SLB','Solomon Islands'],['SOM','Somalia'],
  ['ZAF','South Africa'],['SSD','South Sudan'],['ESP','Spain'],['LKA','Sri Lanka'],
  ['SDN','Sudan'],['SUR','Suriname'],['SWE','Sweden'],['CHE','Switzerland'],
  ['SYR','Syrian Arab Republic'],['TWN','Taiwan'],['TJK','Tajikistan'],['TZA','Tanzania'],
  ['THA','Thailand'],['TGO','Togo'],['TON','Tonga'],['TTO','Trinidad and Tobago'],
  ['TUN','Tunisia'],['TUR','Turkey'],['TKM','Turkmenistan'],['TUV','Tuvalu'],['UGA','Uganda'],
  ['UKR','Ukraine'],['ARE','United Arab Emirates'],['GBR','United Kingdom'],
  ['USA','United States'],['URY','Uruguay'],['UZB','Uzbekistan'],['VUT','Vanuatu'],
  ['VAT','Vatican City'],['VEN','Venezuela'],['VNM','Viet Nam'],['YEM','Yemen'],
  ['ZMB','Zambia'],['ZWE','Zimbabwe'],
];

const THIRD_PARTY_TYPES = [
  'PLEASE SELECT','ACCEPTED','LIABILITY DISPUTE','FAILED TO MEET POLICY OBLIGATIONS',
  'PENDING FROM BUSINESS BROKER','IN REVIEW','LIABILITY DENIED',
  'PENDING INSURER DETAILS FROM TP','UNINSURED','INSURED - PENDING CLAIM NUMBER',
  'BUSINESS TP','EBO (EACH BARE OWN)','3 DAY VALIDATION','PENDING FROM INSURER',
];

/* ─── At Fault Third Party Tab ───────────────────────────── */
function AtFaultThirdPartyTab() {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [mi, setMi] = useState('');
  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('AUS');
  const [stateVal, setStateVal] = useState('');
  const [postal, setPostal] = useState('');
  const [homePhone, setHomePhone] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licIssueDate, setLicIssueDate] = useState('');
  const [licCountry, setLicCountry] = useState('AUS');
  const [licIssueCity, setLicIssueCity] = useState('');
  const [licNum, setLicNum] = useState('');
  const [licState, setLicState] = useState('');
  const [licExpires, setLicExpires] = useState('');
  const [dob, setDob] = useState('');
  const [birthPlace, setBirthPlace] = useState('');

  const [insCarrier, setInsCarrier] = useState('');
  const [insAgency, setInsAgency] = useState('');
  const [insAgent, setInsAgent] = useState('');
  const [policyNo, setPolicyNo] = useState('');
  const [altId, setAltId] = useState('');
  const [coverType, setCoverType] = useState('CTP');
  const [thirdPartyType, setThirdPartyType] = useState('PLEASE SELECT');
  const [atFault, setAtFault] = useState('');
  const [vehYear, setVehYear] = useState('');
  const [vehMake, setVehMake] = useState('');
  const [vehModel, setVehModel] = useState('');
  const [vehRego, setVehRego] = useState('');
  const [regoType, setRegoType] = useState('Private');
  const [validated, setValidated] = useState(false);
  const [company, setCompany] = useState('');
  const [abn, setAbn] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [claimNo, setClaimNo] = useState('');

  /* grid rows (mock — would be loaded from API) */
  const [gridRows] = useState<{lname:string;fname:string;licNum:string}[]>([]);

  const inp2: React.CSSProperties = { ...inp, width: '100%' };
  const lbl2: React.CSSProperties = { ...lbl };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '960px' }}>
        <colgroup>
          <col style={{ width: '144px' }} />
          <col style={{ width: '195px' }} />
          <col style={{ width: '10px' }} />
          <col style={{ width: '130px' }} />
          <col style={{ width: '175px' }} />
          <col style={{ width: '130px' }} />
          <col style={{ width: '154px' }} />
          <col />
        </colgroup>
        <tbody>
          {/* Title row */}
          <tr>
            <td colSpan={2} style={{ padding: '2px 0 4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>At Fault Third Party</span>
            </td>
            <td colSpan={6}></td>
          </tr>

          {/* Row 1 — grid starts rowspan 6, cols 4-8 */}
          <tr>
            <td style={lbl2}>Last Name&nbsp;<span style={{ color: 'red' }}>*</span></td>
            <td style={tdc}><input style={inp2} value={lastName} onChange={e => setLastName(e.target.value)} maxLength={40} /></td>
            <td></td>
            {/* Third Party grid — rowspan 6 */}
            <td colSpan={5} rowSpan={6} style={{ verticalAlign: 'top', padding: '1px 2px' }}>
              <div style={{ width: '592px', border: '1px solid #9ca3af' }}>
                {/* header */}
                <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%', fontSize: '11px', background: '#e5e7eb' }}>
                  <colgroup>
                    <col style={{ width: '26px' }} />
                    <col style={{ width: '176px' }} />
                    <col style={{ width: '176px' }} />
                    <col />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{ padding: '2px 4px', border: '1px solid #9ca3af', textAlign: 'left' }}>&nbsp;</th>
                      <th style={{ padding: '2px 4px', border: '1px solid #9ca3af', textAlign: 'left' }}>Last Name</th>
                      <th style={{ padding: '2px 4px', border: '1px solid #9ca3af', textAlign: 'left' }}>First Name</th>
                      <th style={{ padding: '2px 4px', border: '1px solid #9ca3af', textAlign: 'left' }}>License #</th>
                    </tr>
                  </thead>
                </table>
                {/* body */}
                <div style={{ height: '95px', overflowY: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%', fontSize: '11px' }}>
                    <colgroup>
                      <col style={{ width: '26px' }} />
                      <col style={{ width: '176px' }} />
                      <col style={{ width: '176px' }} />
                      <col />
                    </colgroup>
                    <tbody>
                      {gridRows.length === 0
                        ? <tr><td colSpan={4} style={{ padding: '4px', color: '#6b7280' }}></td></tr>
                        : gridRows.map((r, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                            <td style={{ padding: '2px 4px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                              <button style={{ fontSize: '10px', padding: '0 3px', cursor: 'pointer' }}>▶</button>
                            </td>
                            <td style={{ padding: '2px 4px', border: '1px solid #e5e7eb' }}>{r.lname}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #e5e7eb' }}>{r.fname}</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #e5e7eb' }}>{r.licNum}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
                {/* pager */}
                <div style={{ background: '#e5e7eb', padding: '2px 6px', fontSize: '11px', borderTop: '1px solid #9ca3af' }}>
                  Page <strong>1</strong> of <strong>1</strong>, items <strong>0</strong> to <strong>0</strong> of <strong>0</strong>.
                </div>
              </div>
            </td>
          </tr>

          {/* Row 2 */}
          <tr>
            <td style={lbl2}>First Name&nbsp;<span style={{ color: 'red' }}>*</span></td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                <input style={{ ...inp2, flex: 1 }} value={firstName} onChange={e => setFirstName(e.target.value)} maxLength={40} />
                <span style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>MI</span>
                <input style={{ ...inp, width: '20px' }} value={mi} onChange={e => setMi(e.target.value)} maxLength={1} />
              </div>
            </td>
            <td></td>
          </tr>

          {/* Row 3 */}
          <tr>
            <td style={lbl2}>Street 1</td>
            <td style={tdc}><input style={inp2} value={street1} onChange={e => setStreet1(e.target.value)} maxLength={100} /></td>
            <td></td>
          </tr>

          {/* Row 4 */}
          <tr>
            <td style={lbl2}>Street 2</td>
            <td style={tdc}><input style={inp2} value={street2} onChange={e => setStreet2(e.target.value)} maxLength={100} /></td>
            <td></td>
          </tr>

          {/* Row 5 */}
          <tr>
            <td style={lbl2}>City</td>
            <td style={tdc}><input style={inp2} value={city} onChange={e => setCity(e.target.value)} maxLength={40} /></td>
            <td></td>
          </tr>

          {/* Row 6 */}
          <tr>
            <td style={lbl2}>Country</td>
            <td style={tdc}>
              <select style={{ ...sel, width: '100%' }} value={country} onChange={e => setCountry(e.target.value)}>
                {COUNTRIES.map(([code, name]) => (
                  <option key={code} value={code}>{name}{name && code ? `  ${code}` : ''}</option>
                ))}
              </select>
            </td>
            <td></td>
            {/* grid rowspan ends — next rows have their own cols 4-8 */}
          </tr>

          {/* Row 7 — grid ends, insurance starts */}
          <tr>
            <td style={lbl2}>State</td>
            <td style={tdc}><input style={inp2} value={stateVal} onChange={e => setStateVal(e.target.value)} maxLength={40} /></td>
            <td></td>
            <td style={lbl2}>Insurance Carrier</td>
            <td style={tdc}><input style={inp2} value={insCarrier} onChange={e => setInsCarrier(e.target.value)} maxLength={40} /></td>
            <td style={lbl2}>Type</td>
            <td colSpan={2} style={tdc}>
              <select style={{ ...sel, width: '100%' }} value={thirdPartyType} onChange={e => setThirdPartyType(e.target.value)}>
                {THIRD_PARTY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </td>
          </tr>

          {/* Row 8 */}
          <tr>
            <td style={lbl2}>Postal Code</td>
            <td style={tdc}><input style={inp2} value={postal} onChange={e => setPostal(e.target.value)} maxLength={25} /></td>
            <td></td>
            <td style={lbl2}>Insurance Agency</td>
            <td style={tdc}><input style={inp2} value={insAgency} onChange={e => setInsAgency(e.target.value)} maxLength={20} /></td>
            <td style={lbl2}>At Fault&nbsp;<span style={{ color: 'red' }}>*</span></td>
            <td style={tdc}>
              <select style={{ ...sel, width: '80px' }} value={atFault} onChange={e => setAtFault(e.target.value)}>
                <option value=""></option>
                <option value="N">No</option>
                <option value="Y">Yes</option>
              </select>
            </td>
            <td></td>
          </tr>

          {/* Row 9 */}
          <tr>
            <td style={lbl2}>Home Phone</td>
            <td style={tdc}><input style={inp2} type="tel" value={homePhone} onChange={e => setHomePhone(e.target.value)} maxLength={30} /></td>
            <td></td>
            <td style={lbl2}>Insurance Agent</td>
            <td style={tdc}><input style={inp2} value={insAgent} onChange={e => setInsAgent(e.target.value)} maxLength={20} /></td>
            <td style={lbl2}>Vehicle Year / Make</td>
            <td colSpan={2} style={tdc}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input style={{ ...inp, width: '45px' }} type="number" value={vehYear} onChange={e => setVehYear(e.target.value)} maxLength={4} />
                <input style={{ ...inp, flex: 1 }} value={vehMake} onChange={e => setVehMake(e.target.value)} maxLength={20} />
              </div>
            </td>
          </tr>

          {/* Row 10 */}
          <tr>
            <td style={lbl2}>Mobile Phone</td>
            <td style={tdc}><input style={inp2} type="tel" value={mobilePhone} onChange={e => setMobilePhone(e.target.value)} maxLength={30} /></td>
            <td></td>
            <td style={lbl2}>Policy #</td>
            <td style={tdc}><input style={inp2} value={policyNo} onChange={e => setPolicyNo(e.target.value)} maxLength={40} /></td>
            <td style={lbl2}>Vehicle Model</td>
            <td colSpan={2} style={tdc}><input style={inp2} value={vehModel} onChange={e => setVehModel(e.target.value)} maxLength={20} /></td>
          </tr>

          {/* Row 11 */}
          <tr>
            <td style={lbl2}>Work Phone</td>
            <td style={tdc}><input style={inp2} type="tel" value={workPhone} onChange={e => setWorkPhone(e.target.value)} maxLength={40} /></td>
            <td></td>
            <td style={lbl2}>Alternate ID</td>
            <td style={tdc}><input style={inp2} value={altId} onChange={e => setAltId(e.target.value)} maxLength={40} /></td>
            <td style={lbl2}>Vehicle Registration</td>
            <td colSpan={2} style={tdc}><input style={inp2} value={vehRego} onChange={e => setVehRego(e.target.value)} maxLength={29} /></td>
          </tr>

          {/* Row 12 */}
          <tr>
            <td style={lbl2}>E-Mail</td>
            <td style={tdc}><input style={inp2} value={email} onChange={e => setEmail(e.target.value)} maxLength={50} /></td>
            <td></td>
            <td style={lbl2}>Type of Cover</td>
            <td style={tdc}>
              {['CTP','TPP','COMP'].map(c => (
                <label key={c} style={{ fontSize: '11px', marginRight: '6px', cursor: 'pointer' }}>
                  <input type="radio" name="afCoverType" value={c} checked={coverType === c} onChange={() => setCoverType(c)} />&nbsp;{c}
                </label>
              ))}
            </td>
            <td style={lbl2}>Vehicle Reg. Type</td>
            <td colSpan={2} style={tdc}>
              {['Private','Business'].map(r => (
                <label key={r} style={{ fontSize: '11px', marginRight: '6px', cursor: 'pointer' }}>
                  <input type="radio" name="afRegoType" value={r} checked={regoType === r} onChange={() => setRegoType(r)} />&nbsp;{r}
                </label>
              ))}
            </td>
          </tr>

          {/* Row 13 */}
          <tr>
            <td style={lbl2}>Lic Issue Date / Country</td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <input type="date" style={{ ...inp, width: '90px' }} value={licIssueDate} onChange={e => setLicIssueDate(e.target.value)} />
                <select style={{ ...sel, flex: 1 }} value={licCountry} onChange={e => setLicCountry(e.target.value)}>
                  {COUNTRIES.filter(([c]) => c).map(([code]) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
            </td>
            <td></td>
            <td colSpan={2} style={tdc}>&nbsp;</td>
            <td style={lbl2}>Validated</td>
            <td colSpan={2} style={tdc}>
              <input type="checkbox" checked={validated} onChange={e => setValidated(e.target.checked)} />&nbsp;
              <span style={{ fontSize: '11px' }}>Company</span>&nbsp;
              <input style={{ ...inp, width: '100px', display: 'inline-block' }} value={company} onChange={e => setCompany(e.target.value)} maxLength={40} />
            </td>
          </tr>

          {/* Row 14 */}
          <tr>
            <td style={lbl2}>License Issue City</td>
            <td style={tdc}><input style={inp2} value={licIssueCity} onChange={e => setLicIssueCity(e.target.value)} maxLength={35} /></td>
            <td></td>
            <td colSpan={2} style={tdc}>&nbsp;</td>
            <td style={lbl2}>ABN</td>
            <td colSpan={2} style={tdc}><input style={inp2} value={abn} onChange={e => setAbn(e.target.value)} maxLength={40} /></td>
          </tr>

          {/* Row 15 */}
          <tr>
            <td style={lbl2}>License # / State</td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-start' }}>
                <textarea
                  style={{ fontSize: '11px', border: '1px solid #9ca3af', width: '148px', height: '18px', resize: 'none', padding: '1px 3px', overflow: 'hidden', boxSizing: 'border-box' }}
                  value={licNum}
                  onChange={e => setLicNum(e.target.value)}
                  maxLength={1000}
                  rows={1}
                />
                <input style={{ ...inp, width: '38px' }} value={licState} onChange={e => setLicState(e.target.value)} maxLength={3} />
              </div>
            </td>
            <td></td>
            <td colSpan={2} style={tdc}>&nbsp;</td>
            <td style={lbl2}>Company Phone</td>
            <td colSpan={2} style={tdc}><input style={inp2} type="tel" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} maxLength={40} /></td>
          </tr>

          {/* Row 16 */}
          <tr>
            <td style={lbl2}>License Expiration</td>
            <td style={tdc}><input type="date" style={inp2} value={licExpires} onChange={e => setLicExpires(e.target.value)} /></td>
            <td></td>
            <td colSpan={2} style={tdc}></td>
            <td style={lbl2}>Claim #</td>
            <td colSpan={2} style={tdc}><input style={inp2} value={claimNo} onChange={e => setClaimNo(e.target.value)} maxLength={40} /></td>
          </tr>

          {/* Row 17 */}
          <tr>
            <td style={lbl2}>Date of Birth</td>
            <td style={tdc}><input type="date" style={inp2} value={dob} onChange={e => setDob(e.target.value)} /></td>
            <td colSpan={6}></td>
          </tr>

          {/* Row 18 */}
          <tr>
            <td style={lbl2}>Birth Place</td>
            <td style={tdc}><input style={inp2} value={birthPlace} onChange={e => setBirthPlace(e.target.value)} maxLength={35} /></td>
            <td colSpan={6}></td>
          </tr>

          {/* spacer */}
          <tr><td style={{ height: '6px' }} colSpan={8}></td></tr>
        </tbody>
      </table>

      {/* Button bar */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
        {['Save','New','Delete','Close'].map(label => (
          <button key={label} style={{
            padding: '3px 14px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            border: '1px solid #9ca3af', background: '#e5e7eb', borderRadius: '2px',
          }}>{label}</button>
        ))}
      </div>
    </div>
  );
}

/* ─── TSD bottom button bar ─────────────────────────────── */
function BtnBar() {
  const btn = (label: string, primary = false): React.CSSProperties => ({
    padding: '3px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
    border: '1px solid #9ca3af',
    background: primary ? '#16a34a' : '#e5e7eb',
    color: primary ? '#fff' : '#111',
    borderRadius: '2px',
  });
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#f0fdf4', borderTop: '1px solid #bbf7d0', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 100, flexWrap: 'wrap' }}>
      <button style={btn('Save', true)}>Save</button>
      <button style={btn('')}>Opt. Services</button>
      <button style={btn('')}>Addl Drivers</button>
      <button style={btn('')}>Discount</button>
      <button style={btn('')}>Notes</button>
      <button style={btn('')}>Events</button>
      <button style={btn('')}>Payments</button>
      <button style={btn('')}>Print</button>
      <button style={btn('')}>Email</button>
      <button style={btn('')}>Invoice</button>
      <button style={btn('')}>Open R/A</button>
      <button style={btn('')}>Duplicate</button>
      <button style={{ ...btn(''), color: '#dc2626', border: '1px solid #dc2626' }}>Cancel</button>
    </div>
  );
}

/* ─── Main Tab ───────────────────────────────────────────── */
function MainTab() {
  const [quoteNum, setQuoteNum] = useState('');
  const [preferredNum, setPreferredNum] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [mi, setMi] = useState('');
  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [postal, setPostal] = useState('');
  const [homePhone, setHomePhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [licNum, setLicNum] = useState('');
  const [licState, setLicState] = useState('');
  const [licExpires, setLicExpires] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [passport, setPassport] = useState('');
  const [altKNum, setAltKNum] = useState('');

  const [pickupLoc, setPickupLoc] = useState('');
  const [dropLoc, setDropLoc] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupHH, setPickupHH] = useState('08');
  const [pickupMM, setPickupMM] = useState('00');
  const [pickupAmPm, setPickupAmPm] = useState('AM');
  const [dropDate, setDropDate] = useState('');
  const [dropHH, setDropHH] = useState('08');
  const [dropMM, setDropMM] = useState('00');
  const [dropAmPm, setDropAmPm] = useState('AM');
  const [days, setDays] = useState('');
  const [ratePlanType, setRatePlanType] = useState('');
  const [rateCode, setRateCode] = useState('');
  const [rateClass, setRateClass] = useState('');
  const [estKms, setEstKms] = useState('');
  const [availUnits, setAvailUnits] = useState('');
  const [unit, setUnit] = useState('');
  const [unitDesc, setUnitDesc] = useState('');
  const [prepaidFuel, setPrepaidFuel] = useState(false);
  const [prepaidFuelAmt, setPrepaidFuelAmt] = useState('');
  const [origCurrency, setOrigCurrency] = useState('AUD');

  const [agentOut, setAgentOut] = useState('');
  const [source, setSource] = useState('');
  const [referralAgency, setReferralAgency] = useState('');
  const [referralAgent, setReferralAgent] = useState('');
  const [directBill, setDirectBill] = useState('');
  const [poNum, setPoNum] = useState('');
  const [useTax, setUseTax] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardType, setCardType] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [broadcastNote, setBroadcastNote] = useState('');
  const [expires, setExpires] = useState('');
  const [booked] = useState(new Date().toLocaleDateString('en-AU'));

  const HH = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const MM = ['00', '15', '30', '45'];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '900px' }}>
        <colgroup>
          <col style={{ width: '125px' }} />
          <col style={{ width: '170px' }} />
          <col style={{ width: '125px' }} />
          <col style={{ width: '230px' }} />
          <col style={{ width: '135px' }} />
          <col />
        </colgroup>
        <tbody>
          {/* Row 1 */}
          <tr>
            <td style={lbl}>Rez Number</td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button style={{ fontSize: '10px', padding: '1px 5px', border: '1px solid #9ca3af', background: '#e5e7eb', cursor: 'pointer' }}>Rez</button>
                <input style={inp} value={quoteNum} onChange={e => setQuoteNum(e.target.value)} />
              </div>
            </td>
            <td style={lbl}>Pickup Location</td>
            <td style={tdc}>
              <select style={sel} value={pickupLoc} onChange={e => setPickupLoc(e.target.value)}>
                <option value="">— Select —</option>
              </select>
            </td>
            <td style={lbl}>Preferred Renter #</td>
            <td style={tdc}><input style={inp} value={preferredNum} onChange={e => setPreferredNum(e.target.value)} /></td>
          </tr>

          {/* Row 2 */}
          <tr>
            <td style={lbl}>Last Name</td>
            <td style={tdc}><input style={inp} value={lastName} onChange={e => setLastName(e.target.value)} /></td>
            <td style={lbl}>Return Location</td>
            <td style={tdc}>
              <select style={sel} value={dropLoc} onChange={e => setDropLoc(e.target.value)}>
                <option value="">Return to pickup</option>
              </select>
            </td>
            <td style={lbl}>Expiration / Booked</td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <input style={{ ...inp, width: '80px' }} placeholder="Expiry" value={expires} onChange={e => setExpires(e.target.value)} />
                <input style={{ ...roInp, flex: 1 }} readOnly value={booked} />
              </div>
            </td>
          </tr>

          {/* Row 3 */}
          <tr>
            <td style={lbl}>First Name / MI</td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <input style={{ ...inp, flex: 1 }} value={firstName} onChange={e => setFirstName(e.target.value)} />
                <input style={{ ...inp, width: '30px' }} value={mi} onChange={e => setMi(e.target.value)} maxLength={1} />
              </div>
            </td>
            <td style={lbl}>Pickup Date</td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <input type="date" style={{ ...inp, flex: 1 }} value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
                <select style={{ ...sel, width: '36px' }} value={pickupHH} onChange={e => setPickupHH(e.target.value)}>
                  {HH.map(h => <option key={h}>{h}</option>)}
                </select>
                <select style={{ ...sel, width: '36px' }} value={pickupMM} onChange={e => setPickupMM(e.target.value)}>
                  {MM.map(m => <option key={m}>{m}</option>)}
                </select>
                <select style={{ ...sel, width: '38px' }} value={pickupAmPm} onChange={e => setPickupAmPm(e.target.value)}>
                  <option>AM</option><option>PM</option>
                </select>
              </div>
            </td>
            <td style={lbl}>Agent Out</td>
            <td style={tdc}><input style={roInp} readOnly value={agentOut} /></td>
          </tr>

          {/* Row 4 */}
          <tr>
            <td style={lbl}>Street 1</td>
            <td style={tdc}><input style={inp} value={street1} onChange={e => setStreet1(e.target.value)} /></td>
            <td style={lbl}>Drop Off Date</td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <input type="date" style={{ ...inp, flex: 1 }} value={dropDate} onChange={e => setDropDate(e.target.value)} />
                <select style={{ ...sel, width: '36px' }} value={dropHH} onChange={e => setDropHH(e.target.value)}>
                  {HH.map(h => <option key={h}>{h}</option>)}
                </select>
                <select style={{ ...sel, width: '36px' }} value={dropMM} onChange={e => setDropMM(e.target.value)}>
                  {MM.map(m => <option key={m}>{m}</option>)}
                </select>
                <select style={{ ...sel, width: '38px' }} value={dropAmPm} onChange={e => setDropAmPm(e.target.value)}>
                  <option>AM</option><option>PM</option>
                </select>
                &nbsp;Days:&nbsp;
                <input style={{ ...inp, width: '32px' }} value={days} onChange={e => setDays(e.target.value)} />
              </div>
            </td>
            <td style={lbl}>Source of Business</td>
            <td style={tdc}>
              <select style={sel} value={source} onChange={e => setSource(e.target.value)}>
                <option value="">— Select —</option>
                <option>Insurance</option>
                <option>Corporate</option>
                <option>Walk-in</option>
                <option>Internet</option>
                <option>Repairer</option>
              </select>
            </td>
          </tr>

          {/* Row 5 */}
          <tr>
            <td style={lbl}>Street 2</td>
            <td style={tdc}><input style={inp} value={street2} onChange={e => setStreet2(e.target.value)} /></td>
            <td style={lbl}>Rate Plan Type / Code</td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <select style={{ ...sel, flex: 1 }} value={ratePlanType} onChange={e => setRatePlanType(e.target.value)}>
                  <option value="">— Type —</option>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
                <input style={{ ...inp, width: '80px' }} placeholder="Code" value={rateCode} onChange={e => setRateCode(e.target.value)} />
              </div>
            </td>
            <td style={lbl}>Referral Agency</td>
            <td style={tdc}><input style={inp} value={referralAgency} onChange={e => setReferralAgency(e.target.value)} /></td>
          </tr>

          {/* Row 6 */}
          <tr>
            <td style={lbl}>City</td>
            <td style={tdc}><input style={inp} value={city} onChange={e => setCity(e.target.value)} /></td>
            <td style={lbl}>Rate Class / Est. Kms</td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <select style={{ ...sel, flex: 1 }} value={rateClass} onChange={e => setRateClass(e.target.value)}>
                  <option value="">— Class —</option>
                  <option>Economy</option>
                  <option>Compact</option>
                  <option>Midsize</option>
                  <option>Standard</option>
                  <option>Fullsize</option>
                  <option>SUV</option>
                  <option>Van</option>
                </select>
                <input style={{ ...inp, width: '60px' }} placeholder="Est Kms" value={estKms} onChange={e => setEstKms(e.target.value)} />
              </div>
            </td>
            <td style={lbl}>Referral Agent</td>
            <td style={tdc}><input style={inp} value={referralAgent} onChange={e => setReferralAgent(e.target.value)} /></td>
          </tr>

          {/* Row 7 */}
          <tr>
            <td style={lbl}>Country</td>
            <td style={tdc}><input style={inp} value={country} onChange={e => setCountry(e.target.value)} /></td>
            <td style={lbl}>Available Units / Unit</td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <select style={{ ...sel, width: '70px' }} value={availUnits} onChange={e => setAvailUnits(e.target.value)}>
                  <option value="">—</option>
                </select>
                <input style={{ ...inp, width: '70px' }} placeholder="Unit #" value={unit} onChange={e => setUnit(e.target.value)} />
                <input style={{ ...inp, flex: 1 }} placeholder="Description" value={unitDesc} onChange={e => setUnitDesc(e.target.value)} />
              </div>
            </td>
            <td style={lbl}>Direct Bill</td>
            <td style={tdc}>
              <select style={sel} value={directBill} onChange={e => setDirectBill(e.target.value)}>
                <option value="">— Select —</option>
              </select>
            </td>
          </tr>

          {/* Row 8 */}
          <tr>
            <td style={lbl}>State</td>
            <td style={tdc}>
              <select style={sel} value={stateVal} onChange={e => setStateVal(e.target.value)}>
                <option value="">—</option>
                {['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s}>{s}</option>)}
              </select>
            </td>
            <td style={lbl}>Prepaid Fuel</td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input type="checkbox" checked={prepaidFuel} onChange={e => setPrepaidFuel(e.target.checked)} />
                <input style={{ ...inp, width: '80px' }} placeholder="Amount" value={prepaidFuelAmt} onChange={e => setPrepaidFuelAmt(e.target.value)} disabled={!prepaidFuel} />
              </div>
            </td>
            <td style={lbl}>P.O. / R.O. #</td>
            <td style={tdc}><input style={inp} value={poNum} onChange={e => setPoNum(e.target.value)} /></td>
          </tr>

          {/* Row 9 */}
          <tr>
            <td style={lbl}>Postal Code</td>
            <td style={tdc}><input style={inp} value={postal} onChange={e => setPostal(e.target.value)} /></td>
            <td style={lbl}>Original Currency</td>
            <td style={tdc}>
              <select style={sel} value={origCurrency} onChange={e => setOrigCurrency(e.target.value)}>
                <option>AUD</option><option>USD</option><option>GBP</option><option>EUR</option><option>NZD</option>
              </select>
            </td>
            {/* Use Tax — rowspan 2, cols 5-6 */}
            <td colSpan={2} rowSpan={2} style={{ ...tdc, verticalAlign: 'top' }}>
              <div style={{ border: '1px solid #9ca3af', padding: '4px 6px', fontSize: '11px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                  <input type="checkbox" checked={useTax} onChange={e => setUseTax(e.target.checked)} />
                  Use Tax Exempt
                </label>
              </div>
            </td>
          </tr>

          {/* Row 10 */}
          <tr>
            <td style={lbl}>Home Phone</td>
            <td style={tdc}><input style={inp} value={homePhone} onChange={e => setHomePhone(e.target.value)} /></td>
            <td colSpan={2} style={tdc}></td>
          </tr>

          {/* Row 11 — Charge Grid starts (rowspan 9, cols 5-6) */}
          <tr>
            <td style={lbl}>Mobile Phone</td>
            <td style={tdc}><input style={inp} value={mobile} onChange={e => setMobile(e.target.value)} /></td>
            <td colSpan={2} style={tdc}></td>
            {/* Charge Grid rowspan 9 */}
            <td colSpan={2} rowSpan={9} style={{ verticalAlign: 'top', padding: '1px 2px' }}>
              <div style={{ width: '315px', height: '210px', border: '1px solid #9ca3af', overflow: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#16a34a' }}>
                      <th style={{ color: '#fff', padding: '2px 4px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                      <th style={{ color: '#fff', padding: '2px 4px', textAlign: 'right', fontWeight: 600 }}>Qty</th>
                      <th style={{ color: '#fff', padding: '2px 4px', textAlign: 'right', fontWeight: 600 }}>Rate</th>
                      <th style={{ color: '#fff', padding: '2px 4px', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan={4} style={{ padding: '4px', color: '#6b7280', fontSize: '11px' }}>No charges added</td></tr>
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#e5e7eb', borderTop: '1px solid #9ca3af' }}>
                      <td colSpan={3} style={{ padding: '2px 4px', fontWeight: 700, fontSize: '11px' }}>Total</td>
                      <td style={{ padding: '2px 4px', fontWeight: 700, fontSize: '11px', textAlign: 'right' }}>0.00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </td>
          </tr>

          {/* Row 12 */}
          <tr>
            <td style={lbl}>Work Phone</td>
            <td style={tdc}><input style={inp} value={workPhone} onChange={e => setWorkPhone(e.target.value)} /></td>
            <td style={lbl}>Card Number</td>
            <td style={tdc}><input style={inp} value={cardNumber} onChange={e => setCardNumber(e.target.value)} /></td>
          </tr>

          {/* Row 13 */}
          <tr>
            <td style={lbl}>License # / State</td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <input style={{ ...inp, flex: 1 }} value={licNum} onChange={e => setLicNum(e.target.value)} />
                <select style={{ ...sel, width: '50px' }} value={licState} onChange={e => setLicState(e.target.value)}>
                  <option value="">—</option>
                  {['International','ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </td>
            <td style={lbl}>Card Type / Expiry</td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <select style={{ ...sel, flex: 1 }} value={cardType} onChange={e => setCardType(e.target.value)}>
                  <option value="">— Type —</option>
                  <option>Visa</option>
                  <option>Mastercard</option>
                  <option>Amex</option>
                  <option>eftpos</option>
                </select>
                <input style={{ ...inp, width: '60px' }} placeholder="MM/YY" value={cardExp} onChange={e => setCardExp(e.target.value)} />
              </div>
            </td>
          </tr>

          {/* Row 14 */}
          <tr>
            <td style={lbl}>Expiry / DOB</td>
            <td style={tdc}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <input type="date" style={{ ...inp, flex: 1 }} value={licExpires} onChange={e => setLicExpires(e.target.value)} placeholder="Lic Expires" />
                <input type="date" style={{ ...inp, flex: 1 }} value={dob} onChange={e => setDob(e.target.value)} placeholder="DOB" />
              </div>
            </td>
            <td colSpan={2} style={{ ...tdc, fontWeight: 700, fontSize: '11px' }}>Broadcast Note</td>
          </tr>

          {/* Row 15 — Broadcast Note textarea rowspan 5 cols 3-4 */}
          <tr>
            <td style={lbl}>Email</td>
            <td style={tdc}><input style={inp} value={email} onChange={e => setEmail(e.target.value)} /></td>
            {/* Broadcast Note textarea rowspan 5 */}
            <td colSpan={2} rowSpan={5} style={{ verticalAlign: 'top', padding: '1px 2px' }}>
              <textarea
                style={{ width: '340px', height: '100px', fontSize: '11px', border: '1px solid #9ca3af', padding: '2px 4px', resize: 'none', boxSizing: 'border-box' }}
                value={broadcastNote}
                onChange={e => setBroadcastNote(e.target.value)}
              />
            </td>
          </tr>

          {/* Row 16 */}
          <tr>
            <td style={lbl}>Alternate ID</td>
            <td style={tdc}><input style={inp} value={passport} onChange={e => setPassport(e.target.value)} /></td>
          </tr>

          {/* Row 17 */}
          <tr>
            <td style={lbl}>Control #</td>
            <td style={tdc}><input style={inp} value={altKNum} onChange={e => setAltKNum(e.target.value)} /></td>
          </tr>

          {/* Rows 18-19 spacers */}
          <tr><td colSpan={2} style={{ height: '4px' }}></td></tr>
          <tr><td colSpan={2} style={{ height: '4px' }}></td></tr>
        </tbody>
      </table>
    </div>
  );
}

/* ─── Misc Tab ───────────────────────────────────────────── */
function MiscTab() {
  const [insCarrier, setInsCarrier] = useState('');
  const [insAgency, setInsAgency] = useState('');
  const [insAgent, setInsAgent] = useState('');
  const [insPhone, setInsPhone] = useState('');
  const [insPolicy, setInsPolicy] = useState('');
  const [insPolicyExp, setInsPolicyExp] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [vehYear, setVehYear] = useState('');
  const [vehMake, setVehMake] = useState('');
  const [vehModel, setVehModel] = useState('');
  const [vehColor, setVehColor] = useState('');
  const [vehVin, setVehVin] = useState('');
  const [totalLoss, setTotalLoss] = useState(false);
  const [localResAddr, setLocalResAddr] = useState('');
  const [localResPhone, setLocalResPhone] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [employerAddr, setEmployerAddr] = useState('');
  const [employerPhone, setEmployerPhone] = useState('');
  const [repairFacility, setRepairFacility] = useState('');
  const [repairPhone, setRepairPhone] = useState('');
  const [repairContact, setRepairContact] = useState('');
  const [delivery, setDelivery] = useState(false);
  const [collection, setCollection] = useState(false);
  const [language, setLanguage] = useState('');
  const [passportNum, setPassportNum] = useState('');

  const inp2: React.CSSProperties = { ...inp, width: '100%' };

  return (
    <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '860px' }}>
        <colgroup>
          <col style={{ width: '120px' }} />
          <col style={{ width: '200px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '200px' }} />
          <col style={{ width: '110px' }} />
          <col />
        </colgroup>
        <tbody>
          <tr><td colSpan={6} style={{ padding: '4px 0 2px' }}><span style={sectionHdr}>Insurance Details</span></td></tr>
          <tr>
            <td style={lbl}>Carrier</td>
            <td style={tdc}><input style={inp2} value={insCarrier} onChange={e => setInsCarrier(e.target.value)} /></td>
            <td style={lbl}>Agency</td>
            <td style={tdc}><input style={inp2} value={insAgency} onChange={e => setInsAgency(e.target.value)} /></td>
            <td style={lbl}>Agent</td>
            <td style={tdc}><input style={inp2} value={insAgent} onChange={e => setInsAgent(e.target.value)} /></td>
          </tr>
          <tr>
            <td style={lbl}>Ins. Phone</td>
            <td style={tdc}><input style={inp2} value={insPhone} onChange={e => setInsPhone(e.target.value)} /></td>
            <td style={lbl}>Policy #</td>
            <td style={tdc}><input style={inp2} value={insPolicy} onChange={e => setInsPolicy(e.target.value)} /></td>
            <td style={lbl}>Policy Exp.</td>
            <td style={tdc}><input type="date" style={inp2} value={insPolicyExp} onChange={e => setInsPolicyExp(e.target.value)} /></td>
          </tr>

          <tr><td colSpan={6} style={{ padding: '6px 0 2px' }}><span style={sectionHdr}>Arrival</span></td></tr>
          <tr>
            <td style={lbl}>Arrival Date</td>
            <td style={tdc}><input type="date" style={inp2} value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} /></td>
            <td style={lbl}>Arrival Time</td>
            <td style={tdc}><input type="time" style={inp2} value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} /></td>
            <td colSpan={2}></td>
          </tr>

          <tr><td colSpan={6} style={{ padding: '6px 0 2px' }}><span style={sectionHdr}>Vehicle Details (NAF)</span></td></tr>
          <tr>
            <td style={lbl}>Year</td>
            <td style={tdc}><input style={inp2} value={vehYear} onChange={e => setVehYear(e.target.value)} maxLength={4} /></td>
            <td style={lbl}>Make</td>
            <td style={tdc}><input style={inp2} value={vehMake} onChange={e => setVehMake(e.target.value)} /></td>
            <td style={lbl}>Model</td>
            <td style={tdc}><input style={inp2} value={vehModel} onChange={e => setVehModel(e.target.value)} /></td>
          </tr>
          <tr>
            <td style={lbl}>Colour</td>
            <td style={tdc}><input style={inp2} value={vehColor} onChange={e => setVehColor(e.target.value)} /></td>
            <td style={lbl}>VIN</td>
            <td style={tdc}><input style={inp2} value={vehVin} onChange={e => setVehVin(e.target.value)} /></td>
            <td style={lbl}>Total Loss?</td>
            <td style={tdc}><input type="checkbox" checked={totalLoss} onChange={e => setTotalLoss(e.target.checked)} /></td>
          </tr>

          <tr><td colSpan={6} style={{ padding: '6px 0 2px' }}><span style={sectionHdr}>Local Residence</span></td></tr>
          <tr>
            <td style={lbl}>Address</td>
            <td colSpan={3} style={tdc}><input style={inp2} value={localResAddr} onChange={e => setLocalResAddr(e.target.value)} /></td>
            <td style={lbl}>Phone</td>
            <td style={tdc}><input style={inp2} value={localResPhone} onChange={e => setLocalResPhone(e.target.value)} /></td>
          </tr>

          <tr><td colSpan={6} style={{ padding: '6px 0 2px' }}><span style={sectionHdr}>Employer</span></td></tr>
          <tr>
            <td style={lbl}>Name</td>
            <td style={tdc}><input style={inp2} value={employerName} onChange={e => setEmployerName(e.target.value)} /></td>
            <td style={lbl}>Address</td>
            <td style={tdc}><input style={inp2} value={employerAddr} onChange={e => setEmployerAddr(e.target.value)} /></td>
            <td style={lbl}>Phone</td>
            <td style={tdc}><input style={inp2} value={employerPhone} onChange={e => setEmployerPhone(e.target.value)} /></td>
          </tr>

          <tr><td colSpan={6} style={{ padding: '6px 0 2px' }}><span style={sectionHdr}>Repair Facility</span></td></tr>
          <tr>
            <td style={lbl}>Facility</td>
            <td colSpan={2} style={tdc}><input style={inp2} value={repairFacility} onChange={e => setRepairFacility(e.target.value)} /></td>
            <td style={{ ...lbl }}>Contact</td>
            <td colSpan={2} style={tdc}><input style={inp2} value={repairContact} onChange={e => setRepairContact(e.target.value)} /></td>
          </tr>
          <tr>
            <td style={lbl}>Phone</td>
            <td style={tdc}><input style={inp2} value={repairPhone} onChange={e => setRepairPhone(e.target.value)} /></td>
            <td colSpan={4}></td>
          </tr>

          <tr><td colSpan={6} style={{ padding: '6px 0 2px' }}><span style={sectionHdr}>Other</span></td></tr>
          <tr>
            <td style={lbl}>Delivery</td>
            <td style={tdc}><input type="checkbox" checked={delivery} onChange={e => setDelivery(e.target.checked)} /></td>
            <td style={lbl}>Collection</td>
            <td style={tdc}><input type="checkbox" checked={collection} onChange={e => setCollection(e.target.checked)} /></td>
            <td style={lbl}>Language</td>
            <td style={tdc}><input style={inp2} value={language} onChange={e => setLanguage(e.target.value)} /></td>
          </tr>
          <tr>
            <td style={lbl}>Passport #</td>
            <td style={tdc}><input style={inp2} value={passportNum} onChange={e => setPassportNum(e.target.value)} /></td>
            <td colSpan={4}></td>
          </tr>
          <tr><td style={{ height: '60px' }} colSpan={6}></td></tr>
        </tbody>
      </table>
    </div>
  );
}

/* ─── Accident Details Tab ───────────────────────────────── */
function AccidentTab() {
  const [hireType, setHireType] = useState<'credit' | 'direct'>('credit');
  const [flags, setFlags] = useState<Record<string, boolean>>({
    AFR: false, AFC: false, MAV: false, VAL: false, SIG: false, REG: false, INS: false, DLS: false,
  });
  const [driverIsOwner, setDriverIsOwner] = useState<'yes' | 'no' | ''>('');
  // NAF Owner
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerAddr, setOwnerAddr] = useState('');
  const [ownerCity, setOwnerCity] = useState('');
  const [ownerState, setOwnerState] = useState('');
  const [ownerPostal, setOwnerPostal] = useState('');
  // NAF Insurance
  const [nafInsCarrier, setNafInsCarrier] = useState('');
  const [nafInsPolicy, setNafInsPolicy] = useState('');
  const [nafInsPhone, setNafInsPhone] = useState('');
  const [nafInsAgent, setNafInsAgent] = useState('');
  const [nafInsAgency, setNafInsAgency] = useState('');
  // Type of Cover
  const [coverType, setCoverType] = useState('');
  // Accident Details
  const [accDescription, setAccDescription] = useState('');
  const [accDamageDesc, setAccDamageDesc] = useState('');
  const [accDate, setAccDate] = useState('');
  const [accTime, setAccTime] = useState('');
  const [accStreet, setAccStreet] = useState('');
  const [accSuburb, setAccSuburb] = useState('');
  const [accState, setAccState] = useState('');
  const [accPostal, setAccPostal] = useState('');
  const [accCrossStreet, setAccCrossStreet] = useState('');
  const [drivable, setDrivable] = useState('');
  const [totalLossAcc, setTotalLossAcc] = useState('');
  const [settlementLetter, setSettlementLetter] = useState('');
  // Repair Facility
  const [repFacility, setRepFacility] = useState('');
  const [repContact, setRepContact] = useState('');
  const [repPhone, setRepPhone] = useState('');
  // Witness
  const [witnessName, setWitnessName] = useState('');
  const [witnessPhone, setWitnessPhone] = useState('');
  // Police
  const [policeStation, setPoliceStation] = useState('');
  const [policeEventNum, setPoliceEventNum] = useState('');
  const [policeName, setPoliceName] = useState('');

  const inp2: React.CSSProperties = { ...inp, width: '100%' };

  function toggleFlag(f: string) {
    setFlags(prev => ({ ...prev, [f]: !prev[f] }));
  }

  return (
    <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '860px' }}>
        <colgroup>
          <col style={{ width: '120px' }} />
          <col style={{ width: '200px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '200px' }} />
          <col style={{ width: '110px' }} />
          <col />
        </colgroup>
        <tbody>
          {/* Credit / Direct Hire */}
          <tr>
            <td colSpan={6} style={{ padding: '4px 0' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', display: 'flex', gap: '4px', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="hireType" value="credit" checked={hireType === 'credit'} onChange={() => setHireType('credit')} />
                  Credit Hire
                </label>
                <label style={{ fontSize: '11px', display: 'flex', gap: '4px', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="hireType" value="direct" checked={hireType === 'direct'} onChange={() => setHireType('direct')} />
                  Direct Hire
                </label>
                <div style={{ display: 'flex', gap: '10px', marginLeft: '30px' }}>
                  {Object.keys(flags).map(f => (
                    <label key={f} style={{ fontSize: '11px', display: 'flex', gap: '3px', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={flags[f]} onChange={() => toggleFlag(f)} />{f}
                    </label>
                  ))}
                </div>
              </div>
            </td>
          </tr>

          {/* Is driver vehicle owner? */}
          <tr>
            <td colSpan={6} style={{ padding: '2px 0 4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 500 }}>Is Driver the Vehicle Owner?&nbsp;&nbsp;</span>
              <label style={{ fontSize: '11px', marginRight: '10px', cursor: 'pointer' }}>
                <input type="radio" name="driverOwner" value="yes" checked={driverIsOwner === 'yes'} onChange={() => setDriverIsOwner('yes')} />&nbsp;Yes
              </label>
              <label style={{ fontSize: '11px', cursor: 'pointer' }}>
                <input type="radio" name="driverOwner" value="no" checked={driverIsOwner === 'no'} onChange={() => setDriverIsOwner('no')} />&nbsp;No
              </label>
            </td>
          </tr>

          {/* NAF Vehicle Owner */}
          <tr><td colSpan={6} style={{ padding: '4px 0 2px' }}><span style={sectionHdr}>NAF Vehicle Owner Details</span></td></tr>
          <tr>
            <td style={lbl}>Name</td>
            <td style={tdc}><input style={inp2} value={ownerName} onChange={e => setOwnerName(e.target.value)} /></td>
            <td style={lbl}>Phone</td>
            <td style={tdc}><input style={inp2} value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} /></td>
            <td colSpan={2}></td>
          </tr>
          <tr>
            <td style={lbl}>Address</td>
            <td colSpan={3} style={tdc}><input style={inp2} value={ownerAddr} onChange={e => setOwnerAddr(e.target.value)} /></td>
            <td colSpan={2}></td>
          </tr>
          <tr>
            <td style={lbl}>City</td>
            <td style={tdc}><input style={inp2} value={ownerCity} onChange={e => setOwnerCity(e.target.value)} /></td>
            <td style={lbl}>State</td>
            <td style={tdc}>
              <select style={sel} value={ownerState} onChange={e => setOwnerState(e.target.value)}>
                <option value="">—</option>
                {['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s}>{s}</option>)}
              </select>
            </td>
            <td style={lbl}>Postal</td>
            <td style={tdc}><input style={inp2} value={ownerPostal} onChange={e => setOwnerPostal(e.target.value)} /></td>
          </tr>

          {/* NAF Insurance */}
          <tr><td colSpan={6} style={{ padding: '6px 0 2px' }}><span style={sectionHdr}>NAF Insurance Details</span></td></tr>
          <tr>
            <td style={lbl}>Carrier</td>
            <td style={tdc}><input style={inp2} value={nafInsCarrier} onChange={e => setNafInsCarrier(e.target.value)} /></td>
            <td style={lbl}>Policy #</td>
            <td style={tdc}><input style={inp2} value={nafInsPolicy} onChange={e => setNafInsPolicy(e.target.value)} /></td>
            <td style={lbl}>Phone</td>
            <td style={tdc}><input style={inp2} value={nafInsPhone} onChange={e => setNafInsPhone(e.target.value)} /></td>
          </tr>
          <tr>
            <td style={lbl}>Agency</td>
            <td style={tdc}><input style={inp2} value={nafInsAgency} onChange={e => setNafInsAgency(e.target.value)} /></td>
            <td style={lbl}>Agent</td>
            <td style={tdc}><input style={inp2} value={nafInsAgent} onChange={e => setNafInsAgent(e.target.value)} /></td>
            <td colSpan={2}></td>
          </tr>

          {/* Type of Cover */}
          <tr><td colSpan={6} style={{ padding: '6px 0 2px' }}><span style={sectionHdr}>Type of Cover</span></td></tr>
          <tr>
            <td colSpan={6} style={{ padding: '2px 0 4px' }}>
              {['CTP', 'TPP', 'COMP'].map(c => (
                <label key={c} style={{ fontSize: '11px', marginRight: '16px', cursor: 'pointer' }}>
                  <input type="radio" name="coverType" value={c} checked={coverType === c} onChange={() => setCoverType(c)} />&nbsp;{c}
                </label>
              ))}
            </td>
          </tr>

          {/* Accident Details */}
          <tr><td colSpan={6} style={{ padding: '6px 0 2px' }}><span style={sectionHdr}>Accident Details</span></td></tr>
          <tr>
            <td style={lbl}>Description</td>
            <td colSpan={5} style={tdc}>
              <textarea style={{ width: '100%', height: '50px', fontSize: '11px', border: '1px solid #9ca3af', padding: '2px 4px', boxSizing: 'border-box' }}
                value={accDescription} onChange={e => setAccDescription(e.target.value)} />
            </td>
          </tr>
          <tr>
            <td style={lbl}>Damage Desc.</td>
            <td colSpan={5} style={tdc}>
              <textarea style={{ width: '100%', height: '40px', fontSize: '11px', border: '1px solid #9ca3af', padding: '2px 4px', boxSizing: 'border-box' }}
                value={accDamageDesc} onChange={e => setAccDamageDesc(e.target.value)} />
            </td>
          </tr>
          <tr>
            <td style={lbl}>Date / Time</td>
            <td style={tdc}><input type="date" style={inp2} value={accDate} onChange={e => setAccDate(e.target.value)} /></td>
            <td style={tdc} colSpan={1}><input type="time" style={inp2} value={accTime} onChange={e => setAccTime(e.target.value)} /></td>
            <td colSpan={3}></td>
          </tr>
          <tr>
            <td style={lbl}>Street</td>
            <td colSpan={2} style={tdc}><input style={inp2} value={accStreet} onChange={e => setAccStreet(e.target.value)} /></td>
            <td style={lbl}>Cross Street</td>
            <td colSpan={2} style={tdc}><input style={inp2} value={accCrossStreet} onChange={e => setAccCrossStreet(e.target.value)} /></td>
          </tr>
          <tr>
            <td style={lbl}>Suburb</td>
            <td style={tdc}><input style={inp2} value={accSuburb} onChange={e => setAccSuburb(e.target.value)} /></td>
            <td style={lbl}>State</td>
            <td style={tdc}>
              <select style={sel} value={accState} onChange={e => setAccState(e.target.value)}>
                <option value="">—</option>
                {['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s}>{s}</option>)}
              </select>
            </td>
            <td style={lbl}>Postcode</td>
            <td style={tdc}><input style={inp2} value={accPostal} onChange={e => setAccPostal(e.target.value)} /></td>
          </tr>
          <tr>
            <td style={lbl}>Drivable?</td>
            <td style={tdc}>
              {['Yes', 'No'].map(o => (
                <label key={o} style={{ fontSize: '11px', marginRight: '10px', cursor: 'pointer' }}>
                  <input type="radio" name="drivable" value={o} checked={drivable === o} onChange={() => setDrivable(o)} />&nbsp;{o}
                </label>
              ))}
            </td>
            <td style={lbl}>Total Loss?</td>
            <td style={tdc}>
              {['Yes', 'No'].map(o => (
                <label key={o} style={{ fontSize: '11px', marginRight: '10px', cursor: 'pointer' }}>
                  <input type="radio" name="totalLossAcc" value={o} checked={totalLossAcc === o} onChange={() => setTotalLossAcc(o)} />&nbsp;{o}
                </label>
              ))}
            </td>
            <td style={lbl}>Settlement Ltr?</td>
            <td style={tdc}>
              {['Yes', 'No'].map(o => (
                <label key={o} style={{ fontSize: '11px', marginRight: '10px', cursor: 'pointer' }}>
                  <input type="radio" name="settlementLetter" value={o} checked={settlementLetter === o} onChange={() => setSettlementLetter(o)} />&nbsp;{o}
                </label>
              ))}
            </td>
          </tr>

          {/* Repair Facility */}
          <tr><td colSpan={6} style={{ padding: '6px 0 2px' }}><span style={sectionHdr}>Repair Facility</span></td></tr>
          <tr>
            <td style={lbl}>Facility</td>
            <td style={tdc}><input style={inp2} value={repFacility} onChange={e => setRepFacility(e.target.value)} /></td>
            <td style={lbl}>Contact</td>
            <td style={tdc}><input style={inp2} value={repContact} onChange={e => setRepContact(e.target.value)} /></td>
            <td style={lbl}>Phone</td>
            <td style={tdc}><input style={inp2} value={repPhone} onChange={e => setRepPhone(e.target.value)} /></td>
          </tr>

          {/* Witness */}
          <tr><td colSpan={6} style={{ padding: '6px 0 2px' }}><span style={sectionHdr}>Witness Details</span></td></tr>
          <tr>
            <td style={lbl}>Name</td>
            <td style={tdc}><input style={inp2} value={witnessName} onChange={e => setWitnessName(e.target.value)} /></td>
            <td style={lbl}>Phone</td>
            <td style={tdc}><input style={inp2} value={witnessPhone} onChange={e => setWitnessPhone(e.target.value)} /></td>
            <td colSpan={2}></td>
          </tr>

          {/* Police */}
          <tr><td colSpan={6} style={{ padding: '6px 0 2px' }}><span style={sectionHdr}>Police Details</span></td></tr>
          <tr>
            <td style={lbl}>Station</td>
            <td style={tdc}><input style={inp2} value={policeStation} onChange={e => setPoliceStation(e.target.value)} /></td>
            <td style={lbl}>Event #</td>
            <td style={tdc}><input style={inp2} value={policeEventNum} onChange={e => setPoliceEventNum(e.target.value)} /></td>
            <td style={lbl}>Officer Name</td>
            <td style={tdc}><input style={inp2} value={policeName} onChange={e => setPoliceName(e.target.value)} /></td>
          </tr>

          <tr><td style={{ height: '60px' }} colSpan={6}></td></tr>
        </tbody>
      </table>
    </div>
  );
}

/* ─── Root component ─────────────────────────────────────── */
export default function TSDReservationDetail() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', paddingBottom: '50px', maxWidth: '960px' }}>
      {/* Page header */}
      <div style={{ background: '#16a34a', color: '#fff', padding: '4px 10px', fontSize: '13px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Reservation Detail</span>
        <span style={{ fontSize: '11px', fontWeight: 400 }}>New Reservation</span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '2px solid #16a34a', marginBottom: '6px', background: '#fff' }}>
        {TABS.map((t, i) => (
          <button key={t} type="button" onClick={() => setActiveTab(i)} style={{
            padding: '4px 14px', fontSize: '11px', fontWeight: activeTab === i ? 700 : 400,
            color: activeTab === i ? '#fff' : '#475569',
            background: activeTab === i ? '#16a34a' : 'transparent',
            border: 'none', borderRight: '1px solid #e2e8f0',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 0 && <MainTab />}
      {activeTab === 1 && <MiscTab />}
      {activeTab === 2 && <AccidentTab />}
      {activeTab === 3 && <AtFaultThirdPartyTab />}

      <BtnBar />
    </div>
  );
}
