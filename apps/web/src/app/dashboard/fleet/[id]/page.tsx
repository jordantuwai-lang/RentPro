'use client';
import { use, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const statusColors: Record<string, string> = {
  AVAILABLE: '#10b981', BOOKED_FOR_REPAIR: '#f59e0b', BOOKED_FOR_SERVICE: '#f59e0b',
  CLEAN_NEEDED: '#94a3b8', IN_REPAIR: '#ef4444', IN_SERVICE: '#f59e0b',
  NOT_AVAILABLE: '#ef4444', ON_HIRE: '#01ae42', RESERVED_FOR_TRANSPORT: '#8b5cf6',
  RETIRED: '#64748b', WITH_STAFF: '#0f172a',
};

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Available', BOOKED_FOR_REPAIR: 'Booked For Repair', BOOKED_FOR_SERVICE: 'Booked For Service',
  CLEAN_NEEDED: 'Clean Needed', IN_REPAIR: 'In Repair', IN_SERVICE: 'In Service',
  NOT_AVAILABLE: 'Not Available', ON_HIRE: 'On Hire', RESERVED_FOR_TRANSPORT: 'Reserved For Transport',
  RETIRED: 'Retired', WITH_STAFF: 'With Staff',
};

const accessoryOptions = ['Phone Holder','Phone Charger','Dash Cam','Parking Sensor','Reverse Camera','Roof Rack','Tow Bar','Floor Mats','Sunshade','First Aid Kit'];

