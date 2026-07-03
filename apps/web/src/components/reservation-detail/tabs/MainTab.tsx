'use client';
import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useRezForm } from '../ReservationFormContext';
import { R, colHdr, cinp, STATES } from '../shared/styles';

export function MainTab() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const {
    reservation: r,
    firstName, setFirstName, lastName, setLastName, mobile, setMobile, homePhone, setHomePhone,
    email, setEmail, street1, setStreet1, city, setCity, stateVal, setStateVal, postal, setPostal,
    licNum, setLicNum, licState, setLicState, licExpires, setLicExpires, dob, setDob,
    pickupLoc, setPickupLoc, dropLoc, setDropLoc, pickupDate, setPickupDate, dropDate, setDropDate,
    source, setSource, partnerName, setPartnerName, broadcastNote, setBroadcastNote,
    rezNumber, fileNumber, reservationStatus,
    assignedRego: rego, setAssignedRego: setRego, setAssignedVehicleId,
  } = useRezForm();

  const [showFleetSearch, setShowFleetSearch] = useState(false);
  const [fleetSearchQuery, setFleetSearchQuery] = useState('');

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/branches', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: repairers = [] } = useQuery({
    queryKey: ['repairers'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/repairers', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    enabled: source === 'Repairer',
  });

  const { data: fleet = [] } = useQuery({
    queryKey: ['fleet'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/fleet', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const assignedVehicle = fleet.find((v: any) => v.registration?.toUpperCase() === rego.trim().toUpperCase());

  useEffect(() => {
    setAssignedVehicleId(assignedVehicle?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedVehicle?.id]);

  const filteredFleet = fleet.filter((v: any) =>
    v.registration?.toLowerCase().includes(fleetSearchQuery.toLowerCase()) ||
    v.make?.toLowerCase().includes(fleetSearchQuery.toLowerCase()) ||
    v.model?.toLowerCase().includes(fleetSearchQuery.toLowerCase())
  );

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 20px', alignItems: 'start' }}>

        {/* ── Column 1: Customer ── */}
        <div>
          <div style={colHdr}>Customer</div>
          <R label="Last Name"><input style={cinp} value={lastName} onChange={e => setLastName(e.target.value)} /></R>
          <R label="First Name"><input style={cinp} value={firstName} onChange={e => setFirstName(e.target.value)} /></R>
          <R label="Street"><input style={cinp} value={street1} onChange={e => setStreet1(e.target.value)} /></R>
          <R label="City / Suburb"><input style={cinp} value={city} onChange={e => setCity(e.target.value)} /></R>
          <R label="State">
            <select style={cinp} value={stateVal} onChange={e => setStateVal(e.target.value)}>
              <option value="">—</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </R>
          <R label="Postcode"><input style={cinp} value={postal} onChange={e => setPostal(e.target.value)} /></R>
          <R label="Mobile Phone"><input style={cinp} value={mobile} onChange={e => setMobile(e.target.value)} /></R>
          <R label="Home Phone"><input style={cinp} value={homePhone} onChange={e => setHomePhone(e.target.value)} /></R>
          <R label="E-Mail"><input style={cinp} value={email} onChange={e => setEmail(e.target.value)} /></R>
          <R label="Licence #"><input style={cinp} value={licNum} onChange={e => setLicNum(e.target.value)} /></R>
          <R label="Lic State">
            <select style={cinp} value={licState} onChange={e => setLicState(e.target.value)}>
              <option value="">—</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </R>
          <R label="Lic Expiry"><input type="date" style={cinp} value={licExpires} onChange={e => setLicExpires(e.target.value)} /></R>
          <R label="Date of Birth"><input type="date" style={cinp} value={dob} onChange={e => setDob(e.target.value)} /></R>
        </div>

        {/* ── Column 2: Hire Details + Assigned Vehicle ── */}
        <div>
          <div style={colHdr}>Hire Details</div>
          <R label="Pickup Location">
            <select style={cinp} value={pickupLoc} onChange={e => setPickupLoc(e.target.value)}>
              <option value="">— Select branch —</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </R>
          <R label="Return Location">
            <select style={cinp} value={dropLoc} onChange={e => setDropLoc(e.target.value)}>
              <option value="">Return to pickup</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </R>
          <R label="Pickup Date"><input type="date" style={cinp} value={pickupDate} onChange={e => setPickupDate(e.target.value)} /></R>
          <R label="Drop Off Date"><input type="date" style={cinp} value={dropDate} onChange={e => setDropDate(e.target.value)} /></R>

          <div style={{ ...colHdr, marginTop: '10px' }}>Assigned Vehicle</div>
          <R label="Rego">
            <div style={{ display: 'flex', gap: '3px' }}>
              <input style={{ ...cinp, flex: '1 1 auto' }} value={rego} onChange={e => setRego(e.target.value.toUpperCase())} placeholder="Enter rego" />
              <button type="button" title="Search fleet" onClick={() => setShowFleetSearch(true)}
                style={{ width: '26px', height: '26px', flexShrink: 0, borderRadius: '3px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>🔎</button>
            </div>
          </R>
          {assignedVehicle && (
            <>
              <R label="Vehicle"><input style={{ ...cinp, background: '#f8fafc', color: '#64748b' }} readOnly value={`${assignedVehicle.year || ''} ${assignedVehicle.make || ''} ${assignedVehicle.model || ''}`.trim()} /></R>
              <R label="Odometer"><input style={{ ...cinp, background: '#f8fafc', color: '#64748b' }} readOnly value={assignedVehicle.odometer != null ? `${assignedVehicle.odometer.toLocaleString()} km` : ''} /></R>
            </>
          )}
        </div>

        {/* ── Column 3: Administration + Charges ── */}
        <div>
          <div style={colHdr}>Administration</div>
          <R label="Rez Number"><input style={{ ...cinp, background: '#f8fafc', color: '#64748b', fontWeight: 600 }} readOnly value={rezNumber || r?.reservationNumber || ''} /></R>
          <R label="File Number"><input style={{ ...cinp, background: '#f8fafc', color: '#64748b' }} readOnly value={fileNumber || r?.fileNumber || ''} /></R>
          <R label="Status"><input style={{ ...cinp, background: '#f8fafc', color: '#64748b' }} readOnly value={reservationStatus || r?.status || ''} /></R>
          <R label="Booked"><input style={{ ...cinp, background: '#f8fafc', color: '#64748b' }} readOnly value={r?.createdAt ? new Date(r.createdAt).toLocaleDateString('en-AU') : ''} /></R>
          <R label="Agent Out"><input style={{ ...cinp, background: '#f8fafc', color: '#64748b' }} readOnly value={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''} /></R>
          <R label="Source">
            <select style={cinp} value={source} onChange={e => { setSource(e.target.value); setPartnerName(''); }}>
              <option value="">— Select —</option>
              <option value="Repairer">Repairer</option>
              <option value="Tow Operator">Tow Operator</option>
              <option value="Marketing">Marketing</option>
              <option value="Corporate Partnerships">Corporate Partnerships</option>
            </select>
          </R>
          {source === 'Repairer' && (
            <R label="Repairer">
              <select style={cinp} value={partnerName} onChange={e => setPartnerName(e.target.value)}>
                <option value="">— Select repairer —</option>
                {repairers.map((rep: any) => <option key={rep.id} value={rep.name}>{rep.name}</option>)}
              </select>
            </R>
          )}
          {source === 'Tow Operator' && (
            <R label="Tow Operator"><input style={cinp} value={partnerName} onChange={e => setPartnerName(e.target.value)} /></R>
          )}

          {r?.charges && r.charges.length > 0 && (
            <div style={{ marginTop: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#475569' }}>
                    <th style={{ padding: '4px 8px', color: '#fff', textAlign: 'left', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '4px 8px', color: '#fff', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {r.charges.map((c: any, i: number) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                      <td style={{ padding: '3px 8px', color: '#374151' }}>{c.description || c.name}</td>
                      <td style={{ padding: '3px 8px', color: '#374151', textAlign: 'right' }}>{typeof c.amount === 'number' ? c.amount.toFixed(2) : c.amount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#e2e8f0' }}>
                    <td style={{ padding: '4px 8px', fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>Total</td>
                    <td style={{ padding: '4px 8px', fontWeight: 700, fontSize: '12px', color: '#0f172a', textAlign: 'right' }}>
                      {r.charges.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#fff', background: '#475569', padding: '2px 8px', marginBottom: '4px', borderRadius: '3px', letterSpacing: '0.04em' }}>Broadcast Note</div>
            <textarea style={{ ...cinp, height: '80px', resize: 'vertical', width: '100%' }} value={broadcastNote} onChange={e => setBroadcastNote(e.target.value)} placeholder="Broadcast message visible to all staff..." />
          </div>
        </div>
      </div>

      {showFleetSearch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowFleetSearch(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', width: '420px', maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Search Fleet</div>
            <input autoFocus style={{ ...cinp, marginBottom: '12px', padding: '8px 10px' }} placeholder="Type to filter by rego, make or model…" value={fleetSearchQuery} onChange={e => setFleetSearchQuery(e.target.value)} />
            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              {filteredFleet.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No vehicles found.</div>
              ) : filteredFleet.map((v: any) => (
                <button key={v.id} type="button" onClick={() => { setRego(v.registration); setShowFleetSearch(false); setFleetSearchQuery(''); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', borderBottom: '1px solid #f1f5f9', background: '#fff', cursor: 'pointer' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{v.registration}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{[v.year, v.make, v.model].filter(Boolean).join(' ')}</div>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setShowFleetSearch(false)} style={{ marginTop: '12px', width: '100%', padding: '8px', fontSize: '13px', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
