'use client';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UsersPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isLoaded, user, router]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>User management</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage staff accounts and roles</p>
      </div>
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
          Staff accounts and roles are managed via the Clerk dashboard.
        </p>
        <button
          onClick={() => window.open('https://dashboard.clerk.com', '_blank')}
          style={{ display: 'inline-block', marginTop: '16px', padding: '10px 20px', borderRadius: '8px', background: '#01ae42', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
        >
          Open Clerk Dashboard
        </button>
      </div>
    </div>
  );
}
