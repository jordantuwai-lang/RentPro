'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { useBranch } from '@/context/BranchContext';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: '▦' },
  { label: 'Reservations', href: '/dashboard/reservations', icon: '📋' },
  { label: 'Schedule', href: '/dashboard/logistics', icon: '🚚' },
  { label: 'On Hired', href: '/dashboard/on-hire', icon: '🔑' },
  { label: 'Claims', href: '/dashboard/claims', icon: '📁' },
  { label: 'Recoveries', href: '/dashboard/recoveries', icon: '🔄' },
  { label: 'Fleet', href: '/dashboard/fleet', icon: '🚗' },
  { label: 'Reports', href: '/dashboard/reports', icon: '📊' },
];

const financeNav = [
  { label: 'Payments', href: '/dashboard/payments', icon: '💳' },
  { label: 'Invoicing', href: '/dashboard/invoicing', icon: '🧾' },
];

const adminNav = [
  { label: 'Partners', href: '/dashboard/partners', icon: '🤝' },
  { label: 'Users', href: '/dashboard/admin/users', icon: '👥' },
  { label: 'Branches', href: '/dashboard/admin/branches', icon: '🏢' },
  { label: 'Documents', href: '/dashboard/admin/documents', icon: '📄' },
  { label: 'Rates', href: '/dashboard/admin/rates', icon: '💲' },
  { label: 'Settings', href: '/dashboard/admin/settings', icon: '🎨' },
];

function SectionHeader({ label, icon, isOpen, onClick, navText }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '10px 12px', borderRadius: '8px',
        background: 'transparent', color: navText, border: 'none',
        fontSize: '14px', fontWeight: 500, cursor: 'pointer', textAlign: 'left'
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        {label}
      </span>
      <span style={{ fontSize: '10px', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}>▼</span>
    </button>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { selectedBranch, setSelectedBranch } = useBranch();
  const { config } = useTheme();

  const [hovered, setHovered] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(pathname.includes('/admin') || pathname.includes('/partners'));
  const [financeOpen, setFinanceOpen] = useState(pathname.includes('/payments') || pathname.includes('/invoicing'));

  const isAdmin = user?.publicMetadata?.role === 'ADMIN';
  const isLight = config.light === true;

  // In light mode: logo text is dark, "Pro" is accent green
  const logoBaseColor = isLight ? '#0f172a' : '#fff';

  const linkStyle = (href: string, isSubItem = false): React.CSSProperties => {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
    const isHovered = hovered === href;
    return {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: isSubItem ? '8px 12px' : '10px 12px',
      borderRadius: '8px', marginBottom: '4px',
      background: active ? config.accent : (isHovered ? config.accentHover : 'transparent'),
      color: active ? config.accentText : config.navText,
      textDecoration: 'none',
      fontSize: isSubItem ? '13px' : '14px',
      fontWeight: active ? 600 : 400,
      transition: 'all 0.2s ease',
    };
  };

  return (
    <div style={{
      width: '240px', height: '100vh', background: config.sidebar,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'sticky', top: 0,
      borderRight: `1px solid ${config.sidebarBorder}`,
      boxShadow: isLight ? '2px 0 8px rgba(0,0,0,0.06)' : 'none',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: `1px solid ${config.sidebarBorder}` }}>
        <div style={{ fontSize: '24px', fontWeight: '800', color: logoBaseColor, letterSpacing: '-0.5px' }}>
          Rent<span style={{ color: config.logo }}>Pro</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {nav.map((item) => (
          <Link key={item.href} href={item.href} style={linkStyle(item.href)}
            onMouseEnter={() => setHovered(item.href)} onMouseLeave={() => setHovered(null)}>
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div style={{ marginTop: '12px' }}>
          <SectionHeader label="Finance" icon="💰" isOpen={financeOpen} navText={config.navText} onClick={() => setFinanceOpen(!financeOpen)} />
          {financeOpen && (
            <div style={{ paddingLeft: '12px', marginTop: '4px' }}>
              {financeNav.map((item) => (
                <Link key={item.href} href={item.href} style={linkStyle(item.href, true)}
                  onMouseEnter={() => setHovered(item.href)} onMouseLeave={() => setHovered(null)}>
                  <span>{item.icon}</span> {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {isAdmin && (
          <div style={{ marginTop: '12px' }}>
            <SectionHeader label="Admin" icon="⚙️" isOpen={adminOpen} navText={config.navText} onClick={() => setAdminOpen(!adminOpen)} />
            {adminOpen && (
              <div style={{ paddingLeft: '12px', marginTop: '4px' }}>
                {adminNav.map((item) => (
                  <Link key={item.href} href={item.href} style={linkStyle(item.href, true)}
                    onMouseEnter={() => setHovered(item.href)} onMouseLeave={() => setHovered(null)}>
                    <span>{item.icon}</span> {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Active Branch */}
      {selectedBranch && (
        <div
          onClick={() => {
            setSelectedBranch(null);
            sessionStorage.removeItem('selectedBranch');
            router.push('/select-branch');
          }}
          style={{
            padding: '16px 20px',
            background: isLight ? '#f0fdf4' : 'rgba(0,0,0,0.2)',
            cursor: 'pointer',
            borderTop: `1px solid ${config.sidebarBorder}`,
          }}
        >
          <div style={{ fontSize: '10px', color: config.accent, textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Active Branch</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: isLight ? '#0f172a' : '#fff', fontWeight: 600 }}>{selectedBranch.name}</span>
            <span>🔄</span>
          </div>
        </div>
      )}

      {/* User footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: `1px solid ${config.sidebarBorder}`,
        background: isLight ? config.sidebarBottom : config.sidebarBottom,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UserButton />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', color: isLight ? '#0f172a' : '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.firstName || 'User'}
            </div>
            <div style={{ fontSize: '10px', color: config.navText }}>{user?.publicMetadata?.role as string || 'Staff'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
