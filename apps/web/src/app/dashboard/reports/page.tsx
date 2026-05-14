'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import * as XLSX from 'xlsx';
import api from '@/lib/api';

// ─── Column Definitions ──────────────────────────────────────────────────────

const RA_COLUMNS = [
  { key: 'raNumber', label: 'R/A Number' },
  { key: 'fileNumber', label: 'File Number' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Address' },
  { key: 'suburb', label: 'Suburb' },
  { key: 'state', label: 'State' },
  { key: 'postcode', label: 'Postcode' },
  { key: 'licenceNumber', label: 'Licence Number' },
  { key: 'licenceState', label: 'Licence State' },
  { key: 'licenceExpiry', label: 'Licence Expiry' },
  { key: 'dob', label: 'Date of Birth' },
  { key: 'startDate', label: 'Start Date' },
  { key: 'endDate', label: 'End Date' },
  { key: 'status', label: 'Status' },
  { key: 'sourceOfBusiness', label: 'Source of Business' },
  { key: 'partnerName', label: 'Partner Name' },
  { key: 'cancellationReason', label: 'Cancellation Reason' },
];

const CLAIM_COLUMNS = [
  { key: 'claimNumber', label: 'Claim Number' },
  { key: 'claimReference', label: 'Claim Reference' },
  { key: 'claimStatus', label: 'Claim Status' },
  { key: 'hireType', label: 'Hire Type' },
  { key: 'typeOfCover', label: 'Type of Cover' },
  { key: 'policyNumber', label: 'Policy Number' },
  { key: 'excessAmount', label: 'Excess Amount' },
  { key: 'liabilityStatus', label: 'Liability Status' },
  { key: 'insurer', label: 'Insurer' },
  { key: 'repairer', label: 'Repairer' },
  { key: 'totalLoss', label: 'Total Loss' },
  { key: 'towIn', label: 'Tow In' },
];

const VEHICLE_COLUMNS = [
  { key: 'registration', label: 'Registration' },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'year', label: 'Year' },
  { key: 'colour', label: 'Colour' },
  { key: 'category', label: 'Category' },
  { key: 'vehicleStatus', label: 'Vehicle Status' },
  { key: 'branch', label: 'Branch' },
];

const ALL_COLUMNS = [...RA_COLUMNS, ...CLAIM_COLUMNS, ...VEHICLE_COLUMNS];

// ─── Cell Value Extractor ────────────────────────────────────────────────────

function getCellValue(r: any, key: string): string {
  const c = r.claim;
  const v = r.vehicle;
  const cust = r.customer;
  switch (key) {
    case 'raNumber':          return r.reservationNumber || '';
    case 'fileNumber':        return r.fileNumber || '';
    case 'firstName':         return cust?.firstName || '';
    case 'lastName':          return cust?.lastName || '';
    case 'phone':             return cust?.phone || '';
    case 'email':             return cust?.email || '';
    case 'address':           return cust?.address || '';
    case 'suburb':            return cust?.suburb || '';
    case 'state':             return cust?.state || '';
    case 'postcode':          return cust?.postcode || '';
    case 'licenceNumber':     return cust?.licenceNumber || '';
    case 'licenceState':      return cust?.licenceState || '';
    case 'licenceExpiry':     return cust?.licenceExpiry || '';
    case 'dob':               return cust?.dob || '';
    case 'startDate':         return r.startDate ? new Date(r.startDate).toLocaleDateString('en-AU') : '';
    case 'endDate':           return r.endDate ? new Date(r.endDate).toLocaleDateString('en-AU') : '';
    case 'status':            return r.status || '';
    case 'sourceOfBusiness':  return r.sourceOfBusiness || '';
    case 'partnerName':       return r.partnerName || '';
    case 'cancellationReason': return r.cancellationReason || '';
    case 'claimNumber':       return c?.claimNumber || '';
    case 'claimReference':    return c?.claimReference || '';
    case 'claimStatus':       return c?.status || '';
    case 'hireType':          return c?.hireType === 'CREDIT_HIRE' ? 'Credit Hire' : c?.hireType === 'DIRECT_HIRE' ? 'Direct Hire' : '';
    case 'typeOfCover':       return c?.typeOfCover || '';
    case 'policyNumber':      return c?.policyNumber || '';
    case 'excessAmount':      return c?.excessAmount != null ? `$${c.excessAmount}` : '';
    case 'liabilityStatus':   return c?.liabilityStatus || '';
    case 'insurer':           return c?.insurer?.name || '';
    case 'repairer':          return c?.repairer?.name || '';
    case 'totalLoss':         return c?.totalLoss ? 'Yes' : '';
    case 'towIn':             return c?.towIn ? 'Yes' : '';
    case 'registration':      return v?.registration || '';
    case 'make':              return v?.make || '';
    case 'model':             return v?.model || '';
    case 'year':              return v?.year?.toString() || '';
    case 'colour':            return v?.colour || '';
    case 'category':          return v?.category || '';
    case 'vehicleStatus':     return v?.status || '';
    case 'branch':            return v?.branch?.code ? `${v.branch.code} — ${v.branch.name}` : '';
    default:                  return '';
  }
}

