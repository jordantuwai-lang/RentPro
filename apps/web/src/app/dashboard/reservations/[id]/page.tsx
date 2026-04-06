'use client';
import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const statusColors: Record<string, string> = {
  DRAFT: '#94a3b8',
  PENDING: '#f59e0b',
  ACTIVE: '#10b981',
  COMPLETED: '#64748b',
  CANCELLED: '#ef4444',
};

const section: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  padding: '24px',
  marginBottom: '16px',
};

const heading: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#64748b',
  marginTop: 0,
  marginBottom: '16px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: value ? '#0f172a' : '#cbd5e1' }}>{value || '—'}</div>
    </div>
  );
}

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: r, isLoading } = useQuery({
    queryKey: ['reservation', id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const token = await getToken();
      return api.patch(`/reservations/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });

  if (isLoading) return <div style={{ padding: '40px', color: '#94a3b8' }}>Loading...</div>;
  if (!r) return <div style={{ padding: '40px', color: '#94a3b8' }}>Reservation not found.</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.reservationNumber}</h1>
            <span style={{
              background: statusColors[r.status] + '20',
              color: statusColors[r.status],
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
            }}>{r.status}</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Created {new Date(r.createdAt).toLocaleDateString('en-AU')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push(`/dashboard/reservations/${id}/edit`)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#0f172a', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            Continue editing
          </button>
          {r.status === 'DRAFT' && (
            <button onClick={() => updateStatus.mutate('PENDING')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              Activate
            </button>
          )}
          {r.status === 'PENDING' && (
            <button onClick={() => updateStatus.mutate('ACTIVE')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              Mark active
            </button>
          )}
          {(r.status === 'ACTIVE' || r.status === 'PENDING') && (
            <button onClick={() => updateStatus.mutate('COMPLETED')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              Complete
            </button>
          )}
          {r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
            <button onClick={() => updateStatus.mutate('CANCELLED')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
          )}
          <button onClick={() => router.push('/dashboard/reservations')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Back
          </button>
        </div>
      </div>

      <div style={section}>
        <h2 style={heading}>Customer</h2>
        <div style={grid2}>
          <Field label="First name" value={r.customer?.firstName} />
          <Field label="Last name" value={r.customer?.lastName} />
          <Field label="Phone" value={r.customer?.phone} />
          <Field label="Email" value={r.customer?.email} />
          <Field label="Licence number" value={r.customer?.licenceNumber} />
        </div>
      </div>

      <div style={section}>
        <h2 style={heading}>Replacement vehicle</h2>
        <div style={grid2}>
          <Field label="Registration" value={r.vehicle?.registration} />
          <Field label="Vehicle" value={r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : undefined} />
          <Field label="Year" value={r.vehicle?.year?.toString()} />
          <Field label="Category" value={r.vehicle?.category} />
          <Field label="Branch" value={r.vehicle?.branch?.name} />
          <Field label="Hire start" value={r.startDate ? new Date(r.startDate).toLocaleDateString('en-AU') : undefined} />
          {r.endDate && <Field label="Hire end" value={new Date(r.endDate).toLocaleDateString('en-AU')} />}
        </div>
      </div>

      {r.claim && (
        <div style={section}>
          <h2 style={heading}>Claim</h2>
          <div style={grid2}>
            <Field label="Claim number" value={r.claim.claimNumber} />
            <Field label="Status" value={r.claim.status} />
            <Field label="Insurer" value={r.claim.insurer?.name} />
            <Field label="Repairer" value={r.claim.repairer?.name} />
          </div>
        </div>
      )}

      {r.delivery && (
        <div style={section}>
          <h2 style={heading}>Delivery</h2>
          <div style={grid2}>
            <Field label="Address" value={r.delivery.address} />
            <Field label="Suburb" value={r.delivery.suburb} />
            <Field label="Scheduled" value={r.delivery.scheduledAt ? new Date(r.delivery.scheduledAt).toLocaleString('en-AU') : undefined} />
            <Field label="Status" value={r.delivery.status} />
          </div>
        </div>
      )}
    </div>
  );
}
