'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AddressAutocomplete from '@/components/AddressAutocomplete';

// ─── Styles ───────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  color: '#0f172a',
  background: '#fff',
  boxSizing: 'border-box',
};

const lbl: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: '#374151',
  marginBottom: '4px',
  display: 'block',
};

const sectionBox: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  padding: '16px',
  marginBottom: '16px',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#64748b',
  margin: '0 0 12px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' };
const fullSpan: React.CSSProperties = { gridColumn: '1 / -1' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function F({ label, children, full, span2 }: {
  label: string; children: React.ReactNode; full?: boolean; span2?: boolean;
}) {
  const style = full ? fullSpan : span2 ? { gridColumn: 'span 2' } : {};
  return (
    <div style={style}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sectionBox}>
      <h3 style={sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
const LICENCE_STATES = ['International', ...STATES];
const BODY_TYPES = ['Sedan', 'Hatchback', 'SUV', 'Ute', 'Van', 'Wagon', 'Coupe', 'Convertible', 'Truck', 'Other'];

// ─── Vehicle types ─────────────────────────────────────────────────────────────

const VEHICLE_TYPES = [
  { id: 'naf',   label: 'NAF Vehicle',   color: '#01ae42', bg: '#f0fdf4', border: '#86efac' },
  { id: 'fault', label: 'At Fault',      color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
  { id: 'tp1',   label: 'Third Party 1', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  { id: 'tp2',   label: 'Third Party 2', color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
  { id: 'tp3',   label: 'Third Party 3', color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd' },
  { id: 'tp4',   label: 'Third Party 4', color: '#ec4899', bg: '#fdf2f8', border: '#f9a8d4' },
];

function CarSvg({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="8" fill={color} fillOpacity="0.12" />
      <g transform="translate(6,4)">
        <rect x="2" y="10" width="20" height="12" rx="3" fill={color} />
        <path d="M6 10 L8 4 L16 4 L18 10 Z" fill={color} fillOpacity="0.85" />
        <rect x="8.5" y="5" width="3.5" height="4.5" rx="1" fill="white" fillOpacity="0.7" />
        <rect x="12.5" y="5" width="3.5" height="4.5" rx="1" fill="white" fillOpacity="0.7" />
        <circle cx="7" cy="22" r="3.5" fill="#1e293b" />
        <circle cx="7" cy="22" r="1.8" fill="#94a3b8" />
        <circle cx="17" cy="22" r="3.5" fill="#1e293b" />
        <circle cx="17" cy="22" r="1.8" fill="#94a3b8" />
        <rect x="2" y="13" width="2" height="3" rx="1" fill="white" fillOpacity="0.9" />
        <rect x="20" y="13" width="2" height="3" rx="1" fill="#fca5a5" fillOpacity="0.9" />
      </g>
    </svg>
  );
}

function buildMarkerSvg(color: string, text: string): string {
  const display = (text || '?').trim().toUpperCase().slice(0, 7);
  const fontSize = display.length > 5 ? 8 : display.length > 3 ? 10 : 12;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r="23" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="26" y="31" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" font-weight="700" fill="white">${display}</text>
    </svg>
  `;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg.trim());
}

// ─── Google Maps types ────────────────────────────────────────────────────────

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
    _removeMarker: (id: string) => void;
  }
}

interface PlacedVehicle {
  instanceId: string;
  typeId: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  lat: number;
  lng: number;
  address: string;
  displayText: string;
}

// ─── Accident map ─────────────────────────────────────────────────────────────

function AccidentMap({
  onUpdate, nafRego, faultRego, tp1Rego, tp2Rego,
}: {
  onUpdate: (vehicles: PlacedVehicle[]) => void;
  nafRego?: string;
  faultRego?: string;
  tp1Rego?: string;
  tp2Rego?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const dragTypeRef = useRef<string | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [placedVehicles, setPlacedVehicles] = useState<PlacedVehicle[]>([]);
  const [visibleTypes, setVisibleTypes] = useState<string[]>(['naf', 'fault']);

  useEffect(() => { onUpdate(placedVehicles); }, [placedVehicles]);

  useEffect(() => {
    if (window.google?.maps) { setMapsReady(true); return; }
    const scriptId = 'google-places-script';
    if (document.getElementById(scriptId)) {
      const interval = setInterval(() => {
        if (window.google?.maps) { setMapsReady(true); clearInterval(interval); }
      }, 100);
      return () => clearInterval(interval);
    }
    window.initGooglePlaces = () => setMapsReady(true);
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: -37.8136, lng: 144.9631 },
      zoom: 15,
      mapTypeId: 'hybrid',
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapInstanceRef.current = map;

    if (searchRef.current) {
      const ac = new window.google.maps.places.Autocomplete(searchRef.current, {
        componentRestrictions: { country: 'au' },
        fields: ['geometry'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (place.geometry) { map.setCenter(place.geometry.location); map.setZoom(17); }
      });
    }

    const mapDiv = mapRef.current;
    mapDiv.addEventListener('dragover', (e) => { e.preventDefault(); });
    mapDiv.addEventListener('drop', (e) => {
      e.preventDefault();
      const typeId = dragTypeRef.current;
      if (!typeId || !mapInstanceRef.current) return;
      const rect = mapDiv.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const bounds = mapInstanceRef.current.getBounds();
      if (!bounds) return;
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const lng = sw.lng() + (x / mapDiv.offsetWidth) * (ne.lng() - sw.lng());
      const lat = ne.lat() - (y / mapDiv.offsetHeight) * (ne.lat() - sw.lat());
      const latLng = new window.google.maps.LatLng(lat, lng);
      const vType = VEHICLE_TYPES.find(v => v.id === typeId);
      if (!vType) return;
      const instanceId = `${typeId}-${Date.now()}`;
      const displayText = getDisplayText(typeId);
      addMarker(instanceId, vType, latLng, displayText);
      dragTypeRef.current = null;
    });
  }, [mapsReady]);

  function getDisplayText(typeId: string): string {
    if (typeId === 'naf')   return nafRego   || 'NAF';
    if (typeId === 'fault') return faultRego || 'AF';
    if (typeId === 'tp1')   return tp1Rego   || 'TP1';
    if (typeId === 'tp2')   return tp2Rego   || 'TP2';
    if (typeId === 'tp3')   return 'TP3';
    if (typeId === 'tp4')   return 'TP4';
    return typeId.toUpperCase();
  }

  function addMarker(instanceId: string, vType: typeof VEHICLE_TYPES[0], latLng: any, displayText: string) {
    const map = mapInstanceRef.current;
    if (!map) return;
    const marker = new window.google.maps.Marker({
      position: latLng,
      map,
      draggable: true,
      icon: {
        url: buildMarkerSvg(vType.color, displayText),
        scaledSize: new window.google.maps.Size(52, 52),
        anchor: new window.google.maps.Point(26, 26),
      },
      title: `${vType.label} — ${displayText}`,
    });
    markersRef.current[instanceId] = marker;
    const geocoder = new window.google.maps.Geocoder();
    function resolveAddress(position: any, cb: (addr: string) => void) {
      geocoder.geocode({ location: position }, (results: any[], status: string) => {
        cb(status === 'OK' && results[0] ? results[0].formatted_address : `${position.lat().toFixed(5)}, ${position.lng().toFixed(5)}`);
      });
    }
    resolveAddress(latLng, (address) => {
      setPlacedVehicles(prev => [...prev, {
        instanceId, typeId: vType.id, label: vType.label,
        color: vType.color, bg: vType.bg, border: vType.border,
        lat: latLng.lat(), lng: latLng.lng(), address, displayText,
      }]);
    });
    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      resolveAddress(pos, (address) => {
        setPlacedVehicles(prev => prev.map(v =>
          v.instanceId === instanceId ? { ...v, lat: pos.lat(), lng: pos.lng(), address } : v
        ));
      });
    });
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="font-family:sans-serif;padding:4px 0;">
          <div style="font-weight:600;font-size:13px;color:#0f172a;margin-bottom:4px;">${vType.label}</div>
          <div style="font-size:12px;color:#64748b;margin-bottom:8px;">${displayText}</div>
          <button onclick="window._removeMarker('${instanceId}')"
            style="padding:5px 14px;border-radius:6px;border:1px solid #fca5a5;background:#fff;color:#ef4444;font-size:12px;cursor:pointer;font-weight:500;">
            Remove
          </button>
        </div>
      `,
    });
    marker.addListener('click', () => infoWindow.open(map, marker));
    window._removeMarker = (id: string) => {
      const m = markersRef.current[id];
      if (m) { m.setMap(null); delete markersRef.current[id]; }
      infoWindow.close();
      setPlacedVehicles(prev => prev.filter(v => v.instanceId !== id));
    };
  }

  function addVehicleType() {
    const next = VEHICLE_TYPES.find(v => !visibleTypes.includes(v.id));
    if (next) setVisibleTypes(prev => [...prev, next.id]);
  }

  const paletteTypes = VEHICLE_TYPES.filter(v => visibleTypes.includes(v.id));

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <input ref={searchRef} placeholder="Search for accident location..." style={{ ...inp, width: '100%' }} />
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        marginBottom: '10px', padding: '10px 12px',
        background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '4px' }}>
          Drag onto map:
        </span>
        {paletteTypes.map(vType => (
          <div
            key={vType.id}
            draggable
            onDragStart={() => { dragTypeRef.current = vType.id; }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 10px', borderRadius: '8px',
              border: `1.5px solid ${vType.border}`,
              background: vType.bg, cursor: 'grab', userSelect: 'none',
            }}
          >
            <CarSvg color={vType.color} size={26} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: vType.color }}>{vType.label}</div>
              {getDisplayText(vType.id) !== vType.label && (
                <div style={{ fontSize: '10px', color: vType.color, opacity: 0.8 }}>{getDisplayText(vType.id)}</div>
              )}
            </div>
          </div>
        ))}
        {visibleTypes.length < VEHICLE_TYPES.length && (
          <button
            type="button"
            onClick={addVehicleType}
            style={{
              padding: '5px 12px', borderRadius: '8px',
              border: '1.5px dashed #cbd5e1', background: '#fff',
              color: '#64748b', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            + Add vehicle
          </button>
        )}
      </div>
      <div ref={mapRef} style={{
        width: '100%', height: '380px', borderRadius: '8px',
        border: '1px solid #e2e8f0', overflow: 'hidden', background: '#f1f5f9',
      }} />
      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', marginBottom: placedVehicles.length > 0 ? '12px' : '0' }}>
        Drag a vehicle onto the map to place it. Drag markers to reposition. Click a marker to remove it.
      </p>
      {placedVehicles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {placedVehicles.map(v => (
            <div key={v.instanceId} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '8px 12px', background: v.bg,
              border: `1px solid ${v.border}`, borderRadius: '8px',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: v.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff' }}>{v.displayText.slice(0, 4)}</span>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: v.color }}>{v.label} — {v.displayText}</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>{v.address}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TABS = ['Main', 'Customer', 'At Fault', 'Other Party', 'Accident', 'Documents'];

function TabBar({ active, onChange }: { active: number; onChange: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', overflowX: 'auto' }}>
      {TABS.map((t, i) => (
        <button key={t} type="button" onClick={() => onChange(i)} style={{
          padding: '10px 18px', fontSize: '13px',
          fontWeight: active === i ? 600 : 500,
          color: active === i ? '#01ae42' : '#64748b',
          background: 'none', border: 'none',
          borderBottom: active === i ? '2px solid #01ae42' : '2px solid transparent',
          marginBottom: '-2px', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const emptyPerson = {
  firstName: '', lastName: '', phone: '', email: '',
  address: '', suburb: '', postcode: '', state: '',
  licenceNumber: '', licenceState: '', licenceExpiry: '', dob: '',
};

const emptyAtFault = {
  firstName: '', lastName: '', phone: '', email: '',
  address: '', suburb: '', postcode: '', state: '',
  vehicleRegistration: '', vehicleState: '', vehicleYear: '',
  vehicleMake: '', vehicleModel: '',
  insuranceProvider: '', claimNumber: '',
};

const emptyOtherParty = {
  firstName: '', lastName: '', phone: '', email: '',
  address: '', suburb: '', postcode: '', state: '',
  vehicleRegistration: '', vehicleState: '', vehicleYear: '',
  vehicleMake: '', vehicleModel: '',
  insuranceProvider: '', claimNumber: '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreditHirePage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [rezNumber, setRezNumber] = useState('');

  // Tab 0 — Main
  const [sourceOfBusiness, setSourceOfBusiness] = useState('');
  const [startDate, setStartDate] = useState('');

  // Tab 1 — Customer
  const [driver, setDriver] = useState({ ...emptyPerson });
  const updDriver = (f: string, v: string) => setDriver(p => ({ ...p, [f]: v }));

  // NAF Vehicle
  const [nafVehicleRego, setNafVehicleRego] = useState('');
  const [nafVehicleMake, setNafVehicleMake] = useState('');
  const [nafVehicleModel, setNafVehicleModel] = useState('');
  const [nafVehicleYear, setNafVehicleYear] = useState('');
  const [nafVehicleBodyType, setNafVehicleBodyType] = useState('');
  const [validating, setValidating] = useState(false);

  // Registered Owner
  const [owner, setOwner] = useState({ ...emptyPerson });
  const [sameAsDriver, setSameAsDriver] = useState(false);
  const updOwner = (f: string, v: string) => setOwner(p => ({ ...p, [f]: v }));
  const handleSameAsDriver = (checked: boolean) => {
    setSameAsDriver(checked);
    setOwner(checked ? { ...driver } : { ...emptyPerson });
  };

  // Tab 2 — At Fault
  const [atFault, setAtFault] = useState({ ...emptyAtFault });
  const updAtFault = (f: string, v: string) => setAtFault(p => ({ ...p, [f]: v }));
  const [validatingAtFault, setValidatingAtFault] = useState(false);

  // Tab 3 — Other Party
  const [tp1, setTp1] = useState({ ...emptyOtherParty });
  const updTp1 = (f: string, v: string) => setTp1(p => ({ ...p, [f]: v }));
  const [tp2, setTp2] = useState({ ...emptyOtherParty });
  const updTp2 = (f: string, v: string) => setTp2(p => ({ ...p, [f]: v }));
  const [showTp2, setShowTp2] = useState(false);

  // Tab 4 — Accident
  const [accident, setAccident] = useState({ date: '', location: '', suburb: '', description: '' });
  const updAccident = (f: string, v: string) => setAccident(p => ({ ...p, [f]: v }));
  const [accidentVehicles, setAccidentVehicles] = useState<PlacedVehicle[]>([]);

  useEffect(() => {
    getToken().then(token => {
      api.get('/reservations/next-number', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setRezNumber(res.data.nextNumber))
        .catch(() => setRezNumber('REZ—'));
    });
  }, []);

  const mutation = useMutation({
    mutationFn: async (status: string) => {
      const token = await getToken();
      const authorName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}` : 'Staff';
      const res = await api.post('/reservations', {
        status, authorName, hireType: 'Credit Hire',
        sourceOfBusiness, startDate,
        customer: driver,
        nafVehicle: {
          registration: nafVehicleRego,
          make: nafVehicleMake,
          model: nafVehicleModel,
          year: nafVehicleYear,
          bodyType: nafVehicleBodyType,
        },
        registeredOwner: owner,
        atFault,
        otherParties: [
          { ...tp1, role: 'Third Party 1' },
          ...(showTp2 ? [{ ...tp2, role: 'Third Party 2' }] : []),
        ],
        accident: { ...accident, vehicles: accidentVehicles },
      }, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      router.push('/dashboard/reservations');
    },
  });

  return (
    <div style={{ maxWidth: '860px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>New Reservation</h1>
          {rezNumber && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              background: '#f0fdf4', border: '1.5px solid #86efac',
              borderRadius: '6px', padding: '3px 10px',
              fontSize: '13px', fontWeight: 600, color: '#01ae42', fontFamily: 'monospace',
            }}>
              {rezNumber}
            </span>
          )}
        </div>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Credit hire intake form</p>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* ── Tab 0: Main ── */}
      {activeTab === 0 && (
        <SectionBlock title="Booking Details">
          <div style={grid2}>
            <F label="Source *">
              <select style={inp} value={sourceOfBusiness} onChange={e => setSourceOfBusiness(e.target.value)}>
                <option value="">Select source...</option>
                <option value="Repairer">Repairer</option>
                <option value="Tow Operator">Tow Operator</option>
                <option value="Marketing">Marketing</option>
                <option value="Corporate Partnerships">Corporate Partnerships</option>
              </select>
            </F>
            <F label="Hire start date">
              <input type="date" style={inp} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </F>
          </div>
        </SectionBlock>
      )}

      {/* ── Tab 1: Customer ── */}
      {activeTab === 1 && (
        <>
          {/* NAF Vehicle — top of customer tab */}
          <SectionBlock title="NAF Vehicle">
            <div style={grid3}>
              <F label="Registration">
                <input
                  style={inp}
                  value={nafVehicleRego}
                  onChange={e => setNafVehicleRego(e.target.value)}
                  placeholder="e.g. ABC123"
                />
              </F>
              <F label="Make">
                <input
                  style={inp}
                  value={nafVehicleMake}
                  onChange={e => setNafVehicleMake(e.target.value)}
                  placeholder="e.g. Toyota"
                />
              </F>
              <F label="Model">
                <input
                  style={inp}
                  value={nafVehicleModel}
                  onChange={e => setNafVehicleModel(e.target.value)}
                  placeholder="e.g. Corolla"
                />
              </F>
              <F label="Year">
                <input
                  style={inp}
                  value={nafVehicleYear}
                  onChange={e => setNafVehicleYear(e.target.value)}
                  placeholder="e.g. 2021"
                />
              </F>
              <F label="Body type">
                <select style={inp} value={nafVehicleBodyType} onChange={e => setNafVehicleBodyType(e.target.value)}>
                  <option value="">Select...</option>
                  {BODY_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </F>
              <F label=" ">
                <button
                  type="button"
                  onClick={() => {
                    if (!nafVehicleRego || validating) return;
                    setValidating(true);
                    console.log('Validate rego:', nafVehicleRego);
                    // TODO: wire up to external rego lookup API
                    setTimeout(() => setValidating(false), 1000);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: `1.5px solid ${nafVehicleRego ? '#01ae42' : '#e2e8f0'}`,
                    background: nafVehicleRego ? '#f0fdf4' : '#f8fafc',
                    color: nafVehicleRego ? '#01ae42' : '#94a3b8',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: nafVehicleRego ? 'pointer' : 'not-allowed',
                  }}
                >
                  {validating ? 'Checking...' : 'Validate'}
                </button>
              </F>
            </div>
          </SectionBlock>

          {/* Customer Details */}
          <SectionBlock title="Customer Details">
            <div style={grid3}>
              <F label="First name *">
                <input style={inp} value={driver.firstName} onChange={e => updDriver('firstName', e.target.value)} />
              </F>
              <F label="Last name *">
                <input style={inp} value={driver.lastName} onChange={e => updDriver('lastName', e.target.value)} />
              </F>
              <F label="Phone *">
                <input style={inp} value={driver.phone} onChange={e => updDriver('phone', e.target.value)} />
              </F>
              <F label="Email" span2>
                <input style={inp} value={driver.email} onChange={e => updDriver('email', e.target.value)} />
              </F>
              <F label="Date of birth">
                <input type="date" style={inp} value={driver.dob} onChange={e => updDriver('dob', e.target.value)} />
              </F>
              <F label="Address" full>
                <AddressAutocomplete
                  value={driver.address}
                  onChange={(v: string) => updDriver('address', v)}
                  onSelect={(r: any) => { updDriver('address', r.address); updDriver('suburb', r.suburb); updDriver('postcode', r.postcode); if (r.state) updDriver('state', r.state); }}
                  style={inp} placeholder="Start typing address..."
                />
              </F>
              <F label="Suburb">
                <input style={inp} value={driver.suburb} onChange={e => updDriver('suburb', e.target.value)} />
              </F>
              <F label="Postcode">
                <input style={inp} value={driver.postcode} onChange={e => updDriver('postcode', e.target.value)} />
              </F>
              <F label="State">
                <select style={inp} value={driver.state} onChange={e => updDriver('state', e.target.value)}>
                  <option value="">Select...</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </F>
              <F label="Licence number">
                <input style={inp} value={driver.licenceNumber} onChange={e => updDriver('licenceNumber', e.target.value)} />
              </F>
              <F label="Licence state">
                <select style={inp} value={driver.licenceState} onChange={e => updDriver('licenceState', e.target.value)}>
                  <option value="">Select...</option>
                  {LICENCE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </F>
              <F label="Licence expiry">
                <input type="date" style={inp} value={driver.licenceExpiry} onChange={e => updDriver('licenceExpiry', e.target.value)} />
              </F>
            </div>
          </SectionBlock>

          {/* Registered Owner */}
          <SectionBlock title="Registered Owner">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>
                <input type="checkbox" checked={sameAsDriver} onChange={e => handleSameAsDriver(e.target.checked)} />
                Same as driver
              </label>
            </div>
            <div style={grid3}>
              <F label="First name">
                <input style={inp} value={owner.firstName} onChange={e => updOwner('firstName', e.target.value)} />
              </F>
              <F label="Last name">
                <input style={inp} value={owner.lastName} onChange={e => updOwner('lastName', e.target.value)} />
              </F>
              <F label="Phone">
                <input style={inp} value={owner.phone} onChange={e => updOwner('phone', e.target.value)} />
              </F>
              <F label="Email" span2>
                <input style={inp} value={owner.email} onChange={e => updOwner('email', e.target.value)} />
              </F>
              <F label="Date of birth">
                <input type="date" style={inp} value={owner.dob} onChange={e => updOwner('dob', e.target.value)} />
              </F>
              <F label="Address" full>
                <AddressAutocomplete
                  value={owner.address}
                  onChange={(v: string) => updOwner('address', v)}
                  onSelect={(r: any) => { updOwner('address', r.address); updOwner('suburb', r.suburb); updOwner('postcode', r.postcode); if (r.state) updOwner('state', r.state); }}
                  style={inp} placeholder="Start typing address..."
                />
              </F>
              <F label="Suburb">
                <input style={inp} value={owner.suburb} onChange={e => updOwner('suburb', e.target.value)} />
              </F>
              <F label="Postcode">
                <input style={inp} value={owner.postcode} onChange={e => updOwner('postcode', e.target.value)} />
              </F>
              <F label="State">
                <select style={inp} value={owner.state} onChange={e => updOwner('state', e.target.value)}>
                  <option value="">Select...</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </F>
            </div>
          </SectionBlock>
        </>
      )}

      {/* ── Tab 2: At Fault ── */}
      {activeTab === 2 && (
        <>
          {/* Vehicle first */}
          <SectionBlock title="At Fault Vehicle">
            <div style={grid3}>
              <F label="Registration">
                <input style={inp} value={atFault.vehicleRegistration} onChange={e => updAtFault('vehicleRegistration', e.target.value)} />
              </F>
              <F label="State">
                <select style={inp} value={atFault.vehicleState} onChange={e => updAtFault('vehicleState', e.target.value)}>
                  <option value="">Select...</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </F>
              <F label="Year">
                <input style={inp} value={atFault.vehicleYear} onChange={e => updAtFault('vehicleYear', e.target.value)} placeholder="e.g. 2021" />
              </F>
              <F label="Make">
                <input style={inp} value={atFault.vehicleMake} onChange={e => updAtFault('vehicleMake', e.target.value)} />
              </F>
              <F label="Model">
                <input style={inp} value={atFault.vehicleModel} onChange={e => updAtFault('vehicleModel', e.target.value)} />
              </F>
              <F label=" ">
  <button
    type="button"
    onClick={() => {
      if (!atFault.vehicleRegistration || validatingAtFault) return;
      setValidatingAtFault(true);
      console.log('Validate at fault rego:', atFault.vehicleRegistration);
      // TODO: wire up to external rego lookup API
      setTimeout(() => setValidatingAtFault(false), 1000);
    }}
    style={{
      width: '100%',
      padding: '8px 10px',
      borderRadius: '8px',
      border: `1.5px solid ${atFault.vehicleRegistration ? '#01ae42' : '#e2e8f0'}`,
      background: atFault.vehicleRegistration ? '#f0fdf4' : '#f8fafc',
      color: atFault.vehicleRegistration ? '#01ae42' : '#94a3b8',
      fontSize: '13px',
      fontWeight: 600,
      cursor: atFault.vehicleRegistration ? 'pointer' : 'not-allowed',
    }}
  >
    {validatingAtFault ? 'Checking...' : 'Validate'}
  </button>
</F>
            </div>
          </SectionBlock>

          {/* Person details below */}
          <SectionBlock title="At Fault Party">
  <div style={grid3}>
    <F label="First name">
      <input style={inp} value={atFault.firstName} onChange={e => updAtFault('firstName', e.target.value)} />
    </F>
    <F label="Last name">
      <input style={inp} value={atFault.lastName} onChange={e => updAtFault('lastName', e.target.value)} />
    </F>
    <F label="Phone">
      <input style={inp} value={atFault.phone} onChange={e => updAtFault('phone', e.target.value)} />
    </F>
    <F label="Email">
      <input style={inp} value={atFault.email} onChange={e => updAtFault('email', e.target.value)} />
    </F>
    <F label="Insurance provider">
      <input style={inp} value={atFault.insuranceProvider} onChange={e => updAtFault('insuranceProvider', e.target.value)} />
    </F>
    <F label="Claim number">
      <input style={inp} value={atFault.claimNumber} onChange={e => updAtFault('claimNumber', e.target.value)} />
    </F>
    <F label="Address" full>
      <AddressAutocomplete
        value={atFault.address}
        onChange={(v: string) => updAtFault('address', v)}
        onSelect={(r: any) => { updAtFault('address', r.address); updAtFault('suburb', r.suburb); updAtFault('postcode', r.postcode); if (r.state) updAtFault('state', r.state); }}
        style={inp} placeholder="Start typing address..."
      />
    </F>
    <F label="Suburb">
      <input style={inp} value={atFault.suburb} onChange={e => updAtFault('suburb', e.target.value)} />
    </F>
    <F label="Postcode">
      <input style={inp} value={atFault.postcode} onChange={e => updAtFault('postcode', e.target.value)} />
    </F>
    <F label="State">
      <select style={inp} value={atFault.state} onChange={e => updAtFault('state', e.target.value)}>
        <option value="">Select...</option>
        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </F>
  </div>
</SectionBlock>
        </>
      )}

      {/* ── Tab 3: Other Party ── */}
      {activeTab === 3 && (
        <>
          <SectionBlock title="Third Party 1 — Vehicle">
            <div style={grid3}>
              <F label="Registration">
                <input style={inp} value={tp1.vehicleRegistration} onChange={e => updTp1('vehicleRegistration', e.target.value)} />
              </F>
              <F label="State">
                <select style={inp} value={tp1.vehicleState} onChange={e => updTp1('vehicleState', e.target.value)}>
                  <option value="">Select...</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </F>
              <F label="Year">
                <input style={inp} value={tp1.vehicleYear} onChange={e => updTp1('vehicleYear', e.target.value)} placeholder="e.g. 2021" />
              </F>
              <F label="Make">
                <input style={inp} value={tp1.vehicleMake} onChange={e => updTp1('vehicleMake', e.target.value)} />
              </F>
              <F label="Model">
                <input style={inp} value={tp1.vehicleModel} onChange={e => updTp1('vehicleModel', e.target.value)} />
              </F>
              <F label="Claim number">
                <input style={inp} value={tp1.claimNumber} onChange={e => updTp1('claimNumber', e.target.value)} />
              </F>
            </div>
          </SectionBlock>

          <SectionBlock title="Third Party 1 — Person">
            <div style={grid3}>
              <F label="First name">
                <input style={inp} value={tp1.firstName} onChange={e => updTp1('firstName', e.target.value)} />
              </F>
              <F label="Last name">
                <input style={inp} value={tp1.lastName} onChange={e => updTp1('lastName', e.target.value)} />
              </F>
              <F label="Phone">
                <input style={inp} value={tp1.phone} onChange={e => updTp1('phone', e.target.value)} />
              </F>
              <F label="Email" span2>
                <input style={inp} value={tp1.email} onChange={e => updTp1('email', e.target.value)} />
              </F>
              <F label="Insurance provider">
                <input style={inp} value={tp1.insuranceProvider} onChange={e => updTp1('insuranceProvider', e.target.value)} />
              </F>
              <F label="Address" full>
                <AddressAutocomplete
                  value={tp1.address}
                  onChange={(v: string) => updTp1('address', v)}
                  onSelect={(r: any) => { updTp1('address', r.address); updTp1('suburb', r.suburb); updTp1('postcode', r.postcode); if (r.state) updTp1('state', r.state); }}
                  style={inp} placeholder="Start typing address..."
                />
              </F>
              <F label="Suburb">
                <input style={inp} value={tp1.suburb} onChange={e => updTp1('suburb', e.target.value)} />
              </F>
              <F label="Postcode">
                <input style={inp} value={tp1.postcode} onChange={e => updTp1('postcode', e.target.value)} />
              </F>
              <F label="State">
                <select style={inp} value={tp1.state} onChange={e => updTp1('state', e.target.value)}>
                  <option value="">Select...</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </F>
            </div>
          </SectionBlock>

          {!showTp2 ? (
            <button
              type="button"
              onClick={() => setShowTp2(true)}
              style={{
                width: '100%', padding: '10px', borderRadius: '8px',
                border: '1.5px dashed #cbd5e1', background: '#fff',
                color: '#64748b', fontSize: '13px', fontWeight: 500,
                cursor: 'pointer', marginBottom: '16px',
              }}
            >
              + Add Third Party 2
            </button>
          ) : (
            <>
              <SectionBlock title="Third Party 2 — Vehicle">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowTp2(false)}
                    style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
                <div style={grid3}>
                  <F label="Registration">
                    <input style={inp} value={tp2.vehicleRegistration} onChange={e => updTp2('vehicleRegistration', e.target.value)} />
                  </F>
                  <F label="State">
                    <select style={inp} value={tp2.vehicleState} onChange={e => updTp2('vehicleState', e.target.value)}>
                      <option value="">Select...</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </F>
                  <F label="Year">
                    <input style={inp} value={tp2.vehicleYear} onChange={e => updTp2('vehicleYear', e.target.value)} placeholder="e.g. 2021" />
                  </F>
                  <F label="Make">
                    <input style={inp} value={tp2.vehicleMake} onChange={e => updTp2('vehicleMake', e.target.value)} />
                  </F>
                  <F label="Model">
                    <input style={inp} value={tp2.vehicleModel} onChange={e => updTp2('vehicleModel', e.target.value)} />
                  </F>
                  <F label="Claim number">
                    <input style={inp} value={tp2.claimNumber} onChange={e => updTp2('claimNumber', e.target.value)} />
                  </F>
                </div>
              </SectionBlock>

              <SectionBlock title="Third Party 2 — Person">
                <div style={grid3}>
                  <F label="First name">
                    <input style={inp} value={tp2.firstName} onChange={e => updTp2('firstName', e.target.value)} />
                  </F>
                  <F label="Last name">
                    <input style={inp} value={tp2.lastName} onChange={e => updTp2('lastName', e.target.value)} />
                  </F>
                  <F label="Phone">
                    <input style={inp} value={tp2.phone} onChange={e => updTp2('phone', e.target.value)} />
                  </F>
                  <F label="Email" span2>
                    <input style={inp} value={tp2.email} onChange={e => updTp2('email', e.target.value)} />
                  </F>
                  <F label="Insurance provider">
                    <input style={inp} value={tp2.insuranceProvider} onChange={e => updTp2('insuranceProvider', e.target.value)} />
                  </F>
                  <F label="Address" full>
                    <AddressAutocomplete
                      value={tp2.address}
                      onChange={(v: string) => updTp2('address', v)}
                      onSelect={(r: any) => { updTp2('address', r.address); updTp2('suburb', r.suburb); updTp2('postcode', r.postcode); if (r.state) updTp2('state', r.state); }}
                      style={inp} placeholder="Start typing address..."
                    />
                  </F>
                  <F label="Suburb">
                    <input style={inp} value={tp2.suburb} onChange={e => updTp2('suburb', e.target.value)} />
                  </F>
                  <F label="Postcode">
                    <input style={inp} value={tp2.postcode} onChange={e => updTp2('postcode', e.target.value)} />
                  </F>
                  <F label="State">
                    <select style={inp} value={tp2.state} onChange={e => updTp2('state', e.target.value)}>
                      <option value="">Select...</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </F>
                </div>
              </SectionBlock>
            </>
          )}
        </>
      )}

      {/* ── Tab 4: Accident ── */}
      {activeTab === 4 && (
        <>
          <SectionBlock title="Accident Details">
            <div style={grid3}>
              <F label="Date of accident">
                <input type="date" style={inp} value={accident.date} onChange={e => updAccident('date', e.target.value)} />
              </F>
              <F label="Street / location">
                <input style={inp} value={accident.location} onChange={e => updAccident('location', e.target.value)} placeholder="e.g. Flinders St & Swanston St" />
              </F>
              <F label="Suburb">
                <input style={inp} value={accident.suburb} onChange={e => updAccident('suburb', e.target.value)} />
              </F>
              <F label="Description" full>
                <textarea
                  style={{ ...inp, height: '80px', resize: 'vertical' }}
                  value={accident.description}
                  onChange={e => updAccident('description', e.target.value)}
                  placeholder="Brief description of what happened..."
                />
              </F>
            </div>
          </SectionBlock>

          <SectionBlock title="Vehicle Positions">
            <AccidentMap
              onUpdate={setAccidentVehicles}
              nafRego={nafVehicleRego}
              faultRego={atFault.vehicleRegistration}
              tp1Rego={tp1.vehicleRegistration}
              tp2Rego={tp2.vehicleRegistration}
            />
          </SectionBlock>
        </>
      )}

      {/* ── Tab 5: Documents ── */}
      {activeTab === 5 && (
        <SectionBlock title="Documents">
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Document upload available after reservation is created.
          </p>
        </SectionBlock>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px', paddingBottom: '40px', marginTop: '20px' }}>
        <button
          onClick={() => router.push('/dashboard/reservations')}
          style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate('PENDING')}
          disabled={mutation.isPending}
          style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: mutation.isPending ? 0.7 : 1 }}
        >
          {mutation.isPending ? 'Saving...' : 'Create Reservation'}
        </button>
      </div>
    </div>
  );
}