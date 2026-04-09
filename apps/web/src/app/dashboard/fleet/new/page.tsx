'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' };
const section: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px' };
const heading: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.1em' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };

function F({ label: l, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={labelStyle}>{l}</label>{children}</div>;
}

export default function NewVehiclePage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ registration: '', make: '', model: '', year: '', colour: '', category: '', state: '', branchId: '' });
  const [photos, setPhotos] = useState<{ dataUrl: string; caption: string }[]>([]);
  const [showPhotos, setShowPhotos] = useState(false);
  const [createdVehicleId, setCreatedVehicleId] = useState<string | null>(null);

  const upd = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/branches', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 10) {
      alert('Maximum 10 photos allowed.');
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos(prev => [...prev, { dataUrl: reader.result as string, caption: '' }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (i: number) => setPhotos(photos.filter((_, idx) => idx !== i));
  const updateCaption = (i: number, caption: string) => setPhotos(photos.map((p, idx) => idx === i ? { ...p, caption } : p));

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await api.post('/fleet', {
        registration: form.registration.toUpperCase(),
        make: form.make,
        model: form.model,
        year: parseInt(form.year),
        colour: form.colour,
        category: form.category,
        state: form.state,
        branchId: form.branchId,
        status: 'AVAILABLE',
      }, { headers: { Authorization: `Bearer ${token}` } });

      const vehicleId = res.data.id;
      setCreatedVehicleId(vehicleId);

      for (const photo of photos) {
        await api.post(`/fleet/${vehicleId}/photos`, {
          url: photo.dataUrl,
          key: `vehicle-${vehicleId}-${Date.now()}`,
          caption: photo.caption || null,
        }, { headers: { Authorization: `Bearer ${token}` } });
      }

      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-summary'] });
      router.push('/dashboard/fleet');
    },
  });

  const isValid = form.registration && form.make && form.model && form.year && form.colour && form.category && form.state;

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Add Vehicle</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Add a new vehicle to the RentPro fleet</p>
      </div>

      <div style={section}>
        <h2 style={heading}>Vehicle details</h2>
        <div style={grid2}>
          <F label="Registration *"><input style={input} value={form.registration} onChange={e => upd('registration', e.target.value)} placeholder="ABC123" /></F>
          <F label="State *">
            <select style={input} value={form.state} onChange={e => upd('state', e.target.value)}>
              <option value="">Select state...</option>
              <option value="NSW">NSW</option>
              <option value="NT">NT</option>
              <option value="QLD">QLD</option>
              <option value="SA">SA</option>
              <option value="TAS">TAS</option>
              <option value="VIC">VIC</option>
              <option value="WA">WA</option>
            </select>
          </F>
          <F label="Year *"><input style={input} value={form.year} onChange={e => upd('year', e.target.value)} placeholder="2023" type="number" /></F>
          <F label="Make *"><input style={input} value={form.make} onChange={e => upd('make', e.target.value)} placeholder="Toyota" /></F>
          <F label="Model *"><input style={input} value={form.model} onChange={e => upd('model', e.target.value)} placeholder="Corolla" /></F>
          <F label="Colour *"><input style={input} value={form.colour} onChange={e => upd('colour', e.target.value)} placeholder="White" /></F>
          <F label="Category *">
            <select style={input} value={form.category} onChange={e => upd('category', e.target.value)}>
              <option value="">Select category...</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
              <option value="SUV">SUV</option>
              <option value="Van">Van</option>
              <option value="Ute">Ute</option>
            </select>
          </F>
          <F label="Branch *">
            <select style={input} value={form.branchId} onChange={e => upd('branchId', e.target.value)}>
              <option value="">Select branch...</option>
              {branches?.map((b: any) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
            </select>
          </F>
        </div>
      </div>

      <div style={section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showPhotos ? '20px' : '0' }}>
          <h2 style={{ ...heading, marginBottom: 0 }}>Check-in photos</h2>
          <button
            onClick={() => setShowPhotos(!showPhotos)}
            style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', background: showPhotos ? '#f0fdf4' : '#fff', color: showPhotos ? '#01ae42' : '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            {showPhotos ? '— Hide photos' : '+ Check in photos'}
          </button>
        </div>

        {showPhotos && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={photos.length >= 10}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: photos.length >= 10 ? 'not-allowed' : 'pointer', textAlign: 'center' }}
              >
                📷 Take photo
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photos.length >= 10}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: photos.length >= 10 ? 'not-allowed' : 'pointer', textAlign: 'center' }}
              >
                Upload photo
              </button>
            </div>

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" multiple onChange={handlePhotoCapture} style={{ display: 'none' }} />
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoCapture} style={{ display: 'none' }} />

            {photos.length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, textAlign: 'center', padding: '20px' }}>No photos added yet. Take or upload up to 10 photos.</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {photos.map((photo, i) => (
                <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={photo.dataUrl} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                    <button
                      onClick={() => removePhoto(i)}
                      style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ padding: '8px' }}>
                    <input
                      style={{ ...input, fontSize: '12px', padding: '6px 8px' }}
                      placeholder="Caption (optional)"
                      value={photo.caption}
                      onChange={e => updateCaption(i, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {photos.length > 0 && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', textAlign: 'right' }}>
                {photos.length}/10 photos
              </div>
            )}
          </>
        )}
      </div>

      {mutation.isError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
          Something went wrong. The registration may already exist.
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', paddingBottom: '40px' }}>
        <button onClick={() => router.push('/dashboard/fleet')} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={!isValid || mutation.isPending}
          style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: !isValid || mutation.isPending ? '#86efac' : '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: !isValid ? 'not-allowed' : 'pointer' }}
        >
          {mutation.isPending ? 'Adding...' : 'Add Vehicle'}
        </button>
      </div>
    </div>
  );
}