const section: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px' };
const heading: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' };
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ registration: '', make: '', model: '', year: '', colour: '', category: '', state: '', odometer: '' });
  const [editAccessories, setEditAccessories] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const updEdit = (f: string, v: string) => setEditForm(p => ({ ...p, [f]: v }));
  const toggleEditAccessory = (item: string) => setEditAccessories(prev =>
    prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
  );

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
      setSelectedStatus(''); setStaffName(''); setShowStaffModal(false);
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.patch(`/fleet/${id}`, {
        registration: editForm.registration.toUpperCase(),
        make: editForm.make, model: editForm.model,
        year: parseInt(editForm.year), colour: editForm.colour,
        category: editForm.category, state: editForm.state,
        odometer: editForm.odometer ? parseInt(editForm.odometer) : undefined,
        accessories: editAccessories,
      }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      setShowEditModal(false);
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const token = await getToken();
        await api.post(`/fleet/${id}/photos`, {
          fileData: base64,
          mimeType: file.type,
          caption: '',
        }, { headers: { Authorization: `Bearer ${token}` } });
        queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingPhoto(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;
    setDeletingPhotoId(photoId);
    try {
      const token = await getToken();
      await api.delete(`/fleet/${id}/photos/${photoId}`, { headers: { Authorization: `Bearer ${token}` } });
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    if (status === 'WITH_STAFF') { setShowStaffModal(true); }
    else if (status) { updateStatus.mutate({ status }); }
  };

  if (isLoading) return <div style={{ padding: '40px', color: '#94a3b8' }}>Loading...</div>;
  if (!vehicle) return <div style={{ padding: '40px', color: '#94a3b8' }}>Vehicle not found.</div>;

  return (
    <div style={{ maxWidth: '800px' }}>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '620px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Edit Vehicle</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {[
                { label: 'Registration *', field: 'registration', placeholder: 'ABC123' },
                { label: 'Make *', field: 'make', placeholder: 'Toyota' },
                { label: 'Model *', field: 'model', placeholder: 'Corolla' },
                { label: 'Year *', field: 'year', placeholder: '2023' },
                { label: 'Colour *', field: 'colour', placeholder: 'White' },
                { label: 'Odometer (km)', field: 'odometer', placeholder: '45000' },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>{label}</label>
                  <input
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                    value={(editForm as any)[field]}
                    onChange={e => updEdit(field, e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>State *</label>
                <select style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }} value={editForm.state} onChange={e => updEdit('state', e.target.value)}>
                  <option value="">Select state...</option>
                  {['NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Category *</label>
                <select style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }} value={editForm.category} onChange={e => updEdit('category', e.target.value)}>
                  <option value="">Select category...</option>
                  {['Small','Medium','Large','SUV','Van','Ute'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Accessories</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
                {accessoryOptions.map(item => (
                  <div key={item} onClick={() => toggleEditAccessory(item)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', border: `1px solid ${editAccessories.includes(item) ? '#01ae42' : '#e2e8f0'}`, background: editAccessories.includes(item) ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: '13px', color: editAccessories.includes(item) ? '#166534' : '#374151', fontWeight: editAccessories.includes(item) ? 500 : 400 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1.5px solid ${editAccessories.includes(item) ? '#01ae42' : '#cbd5e1'}`, background: editAccessories.includes(item) ? '#01ae42' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {editAccessories.includes(item) && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            {editMutation.isError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
                Something went wrong. Please try again.
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEditModal(false)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => editMutation.mutate()} disabled={editMutation.isPending}
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: editMutation.isPending ? 0.6 : 1 }}>
                {editMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginTop: 0, marginBottom: '8px' }}>With staff</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Enter the name of the staff member who has this vehicle.</p>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>Staff member name *</label>
            <input
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box', marginBottom: '20px' }}
              value={staffName} onChange={e => setStaffName(e.target.value)}
              placeholder="Enter staff member name" autoFocus
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowStaffModal(false); setSelectedStatus(''); setStaffName(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => updateStatus.mutate({ status: 'WITH_STAFF', notes: `With staff: ${staffName}` })}
                disabled={!staffName.trim() || updateStatus.isPending}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: !staffName.trim() ? '#86efac' : '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: !staffName.trim() ? 'not-allowed' : 'pointer' }}>
                {updateStatus.isPending ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
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
          <select value={selectedStatus} onChange={e => handleStatusChange(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
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
          <button
            onClick={() => {
              setEditForm({ registration: vehicle.registration, make: vehicle.make, model: vehicle.model, year: vehicle.year?.toString(), colour: vehicle.colour, category: vehicle.category, state: vehicle.state || '', odometer: vehicle.odometer?.toString() || '' });
              setEditAccessories(vehicle.accessories || []);
              setShowEditModal(true);
            }}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Edit
          </button>
          <button onClick={() => router.push('/dashboard/fleet')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Back
          </button>
        </div>
      </div>

      {/* Vehicle Details */}
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
          <Field label="Odometer Reading" value={vehicle.odometer ? vehicle.odometer.toLocaleString() + ' km' : undefined} />
        </div>
      </div>

      {/* Accessories */}
      {vehicle.accessories?.length > 0 && (
        <div style={section}>
          <h2 style={heading}>Accessories</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {vehicle.accessories.map((a: string) => (
              <div key={a} style={{ padding: '4px 12px', borderRadius: '99px', background: '#f0fdf4', color: '#166534', fontSize: '13px', border: '1px solid #bbf7d0', fontWeight: 500 }}>
                {a}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in Photos */}
      <div style={section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ ...heading, margin: 0 }}>Check-in photos ({vehicle.photos?.length || 0}/10)</h2>
          {(vehicle.photos?.length || 0) < 10 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              <button onClick={() => cameraInputRef.current?.click()} disabled={uploadingPhoto}
                style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                📷 Take photo
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
                style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                {uploadingPhoto ? 'Uploading...' : '+ Upload'}
              </button>
            </div>
          )}
        </div>
        {!vehicle.photos?.length ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No photos yet. Use the buttons above to add check-in photos.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {vehicle.photos.map((photo: any) => (
              <div key={photo.id} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
                <img src={photo.url} alt="Check-in photo" style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  disabled={deletingPhotoId === photo.id}
                  style={{ position: 'absolute', top: '6px', right: '6px', width: '26px', height: '26px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                  {deletingPhotoId === photo.id ? '…' : '×'}
                </button>
                {photo.caption && <div style={{ padding: '8px', fontSize: '12px', color: '#64748b' }}>{photo.caption}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hire History */}
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
                  <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600, color: '#01ae42' }}>{r.reservationNumber}</td>
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