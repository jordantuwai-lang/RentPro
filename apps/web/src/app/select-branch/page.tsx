'use client';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';
import api from '@/lib/api';

export default function SelectBranchPage() {
  const { getToken, isLoaded, user } = useAuth();
  const router = useRouter();
  const { setSelectedBranch } = useBranch();

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/branches', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const isAdmin = user?.publicMetadata?.role === 'ADMIN';

  const handleSelect = (branch: { id: string; name: string; code: string }) => {
    setSelectedBranch(branch);
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
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', letterSpacing: '-1px', marginBottom: '8px' }}>
            Rent<span style={{ color: '#01ae42' }}>Pro</span>
          </div>
          <p style={{ color: '#86efac', fontSize: '16px', margin: 0 }}>
            Good {getGreeting()}, {user?.firstName || 'there'}. Which branch are you working from today?
          </p>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#86efac' }}>Loading branches...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {branches?.map((b: any) => (
              <button
                key={b.id}
                onClick={() => handleSelect({ id: b.id, name: b.name, code: b.code })}
                style={{
                  padding: '20px 24px',
                  borderRadius: '12px',
                  border: '1px solid #025c27',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{b.name}</div>
                  <div style={{ fontSize: '13px', color: '#86efac', marginTop: '2px' }}>{b.code} · {b.address}</div>
                </div>
                <span style={{ color: '#01ae42', fontSize: '20px' }}>→</span>
              </button>
            ))}

            {isAdmin && (
              <button
                onClick={() => handleSelect({ id: 'all', name: 'All Branches', code: 'ALL' })}
                style={{
                  padding: '20px 24px',
                  borderRadius: '12px',
                  border: '1px dashed #01ae42',
                  background: 'transparent',
                  color: '#01ae42',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>All Branches</div>
                  <div style={{ fontSize: '13px', color: '#4ade80', marginTop: '2px' }}>Admin view — see all data</div>
                </div>
                <span style={{ color: '#01ae42', fontSize: '20px' }}>→</span>
              </button>
            )}
          </div>
        )}
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
