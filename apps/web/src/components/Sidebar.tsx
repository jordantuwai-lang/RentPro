'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserButton, useClerk, useUser } from '@clerk/nextjs';
import { useBranch } from '@/context/BranchContext';
import { useState } from 'react';

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: '▦' },
  { label: 'Reservations', href: '/dashboard/reservations', icon: '📋' },
  { label: 'Fleet', href: '/dashboard/fleet', icon: '🚗' },
  { label: 'Claims', href: '/dashboard/claims', icon: '📁' },
  { label: 'Logistics', href: '/dashboard/logistics', icon: '🚚' },
  { label: 'Reports', href: '/dashboard/reports', icon: '📊' },
];

const adminNav = [
  { label: 'Partners', href: '/dashboard/partners', icon: '🤝' },
  { label: 'Users', href: '/dashboard/admin/users', icon: '👥' },
  { label: 'Branches', href: '/dashboard/admin/branches', icon: '🏢' },
  { label: 'Documents', href: '/dashboard/admin/documents', icon: '📄' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { selectedBranch, setSelectedBranch } = useBranch();
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/partners'));

  const isAdmin = user?.publicMetadata?.role === 'ADMIN';

  const linkStyle = (href: string): React.CSSProperties => {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 12px',
      borderRadius: '8px',
      marginBottom: '4px',
      background: active ? '#01ae42' : 'transparent',
      color: active ? '#fff' : '#86efac',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: active ? 600 : 400,
      transition: 'all 0.15s',
    };
  };

  return (
    <div style={{
      width: '220px',
      minHeight: '100vh',
      background: '#013d1a',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
    }}>
      <div style={{ padding: '0 20px 32px', borderBottom: '1px solid #025c27' }}>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff', letterSpacing: '-0.5px' }}>
          Rent<span style={{ color: '#01ae42' }}>Pro</span>
        </div>
        <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '2px' }}>Right2Drive Ops</div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {nav.map((item) => (
          <Link key={item.href} href={item.href} style={linkStyle(item.href)}>
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: adminOpen ? 'rgba(1,174,66,0.15)' : 'transparent',
                color: '#86efac',
                border: 'none',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: '4px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>⚙️</span>
                Admin
              </span>
              <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: adminOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </button>

            {adminOpen && (
              <div style={{ paddingLeft: '12px', borderLeft: '2px solid #025c27', marginLeft: '12px' }}>
                {adminNav.map((item) => (
                  <Link key={item.href} href={item.href} style={{ ...linkStyle(item.href), fontSize: '13px' }}>
                    <span style={{ fontSize: '14px' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {selectedBranch && (
        <div
          onClick={() => { setSelectedBranch(null); sessionStorage.removeItem('selectedBranch'); router.push('/select-branch'); }}
          style={{ padding: '10px 20px', borderTop: '1px solid #025c27', cursor: 'pointer' }}
        >
          <div style={{ fontSize: '10px', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Current branch</div>
          <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{selectedBranch.name}</div>
          <div style={{ fontSize: '11px', color: '#86efac', marginTop: '2px' }}>Tap to switch branch</div>
        </div>
      )}

      <div style={{ padding: '16px 20px', borderTop: '1px solid #025c27' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <UserButton afterSignOutUrl="/sign-in" />
          <button
            onClick={() => signOut({ redirectUrl: '/sign-in' })}
            style={{
              background: 'transparent',
              border: '1px solid #025c27',
              borderRadius: '6px',
              color: '#86efac',
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
