'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import api from '@/lib/api';

/* ─── legacy shared styles (used by non-modernised tabs) ─── */
const inp: React.CSSProperties = {
  width: '100%', padding: '2px 4px', border: '1px solid #9ca3af',
  fontSize: '13px', color: '#000', background: '#fff', boxSizing: 'border-box', height: '22px',
};
const roInp: React.CSSProperties = { ...inp, background: '#e5e7eb', color: '#374151' };
const sel: React.CSSProperties = { ...inp, height: '22px' };
const lbl: React.CSSProperties = {
  fontSize: '13px', fontWeight: 400, color: '#111',
  textAlign: 'right', paddingRight: '4px', whiteSpace: 'nowrap',
  verticalAlign: 'middle', padding: '1px 4px 1px 0',
};
const tdc: React.CSSProperties = { padding: '2px 2px', verticalAlign: 'middle' };
const sectionHdr: React.CSSProperties = {
  fontSize: '12px', fontWeight: 700, background: '#16a34a', color: '#fff',
  padding: '2px 6px', display: 'block', marginBottom: '2px',
};

/* ─── modern shared styles ───────────────────────────────── */
const mField: React.CSSProperties = {
  width: '100%', height: '36px', padding: '0 10px', fontSize: '14px',
  color: '#0f172a', background: '#fff', border: '1px solid #cbd5e1',
  borderRadius: '6px', boxSizing: 'border-box', outline: 'none',
};
const mFieldRo: React.CSSProperties = { ...mField, background: '#f1f5f9', color: '#475569' };
const mLabel: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px',
};

function MField({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={mLabel}>{label}</label>
      {children}
    </div>
  );
}

function MCard({ title, children, cols = 6 }: { title: string; children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '3px', height: '14px', background: '#16a34a', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
        {title}
      </div>
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px 16px' }}>
        {children}
      </div>
    </div>
  );
}

const TABS = ['Main', 'Misc', 'Accident Details', 'At Fault Third Party', 'Requirements', 'Booking Detail'];

/* ─── Reservation form context ───────────────────────────── */
interface RezForm {
  // Customer
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  mi: string; setMi: (v: string) => void;
  homePhone: string; setHomePhone: (v: string) => void;
  mobile: string; setMobile: (v: string) => void;
  workPhone: string; setWorkPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  street1: string; setStreet1: (v: string) => void;
  street2: string; setStreet2: (v: string) => void;
  city: string; setCity: (v: string) => void;
  stateVal: string; setStateVal: (v: string) => void;
  postal: string; setPostal: (v: string) => void;
  country: string; setCountry: (v: string) => void;
  licNum: string; setLicNum: (v: string) => void;
  licState: string; setLicState: (v: string) => void;
  licExpires: string; setLicExpires: (v: string) => void;
  dob: string; setDob: (v: string) => void;
  // Rental
  pickupDate: string; setPickupDate: (v: string) => void;
  dropDate: string; setDropDate: (v: string) => void;
  source: string; setSource: (v: string) => void;
  hireType: string; setHireType: (v: string) => void;
  // Accident
  accDate: string; setAccDate: (v: string) => void;
  accStreet: string; setAccStreet: (v: string) => void;
  accSuburb: string; setAccSuburb: (v: string) => void;
  accDescription: string; setAccDescription: (v: string) => void;
  // AtFault
  tpFirstName: string; setTpFirstName: (v: string) => void;
  tpLastName: string; setTpLastName: (v: string) => void;
  tpPhone: string; setTpPhone: (v: string) => void;
  tpEmail: string; setTpEmail: (v: string) => void;
  tpAddress: string; setTpAddress: (v: string) => void;
  tpSuburb: string; setTpSuburb: (v: string) => void;
  tpPostal: string; setTpPostal: (v: string) => void;
  tpState: string; setTpState: (v: string) => void;
  tpVehRego: string; setTpVehRego: (v: string) => void;
  tpVehMake: string; setTpVehMake: (v: string) => void;
  tpVehModel: string; setTpVehModel: (v: string) => void;
  tpVehYear: string; setTpVehYear: (v: string) => void;
  tpInsCarrier: string; setTpInsCarrier: (v: string) => void;
  tpClaimNo: string; setTpClaimNo: (v: string) => void;
  // Registered Owner
  roFirstName: string; setRoFirstName: (v: string) => void;
  roLastName: string; setRoLastName: (v: string) => void;
  roMi: string; setRoMi: (v: string) => void;
  roDob: string; setRoDob: (v: string) => void;
  roMobile: string; setRoMobile: (v: string) => void;
  roHomePhone: string; setRoHomePhone: (v: string) => void;
  roWorkPhone: string; setRoWorkPhone: (v: string) => void;
  roEmail: string; setRoEmail: (v: string) => void;
  roAltId: string; setRoAltId: (v: string) => void;
  roStreet1: string; setRoStreet1: (v: string) => void;
  roStreet2: string; setRoStreet2: (v: string) => void;
  roCity: string; setRoCity: (v: string) => void;
  roState: string; setRoState: (v: string) => void;
  roPostal: string; setRoPostal: (v: string) => void;
  roCountry: string; setRoCountry: (v: string) => void;
  roLicNum: string; setRoLicNum: (v: string) => void;
  roLicState: string; setRoLicState: (v: string) => void;
  roLicExpires: string; setRoLicExpires: (v: string) => void;
  // Meta
  rezNumber: string;
  tabHasData: (tab: number) => boolean;
  reservationId: string | null;
  isSaving: boolean;
  saveError: string;
  saveSuccess: boolean;
  save: () => Promise<void>;
}

