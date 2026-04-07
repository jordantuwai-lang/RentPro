'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: '▦' },
  { label: 'Reservations', href: '/dashboard/reservations', icon: '📋' },
  { label: 'Fleet', href: '/dashboard/fleet', icon: '🚗' },
  { label: 'Claims', href: '/dashboard/claims', icon: '📁' },
  { label: 'Logistics', href: '/dashboard/logistics', icon: '🚚' },
  { label: 'Partners', href: '/dashboard/partners', icon: '🤝' },
  { label: 'Reports', href: '/dashboard/reports', icon: '📊' },
];

export default function Sidebar() {
  const pathname = usePathname();

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
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
          return (
            <Link key={item.href} href={item.href} style={{
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
              fontWeight: active ? '600' : '400',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #025c27' }}>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </div>
  );
}
