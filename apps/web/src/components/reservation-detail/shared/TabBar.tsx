'use client';

export function TabBar({ tabs, active, onChange }: { tabs: { key: string; label: string }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', overflowX: 'auto' }}>
      {tabs.map(t => (
        <button key={t.key} type="button" onClick={() => onChange(t.key)} style={{
          padding: '10px 16px', fontSize: '13px', fontWeight: active === t.key ? 600 : 500,
          color: active === t.key ? '#01ae42' : '#64748b', background: 'none', border: 'none',
          borderBottom: active === t.key ? '2px solid #01ae42' : '2px solid transparent',
          marginBottom: '-2px', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>{t.label}</button>
      ))}
    </div>
  );
}
