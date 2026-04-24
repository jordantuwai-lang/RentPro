'use client';
import { use } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ReservationDetail from '@/components/ReservationDetail';

const sB: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px' };
const sT: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#64748b', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.1em' };
const g2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
const SC: Record<string, string> = { OPEN: '#f59e0b', IN_PROGRESS: '#3b82f6', CLOSED: '#64748b' };
const TABS = ['Main', 'Customer', 'At Fault', 'Other Party', 'Accident', 'Damages', 'Photos', 'Additional', 'Claims Panel', 'Documents'];

export default function RecoveriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  if (isLoading || !reservation) return <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>Loading...</div>;

  const r = reservation;
  const claim = r.claim || {};
  const days = Math.max(0, Math.floor((new Date().getTime() - new Date(r.startDate).getTime()) / 86400000));

  const extraContent = (tabIndex: number) => {
    if (tabIndex === 8) return (
      <>
        <div style={sB}>
          <h3 style={sT}>Recovery Status</h3>
          <div style={g2}>
            {[['Claim number', claim.claimNumber], ['Insurer', claim.insurer?.name], ['Liability status', claim.liabilityStatus], ['Claim reference', claim.claimReference], ['File number', r.fileNumber], ['Days on hire', `${days} days`]].map(([label, value]) => (
              <div key={label as string}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: value ? '#0f172a' : '#cbd5e1' }}>{(value as string) || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={sB}>
          <h3 style={sT}>Recovery Notes</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Recovery notes will appear here. Use the Additional tab to record police and witness details relevant to recovery.</p>
        </div>
      </>
    );

    if (tabIndex === 9) return (
      <>
        {[{ icon: '📋', title: 'Authority to Act' }, { icon: '📝', title: 'Rental Agreement' }].map(doc => (
          <div key={doc.title} style={sB}>
            <h3 style={sT}>{doc.title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', border: '1.5px dashed #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
              <span style={{ fontSize: '28px' }}>{doc.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '3px' }}>{doc.title}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{r.status === 'ACTIVE' ? 'Ready to sign.' : 'Available once on hire.'}</div>
              </div>
              {r.status === 'ACTIVE' && <button style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Sign now</button>}
            </div>
          </div>
        ))}
      </>
    );

    return null;
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.fileNumber || r.reservationNumber}</h1>
          {claim.status && <span style={{ background: SC[claim.status] + '20', color: SC[claim.status], padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{claim.status?.replace('_', ' ')}</span>}
          <span style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>RECOVERY</span>
        </div>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{r.customer?.firstName} {r.customer?.lastName} · {days} days · {claim.insurer?.name || 'No insurer assigned'}</p>
      </div>

      <ReservationDetail reservationId={id} reservation={reservation} tabs={TABS} extraTabContent={extraContent} onSaveSuccess={() => qc.invalidateQueries({ queryKey: ['reservation', id] })} />

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 50 }}>
        <button onClick={() => router.push('/dashboard/recoveries')} style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
      </div>
    </div>
  );
}
