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
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div style={{
      width: '220px',
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
    }}>
      <div style={{ padding: '0 20px 32px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff', letterSpacing: '-0.5px' }}>
          Rent<span style={{ color: '#3b82f6' }}>Pro</span>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Right2Drive Ops</div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '4px',
              background: active ? '#1e3a5f' : 'transparent',
              color: active ? '#93c5fd' : '#94a3b8',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: active ? '500' : '400',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b' }}>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </div>
  );
}
