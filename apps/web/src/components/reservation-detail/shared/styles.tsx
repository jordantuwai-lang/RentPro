import type { CSSProperties, ReactNode } from 'react';

export const inp: CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '13px', color: '#0f172a',
  background: '#fff', boxSizing: 'border-box',
};
export const lbl: CSSProperties = {
  fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px', display: 'block',
};
export const sectionBox: CSSProperties = {
  background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
  padding: '16px', marginBottom: '16px',
};
export const sectionTitle: CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: '#64748b', margin: '0 0 12px',
  textTransform: 'uppercase', letterSpacing: '0.1em',
};
export const grid2: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
export const grid3: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' };
export const fullSpan: CSSProperties = { gridColumn: '1 / -1' };

// ── Dense row styles (TSD-style label-left layout, used on Main tab only) ──
export const cinp: CSSProperties = {
  width: '100%', padding: '3px 5px', border: '1px solid #cbd5e1',
  borderRadius: '3px', fontSize: '12px', color: '#0f172a',
  background: '#fff', boxSizing: 'border-box',
};
export const rowStyle: CSSProperties = {
  display: 'grid', gridTemplateColumns: '100px 1fr',
  alignItems: 'center', gap: '1px 4px', marginBottom: '3px',
};
export const rowLbl: CSSProperties = {
  fontSize: '11px', fontWeight: 500, color: '#374151',
  textAlign: 'right' as const, paddingRight: '6px', whiteSpace: 'nowrap' as const,
};
export const colHdr: CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#fff',
  background: '#475569', padding: '3px 8px', marginBottom: '6px',
  borderRadius: '3px', letterSpacing: '0.04em',
};

export function R({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={rowStyle}>
      <span style={rowLbl}>{label}</span>
      <div>{children}</div>
    </div>
  );
}

export function F({ label, children, full, span2 }: {
  label: string; children: ReactNode; full?: boolean; span2?: boolean;
}) {
  return (
    <div style={full ? fullSpan : span2 ? { gridColumn: 'span 2' } : {}}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

export function SectionBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={sectionBox}>
      <h3 style={sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

export const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
export const LICENCE_STATES = ['International', ...STATES];
export const BODY_TYPES = ['Sedan', 'Hatchback', 'SUV', 'Ute', 'Van', 'Wagon', 'Coupe', 'Convertible', 'Truck', 'Other'];
export const PHOTO_CATEGORIES = ['General', 'Front', 'Rear', 'Driver Side', 'Passenger Side', 'Interior', 'Damage', 'Other'];
