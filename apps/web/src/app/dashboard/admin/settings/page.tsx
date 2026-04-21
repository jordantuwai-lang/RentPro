'use client';
import { useTheme, themes, Theme } from '@/context/ThemeContext';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Settings</h1>
      <p style={{ color: '#64748b', marginBottom: '32px' }}>Customise the look and feel of RentPro.</p>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', maxWidth: '720px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Colour Theme</h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Choose a theme for the sidebar and accent colours. Your preference is saved to this browser.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {(Object.entries(themes) as [Theme, typeof themes[Theme]][]).map(([key, t]) => {
            const active = theme === key;
            const isLight = t.light === true;
            const logoBaseColor = isLight ? '#0f172a' : '#fff';
            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                style={{
                  border: active ? `2px solid ${t.accent}` : '2px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: '#fff',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? `0 0 0 3px ${t.accent}22` : 'none',
                }}
              >
                {/* Preview mini-sidebar */}
                <div style={{ display: 'flex', height: '80px' }}>
                  <div style={{
                    width: '56px',
                    background: t.sidebar,
                    border: isLight ? `1px solid ${t.sidebarBorder}` : 'none',
                    padding: '10px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                  }}>
                    <div style={{ fontSize: '8px', fontWeight: 800, color: logoBaseColor }}>
                      R<span style={{ color: t.logo }}>P</span>
                    </div>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{
                        height: '6px',
                        borderRadius: '3px',
                        background: i === 1 ? t.accent : (isLight ? '#cbd5e1' : t.navText + '44'),
                        width: i === 1 ? '80%' : '60%',
                      }} />
                    ))}
                  </div>
                  <div style={{ flex: 1, background: '#f8fafc', padding: '10px' }}>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '3px', width: '60%', marginBottom: '6px' }} />
                    <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', width: '40%', marginBottom: '10px' }} />
                    <div style={{ height: '20px', background: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 6px' }}>
                      <div style={{ height: '6px', width: '30%', background: t.accent, borderRadius: '2px' }} />
                    </div>
                  </div>
                </div>
                {/* Label row */}
                <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{t.name}</div>
                  {active && (
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: t.accentText, fontWeight: 700 }}>✓</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
