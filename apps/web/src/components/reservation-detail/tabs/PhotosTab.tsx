'use client';
import { useRef, useState } from 'react';
import { SectionBlock, inp, grid2, PHOTO_CATEGORIES } from '../shared/styles';
import { DocSlot } from '../shared/DocSlot';

export function PhotosTab() {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [licencePhoto, setLicencePhoto] = useState<string | null>(null);
  const [regoPhoto, setRegoPhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{ dataUrl: string; caption: string; category: string }[]>([]);
  const missingMandatory = [!licencePhoto && "Driver's Licence", !regoPhoto && 'Vehicle Registration Papers'].filter(Boolean) as string[];

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 20) { alert('Maximum 20 photos allowed.'); return; }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(prev => [...prev, { dataUrl: reader.result as string, caption: '', category: 'General' }]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  const removePhoto = (i: number) => setPhotos(photos.filter((_, idx) => idx !== i));
  const updatePhotoField = (i: number, field: 'caption' | 'category', value: string) =>
    setPhotos(photos.map((p, idx) => idx === i ? { ...p, [field]: value } : p));

  return (
    <>
      {missingMandatory.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', marginBottom: '16px' }}>
          <span>⚠️</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e' }}>Required photos missing</div>
            <div style={{ fontSize: '11px', color: '#92400e' }}>{missingMandatory.join(' and ')} {missingMandatory.length === 1 ? 'is' : 'are'} required</div>
          </div>
        </div>
      )}
      <SectionBlock title="Required Documents">
        <div style={grid2}>
          <DocSlot label="Driver's Licence" desc="Front of the customer's licence" icon="🪪" val={licencePhoto} set={setLicencePhoto} />
          <DocSlot label="Vehicle Registration Papers" desc="Current registration certificate" icon="📄" val={regoPhoto} set={setRegoPhoto} />
        </div>
      </SectionBlock>
      <SectionBlock title="Additional Photos">
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" multiple onChange={handlePhotoCapture} style={{ display: 'none' }} />
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoCapture} style={{ display: 'none' }} />
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button type="button" onClick={() => cameraInputRef.current?.click()} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1.5px dashed #86efac', background: '#f0fdf4', color: '#01ae42', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>📷 Take photo</button>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1.5px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>📁 Upload photo</button>
        </div>
        {photos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', border: '1.5px dashed #e2e8f0', borderRadius: '10px', color: '#94a3b8' }}>
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>📷</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>No additional photos yet</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {photos.map((photo, i) => (
                <div key={i} style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={photo.dataUrl} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                    <button type="button" onClick={() => removePhoto(i)} style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px' }}>×</button>
                    <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', color: '#fff' }}>{photo.category}</div>
                  </div>
                  <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <select value={photo.category} onChange={e => updatePhotoField(i, 'category', e.target.value)} style={{ ...inp, fontSize: '11px', padding: '5px 8px' }}>
                      {PHOTO_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input style={{ ...inp, fontSize: '11px', padding: '5px 8px' }} placeholder="Caption (optional)" value={photo.caption} onChange={e => updatePhotoField(i, 'caption', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>{photos.length} / 20 photos</div>
          </>
        )}
      </SectionBlock>
    </>
  );
}
