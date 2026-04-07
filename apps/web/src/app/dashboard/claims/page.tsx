'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';

const statusColors: Record<string, string> = {
  OPEN: '#01ae42',
  PENDING_APPROVAL: '#f59e0b',
  APPROVED: '#10b981',
  INVOICED: '#8b5cf6',
  CLOSED: '#64748b',
  DISPUTED: '#ef4444',
};

export default function ClaimsPage() {
  const { getToken, isLoaded } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['claims'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/claims', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#0a2e14', margin: 0 }}>Claims</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Insurance claims and hire justification</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {['Claim number', 'Customer', 'Insurer', 'Repairer', 'Status', 'Created'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : data?.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No claims yet.</td></tr>
            ) : data?.map((c: any) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500', color: '#0a2e14' }}>
                  {c.claimNumber || '—'}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0a2e14' }}>
                  {c.reservation?.customer?.firstName} {c.reservation?.customer?.lastName}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{c.insurer?.name}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{c.repairer?.name || '—'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    background: statusColors[c.status] + '20',
                    color: statusColors[c.status],
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>{c.status.replace('_', ' ')}</span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                  {new Date(c.createdAt).toLocaleDateString('en-AU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
