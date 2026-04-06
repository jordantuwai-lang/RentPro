'use client';
import { useUser } from '@clerk/nextjs';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
          Good morning, {user?.firstName || 'there'} 👋
        </h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
          Here's what's happening across Right2Drive today.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Active hires', value: '—', color: '#3b82f6' },
          { label: 'Available vehicles', value: '—', color: '#10b981' },
          { label: 'Open claims', value: '—', color: '#f59e0b' },
          { label: "Today's deliveries", value: '—', color: '#8b5cf6' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px 24px',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginTop: 0 }}>Recent reservations</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>No reservations yet.</p>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginTop: 0 }}>Today's deliveries</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>No deliveries scheduled.</p>
        </div>
      </div>
    </div>
  );
}