// ─── Export Helpers ───────────────────────────────────────────────────────────

function exportToCSV(rows: any[], columns: { key: string; label: string }[], filename: string) {
  const headers = columns.map(c => c.label);
  const csvRows = [
    headers.join(','),
    ...rows.map(row =>
      columns.map(c => `"${getCellValue(row, c.key).replace(/"/g, '""')}"`).join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToExcel(rows: any[], columns: { key: string; label: string }[], filename: string) {
  const data = [
    columns.map(c => c.label),
    ...rows.map(row => columns.map(c => getCellValue(row, c.key))),
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Bold header row
  columns.forEach((_, i) => {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: i })];
    if (cell) cell.s = { font: { bold: true } };
  });

  // Auto column widths based on content
  ws['!cols'] = columns.map((col, i) => {
    const maxLen = Math.max(
      col.label.length,
      ...rows.map(row => getCellValue(row, col.key).length)
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── Toggle helpers ───────────────────────────────────────────────────────────

function toggle(list: string[], val: string) {
  return list.includes(val) ? list.filter(x => x !== val) : [...list, val];
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { getToken, isLoaded } = useAuth();
  const [activeTab, setActiveTab] = useState<'search' | 'columns'>('search');
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Search criteria
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedClaimStatuses, setSelectedClaimStatuses] = useState<string[]>([]);
  const [selectedHireTypes, setSelectedHireTypes] = useState<string[]>([]);
  const [selectedLiabilityStatuses, setSelectedLiabilityStatuses] = useState<string[]>([]);
  const [raNumber, setRaNumber] = useState('');
  const [fileNumber, setFileNumber] = useState('');
  const [lastName, setLastName] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [registration, setRegistration] = useState('');
  const [claimNumber, setClaimNumber] = useState('');
  const [selectedInsurerId, setSelectedInsurerId] = useState('');
  const [selectedRepairerId, setSelectedRepairerId] = useState('');
  const [sourceOfBusiness, setSourceOfBusiness] = useState('');
  const [dateOutFrom, setDateOutFrom] = useState('');
  const [dateOutTo, setDateOutTo] = useState('');
  const [dateInFrom, setDateInFrom] = useState('');
  const [dateInTo, setDateInTo] = useState('');

  // Column selection
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<Set<string>>(
    new Set(['raNumber', 'fileNumber', 'firstName', 'lastName', 'phone', 'status', 'startDate', 'endDate', 'registration', 'make', 'model', 'branch'])
  );

  // ─── Data fetching ────────────────────────────────────────────────────────

  const { data: reservations } = useQuery({
    queryKey: ['reservations-report'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/reservations', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: claims } = useQuery({
    queryKey: ['claims-report'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: insurers } = useQuery({
    queryKey: ['insurers-report'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/insurers', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: repairers } = useQuery({
    queryKey: ['repairers-report'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/repairers', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: branches } = useQuery({
    queryKey: ['branches-report'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/branches', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  // Enrich reservations with full claim data (insurer/repairer objects) from /claims
  const enrichedReservations = useMemo(() => {
    if (!reservations) return [];
    const claimsMap = new Map((claims || []).map((c: any) => [c.reservationId, c]));
    return reservations.map((r: any) => ({
      ...r,
      claim: claimsMap.get(r.id) ?? r.claim,
    }));
  }, [reservations, claims]);

  // ─── Column selection handlers ─────────────────────────────────────────────

  const toggleColumn = (key: string) => {
    setSelectedColumnKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleColumnGroup = (group: { key: string }[], checked: boolean) => {
    setSelectedColumnKeys(prev => {
      const next = new Set(prev);
      group.forEach(c => (checked ? next.add(c.key) : next.delete(c.key)));
      return next;
    });
  };

  // ─── Search ───────────────────────────────────────────────────────────────

  const handleSearch = () => {
    let filtered = enrichedReservations as any[];

    if (selectedStatuses.length > 0)
      filtered = filtered.filter(r => selectedStatuses.includes(r.status));

    if (selectedBranches.length > 0)
      filtered = filtered.filter(r => selectedBranches.includes(r.vehicle?.branch?.code));

    if (selectedClaimStatuses.length > 0)
      filtered = filtered.filter(r => selectedClaimStatuses.includes(r.claim?.status));

    if (selectedHireTypes.length > 0)
      filtered = filtered.filter(r => selectedHireTypes.includes(r.claim?.hireType));

    if (selectedLiabilityStatuses.length > 0)
      filtered = filtered.filter(r => selectedLiabilityStatuses.includes(r.claim?.liabilityStatus));

    if (selectedInsurerId)
      filtered = filtered.filter(r => r.claim?.insurerId === selectedInsurerId);

    if (selectedRepairerId)
      filtered = filtered.filter(r => r.claim?.repairerId === selectedRepairerId);

    if (sourceOfBusiness)
      filtered = filtered.filter(r => r.sourceOfBusiness === sourceOfBusiness);

    if (raNumber.trim())
      filtered = filtered.filter(r => r.reservationNumber?.toLowerCase().includes(raNumber.trim().toLowerCase()));

    if (fileNumber.trim())
      filtered = filtered.filter(r => r.fileNumber?.toLowerCase().includes(fileNumber.trim().toLowerCase()));

    if (lastName.trim())
      filtered = filtered.filter(r => r.customer?.lastName?.toLowerCase().includes(lastName.trim().toLowerCase()));

    if (licenceNumber.trim())
      filtered = filtered.filter(r => r.customer?.licenceNumber?.toLowerCase().includes(licenceNumber.trim().toLowerCase()));

    if (registration.trim())
      filtered = filtered.filter(r => r.vehicle?.registration?.toLowerCase().includes(registration.trim().toLowerCase()));

    if (claimNumber.trim())
      filtered = filtered.filter(r => r.claim?.claimNumber?.toLowerCase().includes(claimNumber.trim().toLowerCase()));

    if (dateOutFrom) {
      const from = new Date(dateOutFrom);
      filtered = filtered.filter(r => r.startDate && new Date(r.startDate) >= from);
    }
    if (dateOutTo) {
      const to = new Date(dateOutTo);
      to.setHours(23, 59, 59);
      filtered = filtered.filter(r => r.startDate && new Date(r.startDate) <= to);
    }
    if (dateInFrom) {
      const from = new Date(dateInFrom);
      filtered = filtered.filter(r => r.endDate && new Date(r.endDate) >= from);
    }
    if (dateInTo) {
      const to = new Date(dateInTo);
      to.setHours(23, 59, 59);
      filtered = filtered.filter(r => r.endDate && new Date(r.endDate) <= to);
    }

    setResults(filtered);
    setHasSearched(true);
  };

  const handleClear = () => {
    setSelectedStatuses([]);
    setSelectedBranches([]);
    setSelectedClaimStatuses([]);
    setSelectedHireTypes([]);
    setSelectedLiabilityStatuses([]);
    setRaNumber('');
    setFileNumber('');
    setLastName('');
    setLicenceNumber('');
    setRegistration('');
    setClaimNumber('');
    setSelectedInsurerId('');
    setSelectedRepairerId('');
    setSourceOfBusiness('');
    setDateOutFrom('');
    setDateOutTo('');
    setDateInFrom('');
    setDateInTo('');
    setHasSearched(false);
    setResults([]);
  };

  const activeColumns = ALL_COLUMNS.filter(c => selectedColumnKeys.has(c.key));

  // ─── Shared Styles ─────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    padding: '5px 8px',
    borderRadius: '4px',
    border: '1px solid #a0aec0',
    fontSize: '13px',
    color: '#0f172a',
    background: '#fff',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#374151',
    fontWeight: 500,
    marginBottom: '3px',
    display: 'block',
  };

  const listBoxStyle: React.CSSProperties = {
    border: '1px solid #a0aec0',
    borderRadius: '4px',
    overflowY: 'auto',
    background: '#fff',
    fontSize: '13px',
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '1400px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Rental Agreement Reporting
        </h1>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '2px solid #d1d5db' }}>
        {(['search', 'columns'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '7px 20px',
              fontSize: '13px',
              fontWeight: 500,
              border: '1px solid #d1d5db',
              borderBottom: activeTab === tab ? '2px solid #fff' : '1px solid #d1d5db',
              borderRadius: '4px 4px 0 0',
              marginBottom: activeTab === tab ? '-2px' : '0',
              marginRight: '4px',
              background: activeTab === tab ? '#fff' : '#f3f4f6',
              color: activeTab === tab ? '#0f172a' : '#6b7280',
              cursor: 'pointer',
            }}
          >
            {tab === 'search' ? 'Search' : 'Report Columns'}
          </button>
        ))}
      </div>

      {/* ── Tab Panel ──────────────────────────────────────────────────────── */}
      <div style={{ border: '1px solid #d1d5db', borderTop: 'none', background: '#fff', padding: '20px' }}>

        {/* ══ SEARCH TAB ══════════════════════════════════════════════════ */}
        {activeTab === 'search' && (
          <div>
            {/* Top 3-column section */}
            <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr 220px', gap: '20px', marginBottom: '16px' }}>

              {/* Left: R/A Status + Hire Type */}
              <div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>R/A Status</label>
                  <div style={{ ...listBoxStyle, height: '128px' }}>
                    {['DRAFT', 'PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(s => (
                      <div
                        key={s}
                        onClick={() => setSelectedStatuses(prev => toggle(prev, s))}
                        style={{
                          padding: '5px 10px',
                          cursor: 'pointer',
                          background: selectedStatuses.includes(s) ? '#bfdbfe' : 'transparent',
                          userSelect: 'none',
                        }}
                      >
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>Click to select. Leave blank for all.</div>
                </div>

                <div>
                  <label style={labelStyle}>Hire Type</label>
                  {[['CREDIT_HIRE', 'Credit Hire'], ['DIRECT_HIRE', 'Direct Hire']].map(([val, label]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedHireTypes.includes(val)}
                        onChange={() => setSelectedHireTypes(prev => toggle(prev, val))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Middle: Branch, Source, Insurer, Repairer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Branch</label>
                  <div style={{ ...listBoxStyle, height: '70px' }}>
                    {(branches || []).map((b: any) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBranches(prev => toggle(prev, b.code))}
                        style={{
                          padding: '5px 10px',
                          cursor: 'pointer',
                          background: selectedBranches.includes(b.code) ? '#bfdbfe' : 'transparent',
                          userSelect: 'none',
                        }}
                      >
                        {b.code} — {b.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Source of Business</label>
                  <select style={inputStyle} value={sourceOfBusiness} onChange={e => setSourceOfBusiness(e.target.value)}>
                    <option value="">— All —</option>
                    {['Repairer', 'Tow Operator', 'Corporate', 'Marketing', 'Direct'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Insurer</label>
                  <select style={inputStyle} value={selectedInsurerId} onChange={e => setSelectedInsurerId(e.target.value)}>
                    <option value="">— All —</option>
                    {(insurers || []).map((ins: any) => (
                      <option key={ins.id} value={ins.id}>{ins.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Repairer</label>
                  <select style={inputStyle} value={selectedRepairerId} onChange={e => setSelectedRepairerId(e.target.value)}>
                    <option value="">— All —</option>
                    {(repairers || []).map((rep: any) => (
                      <option key={rep.id} value={rep.id}>{rep.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right: Claim Status + Liability Status */}
              <div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Claim Status</label>
                  {[['OPEN', 'Open'], ['IN_PROGRESS', 'In Progress'], ['INVOICING', 'Invoicing'], ['CLOSED', 'Closed']].map(([val, label]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedClaimStatuses.includes(val)}
                        onChange={() => setSelectedClaimStatuses(prev => toggle(prev, val))}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div>
                  <label style={labelStyle}>Liability Status</label>
                  {['PENDING', 'ACCEPTED', 'DISPUTED', 'DENIED'].map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedLiabilityStatuses.includes(s)}
                        onChange={() => setSelectedLiabilityStatuses(prev => toggle(prev, s))}
                      />
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 16px' }} />

            {/* Text search fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>R/A Number</label>
                <input style={inputStyle} value={raNumber} onChange={e => setRaNumber(e.target.value)} placeholder="e.g. REZ1001" />
              </div>
              <div>
                <label style={labelStyle}>File Number</label>
                <input style={inputStyle} value={fileNumber} onChange={e => setFileNumber(e.target.value)} placeholder="e.g. KPKRP-1001" />
              </div>
              <div>
                <label style={labelStyle}>Renter Last Name</label>
                <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name contains..." />
              </div>
              <div>
                <label style={labelStyle}>Licence Number</label>
                <input style={inputStyle} value={licenceNumber} onChange={e => setLicenceNumber(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Vehicle Registration</label>
                <input style={inputStyle} value={registration} onChange={e => setRegistration(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Claim #</label>
                <input style={inputStyle} value={claimNumber} onChange={e => setClaimNumber(e.target.value)} placeholder="e.g. CLM-000001" />
              </div>
              <div />
              <div />
            </div>

            {/* Date ranges */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div>
                <label style={labelStyle}>Date Out Range</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="date" style={{ ...inputStyle, width: '150px' }} value={dateOutFrom} onChange={e => setDateOutFrom(e.target.value)} />
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>to</span>
                  <input type="date" style={{ ...inputStyle, width: '150px' }} value={dateOutTo} onChange={e => setDateOutTo(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Date In Range</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="date" style={{ ...inputStyle, width: '150px' }} value={dateInFrom} onChange={e => setDateInFrom(e.target.value)} />
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>to</span>
                  <input type="date" style={{ ...inputStyle, width: '150px' }} value={dateInTo} onChange={e => setDateInTo(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSearch}
                style={{ padding: '8px 28px', borderRadius: '5px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Search
              </button>
              <button
                onClick={handleClear}
                style={{ padding: '8px 20px', borderRadius: '5px', border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ══ REPORT COLUMNS TAB ══════════════════════════════════════════ */}
        {activeTab === 'columns' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            {(
              [
                { title: 'Rental Agreement Columns', group: RA_COLUMNS },
                { title: 'Claim / Financial Columns', group: CLAIM_COLUMNS },
                { title: 'Vehicle Columns', group: VEHICLE_COLUMNS },
              ] as const
            ).map(({ title, group }) => {
              const allChecked = group.every(c => selectedColumnKeys.has(c.key));
              const someChecked = group.some(c => selectedColumnKeys.has(c.key));
              return (
                <div key={title}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                      onChange={e => toggleColumnGroup(group as any, e.target.checked)}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{title}</span>
                  </div>
                  <div style={{ ...listBoxStyle, height: '380px' }}>
                    {(group as { key: string; label: string }[]).map(col => (
                      <label
                        key={col.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '5px 8px',
                          cursor: 'pointer',
                          background: selectedColumnKeys.has(col.key) ? '#f0fdf4' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedColumnKeys.has(col.key)}
                          onChange={() => toggleColumn(col.key)}
                        />
                        <span style={{ fontSize: '13px', color: '#0f172a' }}>{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Results Table ───────────────────────────────────────────────────── */}
      {hasSearched && (
        <div style={{ marginTop: '24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
              {results.length} record{results.length !== 1 ? 's' : ''} found
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => exportToExcel(results, activeColumns, 'rentpro-report')}
                disabled={results.length === 0 || activeColumns.length === 0}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: '1px solid #1d6f42',
                  background: '#1d6f42',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: results.length > 0 && activeColumns.length > 0 ? 'pointer' : 'not-allowed',
                  opacity: results.length > 0 && activeColumns.length > 0 ? 1 : 0.5,
                }}
              >
                Export to Excel
              </button>
              <button
                onClick={() => exportToCSV(results, activeColumns, 'rentpro-report')}
                disabled={results.length === 0 || activeColumns.length === 0}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: '1px solid #01ae42',
                  background: '#fff',
                  color: '#01ae42',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: results.length > 0 && activeColumns.length > 0 ? 'pointer' : 'not-allowed',
                  opacity: results.length > 0 && activeColumns.length > 0 ? 1 : 0.5,
                }}
              >
                Export to CSV
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {activeColumns.length === 0 ? (
              <p style={{ padding: '20px', color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                No columns selected. Go to <strong>Report Columns</strong> to choose what to display.
              </p>
            ) : results.length === 0 ? (
              <p style={{ padding: '20px', color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                No records match your search criteria.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {activeColumns.map(col => (
                      <th
                        key={col.key}
                        style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          whiteSpace: 'nowrap',
                          borderBottom: '1px solid #e2e8f0',
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row: any, i: number) => (
                    <tr key={row.id ?? i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {activeColumns.map(col => (
                        <td
                          key={col.key}
                          style={{
                            padding: '9px 12px',
                            color: col.key === 'raNumber' ? '#01ae42' : '#0f172a',
                            fontWeight: col.key === 'raNumber' ? 600 : 400,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {getCellValue(row, col.key) || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
