'use client';
import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const statusColors: Record<string, string> = {
  AVAILABLE: '#10b981',
  BOOKED_FOR_REPAIR: '#f59e0b',
  BOOKED_FOR_SERVICE: '#f59e0b',
  CLEAN_NEEDED: '#94a3b8',
  IN_REPAIR: '#ef4444',
  IN_SERVICE: '#f59e0b',
  NOT_AVAILABLE: '#ef4444',
  ON_HIRE: '#3b82f6',
  RESERVED_FOR_TRANSPORT: '#8b5cf6',
  RETIRED: '#64748b',
  WITH_STAFF: '#0f172a',
};

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Available',
  BOOKED_FOR_REPAIR: 'Booked For Repair',
  BOOKED_FOR_SERVICE: 'Booked For Service',
  CLEAN_NEEDED: 'Clean Needed',
  IN_REPAIR: 'In Repair',
  IN_SERVICE: 'In Service',
  NOT_AVAILABLE: 'Not Available',
  ON_HIRE: 'On Hire',
  RESERVED_FOR_TRANSPORT: 'Reserved For Transport',
  RETIRED: 'Retired',
  WITH_STAFF: 'With Staff',
};

const section: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px',
};

const heading: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em',
};

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: value ? '#0f172a' : '#cbd5e1' }}>{value || '—'}</div>
    </div>
  );
}

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/fleet/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      const token = await getToken();
      return api.patch(`/fleet/${id}/status`, { status, notes }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-summary'] });
      setSelectedStatus('');
      setStaffName('');
      setShowStaffModal(false);
    },
  });

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    if (status === 'WITH_STAFF') {
      setShowStaffModal(true);
    } else if (status) {
      updateStatus.mutate({ status });
    }
  };

  const handleStaffConfirm = () => {
    if (!staffName.trim()) return;
    updateStatus.mutate({ status: 'WITH_STAFF', notes: `With staff: ${staffName}` });
  };

  if (isLoading) return <div style={{ padding: '40px', color: '#94a3b8' }}>Loading...</div>;
  if (!vehicle) return <div style={{ padding: '40px', color: '#94a3b8' }}>Vehicle not found.</div>;

  return (
    <div style={{ maxWidth: '800px' }}>

      {showStaffModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginTop: 0, marginBottom: '8px' }}>With staff</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Enter the name of the staff member who has this vehicle.</p>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Staff member name *</label>
            <input
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box', marginBottom: '20px' }}
              value={staffName}
              onChange={e => setStaffName(e.target.value)}
              placeholder="Enter staff member name"
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowStaffModal(false); setSelectedStatus(''); setStaffName(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleStaffConfirm}
                disabled={!staffName.trim() || updateStatus.isPending}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: !staffName.trim() ? '#93c5fd' : '#3b82f6', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: !staffName.trim() ? 'not-allowed' : 'pointer' }}
              >
                {updateStatus.isPending ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{vehicle.registration}</h1>
            <span style={{ background: statusColors[vehicle.status] + '20', color: statusColors[vehicle.status], padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
              {statusLabels[vehicle.status] || vehicle.status}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            {vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.branch?.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={selectedStatus}
            onChange={e => handleStatusChange(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            <option value="">Change status...</option>
            <option value="AVAILABLE">Available</option>
            <option value="BOOKED_FOR_REPAIR">Booked for repair</option>
            <option value="BOOKED_FOR_SERVICE">Booked for service</option>
            <option value="CLEAN_NEEDED">Clean needed</option>
            <option value="IN_REPAIR">In repair</option>
            <option value="IN_SERVICE">In service</option>
            <option value="NOT_AVAILABLE">Not available</option>
            <option value="RESERVED_FOR_TRANSPORT">Reserved for transport</option>
            <option value="RETIRED">Retired</option>
            <option value="WITH_STAFF">With staff</option>
          </select>
          <button onClick={() => router.push('/dashboard/fleet')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Back
          </button>
        </div>
      </div>

      <div style={section}>
        <h2 style={heading}>Vehicle details</h2>
        <div style={grid2}>
          <Field label="Registration" value={vehicle.registration} />
          <Field label="State" value={vehicle.state} />
          <Field label="Make" value={vehicle.make} />
          <Field label="Model" value={vehicle.model} />
          <Field label="Year" value={vehicle.year?.toString()} />
          <Field label="Colour" value={vehicle.colour} />
          <Field label="Category" value={vehicle.category} />
          <Field label="Branch" value={vehicle.branch?.name} />
        </div>
      </div>

      {vehicle.photos?.length > 0 && (
        <div style={section}>
          <h2 style={heading}>Check-in photos ({vehicle.photos.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {vehicle.photos.map((photo: any, i: number) => (
              <div key={photo.id} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <img src={photo.url} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                {photo.caption && <div style={{ padding: '8px', fontSize: '12px', color: '#64748b' }}>{photo.caption}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={section}>
        <h2 style={heading}>Hire history</h2>
        {vehicle.reservations?.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No hire history yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                {['Rez #', 'Customer', 'Start date', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicle.reservations?.map((r: any) => (
                <tr key={r.id} onClick={() => router.push(`/dashboard/reservations/${r.id}`)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                  <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>{r.reservationNumber}</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: '#0f172a' }}>{r.customer?.firstName} {r.customer?.lastName}</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: '#64748b' }}>{new Date(r.startDate).toLocaleDateString('en-AU')}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
