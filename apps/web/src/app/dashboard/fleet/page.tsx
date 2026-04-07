'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useBranch } from '@/context/BranchContext';

const statusColors: Record<string, string> = {
  AVAILABLE: '#10b981',
  ON_HIRE: '#01ae42',
  IN_MAINTENANCE: '#f59e0b',
  AWAITING_REPAIR: '#ef4444',
  RETIRED: '#64748b',
};

export default function FleetPage() {
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  const { selectedBranch, isAllBranches } = useBranch();

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['fleet', selectedBranch?.id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const url = isAllBranches || !selectedBranch ? '/fleet' : `/fleet?branchId=${selectedBranch.id}`;
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: summary } = useQuery({
    queryKey: ['fleet-summary', selectedBranch?.id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const url = isAllBranches || !selectedBranch ? '/fleet/summary' : `/fleet/summary?branchId=${selectedBranch.id}`;
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#0a2e14', margin: 0 }}>Fleet</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>All vehicles across KPK and COB</p>
        </div>
        <button onClick={() => router.push('/dashboard/fleet/new')} style={{ background: '#01ae42', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
          + Add vehicle
        </button>
      </div>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total', value: summary.total, color: '#0a2e14' },
            { label: 'Available', value: summary.available, color: '#10b981' },
            { label: 'On hire', value: summary.onHire, color: '#01ae42' },
            { label: 'In repair/service', value: summary.inRepair + summary.inService, color: '#f59e0b' },
            { label: 'Not available', value: summary.notAvailable, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {['Registration', 'Vehicle', 'Year', 'Category', 'Branch', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : vehicles?.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No vehicles yet.</td></tr>
            ) : vehicles?.map((v: any) => (
              <tr key={v.id} onClick={() => window.location.href = `/dashboard/fleet/${v.id}`} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500', color: '#0a2e14' }}>{v.registration}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0a2e14' }}>{v.make} {v.model}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{v.year}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{v.category}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{v.branch?.code}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ background: statusColors[v.status] + '20', color: statusColors[v.status], padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                    {v.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
