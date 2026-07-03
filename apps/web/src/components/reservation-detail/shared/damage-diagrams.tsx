'use client';
import { useState } from 'react';
import { inp, lbl } from './styles';

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

export function DamageSelector({ bodyType, damaged, onToggle, description, onDescriptionChange }: {
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
