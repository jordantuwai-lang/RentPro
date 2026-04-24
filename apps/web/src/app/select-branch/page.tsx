'use client';
import { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';
import api from '@/lib/api';

export default function SelectBranchPage() {
  const { getToken, isLoaded } = useAuth(); const { user } = useUser();
  const router = useRouter();
  const { setSelectedBranch } = useBranch();
  const [selectedId, setSelectedId] = useState('');

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    enabled: isLoaded,
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    },
  });

  const isAdmin = user?.publicMetadata?.role === 'ADMIN';

  const handleContinue = () => {
    if (!selectedId) return;
    if (selectedId === 'ALL') {
      setSelectedBranch({ id: 'all', name: 'All Branches', code: 'ALL' });
    } else {
      const branch = branches?.find((b: any) => b.id === selectedId);
      if (branch) setSelectedBranch({ id: branch.id, name: branch.name, code: branch.code });
    }
    router.push('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#013d1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', letterSpacing: '-1px', marginBottom: '8px' }}>
            Rent<span style={{ color: '#01ae42' }}>Pro</span>
          </div>
          <p style={{ color: '#86efac', fontSize: '16px', margin: 0 }}>
            Good {getGreeting()}, {user?.firstName || 'there'}. Which branch are you working from today?
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', border: '1px solid #025c27' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#86efac', marginBottom: '8px', display: 'block' }}>
            Select branch
          </label>
          {isLoading ? (
            <div style={{ color: '#86efac', fontSize: '14px', padding: '10px 0' }}>Loading branches...</div>
          ) : (
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #025c27',
                background: '#012d13',
                color: selectedId ? '#fff' : '#86efac',
                fontSize: '15px',
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: '16px',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2386efac' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                paddingRight: '40px',
              }}
            >
              <option value="">Select a branch...</option>
              {branches?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
              {isAdmin && (
                <option value="ALL">All Branches (Admin view)</option>
              )}
            </select>
          )}

          <button
            onClick={handleContinue}
            disabled={!selectedId}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              background: !selectedId ? '#025c27' : '#01ae42',
              color: !selectedId ? '#86efac' : '#fff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: !selectedId ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
