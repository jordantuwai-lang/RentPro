'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';


const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '13px', color: '#0f172a',
  background: '#fff', boxSizing: 'border-box',
};
const lbl: React.CSSProperties = {
  fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px', display: 'block',
};
const sectionBox: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
  padding: '16px', marginBottom: '16px',
};
const sectionTitle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: '#64748b', margin: '0 0 12px',
  textTransform: 'uppercase', letterSpacing: '0.1em',
};
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' };
const fullSpan: React.CSSProperties = { gridColumn: '1 / -1' };

function F({ label, children, full, span2 }: {
  label: string; children: React.ReactNode; full?: boolean; span2?: boolean;
}) {
  return (
    <div style={full ? fullSpan : span2 ? { gridColumn: 'span 2' } : {}}>
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
const PHOTO_CATEGORIES = ['General', 'Front', 'Rear', 'Driver Side', 'Passenger Side', 'Interior', 'Damage', 'Other'];

// ─── Mandatory photo slot ─────────────────────────────────────────────────────

function MandatoryPhotoSlot({ label, description, icon, value, onChange, onClear }: {
  label: string; description: string; icon: string;
  value: string | null; onChange: (dataUrl: string) => void; onClear: () => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  return (
    <div style={{ border: `2px solid ${value ? '#86efac' : '#e2e8f0'}`, borderRadius: '12px', overflow: 'hidden', background: value ? '#f0fdf4' : '#f8fafc' }}>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      {value ? (
        <div>
          <div style={{ position: 'relative' }}>
            <img src={value} alt={label} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
            <button type="button" onClick={onClear} style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'linear-gradient(transparent, rgba(0,0,0,0.5))', padding: '20px 10px 8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>{label}</div>
            </div>
          </div>
          <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px' }}>✅</span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#16a34a' }}>Uploaded</span>
            <button type="button" onClick={() => fileRef.current?.click()} style={{ marginLeft: 'auto', fontSize: '11px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Replace</button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>{icon}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                {label}
                <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 600, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '1px 5px' }}>REQUIRED</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{description}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => cameraRef.current?.click()} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px dashed #01ae42', background: '#fff', color: '#01ae42', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>📷 Take photo</button>
            <button type="button" onClick={() => fileRef.current?.click()} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px dashed #cbd5e1', background: '#fff', color: '#64748b', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>📁 Upload</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Damage panels ────────────────────────────────────────────────────────────

const PANEL_GROUPS: Record<string, { label: string; panels: string[] }[]> = {
  default: [
    { label: 'Front', panels: ['Front Bumper', 'Bonnet', 'Front Grille', 'Headlight (Driver)', 'Headlight (Passenger)', 'Front Windscreen'] },
    { label: 'Rear', panels: ['Rear Bumper', 'Boot Lid', 'Tail Light (Driver)', 'Tail Light (Passenger)', 'Rear Windscreen'] },
    { label: 'Driver Side', panels: ['Front Guard (Driver)', 'Front Door (Driver)', 'Rear Door (Driver)', 'Rear Quarter Panel (Driver)', 'Side Mirror (Driver)', 'Side Skirt (Driver)'] },
    { label: 'Passenger Side', panels: ['Front Guard (Passenger)', 'Front Door (Passenger)', 'Rear Door (Passenger)', 'Rear Quarter Panel (Passenger)', 'Side Mirror (Passenger)', 'Side Skirt (Passenger)'] },
    { label: 'Roof', panels: ['Roof Panel', 'Sunroof'] },
    { label: 'Other', panels: ['Undercarriage', 'Wheel (Front Driver)', 'Wheel (Front Passenger)', 'Wheel (Rear Driver)', 'Wheel (Rear Passenger)'] },
  ],
  Ute: [
    { label: 'Front', panels: ['Front Bumper', 'Bonnet', 'Front Grille', 'Headlight (Driver)', 'Headlight (Passenger)', 'Front Windscreen'] },
    { label: 'Rear', panels: ['Rear Bumper', 'Tailgate', 'Tail Light (Driver)', 'Tail Light (Passenger)'] },
    { label: 'Tray', panels: ['Tray Floor', 'Tray Rail (Driver)', 'Tray Rail (Passenger)', 'Tray Front Wall'] },
    { label: 'Driver Side', panels: ['Front Guard (Driver)', 'Front Door (Driver)', 'Side Mirror (Driver)', 'Side Step (Driver)'] },
    { label: 'Passenger Side', panels: ['Front Guard (Passenger)', 'Front Door (Passenger)', 'Side Mirror (Passenger)', 'Side Step (Passenger)'] },
    { label: 'Roof', panels: ['Roof Panel', 'Roof Rack'] },
    { label: 'Other', panels: ['Undercarriage', 'Wheel (Front Driver)', 'Wheel (Front Passenger)', 'Wheel (Rear Driver)', 'Wheel (Rear Passenger)', 'Towbar'] },
  ],
  Van: [
    { label: 'Front', panels: ['Front Bumper', 'Bonnet', 'Front Grille', 'Headlight (Driver)', 'Headlight (Passenger)', 'Front Windscreen'] },
    { label: 'Rear', panels: ['Rear Bumper', 'Rear Door (Left)', 'Rear Door (Right)', 'Tail Light (Driver)', 'Tail Light (Passenger)'] },
    { label: 'Driver Side', panels: ['Front Guard (Driver)', 'Front Door (Driver)', 'Sliding Door (Driver)', 'Side Mirror (Driver)', 'Side Panel (Driver)'] },
    { label: 'Passenger Side', panels: ['Front Guard (Passenger)', 'Front Door (Passenger)', 'Sliding Door (Passenger)', 'Side Mirror (Passenger)', 'Side Panel (Passenger)'] },
    { label: 'Roof', panels: ['Roof Panel', 'Roof Rack', 'Skylights'] },
    { label: 'Other', panels: ['Undercarriage', 'Wheel (Front Driver)', 'Wheel (Front Passenger)', 'Wheel (Rear Driver)', 'Wheel (Rear Passenger)'] },
  ],
};

function getPanelGroups(bodyType: string) {
  if (bodyType === 'Ute') return PANEL_GROUPS.Ute;
  if (bodyType === 'Van' || bodyType === 'Truck') return PANEL_GROUPS.Van;
  return PANEL_GROUPS.default;
}

const DMG = '#ef4444';
const DMG_BG = '#fef2f2';
const IDLE = '#e2e8f0';
const IDLE_BG = '#f8fafc';
const BODY_C = '#94a3b8';
const GLASS = '#bfdbfe';
const WHEEL = '#475569';
const WHEEL_RIM = '#94a3b8';

function TopDownSedan({ damaged, onToggle }: { damaged: Set<string>; onToggle: (p: string) => void }) {
  const p = (id: string) => ({ fill: damaged.has(id) ? DMG_BG : IDLE_BG, stroke: damaged.has(id) ? DMG : IDLE, onClick: () => onToggle(id), style: { cursor: 'pointer' } });
  return (
    <svg viewBox="0 0 300 520" style={{ width: '100%', maxWidth: 220, display: 'block', margin: '0 auto' }}>
      <rect x="60" y="60" width="180" height="400" rx="30" fill={BODY_C} />
      <rect x="70" y="40" width="160" height="28" rx="8" {...p('Front Bumper')} strokeWidth="2" />
      <rect x="75" y="68" width="150" height="100" rx="6" {...p('Bonnet')} strokeWidth="2" />
      <rect x="85" y="168" width="130" height="50" rx="4" fill={GLASS} stroke={damaged.has('Front Windscreen') ? DMG : '#93c5fd'} strokeWidth="2" onClick={() => onToggle('Front Windscreen')} style={{ cursor: 'pointer' }} />
      <rect x="80" y="218" width="140" height="84" rx="4" {...p('Roof Panel')} strokeWidth="2" />
      <rect x="85" y="302" width="130" height="50" rx="4" fill={GLASS} stroke={damaged.has('Rear Windscreen') ? DMG : '#93c5fd'} strokeWidth="2" onClick={() => onToggle('Rear Windscreen')} style={{ cursor: 'pointer' }} />
      <rect x="75" y="352" width="150" height="90" rx="6" {...p('Boot Lid')} strokeWidth="2" />
      <rect x="70" y="442" width="160" height="28" rx="8" {...p('Rear Bumper')} strokeWidth="2" />
      <rect x="230" y="100" width="24" height="140" rx="6" {...p('Front Guard (Driver)')} strokeWidth="2" />
      <rect x="230" y="248" width="24" height="80" rx="4" {...p('Rear Quarter Panel (Driver)')} strokeWidth="2" />
      <rect x="46" y="100" width="24" height="140" rx="6" {...p('Front Guard (Passenger)')} strokeWidth="2" />
      <rect x="46" y="248" width="24" height="80" rx="4" {...p('Rear Quarter Panel (Passenger)')} strokeWidth="2" />
      {[[52,80],[52,350],[238,80],[238,350]].map(([x,y],i) => <ellipse key={i} cx={x+8} cy={y+24} rx="10" ry="16" fill={WHEEL} />)}
      <text x="150" y="30" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="sans-serif">▲ FRONT</text>
      <text x="150" y="510" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="sans-serif">▼ REAR</text>
      <text x="10" y="265" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="sans-serif" transform="rotate(-90 10 265)">PASSENGER</text>
      <text x="295" y="265" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="sans-serif" transform="rotate(90 295 265)">DRIVER</text>
    </svg>
  );
}

function TopDownSUV({ damaged, onToggle }: { damaged: Set<string>; onToggle: (p: string) => void }) {
  const p = (id: string) => ({ fill: damaged.has(id) ? DMG_BG : IDLE_BG, stroke: damaged.has(id) ? DMG : IDLE, onClick: () => onToggle(id), style: { cursor: 'pointer' } });
  return (
    <svg viewBox="0 0 300 540" style={{ width: '100%', maxWidth: 220, display: 'block', margin: '0 auto' }}>
      <rect x="55" y="55" width="190" height="430" rx="24" fill={BODY_C} />
      <rect x="65" y="36" width="170" height="26" rx="8" {...p('Front Bumper')} strokeWidth="2" />
      <rect x="70" y="62" width="160" height="90" rx="6" {...p('Bonnet')} strokeWidth="2" />
      <rect x="80" y="152" width="140" height="44" rx="4" fill={GLASS} stroke={damaged.has('Front Windscreen') ? DMG : '#93c5fd'} strokeWidth="2" onClick={() => onToggle('Front Windscreen')} style={{ cursor: 'pointer' }} />
      <rect x="75" y="196" width="150" height="110" rx="4" {...p('Roof Panel')} strokeWidth="2" />
      <rect x="80" y="306" width="140" height="44" rx="4" fill={GLASS} stroke={damaged.has('Rear Windscreen') ? DMG : '#93c5fd'} strokeWidth="2" onClick={() => onToggle('Rear Windscreen')} style={{ cursor: 'pointer' }} />
      <rect x="70" y="350" width="160" height="100" rx="6" {...p('Boot Lid')} strokeWidth="2" />
      <rect x="65" y="450" width="170" height="26" rx="8" {...p('Rear Bumper')} strokeWidth="2" />
      <rect x="234" y="90" width="22" height="150" rx="6" {...p('Front Guard (Driver)')} strokeWidth="2" />
      <rect x="234" y="260" width="22" height="100" rx="4" {...p('Rear Quarter Panel (Driver)')} strokeWidth="2" />
      <rect x="44" y="90" width="22" height="150" rx="6" {...p('Front Guard (Passenger)')} strokeWidth="2" />
      <rect x="44" y="260" width="22" height="100" rx="4" {...p('Rear Quarter Panel (Passenger)')} strokeWidth="2" />
      {[[48,72],[48,370],[240,72],[240,370]].map(([x,y],i) => <ellipse key={i} cx={x+8} cy={y+28} rx="11" ry="18" fill={WHEEL} />)}
      <text x="150" y="26" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="sans-serif">▲ FRONT</text>
      <text x="150" y="530" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="sans-serif">▼ REAR</text>
      <text x="10" y="270" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="sans-serif" transform="rotate(-90 10 270)">PASSENGER</text>
      <text x="295" y="270" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="sans-serif" transform="rotate(90 295 270)">DRIVER</text>
    </svg>
  );
}

function TopDownUte({ damaged, onToggle }: { damaged: Set<string>; onToggle: (p: string) => void }) {
  const p = (id: string) => ({ fill: damaged.has(id) ? DMG_BG : IDLE_BG, stroke: damaged.has(id) ? DMG : IDLE, onClick: () => onToggle(id), style: { cursor: 'pointer' } });
  return (
    <svg viewBox="0 0 300 580" style={{ width: '100%', maxWidth: 220, display: 'block', margin: '0 auto' }}>
      <rect x="60" y="50" width="180" height="480" rx="16" fill={BODY_C} />
      <rect x="68" y="32" width="164" height="24" rx="8" {...p('Front Bumper')} strokeWidth="2" />
      <rect x="72" y="56" width="156" height="80" rx="6" {...p('Bonnet')} strokeWidth="2" />
      <rect x="80" y="136" width="140" height="38" rx="4" fill={GLASS} stroke={damaged.has('Front Windscreen') ? DMG : '#93c5fd'} strokeWidth="2" onClick={() => onToggle('Front Windscreen')} style={{ cursor: 'pointer' }} />
      <rect x="78" y="174" width="144" height="64" rx="4" {...p('Roof Panel')} strokeWidth="2" />
      <rect x="72" y="238" width="156" height="14" rx="3" fill="#64748b" />
      <rect x="72" y="252" width="156" height="200" rx="4" {...p('Tray Floor')} strokeWidth="2" />
      <rect x="232" y="252" width="16" height="200" rx="3" {...p('Tray Rail (Driver)')} strokeWidth="2" />
      <rect x="52" y="252" width="16" height="200" rx="3" {...p('Tray Rail (Passenger)')} strokeWidth="2" />
      <rect x="68" y="452" width="164" height="24" rx="6" {...p('Tailgate')} strokeWidth="2" />
      <rect x="68" y="476" width="164" height="22" rx="8" {...p('Rear Bumper')} strokeWidth="2" />
      <rect x="236" y="80" width="20" height="120" rx="6" {...p('Front Guard (Driver)')} strokeWidth="2" />
      <rect x="44" y="80" width="20" height="120" rx="6" {...p('Front Guard (Passenger)')} strokeWidth="2" />
      {[[46,70],[46,390],[242,70],[242,390]].map(([x,y],i) => <ellipse key={i} cx={x+8} cy={y+28} rx="11" ry="20" fill={WHEEL} />)}
      <text x="150" y="22" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="sans-serif">▲ FRONT</text>
      <text x="150" y="570" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="sans-serif">▼ REAR</text>
      <text x="10" y="290" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="sans-serif" transform="rotate(-90 10 290)">PASSENGER</text>
      <text x="295" y="290" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="sans-serif" transform="rotate(90 295 290)">DRIVER</text>
    </svg>
  );
}

function TopDownVan({ damaged, onToggle }: { damaged: Set<string>; onToggle: (p: string) => void }) {
  const p = (id: string) => ({ fill: damaged.has(id) ? DMG_BG : IDLE_BG, stroke: damaged.has(id) ? DMG : IDLE, onClick: () => onToggle(id), style: { cursor: 'pointer' } });
  return (
    <svg viewBox="0 0 300 600" style={{ width: '100%', maxWidth: 220, display: 'block', margin: '0 auto' }}>
      <rect x="55" y="48" width="190" height="504" rx="16" fill={BODY_C} />
      <rect x="63" y="30" width="174" height="24" rx="8" {...p('Front Bumper')} strokeWidth="2" />
      <rect x="68" y="54" width="164" height="60" rx="6" {...p('Bonnet')} strokeWidth="2" />
      <rect x="76" y="114" width="148" height="36" rx="4" fill={GLASS} stroke={damaged.has('Front Windscreen') ? DMG : '#93c5fd'} strokeWidth="2" onClick={() => onToggle('Front Windscreen')} style={{ cursor: 'pointer' }} />
      <rect x="74" y="150" width="152" height="300" rx="4" {...p('Roof Panel')} strokeWidth="2" />
      <rect x="63" y="450" width="174" height="60" rx="4" {...p('Rear Door (Left)')} strokeWidth="2" />
      <rect x="63" y="510" width="174" height="24" rx="8" {...p('Rear Bumper')} strokeWidth="2" />
      <rect x="235" y="80" width="20" height="160" rx="6" {...p('Side Panel (Driver)')} strokeWidth="2" />
      <rect x="45" y="80" width="20" height="160" rx="6" {...p('Side Panel (Passenger)')} strokeWidth="2" />
      {[[46,68],[46,400],[242,68],[242,400]].map(([x,y],i) => <ellipse key={i} cx={x+8} cy={y+28} rx="11" ry="20" fill={WHEEL} />)}
      <text x="150" y="20" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="sans-serif">▲ FRONT</text>
      <text x="150" y="592" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="sans-serif">▼ REAR</text>
      <text x="10" y="300" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="sans-serif" transform="rotate(-90 10 300)">PASSENGER</text>
      <text x="295" y="300" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="sans-serif" transform="rotate(90 295 300)">DRIVER</text>
    </svg>
  );
}

function SideSedan({ damaged, onToggle, side }: { damaged: Set<string>; onToggle: (p: string) => void; side: 'Driver' | 'Passenger' }) {
  const s = side;
  const p = (id: string) => ({ fill: damaged.has(id) ? DMG_BG : IDLE_BG, stroke: damaged.has(id) ? DMG : IDLE, onClick: () => onToggle(id), style: { cursor: 'pointer' } });
  return (
    <svg viewBox="0 0 520 220" style={{ width: '100%', display: 'block' }}>
      <rect x="40" y="100" width="440" height="80" rx="12" fill={BODY_C} />
      <path d="M120 100 L160 48 L340 48 L390 100 Z" fill={BODY_C} />
      <path d="M158 100 L175 54 L260 54 L260 100 Z" fill={GLASS} stroke={damaged.has('Front Windscreen') ? DMG : '#93c5fd'} strokeWidth="2" onClick={() => onToggle('Front Windscreen')} style={{ cursor: 'pointer' }} />
      <path d="M280 100 L280 54 L338 54 L375 100 Z" fill={GLASS} stroke={damaged.has('Rear Windscreen') ? DMG : '#93c5fd'} strokeWidth="2" onClick={() => onToggle('Rear Windscreen')} style={{ cursor: 'pointer' }} />
      <rect x="30" y="110" width="22" height="54" rx="6" {...p('Front Bumper')} strokeWidth="2" />
      <rect x="448" y="110" width="22" height="54" rx="6" {...p('Rear Bumper')} strokeWidth="2" />
      <rect x="52" y="100" width="100" height="80" rx="8" {...p(`Front Guard (${s})`)} strokeWidth="2" />
      <rect x="160" y="100" width="120" height="78" rx="4" {...p(`Front Door (${s})`)} strokeWidth="2" />
      <rect x="284" y="100" width="100" height="78" rx="4" {...p(`Rear Door (${s})`)} strokeWidth="2" />
      <rect x="388" y="100" width="64" height="80" rx="6" {...p(`Rear Quarter Panel (${s})`)} strokeWidth="2" />
      <rect x="400" y="60" width="48" height="44" rx="4" {...p('Boot Lid')} strokeWidth="2" />
      <rect x="52" y="80" width="100" height="24" rx="4" {...p('Bonnet')} strokeWidth="2" />
      <rect x="170" y="48" width="160" height="10" rx="3" {...p('Roof Panel')} strokeWidth="2" />
      <rect x="150" y="108" width="20" height="14" rx="3" {...p(`Side Mirror (${s})`)} strokeWidth="2" />
      <circle cx="130" cy="180" r="34" fill={WHEEL} /><circle cx="130" cy="180" r="18" fill={WHEEL_RIM} />
      <circle cx="370" cy="180" r="34" fill={WHEEL} /><circle cx="370" cy="180" r="18" fill={WHEEL_RIM} />
      <rect x="36" y="110" width="20" height="20" rx="4" fill="#fef9c3" stroke={damaged.has(`Headlight (${s})`) ? DMG : '#fde68a'} strokeWidth="2" onClick={() => onToggle(`Headlight (${s})`)} style={{ cursor: 'pointer' }} />
      <rect x="444" y="110" width="20" height="20" rx="4" fill="#fecaca" stroke={damaged.has(`Tail Light (${s})`) ? DMG : '#fca5a5'} strokeWidth="2" onClick={() => onToggle(`Tail Light (${s})`)} style={{ cursor: 'pointer' }} />
      <text x="260" y="215" textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="sans-serif">{side} Side View</text>
    </svg>
  );
}

function SideSUV({ damaged, onToggle, side }: { damaged: Set<string>; onToggle: (p: string) => void; side: 'Driver' | 'Passenger' }) {
  const s = side;
  const p = (id: string) => ({ fill: damaged.has(id) ? DMG_BG : IDLE_BG, stroke: damaged.has(id) ? DMG : IDLE, onClick: () => onToggle(id), style: { cursor: 'pointer' } });
  return (
    <svg viewBox="0 0 520 230" style={{ width: '100%', display: 'block' }}>
      <rect x="38" y="95" width="444" height="90" rx="12" fill={BODY_C} />
      <path d="M110 95 L145 42 L355 42 L400 95 Z" fill={BODY_C} />
      <path d="M148 95 L168 48 L268 48 L268 95 Z" fill={GLASS} stroke={damaged.has('Front Windscreen') ? DMG : '#93c5fd'} strokeWidth="2" onClick={() => onToggle('Front Windscreen')} style={{ cursor: 'pointer' }} />
      <path d="M285 95 L285 48 L350 48 L388 95 Z" fill={GLASS} stroke={damaged.has('Rear Windscreen') ? DMG : '#93c5fd'} strokeWidth="2" onClick={() => onToggle('Rear Windscreen')} style={{ cursor: 'pointer' }} />
      <rect x="26" y="105" width="24" height="60" rx="6" {...p('Front Bumper')} strokeWidth="2" />
      <rect x="450" y="105" width="24" height="60" rx="6" {...p('Rear Bumper')} strokeWidth="2" />
      <rect x="50" y="95" width="100" height="90" rx="8" {...p(`Front Guard (${s})`)} strokeWidth="2" />
      <rect x="155" y="95" width="128" height="88" rx="4" {...p(`Front Door (${s})`)} strokeWidth="2" />
      <rect x="287" y="95" width="110" height="88" rx="4" {...p(`Rear Door (${s})`)} strokeWidth="2" />
      <rect x="400" y="95" width="56" height="90" rx="6" {...p(`Rear Quarter Panel (${s})`)} strokeWidth="2" />
      <rect x="406" y="52" width="50" height="46" rx="4" {...p('Boot Lid')} strokeWidth="2" />
      <rect x="50" y="74" width="96" height="24" rx="4" {...p('Bonnet')} strokeWidth="2" />
      <rect x="164" y="42" width="182" height="10" rx="3" {...p('Roof Panel')} strokeWidth="2" />
      <rect x="144" y="103" width="22" height="16" rx="3" {...p(`Side Mirror (${s})`)} strokeWidth="2" />
      <circle cx="128" cy="186" r="38" fill={WHEEL} /><circle cx="128" cy="186" r="20" fill={WHEEL_RIM} />
      <circle cx="378" cy="186" r="38" fill={WHEEL} /><circle cx="378" cy="186" r="20" fill={WHEEL_RIM} />
      <rect x="32" y="106" width="22" height="22" rx="4" fill="#fef9c3" stroke={damaged.has(`Headlight (${s})`) ? DMG : '#fde68a'} strokeWidth="2" onClick={() => onToggle(`Headlight (${s})`)} style={{ cursor: 'pointer' }} />
      <rect x="446" y="106" width="22" height="22" rx="4" fill="#fecaca" stroke={damaged.has(`Tail Light (${s})`) ? DMG : '#fca5a5'} strokeWidth="2" onClick={() => onToggle(`Tail Light (${s})`)} style={{ cursor: 'pointer' }} />
      <text x="260" y="225" textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="sans-serif">{side} Side View</text>
    </svg>
  );
}

function SideUte({ damaged, onToggle, side }: { damaged: Set<string>; onToggle: (p: string) => void; side: 'Driver' | 'Passenger' }) {
  const s = side;
  const p = (id: string) => ({ fill: damaged.has(id) ? DMG_BG : IDLE_BG, stroke: damaged.has(id) ? DMG : IDLE, onClick: () => onToggle(id), style: { cursor: 'pointer' } });
  return (
    <svg viewBox="0 0 560 230" style={{ width: '100%', display: 'block' }}>
      <rect x="36" y="95" width="488" height="90" rx="10" fill={BODY_C} />
      <path d="M100 95 L130 44 L280 44 L310 95 Z" fill={BODY_C} />
      <path d="M133 95 L150 50 L230 50 L230 95 Z" fill={GLASS} stroke={damaged.has('Front Windscreen') ? DMG : '#93c5fd'} strokeWidth="2" onClick={() => onToggle('Front Windscreen')} style={{ cursor: 'pointer' }} />
      <rect x="24" y="105" width="22" height="58" rx="6" {...p('Front Bumper')} strokeWidth="2" />
      <rect x="514" y="105" width="22" height="58" rx="6" {...p('Rear Bumper')} strokeWidth="2" />
      <rect x="46" y="95" width="96" height="90" rx="8" {...p(`Front Guard (${s})`)} strokeWidth="2" />
      <rect x="146" y="95" width="165" height="88" rx="4" {...p(`Front Door (${s})`)} strokeWidth="2" />
      <rect x="315" y="95" width="202" height="88" rx="4" {...p(`Tray Rail (${s})`)} strokeWidth="2" />
      <rect x="313" y="95" width="14" height="88" rx="3" fill="#64748b" />
      <rect x="505" y="95" width="14" height="88" rx="4" {...p('Tailgate')} strokeWidth="2" />
      <rect x="46" y="74" width="92" height="24" rx="4" {...p('Bonnet')} strokeWidth="2" />
      <rect x="138" y="44" width="136" height="10" rx="3" {...p('Roof Panel')} strokeWidth="2" />
      <rect x="136" y="102" width="20" height="16" rx="3" {...p(`Side Mirror (${s})`)} strokeWidth="2" />
      <circle cx="120" cy="186" r="36" fill={WHEEL} /><circle cx="120" cy="186" r="19" fill={WHEEL_RIM} />
      <circle cx="420" cy="186" r="36" fill={WHEEL} /><circle cx="420" cy="186" r="19" fill={WHEEL_RIM} />
      <circle cx="475" cy="186" r="36" fill={WHEEL} /><circle cx="475" cy="186" r="19" fill={WHEEL_RIM} />
      <rect x="30" y="106" width="20" height="20" rx="4" fill="#fef9c3" stroke={damaged.has(`Headlight (${s})`) ? DMG : '#fde68a'} strokeWidth="2" onClick={() => onToggle(`Headlight (${s})`)} style={{ cursor: 'pointer' }} />
      <rect x="510" y="106" width="20" height="20" rx="4" fill="#fecaca" stroke={damaged.has(`Tail Light (${s})`) ? DMG : '#fca5a5'} strokeWidth="2" onClick={() => onToggle(`Tail Light (${s})`)} style={{ cursor: 'pointer' }} />
      <text x="280" y="225" textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="sans-serif">{side} Side View</text>
    </svg>
  );
}

function SideVan({ damaged, onToggle, side }: { damaged: Set<string>; onToggle: (p: string) => void; side: 'Driver' | 'Passenger' }) {
  const s = side;
  const p = (id: string) => ({ fill: damaged.has(id) ? DMG_BG : IDLE_BG, stroke: damaged.has(id) ? DMG : IDLE, onClick: () => onToggle(id), style: { cursor: 'pointer' } });
  return (
    <svg viewBox="0 0 520 230" style={{ width: '100%', display: 'block' }}>
      <rect x="36" y="55" width="448" height="130" rx="10" fill={BODY_C} />
      <rect x="36" y="40" width="200" height="18" rx="6" fill={BODY_C} />
      <rect x="44" y="58" width="148" height="50" rx="4" fill={GLASS} stroke={damaged.has('Front Windscreen') ? DMG : '#93c5fd'} strokeWidth="2" onClick={() => onToggle('Front Windscreen')} style={{ cursor: 'pointer' }} />
      <rect x="24" y="80" width="22" height="70" rx="6" {...p('Front Bumper')} strokeWidth="2" />
      <rect x="474" y="80" width="22" height="70" rx="6" {...p('Rear Bumper')} strokeWidth="2" />
      <rect x="46" y="55" width="110" height="130" rx="8" {...p(`Front Door (${s})`)} strokeWidth="2" />
      <rect x="160" y="55" width="148" height="130" rx="4" {...p(`Sliding Door (${s})`)} strokeWidth="2" />
      <rect x="312" y="55" width="166" height="130" rx="4" {...p(`Side Panel (${s})`)} strokeWidth="2" />
      <rect x="36" y="40" width="200" height="18" rx="6" {...p('Roof Panel')} strokeWidth="2" />
      <rect x="36" y="105" width="22" height="18" rx="3" {...p(`Side Mirror (${s})`)} strokeWidth="2" />
      <circle cx="118" cy="188" r="38" fill={WHEEL} /><circle cx="118" cy="188" r="20" fill={WHEEL_RIM} />
      <circle cx="390" cy="188" r="38" fill={WHEEL} /><circle cx="390" cy="188" r="20" fill={WHEEL_RIM} />
      <circle cx="445" cy="188" r="38" fill={WHEEL} /><circle cx="445" cy="188" r="20" fill={WHEEL_RIM} />
      <rect x="28" y="82" width="22" height="24" rx="4" fill="#fef9c3" stroke={damaged.has(`Headlight (${s})`) ? DMG : '#fde68a'} strokeWidth="2" onClick={() => onToggle(`Headlight (${s})`)} style={{ cursor: 'pointer' }} />
      <rect x="470" y="82" width="22" height="24" rx="4" fill="#fecaca" stroke={damaged.has(`Tail Light (${s})`) ? DMG : '#fca5a5'} strokeWidth="2" onClick={() => onToggle(`Tail Light (${s})`)} style={{ cursor: 'pointer' }} />
      <text x="260" y="225" textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="sans-serif">{side} Side View</text>
    </svg>
  );
}

function TopDownDiagram({ bodyType, damaged, onToggle }: { bodyType: string; damaged: Set<string>; onToggle: (p: string) => void }) {
  if (bodyType === 'Ute') return <TopDownUte damaged={damaged} onToggle={onToggle} />;
  if (bodyType === 'Van' || bodyType === 'Truck') return <TopDownVan damaged={damaged} onToggle={onToggle} />;
  if (bodyType === 'SUV' || bodyType === 'Wagon') return <TopDownSUV damaged={damaged} onToggle={onToggle} />;
  return <TopDownSedan damaged={damaged} onToggle={onToggle} />;
}

function SideDiagram({ bodyType, damaged, onToggle, side }: { bodyType: string; damaged: Set<string>; onToggle: (p: string) => void; side: 'Driver' | 'Passenger' }) {
  if (bodyType === 'Ute') return <SideUte damaged={damaged} onToggle={onToggle} side={side} />;
  if (bodyType === 'Van' || bodyType === 'Truck') return <SideVan damaged={damaged} onToggle={onToggle} side={side} />;
  if (bodyType === 'SUV' || bodyType === 'Wagon') return <SideSUV damaged={damaged} onToggle={onToggle} side={side} />;
  return <SideSedan damaged={damaged} onToggle={onToggle} side={side} />;
}

function DamageSelector({ bodyType, damaged, onToggle, description, onDescriptionChange }: {
  bodyType: string; damaged: Set<string>; onToggle: (p: string) => void;
  description: string; onDescriptionChange: (v: string) => void;
}) {
  const [view, setView] = useState<'top' | 'driver' | 'passenger'>('top');
  const groups = getPanelGroups(bodyType);
  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {(['top', 'driver', 'passenger'] as const).map(v => (
          <button key={v} type="button" onClick={() => setView(v)} style={{
            padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
            border: `1.5px solid ${view === v ? '#01ae42' : '#e2e8f0'}`,
            background: view === v ? '#f0fdf4' : '#fff',
            color: view === v ? '#01ae42' : '#64748b', cursor: 'pointer',
          }}>
            {v === 'top' ? 'Top Down' : v === 'driver' ? 'Driver Side' : 'Passenger Side'}
          </button>
        ))}
      </div>
      <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px', textAlign: 'center' }}>Click panels to mark as damaged</p>
        {view === 'top' && <TopDownDiagram bodyType={bodyType} damaged={damaged} onToggle={onToggle} />}
        {view === 'driver' && <SideDiagram bodyType={bodyType} damaged={damaged} onToggle={onToggle} side="Driver" />}
        {view === 'passenger' && <SideDiagram bodyType={bodyType} damaged={damaged} onToggle={onToggle} side="Passenger" />}
      </div>
      {damaged.size > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Marked as damaged ({damaged.size})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Array.from(damaged).map(panel => (
              <span key={panel} onClick={() => onToggle(panel)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', background: DMG_BG, border: `1px solid ${DMG}`, fontSize: '11px', fontWeight: 500, color: DMG, cursor: 'pointer' }}>
                {panel} ×
              </span>
            ))}
          </div>
        </div>
      )}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Panel Checklist</div>
        {groups.map(group => (
          <div key={group.label} style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>{group.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '5px' }}>
              {group.panels.map(panel => (
                <div key={panel} onClick={() => onToggle(panel)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '7px', cursor: 'pointer', border: `1px solid ${damaged.has(panel) ? DMG : '#e2e8f0'}`, background: damaged.has(panel) ? DMG_BG : '#fff' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0, border: `1.5px solid ${damaged.has(panel) ? DMG : '#cbd5e1'}`, background: damaged.has(panel) ? DMG : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {damaged.has(panel) && <span style={{ color: '#fff', fontSize: '9px', lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '12px', color: damaged.has(panel) ? DMG : '#374151', fontWeight: damaged.has(panel) ? 500 : 400 }}>{panel}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <label style={lbl}>Additional damage notes</label>
        <textarea style={{ ...inp, height: '80px', resize: 'vertical' }} value={description} onChange={e => onDescriptionChange(e.target.value)} placeholder="Describe any additional damage details..." />
      </div>
    </div>
  );
}

// ─── Vehicle types & accident map ─────────────────────────────────────────────

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
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="8" fill={color} fillOpacity="0.12" />
      <g transform="translate(6,4)">
        <rect x="2" y="10" width="20" height="12" rx="3" fill={color} />
        <path d="M6 10 L8 4 L16 4 L18 10 Z" fill={color} fillOpacity="0.85" />
        <rect x="8.5" y="5" width="3.5" height="4.5" rx="1" fill="white" fillOpacity="0.7" />
        <rect x="12.5" y="5" width="3.5" height="4.5" rx="1" fill="white" fillOpacity="0.7" />
        <circle cx="7" cy="22" r="3.5" fill="#1e293b" /><circle cx="7" cy="22" r="1.8" fill="#94a3b8" />
        <circle cx="17" cy="22" r="3.5" fill="#1e293b" /><circle cx="17" cy="22" r="1.8" fill="#94a3b8" />
      </g>
    </svg>
  );
}

function buildMarkerSvg(color: string, text: string): string {
  const display = (text || '?').trim().toUpperCase().slice(0, 7);
  const fontSize = display.length > 5 ? 8 : display.length > 3 ? 10 : 12;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="23" fill="${color}" stroke="white" stroke-width="3"/><text x="26" y="31" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" font-weight="700" fill="white">${display}</text></svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

declare global {
  interface Window { google: any; initGooglePlaces: () => void; _removeMarker: (id: string) => void; }
}

interface PlacedVehicle {
  instanceId: string; typeId: string; label: string; color: string;
  bg: string; border: string; lat: number; lng: number; address: string; displayText: string;
}

function AccidentMap({ onUpdate, nafRego, faultRego, tp1Rego, tp2Rego }: {
  onUpdate: (v: PlacedVehicle[]) => void; nafRego?: string; faultRego?: string; tp1Rego?: string; tp2Rego?: string;
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
      const interval = setInterval(() => { if (window.google?.maps) { setMapsReady(true); clearInterval(interval); } }, 100);
      return () => clearInterval(interval);
    }
    window.initGooglePlaces = () => setMapsReady(true);
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGooglePlaces`;
    script.async = true; script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: -37.8136, lng: 144.9631 }, zoom: 15,
      mapTypeId: 'hybrid', mapTypeControl: true, streetViewControl: false, fullscreenControl: false,
    });
    mapInstanceRef.current = map;
    if (searchRef.current) {
      const ac = new window.google.maps.places.Autocomplete(searchRef.current, { componentRestrictions: { country: 'au' }, fields: ['geometry'] });
      ac.addListener('place_changed', () => { const pl = ac.getPlace(); if (pl.geometry) { map.setCenter(pl.geometry.location); map.setZoom(17); } });
    }
    const mapDiv = mapRef.current;
    mapDiv.addEventListener('dragover', e => e.preventDefault());
    mapDiv.addEventListener('drop', e => {
      e.preventDefault();
      const typeId = dragTypeRef.current;
      if (!typeId || !mapInstanceRef.current) return;
      const rect = mapDiv.getBoundingClientRect();
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const bounds = mapInstanceRef.current.getBounds(); if (!bounds) return;
      const ne = bounds.getNorthEast(); const sw = bounds.getSouthWest();
      const lng = sw.lng() + (x / mapDiv.offsetWidth) * (ne.lng() - sw.lng());
      const lat = ne.lat() - (y / mapDiv.offsetHeight) * (ne.lat() - sw.lat());
      const vType = VEHICLE_TYPES.find(v => v.id === typeId); if (!vType) return;
      addMarker(`${typeId}-${Date.now()}`, vType, new window.google.maps.LatLng(lat, lng), getDisplayText(typeId));
      dragTypeRef.current = null;
    });
  }, [mapsReady]);

  function getDisplayText(typeId: string) {
    if (typeId === 'naf') return nafRego || 'NAF';
    if (typeId === 'fault') return faultRego || 'AF';
    if (typeId === 'tp1') return tp1Rego || 'TP1';
    if (typeId === 'tp2') return tp2Rego || 'TP2';
    if (typeId === 'tp3') return 'TP3';
    if (typeId === 'tp4') return 'TP4';
    return typeId.toUpperCase();
  }

  function addMarker(instanceId: string, vType: typeof VEHICLE_TYPES[0], latLng: any, displayText: string) {
    const map = mapInstanceRef.current; if (!map) return;
    const marker = new window.google.maps.Marker({
      position: latLng, map, draggable: true,
      icon: { url: buildMarkerSvg(vType.color, displayText), scaledSize: new window.google.maps.Size(52, 52), anchor: new window.google.maps.Point(26, 26) },
    });
    markersRef.current[instanceId] = marker;
    const geocoder = new window.google.maps.Geocoder();
    const resolve = (pos: any, cb: (a: string) => void) => geocoder.geocode({ location: pos }, (r: any[], s: string) => cb(s === 'OK' && r[0] ? r[0].formatted_address : `${pos.lat().toFixed(5)}, ${pos.lng().toFixed(5)}`));
    resolve(latLng, address => setPlacedVehicles(prev => [...prev, { instanceId, typeId: vType.id, label: vType.label, color: vType.color, bg: vType.bg, border: vType.border, lat: latLng.lat(), lng: latLng.lng(), address, displayText }]));
    marker.addListener('dragend', () => { const pos = marker.getPosition(); resolve(pos, address => setPlacedVehicles(prev => prev.map(v => v.instanceId === instanceId ? { ...v, lat: pos.lat(), lng: pos.lng(), address } : v))); });
    const iw = new window.google.maps.InfoWindow({ content: `<div style="font-family:sans-serif;padding:4px 0;"><div style="font-weight:600;font-size:13px;margin-bottom:4px;">${vType.label}</div><div style="font-size:12px;color:#64748b;margin-bottom:8px;">${displayText}</div><button onclick="window._removeMarker('${instanceId}')" style="padding:5px 14px;border-radius:6px;border:1px solid #fca5a5;background:#fff;color:#ef4444;font-size:12px;cursor:pointer;">Remove</button></div>` });
    marker.addListener('click', () => iw.open(map, marker));
    window._removeMarker = (id: string) => { const m = markersRef.current[id]; if (m) { m.setMap(null); delete markersRef.current[id]; } iw.close(); setPlacedVehicles(prev => prev.filter(v => v.instanceId !== id)); };
  }

  const paletteTypes = VEHICLE_TYPES.filter(v => visibleTypes.includes(v.id));

  return (
    <div>
      <div style={{ marginBottom: '10px' }}><input ref={searchRef} placeholder="Search for accident location..." style={{ ...inp, width: '100%' }} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '4px' }}>Drag onto map:</span>
        {paletteTypes.map(vType => (
          <div key={vType.id} draggable onDragStart={() => { dragTypeRef.current = vType.id; }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px', border: `1.5px solid ${vType.border}`, background: vType.bg, cursor: 'grab', userSelect: 'none' }}>
            <CarSvg color={vType.color} size={26} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: vType.color }}>{vType.label}</div>
              {getDisplayText(vType.id) !== vType.label && <div style={{ fontSize: '10px', color: vType.color, opacity: 0.8 }}>{getDisplayText(vType.id)}</div>}
            </div>
          </div>
        ))}
        {visibleTypes.length < VEHICLE_TYPES.length && (
          <button type="button" onClick={() => { const next = VEHICLE_TYPES.find(v => !visibleTypes.includes(v.id)); if (next) setVisibleTypes(p => [...p, next.id]); }}
            style={{ padding: '5px 12px', borderRadius: '8px', border: '1.5px dashed #cbd5e1', background: '#fff', color: '#64748b', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
            + Add vehicle
          </button>
        )}
      </div>
      <div ref={mapRef} style={{ width: '100%', height: '380px', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', background: '#f1f5f9' }} />
      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', marginBottom: placedVehicles.length > 0 ? '12px' : '0' }}>Drag a vehicle onto the map to place it. Drag markers to reposition. Click a marker to remove it.</p>
      {placedVehicles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {placedVehicles.map(v => (
            <div key={v.instanceId} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 12px', background: v.bg, border: `1px solid ${v.border}`, borderRadius: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

const TABS = ['Main', 'Customer', 'At Fault', 'Other Party', 'Accident', 'Damages', 'Photos', 'Additional', 'Documents'];

function TabBar({ active, onChange }: { active: number; onChange: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', overflowX: 'auto' }}>
      {TABS.map((t, i) => (
        <button key={t} type="button" onClick={() => onChange(i)} style={{
          padding: '10px 16px', fontSize: '13px', fontWeight: active === i ? 600 : 500,
          color: active === i ? '#01ae42' : '#64748b', background: 'none', border: 'none',
          borderBottom: active === i ? '2px solid #01ae42' : '2px solid transparent',
          marginBottom: '-2px', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>{t}</button>
      ))}
    </div>
  );
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const emptyPerson = { firstName: '', lastName: '', phone: '', email: '', address: '', suburb: '', postcode: '', state: '', licenceNumber: '', licenceState: '', licenceExpiry: '', dob: '', insuranceProvider: '', claimNumber: '' };
const emptyAtFault = { firstName: '', lastName: '', phone: '', email: '', address: '', suburb: '', postcode: '', state: '', vehicleRegistration: '', vehicleState: '', vehicleYear: '', vehicleMake: '', vehicleModel: '', insuranceProvider: '', claimNumber: '' };
const emptyOtherParty = { firstName: '', lastName: '', phone: '', email: '', address: '', suburb: '', postcode: '', state: '', vehicleRegistration: '', vehicleState: '', vehicleYear: '', vehicleMake: '', vehicleModel: '', insuranceProvider: '', claimNumber: '' };

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
  const [partnerName, setPartnerName] = useState('');

  // Tab 1 — Customer
  const [driver, setDriver] = useState({ ...emptyPerson });
  const updDriver = (f: string, v: string) => setDriver(p => ({ ...p, [f]: v }));
  const [nafVehicleRego, setNafVehicleRego] = useState('');
  const [nafVehicleMake, setNafVehicleMake] = useState('');
  const [nafVehicleModel, setNafVehicleModel] = useState('');
  const [nafVehicleYear, setNafVehicleYear] = useState('');
  const [nafVehicleBodyType, setNafVehicleBodyType] = useState('');
  const [validating, setValidating] = useState(false);
  const [scanning, setScanning] = useState(false);
const [scanError, setScanError] = useState('');
const videoRef = useRef<HTMLVideoElement>(null);
const scannerRef = useRef<any>(null);

const stopScanner = () => {
  if (scannerRef.current) {
    scannerRef.current.reset();
    scannerRef.current = null;
  }
  setScanning(false);
  setScanError('');
};

const parseAusLicence = (raw: string) => {
  // Australian PDF417 licences use AAMVA format or state-specific formats
  // Most states encode as tab or newline delimited fields
  const lines = raw.split(/[\n\r\t]+/).map(l => l.trim()).filter(Boolean);
  const result: Record<string, string> = {};

  // Try AAMVA format first (used by most states)
  if (raw.includes('ANSI ') || raw.includes('AAMVA')) {
    const dcs = raw.match(/DCS([^\n\r]+)/)?.[1]?.trim(); // last name
    const dac = raw.match(/DAC([^\n\r]+)/)?.[1]?.trim(); // first name
    const dad = raw.match(/DAD([^\n\r]+)/)?.[1]?.trim(); // middle name
    const dbb = raw.match(/DBB([^\n\r]+)/)?.[1]?.trim(); // DOB MMDDYYYY
    const dag = raw.match(/DAG([^\n\r]+)/)?.[1]?.trim(); // street address
    const dai = raw.match(/DAI([^\n\r]+)/)?.[1]?.trim(); // city/suburb
    const daj = raw.match(/DAJ([^\n\r]+)/)?.[1]?.trim(); // state
    const dak = raw.match(/DAK([^\n\r]+)/)?.[1]?.trim(); // postcode
    const daq = raw.match(/DAQ([^\n\r]+)/)?.[1]?.trim(); // licence number
    const dba = raw.match(/DBA([^\n\r]+)/)?.[1]?.trim(); // expiry MMDDYYYY

    if (dcs) result.lastName = dcs;
    if (dac) result.firstName = dac;
    if (dag) result.address = dag;
    if (dai) result.suburb = dai;
    if (daj) result.state = daj;
    if (daq) result.licenceNumber = daq;

    if (dak) result.postcode = dak.substring(0, 4);

    if (dbb && dbb.length === 8) {
      // MMDDYYYY → YYYY-MM-DD
      result.dob = `${dbb.slice(4)}-${dbb.slice(0, 2)}-${dbb.slice(2, 4)}`;
    }
    if (dba && dba.length === 8) {
      // MMDDYYYY → YYYY-MM-DD
      result.licenceExpiry = `${dba.slice(4)}-${dba.slice(0, 2)}-${dba.slice(2, 4)}`;
    }
    if (daj) {
      // Map state codes to Australian states
      const stateMap: Record<string, string> = { 'VIC': 'VIC', 'NSW': 'NSW', 'QLD': 'QLD', 'WA': 'WA', 'SA': 'SA', 'TAS': 'TAS', 'NT': 'NT', 'ACT': 'ACT' };
      result.licenceState = stateMap[daj] || daj;
    }
  }

  return result;
};

const startScanner = async () => {
  setScanError('');
  setScanning(true);

  // Wait for video element to mount
  await new Promise(r => setTimeout(r, 300));

  if (!videoRef.current) return;

  try {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints);
    scannerRef.current = reader;

    const devices = await BrowserMultiFormatReader.listVideoInputDevices();
    // Prefer rear camera on tablet
    const rearCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment')) || devices[devices.length - 1];

    await reader.decodeFromVideoDevice(rearCamera?.deviceId || null, videoRef.current, (result, err) => {
      if (result) {
        const parsed = parseAusLicence(result.getText());
        if (parsed.licenceNumber || parsed.firstName) {
          // Auto-fill driver fields
          if (parsed.firstName) updDriver('firstName', parsed.firstName);
          if (parsed.lastName) updDriver('lastName', parsed.lastName);
          if (parsed.dob) updDriver('dob', parsed.dob);
          if (parsed.licenceNumber) updDriver('licenceNumber', parsed.licenceNumber);
          if (parsed.licenceState) updDriver('licenceState', parsed.licenceState);
          if (parsed.licenceExpiry) updDriver('licenceExpiry', parsed.licenceExpiry);
          if (parsed.address) updDriver('address', parsed.address);
          if (parsed.suburb) updDriver('suburb', parsed.suburb);
          if (parsed.postcode) updDriver('postcode', parsed.postcode);
          if (parsed.state) updDriver('state', parsed.state);
          stopScanner();
        }
      }
    });
  } catch (e: any) {
    setScanError('Could not access camera. Please check permissions.');
    setScanning(false);
  }
};
  const [owner, setOwner] = useState({ ...emptyPerson });
  const [sameAsDriver, setSameAsDriver] = useState(false);
  const updOwner = (f: string, v: string) => setOwner(p => ({ ...p, [f]: v }));
  const handleSameAsDriver = (checked: boolean) => { setSameAsDriver(checked); setOwner(checked ? { ...driver } : { ...emptyPerson }); };

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

  // Tab 5 — Damages
  const [damagedPanels, setDamagedPanels] = useState<Set<string>>(new Set());
  const [damageDescription, setDamageDescription] = useState('');
  const togglePanel = (panel: string) => setDamagedPanels(prev => { const n = new Set(prev); n.has(panel) ? n.delete(panel) : n.add(panel); return n; });

  // Tab 6 — Photos
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [licencePhoto, setLicencePhoto] = useState<string | null>(null);
  const [regoPhoto, setRegoPhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{ dataUrl: string; caption: string; category: string }[]>([]);
  const missingMandatory = [!licencePhoto && "Driver's Licence", !regoPhoto && 'Vehicle Registration Papers'].filter(Boolean) as string[];

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 20) { alert('Maximum 20 photos allowed.'); return; }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(prev => [...prev, { dataUrl: reader.result as string, caption: '', category: 'General' }]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  const removePhoto = (i: number) => setPhotos(photos.filter((_, idx) => idx !== i));
  const updatePhotoField = (i: number, field: 'caption' | 'category', value: string) =>
    setPhotos(photos.map((p, idx) => idx === i ? { ...p, [field]: value } : p));

  // Tab 7 — Additional
  const [policeReportNo, setPoliceReportNo] = useState('');
  const [policeStation, setPoliceStation] = useState('');
  const [policeOfficerName, setPoliceOfficerName] = useState('');
  const [policeOfficerPhone, setPoliceOfficerPhone] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [witnessPhone, setWitnessPhone] = useState('');
  const [witnessEmail, setWitnessEmail] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
// Action modals
const [showNotesModal, setShowNotesModal] = useState(false);
const [showScheduleModal, setShowScheduleModal] = useState(false);
const [noteText, setNoteText] = useState('');
const [scheduleForm, setScheduleForm] = useState({
  date: '', time: '', jobType: 'DELIVERY', addressType: 'customer',
  customAddress: '', customSuburb: '', customPostcode: '', driverId: '',
});

const { data: drivers = [] } = useQuery({
  queryKey: ['drivers'],
  queryFn: async () => {
    const token = await getToken();
    const res = await api.get('/users', { headers: { Authorization: `Bearer ${token}` } });
    return res.data.filter((u: any) => ['CSE_DRIVER', 'FLEET_COORDINATOR', 'OPS_MANAGER', 'BRANCH_MANAGER'].includes(u.role));
  },
});
  useEffect(() => {
    getToken().then(token => {
      api.get('/reservations/next-number', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setRezNumber(res.data.nextNumber))
        .catch(() => setRezNumber('REZ—'));
    });
  }, []);

  const { data: repairers = [] } = useQuery({
    queryKey: ['repairers'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims/repairers', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (status: string) => {
      const token = await getToken();
      const authorName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Staff';
      const res = await api.post('/reservations', {
        status, authorName, hireType: 'Credit Hire', sourceOfBusiness, startDate, partnerName,
        customer: driver,
        nafVehicle: { registration: nafVehicleRego, make: nafVehicleMake, model: nafVehicleModel, year: nafVehicleYear, bodyType: nafVehicleBodyType },
        registeredOwner: owner, atFault,
        otherParties: [{ ...tp1, role: 'Third Party 1' }, ...(showTp2 ? [{ ...tp2, role: 'Third Party 2' }] : [])],
        accident: { ...accident, vehicles: accidentVehicles },
        damages: { panels: Array.from(damagedPanels), description: damageDescription },
        mandatoryPhotos: { licencePhoto, regoPhoto },
        photos: photos.map(p => ({ dataUrl: p.dataUrl, caption: p.caption, category: p.category })),
        additional: { policeReportNo, policeStation, policeOfficerName, policeOfficerPhone, witnessName, witnessPhone, witnessEmail, additionalNotes },
      }, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reservations'] }); router.push('/dashboard/reservations'); },
  });
  const addNote = useMutation({
    mutationFn: async (reservationId: string) => {
      const token = await getToken();
      const authorName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Staff';
      return api.post(`/reservations/${reservationId}/notes`,
        { note: noteText, authorName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setNoteText(''); setShowNotesModal(false);
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
            <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '6px', padding: '3px 10px', fontSize: '13px', fontWeight: 600, color: '#01ae42', fontFamily: 'monospace' }}>
              {rezNumber}
            </span>
          )}
        </div>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Credit hire intake form</p>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 0 && (
  <SectionBlock title="Booking Details">
    <div style={grid2}>
      <F label="Source *">
        <select style={inp} value={sourceOfBusiness} onChange={e => { setSourceOfBusiness(e.target.value); setPartnerName(''); }}>
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

      {sourceOfBusiness === 'Repairer' && (
        <F label="Repairer *" full>
          <select style={inp} value={partnerName} onChange={e => setPartnerName(e.target.value)}>
            <option value="">Select repairer...</option>
            {repairers.map((r: any) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </F>
      )}

      {sourceOfBusiness === 'Tow Operator' && (
        <F label="Tow operator name *" full>
          <input style={inp} value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder="e.g. Smith's Towing" />
        </F>
      )}
    </div>
  </SectionBlock>
)}

      {/* ── Tab 1: Customer ── */}
      {activeTab === 1 && (
        <>
        {/* Scanner modal */}
{scanning && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
    <div style={{ width: '100%', maxWidth: '500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Scan Driver's Licence</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Point the camera at the barcode on the back of the licence</div>
        </div>
        <button type="button" onClick={stopScanner} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '20px', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      </div>

      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
        <video ref={videoRef} style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }} />
        {/* Targeting overlay */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '80%', height: '80px', border: '2px solid #01ae42', borderRadius: '8px', boxShadow: '0 0 0 1000px rgba(0,0,0,0.4)' }} />
        </div>
        {/* Scanning animation line */}
        <div style={{ position: 'absolute', left: '10%', right: '10%', height: '2px', background: '#01ae42', opacity: 0.8, animation: 'scan 2s linear infinite', top: '50%' }} />
      </div>

      <style>{`@keyframes scan { 0% { transform: translateY(-40px); } 100% { transform: translateY(40px); } }`}</style>

      {scanError && (
        <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#ef4444' }}>
          {scanError}
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
        Scanning automatically — no need to tap anything
      </p>
    </div>
  </div>
)}
          <SectionBlock title="NAF Vehicle">
            <div style={grid3}>
              <F label="Registration"><input style={inp} value={nafVehicleRego} onChange={e => setNafVehicleRego(e.target.value)} placeholder="e.g. ABC123" /></F>
              <F label="Make"><input style={inp} value={nafVehicleMake} onChange={e => setNafVehicleMake(e.target.value)} placeholder="e.g. Toyota" /></F>
              <F label="Model"><input style={inp} value={nafVehicleModel} onChange={e => setNafVehicleModel(e.target.value)} placeholder="e.g. Corolla" /></F>
              <F label="Year"><input style={inp} value={nafVehicleYear} onChange={e => setNafVehicleYear(e.target.value)} placeholder="e.g. 2021" /></F>
              <F label="Body type">
                <select style={inp} value={nafVehicleBodyType} onChange={e => setNafVehicleBodyType(e.target.value)}>
                  <option value="">Select...</option>
                  {BODY_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </F>
              <F label=" ">
                <button type="button"
                  onClick={() => { if (!nafVehicleRego || validating) return; setValidating(true); console.log('Validate rego:', nafVehicleRego); setTimeout(() => setValidating(false), 1000); }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1.5px solid ${nafVehicleRego ? '#01ae42' : '#e2e8f0'}`, background: nafVehicleRego ? '#f0fdf4' : '#f8fafc', color: nafVehicleRego ? '#01ae42' : '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: nafVehicleRego ? 'pointer' : 'not-allowed' }}>
                  {validating ? 'Checking...' : 'Validate'}
                </button>
              </F>
            </div>
          </SectionBlock>

          <SectionBlock title="Customer Details">
  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
    <button type="button" onClick={startScanner}
      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '7px', border: '1.5px solid #01ae42', background: '#f0fdf4', color: '#01ae42', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
      <span style={{ fontSize: '13px' }}>🪪</span> Scan Licence
    </button>
  </div>
  <div style={grid3}>
              <F label="First name *"><input style={inp} value={driver.firstName} onChange={e => updDriver('firstName', e.target.value)} /></F>
              <F label="Last name *"><input style={inp} value={driver.lastName} onChange={e => updDriver('lastName', e.target.value)} /></F>
              <F label="Phone *"><input style={inp} value={driver.phone} onChange={e => updDriver('phone', e.target.value)} /></F>
              <F label="Email" span2><input style={inp} value={driver.email} onChange={e => updDriver('email', e.target.value)} /></F>
              <F label="Date of birth"><input type="date" style={inp} value={driver.dob} onChange={e => updDriver('dob', e.target.value)} /></F>
              <F label="Address" full>
                <AddressAutocomplete value={driver.address} onChange={(v: string) => updDriver('address', v)} onSelect={(r: any) => { updDriver('address', r.address); updDriver('suburb', r.suburb); updDriver('postcode', r.postcode); if (r.state) updDriver('state', r.state); }} style={inp} placeholder="Start typing address..." />
              </F>
              <F label="Suburb"><input style={inp} value={driver.suburb} onChange={e => updDriver('suburb', e.target.value)} /></F>
              <F label="Postcode"><input style={inp} value={driver.postcode} onChange={e => updDriver('postcode', e.target.value)} /></F>
              <F label="State"><select style={inp} value={driver.state} onChange={e => updDriver('state', e.target.value)}><option value="">Select...</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
              <F label="Licence number"><input style={inp} value={driver.licenceNumber} onChange={e => updDriver('licenceNumber', e.target.value)} /></F>
              <F label="Licence state"><select style={inp} value={driver.licenceState} onChange={e => updDriver('licenceState', e.target.value)}><option value="">Select...</option>{LICENCE_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
              <F label="Licence expiry"><input type="date" style={inp} value={driver.licenceExpiry} onChange={e => updDriver('licenceExpiry', e.target.value)} /></F>
            </div>
          </SectionBlock>

          <SectionBlock title="Registered Owner">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>
                <input type="checkbox" checked={sameAsDriver} onChange={e => handleSameAsDriver(e.target.checked)} />
                Same as driver
              </label>
            </div>
            <div style={grid3}>
              <F label="First name"><input style={inp} value={owner.firstName} onChange={e => updOwner('firstName', e.target.value)} /></F>
              <F label="Last name"><input style={inp} value={owner.lastName} onChange={e => updOwner('lastName', e.target.value)} /></F>
              <F label="Phone"><input style={inp} value={owner.phone} onChange={e => updOwner('phone', e.target.value)} /></F>
              <F label="Email" span2><input style={inp} value={owner.email} onChange={e => updOwner('email', e.target.value)} /></F>
              <F label="Date of birth"><input type="date" style={inp} value={owner.dob} onChange={e => updOwner('dob', e.target.value)} /></F>
              <F label="Address" full>
                <AddressAutocomplete value={owner.address} onChange={(v: string) => updOwner('address', v)} onSelect={(r: any) => { updOwner('address', r.address); updOwner('suburb', r.suburb); updOwner('postcode', r.postcode); if (r.state) updOwner('state', r.state); }} style={inp} placeholder="Start typing address..." />
              </F>
              <F label="Suburb"><input style={inp} value={owner.suburb} onChange={e => updOwner('suburb', e.target.value)} /></F>
              <F label="Postcode"><input style={inp} value={owner.postcode} onChange={e => updOwner('postcode', e.target.value)} /></F>
              <F label="State"><select style={inp} value={owner.state} onChange={e => updOwner('state', e.target.value)}><option value="">Select...</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
            </div>
          </SectionBlock>
          <SectionBlock title="Insurance Details">
          <div style={grid2}>
            <F label="Insurance provider">
              <input style={inp} value={driver.insuranceProvider || ''} onChange={e => updDriver('insuranceProvider', e.target.value)} placeholder="e.g. AAMI, NRMA, Allianz" />
            </F>
            <F label="Claim number">
              <input style={inp} value={driver.claimNumber || ''} onChange={e => updDriver('claimNumber', e.target.value)} placeholder="e.g. CLM-123456" />
            </F>
          </div>
        </SectionBlock>          
        </>
      )}

      {/* ── Tab 2: At Fault ── */}
      {activeTab === 2 && (
        <>
          <SectionBlock title="At Fault Vehicle">
            <div style={grid3}>
              <F label="Registration"><input style={inp} value={atFault.vehicleRegistration} onChange={e => updAtFault('vehicleRegistration', e.target.value)} /></F>
              <F label="State"><select style={inp} value={atFault.vehicleState} onChange={e => updAtFault('vehicleState', e.target.value)}><option value="">Select...</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
              <F label="Year"><input style={inp} value={atFault.vehicleYear} onChange={e => updAtFault('vehicleYear', e.target.value)} placeholder="e.g. 2021" /></F>
              <F label="Make"><input style={inp} value={atFault.vehicleMake} onChange={e => updAtFault('vehicleMake', e.target.value)} /></F>
              <F label="Model"><input style={inp} value={atFault.vehicleModel} onChange={e => updAtFault('vehicleModel', e.target.value)} /></F>
              <F label=" ">
                <button type="button"
                  onClick={() => { if (!atFault.vehicleRegistration || validatingAtFault) return; setValidatingAtFault(true); console.log('Validate at fault rego:', atFault.vehicleRegistration); setTimeout(() => setValidatingAtFault(false), 1000); }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1.5px solid ${atFault.vehicleRegistration ? '#01ae42' : '#e2e8f0'}`, background: atFault.vehicleRegistration ? '#f0fdf4' : '#f8fafc', color: atFault.vehicleRegistration ? '#01ae42' : '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: atFault.vehicleRegistration ? 'pointer' : 'not-allowed' }}>
                  {validatingAtFault ? 'Checking...' : 'Validate'}
                </button>
              </F>
            </div>
          </SectionBlock>
          <SectionBlock title="At Fault Party">
            <div style={grid3}>
              <F label="First name"><input style={inp} value={atFault.firstName} onChange={e => updAtFault('firstName', e.target.value)} /></F>
              <F label="Last name"><input style={inp} value={atFault.lastName} onChange={e => updAtFault('lastName', e.target.value)} /></F>
              <F label="Phone"><input style={inp} value={atFault.phone} onChange={e => updAtFault('phone', e.target.value)} /></F>
              <F label="Email"><input style={inp} value={atFault.email} onChange={e => updAtFault('email', e.target.value)} /></F>
              <F label="Insurance provider"><input style={inp} value={atFault.insuranceProvider} onChange={e => updAtFault('insuranceProvider', e.target.value)} /></F>
              <F label="Claim number"><input style={inp} value={atFault.claimNumber} onChange={e => updAtFault('claimNumber', e.target.value)} /></F>
              <F label="Address" full>
                <AddressAutocomplete value={atFault.address} onChange={(v: string) => updAtFault('address', v)} onSelect={(r: any) => { updAtFault('address', r.address); updAtFault('suburb', r.suburb); updAtFault('postcode', r.postcode); if (r.state) updAtFault('state', r.state); }} style={inp} placeholder="Start typing address..." />
              </F>
              <F label="Suburb"><input style={inp} value={atFault.suburb} onChange={e => updAtFault('suburb', e.target.value)} /></F>
              <F label="Postcode"><input style={inp} value={atFault.postcode} onChange={e => updAtFault('postcode', e.target.value)} /></F>
              <F label="State"><select style={inp} value={atFault.state} onChange={e => updAtFault('state', e.target.value)}><option value="">Select...</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
            </div>
          </SectionBlock>
        </>
      )}

      {/* ── Tab 3: Other Party ── */}
      {activeTab === 3 && (
        <>
          <SectionBlock title="Third Party 1 — Vehicle">
            <div style={grid3}>
              <F label="Registration"><input style={inp} value={tp1.vehicleRegistration} onChange={e => updTp1('vehicleRegistration', e.target.value)} /></F>
              <F label="State"><select style={inp} value={tp1.vehicleState} onChange={e => updTp1('vehicleState', e.target.value)}><option value="">Select...</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
              <F label="Year"><input style={inp} value={tp1.vehicleYear} onChange={e => updTp1('vehicleYear', e.target.value)} placeholder="e.g. 2021" /></F>
              <F label="Make"><input style={inp} value={tp1.vehicleMake} onChange={e => updTp1('vehicleMake', e.target.value)} /></F>
              <F label="Model"><input style={inp} value={tp1.vehicleModel} onChange={e => updTp1('vehicleModel', e.target.value)} /></F>
              <F label="Claim number"><input style={inp} value={tp1.claimNumber} onChange={e => updTp1('claimNumber', e.target.value)} /></F>
            </div>
          </SectionBlock>
          <SectionBlock title="Third Party 1 — Person">
            <div style={grid3}>
              <F label="First name"><input style={inp} value={tp1.firstName} onChange={e => updTp1('firstName', e.target.value)} /></F>
              <F label="Last name"><input style={inp} value={tp1.lastName} onChange={e => updTp1('lastName', e.target.value)} /></F>
              <F label="Phone"><input style={inp} value={tp1.phone} onChange={e => updTp1('phone', e.target.value)} /></F>
              <F label="Email"><input style={inp} value={tp1.email} onChange={e => updTp1('email', e.target.value)} /></F>
              <F label="Insurance provider"><input style={inp} value={tp1.insuranceProvider} onChange={e => updTp1('insuranceProvider', e.target.value)} /></F>
              <F label="Address" full>
                <AddressAutocomplete value={tp1.address} onChange={(v: string) => updTp1('address', v)} onSelect={(r: any) => { updTp1('address', r.address); updTp1('suburb', r.suburb); updTp1('postcode', r.postcode); if (r.state) updTp1('state', r.state); }} style={inp} placeholder="Start typing address..." />
              </F>
              <F label="Suburb"><input style={inp} value={tp1.suburb} onChange={e => updTp1('suburb', e.target.value)} /></F>
              <F label="Postcode"><input style={inp} value={tp1.postcode} onChange={e => updTp1('postcode', e.target.value)} /></F>
              <F label="State"><select style={inp} value={tp1.state} onChange={e => updTp1('state', e.target.value)}><option value="">Select...</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
            </div>
          </SectionBlock>

          {!showTp2 ? (
            <button type="button" onClick={() => setShowTp2(true)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px dashed #cbd5e1', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer', marginBottom: '16px' }}>
              + Add Third Party 2
            </button>
          ) : (
            <>
              <SectionBlock title="Third Party 2 — Vehicle">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                  <button type="button" onClick={() => setShowTp2(false)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
                </div>
                <div style={grid3}>
                  <F label="Registration"><input style={inp} value={tp2.vehicleRegistration} onChange={e => updTp2('vehicleRegistration', e.target.value)} /></F>
                  <F label="State"><select style={inp} value={tp2.vehicleState} onChange={e => updTp2('vehicleState', e.target.value)}><option value="">Select...</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
                  <F label="Year"><input style={inp} value={tp2.vehicleYear} onChange={e => updTp2('vehicleYear', e.target.value)} placeholder="e.g. 2021" /></F>
                  <F label="Make"><input style={inp} value={tp2.vehicleMake} onChange={e => updTp2('vehicleMake', e.target.value)} /></F>
                  <F label="Model"><input style={inp} value={tp2.vehicleModel} onChange={e => updTp2('vehicleModel', e.target.value)} /></F>
                  <F label="Claim number"><input style={inp} value={tp2.claimNumber} onChange={e => updTp2('claimNumber', e.target.value)} /></F>
                </div>
              </SectionBlock>
              <SectionBlock title="Third Party 2 — Person">
                <div style={grid3}>
                  <F label="First name"><input style={inp} value={tp2.firstName} onChange={e => updTp2('firstName', e.target.value)} /></F>
                  <F label="Last name"><input style={inp} value={tp2.lastName} onChange={e => updTp2('lastName', e.target.value)} /></F>
                  <F label="Phone"><input style={inp} value={tp2.phone} onChange={e => updTp2('phone', e.target.value)} /></F>
                  <F label="Email"><input style={inp} value={tp2.email} onChange={e => updTp2('email', e.target.value)} /></F>
                  <F label="Insurance provider"><input style={inp} value={tp2.insuranceProvider} onChange={e => updTp2('insuranceProvider', e.target.value)} /></F>
                  <F label="Address" full>
                    <AddressAutocomplete value={tp2.address} onChange={(v: string) => updTp2('address', v)} onSelect={(r: any) => { updTp2('address', r.address); updTp2('suburb', r.suburb); updTp2('postcode', r.postcode); if (r.state) updTp2('state', r.state); }} style={inp} placeholder="Start typing address..." />
                  </F>
                  <F label="Suburb"><input style={inp} value={tp2.suburb} onChange={e => updTp2('suburb', e.target.value)} /></F>
                  <F label="Postcode"><input style={inp} value={tp2.postcode} onChange={e => updTp2('postcode', e.target.value)} /></F>
                  <F label="State"><select style={inp} value={tp2.state} onChange={e => updTp2('state', e.target.value)}><option value="">Select...</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
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
              <F label="Date of accident"><input type="date" style={inp} value={accident.date} onChange={e => updAccident('date', e.target.value)} /></F>
              <F label="Street / location"><input style={inp} value={accident.location} onChange={e => updAccident('location', e.target.value)} placeholder="e.g. Flinders St & Swanston St" /></F>
              <F label="Suburb"><input style={inp} value={accident.suburb} onChange={e => updAccident('suburb', e.target.value)} /></F>
              <F label="Description" full>
                <textarea style={{ ...inp, height: '80px', resize: 'vertical' }} value={accident.description} onChange={e => updAccident('description', e.target.value)} placeholder="Brief description of what happened..." />
              </F>
            </div>
          </SectionBlock>
          <SectionBlock title="Vehicle Positions">
            <AccidentMap onUpdate={setAccidentVehicles} nafRego={nafVehicleRego} faultRego={atFault.vehicleRegistration} tp1Rego={tp1.vehicleRegistration} tp2Rego={tp2.vehicleRegistration} />
          </SectionBlock>
        </>
      )}

      {/* ── Tab 5: Damages ── */}
      {activeTab === 5 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '16px' }}>
            <CarSvg color="#01ae42" size={32} />
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', flex: 1 }}>
              {[{ label: 'Rego', value: nafVehicleRego || '—' }, { label: 'Make', value: nafVehicleMake || '—' }, { label: 'Model', value: nafVehicleModel || '—' }, { label: 'Year', value: nafVehicleYear || '—' }, { label: 'Body', value: nafVehicleBodyType || '—' }].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{value}</div>
                </div>
              ))}
            </div>
            {!nafVehicleRego && !nafVehicleMake && <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 500 }}>Fill in Customer tab first</span>}
          </div>
          <SectionBlock title="Damage Selector">
            <DamageSelector bodyType={nafVehicleBodyType} damaged={damagedPanels} onToggle={togglePanel} description={damageDescription} onDescriptionChange={setDamageDescription} />
          </SectionBlock>
        </>
      )}

      {/* ── Tab 6: Photos ── */}
      {activeTab === 6 && (
        <>
          {missingMandatory.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e' }}>Required photos missing</div>
                <div style={{ fontSize: '11px', color: '#92400e', marginTop: '1px' }}>{missingMandatory.join(' and ')} {missingMandatory.length === 1 ? 'is' : 'are'} required</div>
              </div>
            </div>
          )}
          <SectionBlock title="Required Documents">
            <div style={grid2}>
              <MandatoryPhotoSlot label="Driver's Licence" description="Front of the customer's licence" icon="🪪" value={licencePhoto} onChange={setLicencePhoto} onClear={() => setLicencePhoto(null)} />
              <MandatoryPhotoSlot label="Vehicle Registration Papers" description="Current registration certificate" icon="📄" value={regoPhoto} onChange={setRegoPhoto} onClear={() => setRegoPhoto(null)} />
            </div>
          </SectionBlock>
          <SectionBlock title="Additional Photos">
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" multiple onChange={handlePhotoCapture} style={{ display: 'none' }} />
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoCapture} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={photos.length >= 20}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1.5px dashed #86efac', background: '#f0fdf4', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: photos.length >= 20 ? 'not-allowed' : 'pointer', textAlign: 'center', opacity: photos.length >= 20 ? 0.5 : 1 }}>
                📷 Take photo
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={photos.length >= 20}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1.5px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: photos.length >= 20 ? 'not-allowed' : 'pointer', textAlign: 'center', opacity: photos.length >= 20 ? 0.5 : 1 }}>
                📁 Upload photo
              </button>
            </div>
            {photos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', border: '1.5px dashed #e2e8f0', borderRadius: '10px', color: '#94a3b8' }}>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>📷</div>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '3px', color: '#64748b' }}>No additional photos yet</div>
                <div style={{ fontSize: '11px' }}>Take or upload damage, vehicle or scene photos — up to 20</div>
              </div>
            )}
            {photos.length > 0 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {photos.map((photo, i) => (
                    <div key={i} style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={photo.dataUrl} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                        <button type="button" onClick={() => removePhoto(i)}
                          style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', color: '#fff', fontWeight: 500 }}>{photo.category}</div>
                      </div>
                      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <select value={photo.category} onChange={e => updatePhotoField(i, 'category', e.target.value)} style={{ ...inp, fontSize: '11px', padding: '5px 8px' }}>
                          {PHOTO_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input style={{ ...inp, fontSize: '11px', padding: '5px 8px' }} placeholder="Caption (optional)" value={photo.caption} onChange={e => updatePhotoField(i, 'caption', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>{photos.length} / 20 photos</div>
              </>
            )}
          </SectionBlock>
        </>
      )}

      {/* ── Tab 7: Additional ── */}
      {activeTab === 7 && (
        <>
          <SectionBlock title="Police Report">
            <div style={grid3}>
              <F label="Report number">
                <input style={inp} value={policeReportNo} onChange={e => setPoliceReportNo(e.target.value)} placeholder="e.g. E12345678" />
              </F>
              <F label="Police station">
                <input style={inp} value={policeStation} onChange={e => setPoliceStation(e.target.value)} placeholder="e.g. Melbourne Central" />
              </F>
              <F label="Officer name">
                <input style={inp} value={policeOfficerName} onChange={e => setPoliceOfficerName(e.target.value)} />
              </F>
              <F label="Officer phone">
                <input style={inp} value={policeOfficerPhone} onChange={e => setPoliceOfficerPhone(e.target.value)} />
              </F>
            </div>
          </SectionBlock>

          <SectionBlock title="Witness Details">
            <div style={grid3}>
              <F label="Witness name">
                <input style={inp} value={witnessName} onChange={e => setWitnessName(e.target.value)} />
              </F>
              <F label="Witness phone">
                <input style={inp} value={witnessPhone} onChange={e => setWitnessPhone(e.target.value)} />
              </F>
              <F label="Witness email">
                <input style={inp} value={witnessEmail} onChange={e => setWitnessEmail(e.target.value)} />
              </F>
            </div>
          </SectionBlock>

          <SectionBlock title="Additional Notes">
            <textarea
              style={{ ...inp, height: '120px', resize: 'vertical' }}
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              placeholder="Any other relevant details about the accident or claim..."
            />
          </SectionBlock>
        </>
      )}

     {/* ── Tab 8: Documents ── */}
     {activeTab === 8 && (
        <>
          <SectionBlock title="Authority to Act">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', border: '1.5px dashed #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
              <span style={{ fontSize: '28px' }}>📋</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '3px' }}>Authority to Act</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Available to sign once the reservation is on hire. Customer and accident details will be pre-filled automatically.</div>
              </div>
            </div>
          </SectionBlock>
          <SectionBlock title="Rental Agreement">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', border: '1.5px dashed #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
              <span style={{ fontSize: '28px' }}>📝</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '3px' }}>Rental Agreement</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Available to sign once the reservation is on hire. Vehicle and hire details will be pre-filled automatically.</div>
              </div>
            </div>
          </SectionBlock>
        </>
      )}

      {/* ── Notes Modal ── */}
      {showNotesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
          <div style={{ background: '#fff', width: '100%', borderRadius: '20px 20px 0 0', padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Add Note</h2>
              <button onClick={() => setShowNotesModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
              Notes are saved against the reservation and visible across all pages.
            </p>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Log a call attempt, update, or any relevant note..."
              style={{ ...inp, height: '120px', resize: 'vertical', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowNotesModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!noteText.trim()) return;
                  const result = await mutation.mutateAsync('PENDING');
                  if (result?.id) await addNote.mutateAsync(result.id);
                }}
                disabled={!noteText.trim() || mutation.isPending || addNote.isPending}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: noteText.trim() ? '#01ae42' : '#e2e8f0', color: noteText.trim() ? '#fff' : '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: noteText.trim() ? 'pointer' : 'not-allowed' }}>
                {mutation.isPending || addNote.isPending ? 'Saving...' : 'Save & Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Modal ── */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Add to Schedule</h2>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={grid2}>
                <div>
                  <label style={lbl}>Date *</label>
                  <input type="date" style={inp} value={scheduleForm.date} onChange={e => setScheduleForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Time *</label>
                  <input type="time" style={inp} value={scheduleForm.time} onChange={e => setScheduleForm(p => ({ ...p, time: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={lbl}>Job type</label>
                <select style={inp} value={scheduleForm.jobType} onChange={e => setScheduleForm(p => ({ ...p, jobType: e.target.value }))}>
                  <option value="DELIVERY">Delivery</option>
                  <option value="RETURN">Return</option>
                  <option value="EXCHANGE">Exchange</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Delivery address</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { value: 'customer', label: '🏠 Customer home address', sub: driver.address ? `${driver.address}, ${driver.suburb}` : 'Not yet entered' },
                    { value: 'repairer', label: '🔧 Repair shop', sub: partnerName || 'Select repairer on Main tab first' },
                    { value: 'other', label: '📍 Other address', sub: 'Enter manually' },
                  ].map(opt => (
                    <div key={opt.value} onClick={() => setScheduleForm(p => ({ ...p, addressType: opt.value }))}
                      style={{ padding: '10px 14px', borderRadius: '8px', border: `1.5px solid ${scheduleForm.addressType === opt.value ? '#01ae42' : '#e2e8f0'}`, background: scheduleForm.addressType === opt.value ? '#f0fdf4' : '#fff', cursor: 'pointer' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{opt.label}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{opt.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
              {scheduleForm.addressType === 'other' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label style={lbl}>Street address</label>
                    <input style={inp} value={scheduleForm.customAddress} onChange={e => setScheduleForm(p => ({ ...p, customAddress: e.target.value }))} placeholder="e.g. 123 Smith Street" />
                  </div>
                  <div style={grid2}>
                    <div>
                      <label style={lbl}>Suburb</label>
                      <input style={inp} value={scheduleForm.customSuburb} onChange={e => setScheduleForm(p => ({ ...p, customSuburb: e.target.value }))} />
                    </div>
                    <div>
                      <label style={lbl}>Postcode</label>
                      <input style={inp} value={scheduleForm.customPostcode} onChange={e => setScheduleForm(p => ({ ...p, customPostcode: e.target.value }))} />
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label style={lbl}>Assign driver (optional)</label>
                <select style={inp} value={scheduleForm.driverId} onChange={e => setScheduleForm(p => ({ ...p, driverId: e.target.value }))}>
                  <option value="">Unassigned — assign later</option>
                  {drivers.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowScheduleModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                disabled={!scheduleForm.date || !scheduleForm.time || mutation.isPending}
                onClick={async () => {
                  if (!scheduleForm.date || !scheduleForm.time) return;
                  const result = await mutation.mutateAsync('PENDING');
                  if (!result?.id) return;
                  const resolvedAddress =
                    scheduleForm.addressType === 'customer' ? { address: driver.address, suburb: driver.suburb } :
                    scheduleForm.addressType === 'repairer' ? { address: partnerName, suburb: '' } :
                    { address: scheduleForm.customAddress, suburb: scheduleForm.customSuburb };
                  const token = await getToken();
                  await api.post(`/reservations/${result.id}/schedule`, {
                    scheduledAt: `${scheduleForm.date}T${scheduleForm.time}:00`,
                    jobType: scheduleForm.jobType,
                    address: resolvedAddress.address,
                    suburb: resolvedAddress.suburb,
                    postcode: scheduleForm.customPostcode || driver.postcode || '',
                    driverId: scheduleForm.driverId || undefined,
                  }, { headers: { Authorization: `Bearer ${token}` } });
                  setShowScheduleModal(false);
                  queryClient.invalidateQueries({ queryKey: ['reservations'] });
                  router.push('/dashboard/reservations');
                }}
                style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', background: !scheduleForm.date || !scheduleForm.time ? '#e2e8f0' : '#01ae42', color: !scheduleForm.date || !scheduleForm.time ? '#94a3b8' : '#fff', fontSize: '13px', fontWeight: 600, cursor: !scheduleForm.date || !scheduleForm.time ? 'not-allowed' : 'pointer' }}>
                {mutation.isPending ? 'Saving...' : 'Save & Add to Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: '10px', paddingBottom: '40px', marginTop: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard/reservations')}
          style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
          Cancel
        </button>

        <div style={{ flex: 1 }} />

        <button onClick={() => setShowNotesModal(true)}
          style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📝 Notes
        </button>

        <button
          onClick={() => {
            console.log('Send email — Resend not configured yet');
            alert('Email sending will be available once Resend is configured.');
          }}
          style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #3b82f6', background: '#eff6ff', color: '#3b82f6', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ✉️ Send Email
        </button>

        <button onClick={() => setShowScheduleModal(true)}
          style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #f59e0b', background: '#fffbeb', color: '#d97706', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🗓 Add to Schedule
        </button>

        <button onClick={() => mutation.mutate('PENDING')} disabled={mutation.isPending}
          style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: mutation.isPending ? 0.7 : 1 }}>
          {mutation.isPending ? 'Saving...' : 'Create Reservation'}
        </button>
      </div>
    </div>
  );
}