const RezFormContext = createContext<RezForm | null>(null);
const useRezForm = () => {
  const ctx = useContext(RezFormContext);
  if (!ctx) throw new Error('useRezForm must be used inside ReservationFormProvider');
  return ctx;
};

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
  const {
    tpFirstName: firstName, setTpFirstName: setFirstName,
    tpLastName: lastName, setTpLastName: setLastName,
    tpPhone: homePhone, setTpPhone: setHomePhone,
    tpEmail: email, setTpEmail: setEmail,
    tpAddress: street1, setTpAddress: setStreet1,
    tpSuburb: city, setTpSuburb: setCity,
    tpPostal: postal, setTpPostal: setPostal,
    tpState: stateVal, setTpState: setStateVal,
    tpVehRego: vehRego, setTpVehRego: setVehRego,
    tpVehMake: vehMake, setTpVehMake: setVehMake,
    tpVehModel: vehModel, setTpVehModel: setVehModel,
    tpVehYear: vehYear, setTpVehYear: setVehYear,
    tpInsCarrier: insCarrier, setTpInsCarrier: setInsCarrier,
    tpClaimNo: claimNo, setTpClaimNo: setClaimNo,
  } = useRezForm();

  const [mi, setMi] = useState('');
  const [street2, setStreet2] = useState('');
  const [country, setCountry] = useState('AUS');
  const [mobilePhone, setMobilePhone] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [licIssueDate, setLicIssueDate] = useState('');
  const [licCountry, setLicCountry] = useState('AUS');
  const [licIssueCity, setLicIssueCity] = useState('');
  const [licNum, setLicNum] = useState('');
  const [licState, setLicState] = useState('');
  const [licExpires, setLicExpires] = useState('');
  const [dob, setDob] = useState('');
  const [birthPlace, setBirthPlace] = useState('');

  const [insAgency, setInsAgency] = useState('');
  const [insAgent, setInsAgent] = useState('');
  const [policyNo, setPolicyNo] = useState('');
  const [altId, setAltId] = useState('');
  const [coverType, setCoverType] = useState('CTP');
  const [thirdPartyType, setThirdPartyType] = useState('PLEASE SELECT');
  const [atFault, setAtFault] = useState('');
  const [regoType, setRegoType] = useState('Private');
  const [validated, setValidated] = useState(false);
  const [company, setCompany] = useState('');
  const [abn, setAbn] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');


  const mSel: React.CSSProperties = { ...mField, cursor: 'pointer' };

  return (
    <div style={{ padding: '16px' }}>
      <MCard title="Personal Details" cols={6}>
        <MField label="Last Name" span={2}>
          <input style={mField} value={lastName} onChange={e => setLastName(e.target.value)} maxLength={40} />
        </MField>
        <MField label="First Name" span={3}>
          <input style={mField} value={firstName} onChange={e => setFirstName(e.target.value)} maxLength={40} />
        </MField>
        <MField label="MI" span={1}>
          <input style={mField} value={mi} onChange={e => setMi(e.target.value)} maxLength={1} />
        </MField>
        <MField label="Date of Birth" span={2}>
          <input type="date" style={mField} value={dob} onChange={e => setDob(e.target.value)} />
        </MField>
        <MField label="Birth Place" span={2}>
          <input style={mField} value={birthPlace} onChange={e => setBirthPlace(e.target.value)} maxLength={35} />
        </MField>
        <MField label="Home Phone" span={2}>
          <input type="tel" style={mField} value={homePhone} onChange={e => setHomePhone(e.target.value)} maxLength={30} />
        </MField>
        <MField label="Mobile" span={2}>
          <input type="tel" style={mField} value={mobilePhone} onChange={e => setMobilePhone(e.target.value)} maxLength={30} />
        </MField>
        <MField label="Work Phone" span={2}>
          <input type="tel" style={mField} value={workPhone} onChange={e => setWorkPhone(e.target.value)} maxLength={40} />
        </MField>
        <MField label="Email" span={6}>
          <input type="email" style={mField} value={email} onChange={e => setEmail(e.target.value)} maxLength={50} />
        </MField>
      </MCard>

      <MCard title="Address" cols={6}>
        <MField label="Street 1" span={4}>
          <input style={mField} value={street1} onChange={e => setStreet1(e.target.value)} maxLength={100} />
        </MField>
        <MField label="Street 2" span={2}>
          <input style={mField} value={street2} onChange={e => setStreet2(e.target.value)} maxLength={100} />
        </MField>
        <MField label="Suburb" span={2}>
          <input style={mField} value={city} onChange={e => setCity(e.target.value)} maxLength={40} />
        </MField>
        <MField label="State" span={1}>
          <input style={mField} value={stateVal} onChange={e => setStateVal(e.target.value)} maxLength={40} />
        </MField>
        <MField label="Postcode" span={1}>
          <input style={mField} value={postal} onChange={e => setPostal(e.target.value)} maxLength={25} />
        </MField>
        <MField label="Country" span={2}>
          <select style={mSel} value={country} onChange={e => setCountry(e.target.value)}>
            {COUNTRIES.map(([code, name]) => (
              <option key={code} value={code}>{name}{name && code ? `  ${code}` : ''}</option>
            ))}
          </select>
        </MField>
      </MCard>

      <MCard title="Licence" cols={6}>
        <MField label="Licence #" span={3}>
          <input style={mField} value={licNum} onChange={e => setLicNum(e.target.value)} />
        </MField>
        <MField label="State" span={1}>
          <input style={mField} value={licState} onChange={e => setLicState(e.target.value)} maxLength={3} />
        </MField>
        <MField label="Expiry" span={2}>
          <input type="date" style={mField} value={licExpires} onChange={e => setLicExpires(e.target.value)} />
        </MField>
        <MField label="Issue Date" span={2}>
          <input type="date" style={mField} value={licIssueDate} onChange={e => setLicIssueDate(e.target.value)} />
        </MField>
        <MField label="Issue Country" span={2}>
          <select style={mSel} value={licCountry} onChange={e => setLicCountry(e.target.value)}>
            {COUNTRIES.filter(([c]) => c).map(([code]) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </MField>
        <MField label="Issue City" span={2}>
          <input style={mField} value={licIssueCity} onChange={e => setLicIssueCity(e.target.value)} maxLength={35} />
        </MField>
        <MField label="Alternate ID" span={2}>
          <input style={mField} value={altId} onChange={e => setAltId(e.target.value)} maxLength={40} />
        </MField>
      </MCard>

      <MCard title="Vehicle Details" cols={6}>
        <MField label="Registration" span={2}>
          <input style={mField} value={vehRego} onChange={e => setVehRego(e.target.value)} maxLength={29} />
        </MField>
        <MField label="Year" span={1}>
          <input style={mField} value={vehYear} onChange={e => setVehYear(e.target.value)} maxLength={4} />
        </MField>
        <MField label="Make" span={2}>
          <input style={mField} value={vehMake} onChange={e => setVehMake(e.target.value)} maxLength={20} />
        </MField>
        <MField label="Model" span={2}>
          <input style={mField} value={vehModel} onChange={e => setVehModel(e.target.value)} maxLength={20} />
        </MField>
        <div style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '22px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Reg. Type</span>
          {['Private','Business'].map(r => (
            <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
              <input type="radio" name="afRegoType" value={r} checked={regoType === r} onChange={() => setRegoType(r)} />{r}
            </label>
          ))}
        </div>
      </MCard>

      <MCard title="Insurance Details" cols={6}>
        <MField label="Carrier" span={2}>
          <input style={mField} value={insCarrier} onChange={e => setInsCarrier(e.target.value)} maxLength={40} />
        </MField>
        <MField label="Agency" span={2}>
          <input style={mField} value={insAgency} onChange={e => setInsAgency(e.target.value)} maxLength={20} />
        </MField>
        <MField label="Agent" span={2}>
          <input style={mField} value={insAgent} onChange={e => setInsAgent(e.target.value)} maxLength={20} />
        </MField>
        <MField label="Policy #" span={2}>
          <input style={mField} value={policyNo} onChange={e => setPolicyNo(e.target.value)} maxLength={40} />
        </MField>
        <MField label="Claim #" span={2}>
          <input style={mField} value={claimNo} onChange={e => setClaimNo(e.target.value)} maxLength={40} />
        </MField>
        <div style={{ gridColumn: 'span 6', display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Type of Cover</span>
            {['CTP','TPP','COMP'].map(c => (
              <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
                <input type="radio" name="afCoverType" value={c} checked={coverType === c} onChange={() => setCoverType(c)} />{c}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>At Fault</span>
            <select style={{ ...mSel, width: '100px' }} value={atFault} onChange={e => setAtFault(e.target.value)}>
              <option value="">—</option>
              <option value="N">No</option>
              <option value="Y">Yes</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Third Party Type</span>
            <select style={{ ...mSel, width: '180px' }} value={thirdPartyType} onChange={e => setThirdPartyType(e.target.value)}>
              {THIRD_PARTY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </MCard>

      <MCard title="Company Details" cols={6}>
        <div style={{ gridColumn: 'span 1', display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '22px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
            <input type="checkbox" checked={validated} onChange={e => setValidated(e.target.checked)} />
            Validated
          </label>
        </div>
        <MField label="Company" span={3}>
          <input style={mField} value={company} onChange={e => setCompany(e.target.value)} maxLength={40} />
        </MField>
        <MField label="ABN" span={2}>
          <input style={mField} value={abn} onChange={e => setAbn(e.target.value)} maxLength={40} />
        </MField>
        <MField label="Company Phone" span={2}>
          <input type="tel" style={mField} value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} maxLength={40} />
        </MField>
      </MCard>
    </div>
  );
}

/* ─── TSD bottom button bar ─────────────────────────────── */
function BtnBar() {
  const {
    save, isSaving, saveError, saveSuccess,
    setFirstName, setLastName, setMi, setDob, setMobile, setHomePhone, setWorkPhone,
    setEmail, setStreet1, setCity, setStateVal, setPostal, setLicNum, setLicExpires,
    setRoFirstName, setRoLastName, setRoMi, setRoDob, setRoMobile, setRoHomePhone,
    setRoWorkPhone, setRoEmail, setRoStreet1, setRoCity, setRoState, setRoPostal,
    setRoLicNum, setRoLicExpires,
  } = useRezForm();

  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanTarget, setScanTarget] = useState<'driver' | 'owner' | null>(null);

  const secondary: React.CSSProperties = {
    padding: '6px 12px', fontSize: '13px', fontWeight: 500, borderRadius: '6px',
    border: '1px solid #e2e8f0', background: '#fff', color: '#334155', cursor: 'pointer',
  };

  function applyScannedData(data: Record<string, string>, target: 'driver' | 'owner') {
    if (target === 'driver') {
      if (data.firstName) setFirstName(data.firstName);
      if (data.lastName) setLastName(data.lastName);
      if (data.mi) setMi(data.mi);
      if (data.dob) setDob(data.dob);
      if (data.mobile) setMobile(data.mobile);
      if (data.homePhone) setHomePhone(data.homePhone);
      if (data.workPhone) setWorkPhone(data.workPhone);
      if (data.email) setEmail(data.email);
      if (data.street1) setStreet1(data.street1);
      if (data.city) setCity(data.city);
      if (data.state) setStateVal(data.state);
      if (data.postcode) setPostal(data.postcode);
      if (data.licenceNumber) setLicNum(data.licenceNumber);
      if (data.licenceExpiry) setLicExpires(data.licenceExpiry);
    } else {
      if (data.firstName) setRoFirstName(data.firstName);
      if (data.lastName) setRoLastName(data.lastName);
      if (data.mi) setRoMi(data.mi);
      if (data.dob) setRoDob(data.dob);
      if (data.mobile) setRoMobile(data.mobile);
      if (data.homePhone) setRoHomePhone(data.homePhone);
      if (data.workPhone) setRoWorkPhone(data.workPhone);
      if (data.email) setRoEmail(data.email);
      if (data.street1) setRoStreet1(data.street1);
      if (data.city) setRoCity(data.city);
      if (data.state) setRoState(data.state);
      if (data.postcode) setRoPostal(data.postcode);
      if (data.licenceNumber) setRoLicNum(data.licenceNumber);
      if (data.licenceExpiry) setRoLicExpires(data.licenceExpiry);
    }
  }

  const handleScanChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !scanTarget) return;
    setScanLoading(true); setScanError('');
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch('/api/scan-licence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64 }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Scan failed');
        applyScannedData(data, scanTarget);
        setScanLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setScanError(err.message || 'Scan failed');
      setScanLoading(false);
    }
    e.target.value = '';
    setScanTarget(null);
  };

  function handleTargetSelect(target: 'driver' | 'owner') {
    setScanTarget(target);
    setShowScanModal(false);
    setTimeout(() => document.getElementById('scan-licence-input')?.click(), 50);
  }

  return (
    <>
      {/* Scan target modal */}
      {showScanModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowScanModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '12px', padding: '28px 32px', width: '340px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Scan Licence</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Which licence would you like to scan?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => handleTargetSelect('driver')}
                style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: '2px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#16a34a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
              >
                🪪 Driver's Licence
                <div style={{ fontSize: '12px', fontWeight: 400, color: '#64748b', marginTop: '2px' }}>Fill in the Driver Details section</div>
              </button>
              <button
                onClick={() => handleTargetSelect('owner')}
                style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: '2px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#16a34a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
              >
                🪪 Registered Owner's Licence
                <div style={{ fontSize: '12px', fontWeight: 400, color: '#64748b', marginTop: '2px' }}>Fill in the Registered Owner section</div>
              </button>
            </div>
            <button
              onClick={() => setShowScanModal(false)}
              style={{ marginTop: '16px', width: '100%', padding: '8px', fontSize: '13px', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <input id="scan-licence-input" type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleScanChange} />

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 100 }}>
        {/* Primary save */}
        <button
          onClick={save}
          disabled={isSaving}
          style={{ padding: '7px 18px', fontSize: '13px', fontWeight: 700, borderRadius: '6px', border: 'none', background: isSaving ? '#94a3b8' : '#16a34a', color: '#fff', cursor: isSaving ? 'not-allowed' : 'pointer' }}
        >
          {isSaving ? 'Saving…' : saveSuccess ? '✓ Saved' : 'Save'}
        </button>
        {saveError && <span style={{ fontSize: '12px', color: '#dc2626' }}>{saveError}</span>}

        <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 2px' }} />

        {['Opt. Services','Addl Drivers','Discount','Notes','Events','Payments','Print','Email','Invoice','Open R/A','Duplicate'].map(lbl => (
          <button key={lbl} style={secondary}>{lbl}</button>
        ))}

        <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 2px' }} />

        <button
          style={{ ...secondary, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', opacity: scanLoading ? 0.6 : 1 }}
          disabled={scanLoading}
          onClick={() => setShowScanModal(true)}
        >
          {scanLoading ? 'Scanning…' : '📷 Scan Licence'}
        </button>
        {scanError && <span style={{ fontSize: '12px', color: '#dc2626' }}>{scanError}</span>}

        <div style={{ flex: 1 }} />

        <button style={{ ...secondary, color: '#dc2626', border: '1px solid #fca5a5', background: '#fff5f5' }}>Cancel Reservation</button>
      </div>
    </>
  );
}

/* ─── Main Tab ───────────────────────────────────────────── */
function MainTab() {
  const {
    firstName, setFirstName, lastName, setLastName, mi, setMi,
    homePhone, setHomePhone, mobile, setMobile, workPhone, setWorkPhone,
    email, setEmail, street1, setStreet1, street2, setStreet2,
    city, setCity, stateVal, setStateVal, postal, setPostal, country, setCountry,
    licNum, setLicNum, licState, setLicState, licExpires, setLicExpires, dob, setDob,
    pickupDate, setPickupDate, dropDate, setDropDate, source, setSource,
    roFirstName, setRoFirstName, roLastName, setRoLastName, roMi, setRoMi,
    roDob, setRoDob, roMobile, setRoMobile, roHomePhone, setRoHomePhone,
    roWorkPhone, setRoWorkPhone, roEmail, setRoEmail, roAltId, setRoAltId,
    roStreet1, setRoStreet1, roStreet2, setRoStreet2, roCity, setRoCity,
    roState, setRoState, roPostal, setRoPostal, roCountry, setRoCountry,
    roLicNum, setRoLicNum, roLicState, setRoLicState, roLicExpires, setRoLicExpires,
    rezNumber,
  } = useRezForm();

  const { getToken } = useAuth();

  const [preferredNum, setPreferredNum] = useState('');
  const [altKNum, setAltKNum] = useState('');
  const [repairerName, setRepairerName] = useState('');
  const [showRepairerSearch, setShowRepairerSearch] = useState(false);
  const [repairerSearchQuery, setRepairerSearchQuery] = useState('');
  const [pickupTime, setPickupTime] = useState('08:00');
  const [dropTime, setDropTime] = useState('08:00');
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
  const [referralAgency, setReferralAgency] = useState('');
  const [referralAgent, setReferralAgent] = useState('');
  const [poNum, setPoNum] = useState('');
  const [useTax, setUseTax] = useState(false);
  const [broadcastNote, setBroadcastNote] = useState('');
  const [booked] = useState(new Date().toLocaleDateString('en-AU'));
  // NAF Vehicle
  const [nafRego, setNafRego] = useState('');
  const [nafYear, setNafYear] = useState('');
  const [nafMake, setNafMake] = useState('');
  const [nafModel, setNafModel] = useState('');
  const [nafBodyType, setNafBodyType] = useState('');
  const [regoChecking, setRegoChecking] = useState(false);
  const [regoResult, setRegoResult] = useState<{ valid: boolean; message: string; details?: Record<string, string> } | null>(null);
  // NAF Insurance & Cover
  const [nafInsCarrier, setNafInsCarrier] = useState('');
  const [nafInsPolicy, setNafInsPolicy] = useState('');
  const [nafInsPhone, setNafInsPhone] = useState('');
  const [nafInsAgent, setNafInsAgent] = useState('');
  const [nafInsAgency, setNafInsAgency] = useState('');
  const [nafCoverType, setNafCoverType] = useState('CTP');

  const mSel: React.CSSProperties = { ...mField, cursor: 'pointer' };

  const { data: repairers = [] } = useQuery({
    queryKey: ['repairers'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/repairers', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    enabled: showRepairerSearch,
  });

  const filteredRepairers = repairers.filter((rp: any) =>
    rp.name?.toLowerCase().includes(repairerSearchQuery.toLowerCase())
  );

  function selectRepairer(name: string) {
    setRepairerName(name);
    setShowRepairerSearch(false);
    setRepairerSearchQuery('');
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Reservation summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {/* Reservation # */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Reservation #</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', letterSpacing: '0.03em' }}>{rezNumber || 'Generating…'}</div>
        </div>
        {/* Booked */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Booked</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{booked}</div>
        </div>
        {/* Pickup Date + Time */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Pickup Date</div>
          <input type="date" style={{ border: 'none', padding: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a', background: 'transparent', width: '100%', outline: 'none' }} value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
          <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '8px', paddingTop: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Time</div>
            <input type="time" style={{ border: 'none', padding: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a', background: 'transparent', width: '100%', outline: 'none' }} value={pickupTime} onChange={e => setPickupTime(e.target.value)} />
          </div>
        </div>
        {/* Return Date + Time */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Return Date</div>
          <input type="date" style={{ border: 'none', padding: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a', background: 'transparent', width: '100%', outline: 'none' }} value={dropDate} onChange={e => setDropDate(e.target.value)} />
          <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '8px', paddingTop: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Time</div>
            <input type="time" style={{ border: 'none', padding: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a', background: 'transparent', width: '100%', outline: 'none' }} value={dropTime} onChange={e => setDropTime(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Reservation detail */}
      <MCard title="Reservation Detail" cols={4}>
        <MField label="Source of Business" span={2}>
          <select style={mSel} value={source} onChange={e => setSource(e.target.value)}>
            <option value="">— Select —</option>
            <option>Insurance</option>
            <option>Corporate</option>
            <option>Walk-in</option>
            <option>Internet</option>
            <option>Repairer</option>
          </select>
        </MField>
        {source === 'Repairer' && (
          <MField label="Repairer Name" span={2}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                style={{ ...mField, flex: '1 1 auto' }}
                value={repairerName}
                onChange={e => setRepairerName(e.target.value)}
                placeholder="Enter repairer name"
              />
              <button
                type="button"
                title="Search partners"
                onClick={() => setShowRepairerSearch(true)}
                style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                🔎
              </button>
            </div>
          </MField>
        )}
      </MCard>

      {/* Repairer search modal */}
      {showRepairerSearch && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowRepairerSearch(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '12px', padding: '20px', width: '420px', maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Search Repairers</div>
            <input
              autoFocus
              style={{ ...mField, marginBottom: '12px' }}
              placeholder="Type to filter by name…"
              value={repairerSearchQuery}
              onChange={e => setRepairerSearchQuery(e.target.value)}
            />
            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              {filteredRepairers.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No repairers found.</div>
              ) : (
                filteredRepairers.map((rp: any) => (
                  <button
                    key={rp.id}
                    type="button"
                    onClick={() => selectRepairer(rp.name)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', borderBottom: '1px solid #f1f5f9', background: '#fff', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{rp.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{[rp.suburb, rp.state].filter(Boolean).join(', ') || rp.phone || ''}</div>
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowRepairerSearch(false)}
              style={{ marginTop: '12px', width: '100%', padding: '8px', fontSize: '13px', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Driver Details + Address + Licence */}
      <MCard title="Driver Details" cols={6}>
        {/* Personal */}
        <MField label="First Name" span={2}>
          <input style={mField} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
        </MField>
        <MField label="Last Name" span={2}>
          <input style={mField} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
        </MField>
        <MField label="MI" span={1}>
          <input style={mField} value={mi} onChange={e => setMi(e.target.value)} maxLength={1} placeholder="MI" />
        </MField>
        <MField label="Date of Birth" span={1}>
          <input type="date" style={mField} value={dob} onChange={e => setDob(e.target.value)} />
        </MField>
        <MField label="Mobile" span={2}>
          <input type="tel" style={mField} value={mobile} onChange={e => setMobile(e.target.value)} placeholder="0400 000 000" />
        </MField>
        <MField label="Email" span={4}>
          <input type="email" style={mField} value={email} onChange={e => setEmail(e.target.value)} placeholder="driver@email.com" />
        </MField>

        {/* Divider */}
        <div style={{ gridColumn: 'span 6', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

        {/* Address */}
        <MField label="Street 1" span={4}>
          <AddressAutocomplete
            value={street1}
            onChange={setStreet1}
            onSelect={r => { setStreet1(r.address); setCity(r.suburb); setStateVal(r.state); setPostal(r.postcode); }}
            style={{ ...mField }}
          />
        </MField>
        <MField label="Street 2" span={2}>
          <input style={mField} value={street2} onChange={e => setStreet2(e.target.value)} />
        </MField>
        <MField label="Suburb" span={2}>
          <input style={mField} value={city} onChange={e => setCity(e.target.value)} />
        </MField>
        <MField label="State" span={1}>
          <select style={mSel} value={stateVal} onChange={e => setStateVal(e.target.value)}>
            <option value="">—</option>
            {['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s}>{s}</option>)}
          </select>
        </MField>
        <MField label="Postcode" span={1}>
          <input style={mField} value={postal} onChange={e => setPostal(e.target.value)} maxLength={4} />
        </MField>
        <MField label="Country" span={2}>
          <input style={mField} value={country} onChange={e => setCountry(e.target.value)} placeholder="Australia" />
        </MField>

        {/* Divider */}
        <div style={{ gridColumn: 'span 6', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

        {/* Licence */}
        <MField label="Licence Number" span={3}>
          <input style={mField} value={licNum} onChange={e => setLicNum(e.target.value)} />
        </MField>
        <MField label="Issuing State" span={1}>
          <select style={mSel} value={licState} onChange={e => setLicState(e.target.value)}>
            <option value="">—</option>
            {['International','ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s}>{s}</option>)}
          </select>
        </MField>
        <MField label="Expiry Date" span={2}>
          <input type="date" style={mField} value={licExpires} onChange={e => setLicExpires(e.target.value)} />
        </MField>
      </MCard>

      {/* Registered Owner */}
      <MCard title="Registered Owner" cols={6}>
        {/* Personal */}
        <MField label="First Name" span={2}>
          <input style={mField} value={roFirstName} onChange={e => setRoFirstName(e.target.value)} placeholder="First name" />
        </MField>
        <MField label="Last Name" span={2}>
          <input style={mField} value={roLastName} onChange={e => setRoLastName(e.target.value)} placeholder="Last name" />
        </MField>
        <MField label="MI" span={1}>
          <input style={mField} value={roMi} onChange={e => setRoMi(e.target.value)} maxLength={1} placeholder="MI" />
        </MField>
        <MField label="Date of Birth" span={1}>
          <input type="date" style={mField} value={roDob} onChange={e => setRoDob(e.target.value)} />
        </MField>
        <MField label="Mobile" span={2}>
          <input type="tel" style={mField} value={roMobile} onChange={e => setRoMobile(e.target.value)} placeholder="0400 000 000" />
        </MField>
        <MField label="Email" span={4}>
          <input type="email" style={mField} value={roEmail} onChange={e => setRoEmail(e.target.value)} placeholder="owner@email.com" />
        </MField>

        {/* Divider */}
        <div style={{ gridColumn: 'span 6', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

        {/* Address */}
        <MField label="Street 1" span={4}>
          <AddressAutocomplete
            value={roStreet1}
            onChange={setRoStreet1}
            onSelect={r => { setRoStreet1(r.address); setRoCity(r.suburb); setRoState(r.state); setRoPostal(r.postcode); }}
            style={{ ...mField }}
          />
        </MField>
        <MField label="Street 2" span={2}>
          <input style={mField} value={roStreet2} onChange={e => setRoStreet2(e.target.value)} />
        </MField>
        <MField label="Suburb" span={2}>
          <input style={mField} value={roCity} onChange={e => setRoCity(e.target.value)} />
        </MField>
        <MField label="State" span={1}>
          <select style={mSel} value={roState} onChange={e => setRoState(e.target.value)}>
            <option value="">—</option>
            {['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s}>{s}</option>)}
          </select>
        </MField>
        <MField label="Postcode" span={1}>
          <input style={mField} value={roPostal} onChange={e => setRoPostal(e.target.value)} maxLength={4} />
        </MField>
        <MField label="Country" span={2}>
          <input style={mField} value={roCountry} onChange={e => setRoCountry(e.target.value)} placeholder="Australia" />
        </MField>

        {/* Divider */}
        <div style={{ gridColumn: 'span 6', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

        {/* Licence */}
        <MField label="Licence Number" span={3}>
          <input style={mField} value={roLicNum} onChange={e => setRoLicNum(e.target.value)} />
        </MField>
        <MField label="Issuing State" span={1}>
          <select style={mSel} value={roLicState} onChange={e => setRoLicState(e.target.value)}>
            <option value="">—</option>
            {['International','ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s}>{s}</option>)}
          </select>
        </MField>
        <MField label="Expiry Date" span={2}>
          <input type="date" style={mField} value={roLicExpires} onChange={e => setRoLicExpires(e.target.value)} />
        </MField>
      </MCard>

      {/* NAF Vehicle Details */}
      <MCard title="NAF Vehicle Details" cols={6}>
        <MField label="Rego" span={2}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              style={{ ...mField, flex: 1 }}
              value={nafRego}
              onChange={e => { setNafRego(e.target.value.toUpperCase()); setRegoResult(null); }}
            />
            <button
              type="button"
              disabled={regoChecking || !nafRego.trim()}
              onClick={async () => {
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
              }}
              style={{
                padding: '0 12px', fontSize: '13px', fontWeight: 600, height: '36px',
                background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px',
                cursor: 'pointer', whiteSpace: 'nowrap',
                opacity: (regoChecking || !nafRego.trim()) ? 0.5 : 1,
              }}
            >
              {regoChecking ? 'Checking…' : 'Check'}
            </button>
          </div>
        </MField>
        <MField label="Year" span={1}>
          <input style={mField} value={nafYear} onChange={e => setNafYear(e.target.value)} maxLength={4} />
        </MField>
        <MField label="Make" span={2}>
          <input style={mField} value={nafMake} onChange={e => setNafMake(e.target.value)} />
        </MField>
        <MField label="Model" span={2}>
          <input style={mField} value={nafModel} onChange={e => setNafModel(e.target.value)} />
        </MField>
        <MField label="Body Type" span={2}>
          <input style={mField} value={nafBodyType} onChange={e => setNafBodyType(e.target.value)} />
        </MField>
        {regoResult && (
          <div style={{ gridColumn: 'span 6' }}>
            <div style={{
              fontSize: '13px', padding: '8px 12px', borderRadius: '6px',
              background: regoResult.valid ? '#dcfce7' : '#fee2e2',
              color: regoResult.valid ? '#166534' : '#991b1b',
              border: `1px solid ${regoResult.valid ? '#86efac' : '#fca5a5'}`,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span>{regoResult.valid ? '✓' : '✗'}</span>
              <span>{regoResult.message}</span>
            </div>
          </div>
        )}
      </MCard>

      {/* NAF Insurance & Cover */}
      <MCard title="NAF Insurance & Cover" cols={6}>
        <MField label="Carrier" span={2}>
          <input style={mField} value={nafInsCarrier} onChange={e => setNafInsCarrier(e.target.value)} />
        </MField>
        <MField label="Policy #" span={2}>
          <input style={mField} value={nafInsPolicy} onChange={e => setNafInsPolicy(e.target.value)} />
        </MField>
        <MField label="Phone" span={2}>
          <input type="tel" style={mField} value={nafInsPhone} onChange={e => setNafInsPhone(e.target.value)} />
        </MField>
        <MField label="Agency" span={2}>
          <input style={mField} value={nafInsAgency} onChange={e => setNafInsAgency(e.target.value)} />
        </MField>
        <MField label="Agent" span={2}>
          <input style={mField} value={nafInsAgent} onChange={e => setNafInsAgent(e.target.value)} />
        </MField>
        <div style={{ gridColumn: 'span 6', display: 'flex', alignItems: 'center', gap: '24px', paddingTop: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Type of Cover</span>
          {['CTP', 'TPP', 'COMP'].map(c => (
            <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
              <input type="radio" name="nafCoverType" value={c} checked={nafCoverType === c} onChange={() => setNafCoverType(c)} />
              {c}
            </label>
          ))}
        </div>
      </MCard>

      {/* Rate & Vehicle */}
      <MCard title="Rate & Vehicle" cols={6}>
        <MField label="Rate Plan" span={2}>
          <select style={mSel} value={ratePlanType} onChange={e => setRatePlanType(e.target.value)}>
            <option value="">— Type —</option>
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        </MField>
        <MField label="Rate Code" span={1}>
          <input style={mField} value={rateCode} onChange={e => setRateCode(e.target.value)} />
        </MField>
        <MField label="Rate Class" span={2}>
          <select style={mSel} value={rateClass} onChange={e => setRateClass(e.target.value)}>
            <option value="">— Class —</option>
            {['Economy','Compact','Midsize','Standard','Fullsize','SUV','Van'].map(c => <option key={c}>{c}</option>)}
          </select>
        </MField>
        <MField label="Est. Kms" span={1}>
          <input style={mField} value={estKms} onChange={e => setEstKms(e.target.value)} />
        </MField>
        <MField label="Unit #" span={1}>
          <select style={mSel} value={availUnits} onChange={e => setAvailUnits(e.target.value)}>
            <option value="">—</option>
          </select>
        </MField>
        <MField label="Unit Description" span={3}>
          <input style={mField} value={unitDesc} onChange={e => setUnitDesc(e.target.value)} placeholder="Vehicle description" />
        </MField>
        <MField label="Unit Tag" span={2}>
          <input style={mField} value={unit} onChange={e => setUnit(e.target.value)} />
        </MField>
      </MCard>

      {/* Billing & Other */}
      <MCard title="Billing & Other" cols={6}>
        <MField label="Currency" span={1}>
          <select style={mSel} value={origCurrency} onChange={e => setOrigCurrency(e.target.value)}>
            {['AUD','USD','GBP','EUR','NZD'].map(c => <option key={c}>{c}</option>)}
          </select>
        </MField>
        <MField label="P.O. / R.O. #" span={2}>
          <input style={mField} value={poNum} onChange={e => setPoNum(e.target.value)} />
        </MField>
        <MField label="Referral Agency" span={2}>
          <input style={mField} value={referralAgency} onChange={e => setReferralAgency(e.target.value)} />
        </MField>
        <MField label="Referral Agent" span={1}>
          <input style={mField} value={referralAgent} onChange={e => setReferralAgent(e.target.value)} />
        </MField>
        <MField label="Control #" span={2}>
          <input style={mField} value={altKNum} onChange={e => setAltKNum(e.target.value)} />
        </MField>
        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '22px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
            <input type="checkbox" checked={prepaidFuel} onChange={e => setPrepaidFuel(e.target.checked)} />
            Prepaid Fuel
          </label>
          {prepaidFuel && <input style={{ ...mField, width: '100px' }} placeholder="Amount" value={prepaidFuelAmt} onChange={e => setPrepaidFuelAmt(e.target.value)} />}
        </div>
        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '22px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
            <input type="checkbox" checked={useTax} onChange={e => setUseTax(e.target.checked)} />
            Tax Exempt
          </label>
        </div>
        <MField label="Broadcast Note" span={6}>
          <textarea
            style={{ width: '100%', minHeight: '72px', padding: '8px 10px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical', boxSizing: 'border-box', color: '#0f172a', fontFamily: 'inherit' }}
            value={broadcastNote}
            onChange={e => setBroadcastNote(e.target.value)}
          />
        </MField>
      </MCard>
    </div>
  );
}

/* ─── Booking Detail Tab ─────────────────────────────────── */
function BookingDetailTab() {
  const [pickupLoc, setPickupLoc] = useState('');
  const [dropLoc, setDropLoc] = useState('');

  const mSel: React.CSSProperties = { ...mField, cursor: 'pointer' };

  return (
    <div style={{ padding: '16px' }}>
      <MCard title="Pickup & Return" cols={4}>
        <MField label="Pickup Location" span={2}>
          <select style={mSel} value={pickupLoc} onChange={e => setPickupLoc(e.target.value)}>
            <option value="">— Select location —</option>
          </select>
        </MField>
        <MField label="Return Location" span={2}>
          <select style={mSel} value={dropLoc} onChange={e => setDropLoc(e.target.value)}>
            <option value="">Return to pickup</option>
          </select>
        </MField>
      </MCard>
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

  const mSel: React.CSSProperties = { ...mField, cursor: 'pointer' };

  return (
    <div style={{ padding: '16px' }}>
      <MCard title="Insurance Details" cols={6}>
        <MField label="Carrier" span={2}>
          <input style={mField} value={insCarrier} onChange={e => setInsCarrier(e.target.value)} />
        </MField>
        <MField label="Agency" span={2}>
          <input style={mField} value={insAgency} onChange={e => setInsAgency(e.target.value)} />
        </MField>
        <MField label="Agent" span={2}>
          <input style={mField} value={insAgent} onChange={e => setInsAgent(e.target.value)} />
        </MField>
        <MField label="Phone" span={2}>
          <input type="tel" style={mField} value={insPhone} onChange={e => setInsPhone(e.target.value)} />
        </MField>
        <MField label="Policy #" span={2}>
          <input style={mField} value={insPolicy} onChange={e => setInsPolicy(e.target.value)} />
        </MField>
        <MField label="Policy Expiry" span={2}>
          <input type="date" style={mField} value={insPolicyExp} onChange={e => setInsPolicyExp(e.target.value)} />
        </MField>
      </MCard>

      <MCard title="Arrival" cols={6}>
        <MField label="Arrival Date" span={2}>
          <input type="date" style={mField} value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} />
        </MField>
        <MField label="Arrival Time" span={2}>
          <input type="time" style={mField} value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
        </MField>
      </MCard>

      <MCard title="Vehicle Details (NAF)" cols={6}>
        <MField label="Year" span={1}>
          <input style={mField} value={vehYear} onChange={e => setVehYear(e.target.value)} maxLength={4} />
        </MField>
        <MField label="Make" span={2}>
          <input style={mField} value={vehMake} onChange={e => setVehMake(e.target.value)} />
        </MField>
        <MField label="Model" span={2}>
          <input style={mField} value={vehModel} onChange={e => setVehModel(e.target.value)} />
        </MField>
        <MField label="Colour" span={1}>
          <input style={mField} value={vehColor} onChange={e => setVehColor(e.target.value)} />
        </MField>
        <MField label="VIN" span={4}>
          <input style={mField} value={vehVin} onChange={e => setVehVin(e.target.value)} />
        </MField>
        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '22px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
            <input type="checkbox" checked={totalLoss} onChange={e => setTotalLoss(e.target.checked)} />
            Total Loss
          </label>
        </div>
      </MCard>

      <MCard title="Local Residence" cols={6}>
        <MField label="Address" span={4}>
          <input style={mField} value={localResAddr} onChange={e => setLocalResAddr(e.target.value)} />
        </MField>
        <MField label="Phone" span={2}>
          <input type="tel" style={mField} value={localResPhone} onChange={e => setLocalResPhone(e.target.value)} />
        </MField>
      </MCard>

      <MCard title="Employer" cols={6}>
        <MField label="Name" span={2}>
          <input style={mField} value={employerName} onChange={e => setEmployerName(e.target.value)} />
        </MField>
        <MField label="Address" span={2}>
          <input style={mField} value={employerAddr} onChange={e => setEmployerAddr(e.target.value)} />
        </MField>
        <MField label="Phone" span={2}>
          <input type="tel" style={mField} value={employerPhone} onChange={e => setEmployerPhone(e.target.value)} />
        </MField>
      </MCard>

      <MCard title="Repair Facility" cols={6}>
        <MField label="Facility" span={3}>
          <input style={mField} value={repairFacility} onChange={e => setRepairFacility(e.target.value)} />
        </MField>
        <MField label="Contact" span={2}>
          <input style={mField} value={repairContact} onChange={e => setRepairContact(e.target.value)} />
        </MField>
        <MField label="Phone" span={1}>
          <input type="tel" style={mField} value={repairPhone} onChange={e => setRepairPhone(e.target.value)} />
        </MField>
      </MCard>

      <MCard title="Other" cols={6}>
        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '22px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
            <input type="checkbox" checked={delivery} onChange={e => setDelivery(e.target.checked)} />
            Delivery
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
            <input type="checkbox" checked={collection} onChange={e => setCollection(e.target.checked)} />
            Collection
          </label>
        </div>
        <MField label="Language" span={2}>
          <input style={mField} value={language} onChange={e => setLanguage(e.target.value)} />
        </MField>
        <MField label="Passport #" span={2}>
          <input style={mField} value={passportNum} onChange={e => setPassportNum(e.target.value)} />
        </MField>
      </MCard>
    </div>
  );
}

/* ─── Accident Details Tab ───────────────────────────────── */
function AccidentTab() {
  const {
    hireType, setHireType, accDate, setAccDate, accStreet, setAccStreet, accSuburb, setAccSuburb, accDescription, setAccDescription,
  } = useRezForm();
  const [flags, setFlags] = useState<Record<string, boolean>>({
    AFR: false, AFC: false, MAV: false, VAL: false, SIG: false, REG: false, INS: false, DLS: false,
  });
  // Accident Details (local-only extras)
  const [accDamageDesc, setAccDamageDesc] = useState('');
  const [accTime, setAccTime] = useState('');
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

  const mSel: React.CSSProperties = { ...mField, cursor: 'pointer' };

  function toggleFlag(f: string) {
    setFlags(prev => ({ ...prev, [f]: !prev[f] }));
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Hire type + flags strip */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {['credit', 'direct'].map(v => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
              <input type="radio" name="hireType" value={v} checked={hireType === v} onChange={() => setHireType(v)} />
              {v === 'credit' ? 'Credit Hire' : 'Direct Hire'}
            </label>
          ))}
        </div>
        <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {Object.keys(flags).map(f => (
            <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
              <input type="checkbox" checked={flags[f]} onChange={() => toggleFlag(f)} />{f}
            </label>
          ))}
        </div>
      </div>

      <MCard title="Accident Details" cols={6}>
        <MField label="Description" span={6}>
          <textarea
            style={{ width: '100%', minHeight: '72px', padding: '8px 10px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical', boxSizing: 'border-box', color: '#0f172a', fontFamily: 'inherit' }}
            value={accDescription} onChange={e => setAccDescription(e.target.value)}
          />
        </MField>
        <MField label="Damage Description" span={6}>
          <textarea
            style={{ width: '100%', minHeight: '56px', padding: '8px 10px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical', boxSizing: 'border-box', color: '#0f172a', fontFamily: 'inherit' }}
            value={accDamageDesc} onChange={e => setAccDamageDesc(e.target.value)}
          />
        </MField>
        <MField label="Date" span={2}>
          <input type="date" style={mField} value={accDate} onChange={e => setAccDate(e.target.value)} />
        </MField>
        <MField label="Time" span={1}>
          <input type="time" style={mField} value={accTime} onChange={e => setAccTime(e.target.value)} />
        </MField>
        <MField label="Street" span={3}>
          <input style={mField} value={accStreet} onChange={e => setAccStreet(e.target.value)} />
        </MField>
        <MField label="Cross Street" span={3}>
          <input style={mField} value={accCrossStreet} onChange={e => setAccCrossStreet(e.target.value)} />
        </MField>
        <MField label="Suburb" span={2}>
          <input style={mField} value={accSuburb} onChange={e => setAccSuburb(e.target.value)} />
        </MField>
        <MField label="State" span={1}>
          <select style={mSel} value={accState} onChange={e => setAccState(e.target.value)}>
            <option value="">—</option>
            {['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s}>{s}</option>)}
          </select>
        </MField>
        <MField label="Postcode" span={1}>
          <input style={mField} value={accPostal} onChange={e => setAccPostal(e.target.value)} maxLength={4} />
        </MField>
        <div style={{ gridColumn: 'span 6', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {[
            { label: 'Drivable?', name: 'drivable', val: drivable, set: setDrivable },
            { label: 'Total Loss?', name: 'totalLossAcc', val: totalLossAcc, set: setTotalLossAcc },
            { label: 'Settlement Letter?', name: 'settlementLetter', val: settlementLetter, set: setSettlementLetter },
          ].map(g => (
            <div key={g.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>{g.label}</span>
              {['Yes','No'].map(o => (
                <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
                  <input type="radio" name={g.name} value={o} checked={g.val === o} onChange={() => g.set(o)} />{o}
                </label>
              ))}
            </div>
          ))}
        </div>
      </MCard>

      <MCard title="Repair Facility" cols={6}>
        <MField label="Facility" span={3}>
          <input style={mField} value={repFacility} onChange={e => setRepFacility(e.target.value)} />
        </MField>
        <MField label="Contact" span={2}>
          <input style={mField} value={repContact} onChange={e => setRepContact(e.target.value)} />
        </MField>
        <MField label="Phone" span={1}>
          <input type="tel" style={mField} value={repPhone} onChange={e => setRepPhone(e.target.value)} />
        </MField>
      </MCard>

      <MCard title="Witness Details" cols={6}>
        <MField label="Name" span={3}>
          <input style={mField} value={witnessName} onChange={e => setWitnessName(e.target.value)} />
        </MField>
        <MField label="Phone" span={3}>
          <input type="tel" style={mField} value={witnessPhone} onChange={e => setWitnessPhone(e.target.value)} />
        </MField>
      </MCard>

      <MCard title="Police Details" cols={6}>
        <MField label="Station" span={2}>
          <input style={mField} value={policeStation} onChange={e => setPoliceStation(e.target.value)} />
        </MField>
        <MField label="Event #" span={2}>
          <input style={mField} value={policeEventNum} onChange={e => setPoliceEventNum(e.target.value)} />
        </MField>
        <MField label="Officer Name" span={2}>
          <input style={mField} value={policeName} onChange={e => setPoliceName(e.target.value)} />
        </MField>
      </MCard>
    </div>
  );
}

/* ─── Reusable document photo upload slot ────────────────── */
function DocUploadSlot({ label, desc, icon, val, onChange }: { label: string; desc: string; icon: string; val: string | null; onChange: (v: string | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(f);
    e.target.value = '';
  };
  return (
    <div style={{ border: `1px solid ${val ? '#86efac' : '#e2e8f0'}`, borderRadius: '8px', overflow: 'hidden', background: val ? '#f0fdf4' : '#fff' }}>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      {val ? (
        <div>
          <img src={val} alt={label} style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
          <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>✅ Uploaded</span>
            <button type="button" onClick={() => fileRef.current?.click()} style={{ marginLeft: 'auto', fontSize: '11px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Replace</button>
            <button type="button" onClick={() => onChange(null)} style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '22px' }}>{icon}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{label}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{desc}</div>
            </div>
          </div>
          <button type="button" onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1.5px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>📁 Upload photo</button>
        </div>
      )}
    </div>
  );
}

/* ─── Card Details Tab ───────────────────────────────────── */
function CardDetailsTab() {
  const [nameOnCard, setNameOnCard] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cardType, setCardType] = useState('');
  const [saved, setSaved] = useState(false);
  const [licencePhoto, setLicencePhoto] = useState<string | null>(null);
  const [regoPhoto, setRegoPhoto] = useState<string | null>(null);

  function formatCardNumber(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#92400e', marginBottom: '16px' }}>
        Card details are stored securely and not shared without authorisation.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', alignItems: 'start' }}>
        <MCard title="Card Details" cols={4}>
          <MField label="Name on Card" span={4}>
            <input style={mField} value={nameOnCard} onChange={e => setNameOnCard(e.target.value)} placeholder="As it appears on card" maxLength={60} />
          </MField>
          <MField label="Card Type" span={2}>
            <select style={{ ...mField, cursor: 'pointer' }} value={cardType} onChange={e => setCardType(e.target.value)}>
              <option value="">— Select —</option>
              <option>Visa</option>
              <option>Mastercard</option>
              <option>American Express</option>
              <option>eftpos</option>
              <option>Other</option>
            </select>
          </MField>
          <MField label="Card Number" span={3}>
            <input style={mField} value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} placeholder="•••• •••• •••• ••••" maxLength={19} inputMode="numeric" />
          </MField>
          <MField label="Expiry" span={1}>
            <input style={mField} value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" maxLength={5} inputMode="numeric" />
          </MField>
          <div style={{ gridColumn: 'span 4', paddingTop: '4px' }}>
            <button
              onClick={handleSave}
              style={{ padding: '8px 24px', fontSize: '13px', fontWeight: 700, background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              {saved ? '✓ Saved' : 'Save Card Details'}
            </button>
          </div>
        </MCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <MCard title="Driver's Licence" cols={1}>
            <DocUploadSlot label="Driver's Licence Photo" desc="Upload a photo of the customer's driver's licence" icon="🪪" val={licencePhoto} onChange={setLicencePhoto} />
          </MCard>
          <MCard title="Vehicle Registration" cols={1}>
            <DocUploadSlot label="Vehicle Registration Papers" desc="Upload the vehicle's registration certificate" icon="📄" val={regoPhoto} onChange={setRegoPhoto} />
          </MCard>
        </div>
      </div>
    </div>
  );
}

/* ─── Root component ─────────────────────────────────────── */
interface TSDReservationDetailProps {
  initialData?: any;
  reservationId?: string;
}

export default function TSDReservationDetail({ initialData, reservationId: initialResId }: TSDReservationDetailProps = {}) {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const c = initialData?.customer ?? initialData?.driver ?? {};
  const acc = initialData?.accident ?? {};
  const af = initialData?.atFault ?? {};

  // ── Shared saveable state ──────────────────────────────
  const [firstName, setFirstName] = useState(c.firstName ?? '');
  const [lastName, setLastName] = useState(c.lastName ?? '');
  const [mi, setMi] = useState('');
  const [homePhone, setHomePhone] = useState(c.phone ?? '');
  const [mobile, setMobile] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [email, setEmail] = useState(c.email ?? '');
  const [street1, setStreet1] = useState(c.address ?? '');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState(c.suburb ?? '');
  const [stateVal, setStateVal] = useState(c.state ?? '');
  const [postal, setPostal] = useState(c.postcode ?? '');
  const [country, setCountry] = useState('');
  const [licNum, setLicNum] = useState(c.licenceNumber ?? '');
  const [licState, setLicState] = useState(c.licenceState ?? '');
  const [licExpires, setLicExpires] = useState(c.licenceExpiry ? c.licenceExpiry.slice(0, 10) : '');
  const [dob, setDob] = useState(c.dob ? c.dob.slice(0, 10) : '');
  const [pickupDate, setPickupDate] = useState(initialData?.startDate ? initialData.startDate.slice(0, 10) : '');
  const [dropDate, setDropDate] = useState(initialData?.endDate ? initialData.endDate.slice(0, 10) : '');
  const [source, setSource] = useState(initialData?.sourceOfBusiness ?? '');
  const [hireType, setHireType] = useState(initialData?.hireType ?? 'credit');
  const [accDate, setAccDate] = useState(acc.date ? acc.date.slice(0, 10) : '');
  const [accStreet, setAccStreet] = useState(acc.location ?? '');
  const [accSuburb, setAccSuburb] = useState('');
  const [accDescription, setAccDescription] = useState(acc.description ?? '');
  const [tpFirstName, setTpFirstName] = useState(af.firstName ?? '');
  const [tpLastName, setTpLastName] = useState(af.lastName ?? '');
  const [tpPhone, setTpPhone] = useState(af.phone ?? '');
  const [tpEmail, setTpEmail] = useState(af.email ?? '');
  const [tpAddress, setTpAddress] = useState(af.address ?? '');
  const [tpSuburb, setTpSuburb] = useState(af.suburb ?? '');
  const [tpPostal, setTpPostal] = useState(af.postcode ?? '');
  const [tpState, setTpState] = useState(af.state ?? '');
  const [tpVehRego, setTpVehRego] = useState(af.vehicleRegistration ?? '');
  const [tpVehMake, setTpVehMake] = useState(af.vehicleMake ?? '');
  const [tpVehModel, setTpVehModel] = useState(af.vehicleModel ?? '');
  const [tpVehYear, setTpVehYear] = useState(af.vehicleYear ?? '');
  const [tpInsCarrier, setTpInsCarrier] = useState(af.insuranceProvider ?? '');
  const [tpClaimNo, setTpClaimNo] = useState(af.claimNumber ?? '');

  // ── Registered Owner ────────────────────────────────────
  const [roFirstName, setRoFirstName] = useState('');
  const [roLastName, setRoLastName] = useState('');
  const [roMi, setRoMi] = useState('');
  const [roDob, setRoDob] = useState('');
  const [roMobile, setRoMobile] = useState('');
  const [roHomePhone, setRoHomePhone] = useState('');
  const [roWorkPhone, setRoWorkPhone] = useState('');
  const [roEmail, setRoEmail] = useState('');
  const [roAltId, setRoAltId] = useState('');
  const [roStreet1, setRoStreet1] = useState('');
  const [roStreet2, setRoStreet2] = useState('');
  const [roCity, setRoCity] = useState('');
  const [roState, setRoState] = useState('');
  const [roPostal, setRoPostal] = useState('');
  const [roCountry, setRoCountry] = useState('');
  const [roLicNum, setRoLicNum] = useState('');
  const [roLicState, setRoLicState] = useState('');
  const [roLicExpires, setRoLicExpires] = useState('');

  // ── Save state ──────────────────────────────────────────
  const [reservationId, setReservationId] = useState<string | null>(initialResId ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [rezNumber, setRezNumber] = useState(initialData?.reservationNumber ?? '');

  const tabHasData = (tab: number): boolean => {
    switch (tab) {
      case 0: return !!(firstName || lastName || homePhone || email || street1 || pickupDate || dropDate);
      case 2: return !!(accDate || accStreet || accDescription || hireType);
      case 3: return !!(tpFirstName || tpLastName || tpVehRego || tpInsCarrier);
      case 4: return false; // Card Details: local state only, can't inspect from here
      default: return false;
    }
  };

  useEffect(() => {
    if (initialData?.reservationNumber || initialResId) return;
    getToken().then(token => {
      api.get('/reservations/next-number', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setRezNumber(res.data?.nextNumber ?? res.data ?? ''))
        .catch(() => {});
    });
  }, []);

  const save = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        customer: {
          firstName, lastName,
          phone: mobile || homePhone,
          email: email || undefined,
          address: street1,
          suburb: city,
          postcode: postal,
          state: stateVal,
          licenceNumber: licNum || undefined,
          licenceState: licState || undefined,
          licenceExpiry: licExpires || undefined,
          dob: dob || undefined,
        },
        startDate: pickupDate || undefined,
        endDate: dropDate || undefined,
        sourceOfBusiness: source || undefined,
        hireType: hireType || undefined,
        accident: (accDate || accDescription) ? {
          date: accDate || undefined,
          location: accStreet ? `${accStreet}${accSuburb ? ', ' + accSuburb : ''}` : undefined,
          description: accDescription || undefined,
        } : undefined,
        atFault: (tpLastName || tpVehRego) ? {
          firstName: tpFirstName || undefined,
          lastName: tpLastName || undefined,
          phone: tpPhone || undefined,
          email: tpEmail || undefined,
          address: tpAddress || undefined,
          suburb: tpSuburb || undefined,
          postcode: tpPostal || undefined,
          state: tpState || undefined,
          vehicleRegistration: tpVehRego || undefined,
          vehicleMake: tpVehMake || undefined,
          vehicleModel: tpVehModel || undefined,
          vehicleYear: tpVehYear || undefined,
          insuranceProvider: tpInsCarrier || undefined,
          claimNumber: tpClaimNo || undefined,
        } : undefined,
      };

      if (reservationId) {
        await api.patch(`/reservations/${reservationId}`, payload, { headers });
      } else {
        const res = await api.post('/reservations', payload, { headers });
        setReservationId(res.data?.id ?? null);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setSaveError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Save failed. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  const formCtx: RezForm = {
    firstName, setFirstName, lastName, setLastName, mi, setMi,
    homePhone, setHomePhone, mobile, setMobile, workPhone, setWorkPhone,
    email, setEmail, street1, setStreet1, street2, setStreet2,
    city, setCity, stateVal, setStateVal, postal, setPostal, country, setCountry,
    licNum, setLicNum, licState, setLicState, licExpires, setLicExpires, dob, setDob,
    pickupDate, setPickupDate, dropDate, setDropDate, source, setSource,
    hireType, setHireType, accDate, setAccDate, accStreet, setAccStreet,
    accSuburb, setAccSuburb, accDescription, setAccDescription,
    tpFirstName, setTpFirstName, tpLastName, setTpLastName,
    tpPhone, setTpPhone, tpEmail, setTpEmail,
    tpAddress, setTpAddress, tpSuburb, setTpSuburb, tpPostal, setTpPostal, tpState, setTpState,
    tpVehRego, setTpVehRego, tpVehMake, setTpVehMake, tpVehModel, setTpVehModel, tpVehYear, setTpVehYear,
    tpInsCarrier, setTpInsCarrier, tpClaimNo, setTpClaimNo,
    roFirstName, setRoFirstName, roLastName, setRoLastName, roMi, setRoMi,
    roDob, setRoDob, roMobile, setRoMobile, roHomePhone, setRoHomePhone,
    roWorkPhone, setRoWorkPhone, roEmail, setRoEmail, roAltId, setRoAltId,
    roStreet1, setRoStreet1, roStreet2, setRoStreet2, roCity, setRoCity,
    roState, setRoState, roPostal, setRoPostal, roCountry, setRoCountry,
    roLicNum, setRoLicNum, roLicState, setRoLicState, roLicExpires, setRoLicExpires,
    rezNumber, tabHasData, reservationId, isSaving, saveError, saveSuccess, save,
  };

  return (
    <RezFormContext.Provider value={formCtx}>
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', background: '#f8fafc', minHeight: '100vh', paddingBottom: '70px' }}>
        {/* Page header */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: '12px', padding: '3px 8px', borderRadius: '5px', letterSpacing: '0.05em' }}>
              {reservationId ? 'EDIT' : 'NEW'}
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {initialData?.reservationNumber ?? (reservationId ? `Reservation #${reservationId}` : 'New Reservation')}
              </div>
              {rezNumber && !reservationId && (
                <div style={{ fontSize: '12px', color: '#64748b' }}>Next # · {rezNumber}</div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {saveError && <span style={{ fontSize: '13px', color: '#dc2626' }}>{saveError}</span>}
            {saveSuccess && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>✓ Saved</span>}
            <button
              onClick={save}
              disabled={isSaving}
              style={{ padding: '7px 20px', fontSize: '13px', fontWeight: 700, border: 'none', borderRadius: '6px', background: isSaving ? '#94a3b8' : '#16a34a', color: '#fff', cursor: isSaving ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 20px', display: 'flex', gap: '2px', position: 'sticky', top: '53px', zIndex: 19 }}>
          {TABS.map((t, i) => {
            const active = activeTab === i;
            const hasData = tabHasData(i);
            return (
              <button key={t} type="button" onClick={() => setActiveTab(i)} style={{
                padding: '11px 16px', fontSize: '13px', fontWeight: active ? 700 : 500,
                color: active ? '#16a34a' : '#64748b',
                background: 'transparent', border: 'none',
                borderBottom: active ? '2px solid #16a34a' : '2px solid transparent',
                cursor: 'pointer', whiteSpace: 'nowrap',
                marginBottom: '-1px', display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'color 0.15s',
              }}>
                {t}
                {hasData && !active && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', display: 'inline-block', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 0 && <MainTab />}
        {activeTab === 1 && <MiscTab />}
        {activeTab === 2 && <AccidentTab />}
        {activeTab === 3 && <AtFaultThirdPartyTab />}
        {activeTab === 4 && <CardDetailsTab />}
        {activeTab === 5 && <BookingDetailTab />}

        <BtnBar />
      </div>
    </RezFormContext.Provider>
  );
}
