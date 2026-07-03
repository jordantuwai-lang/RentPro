'use client';
import { useRef } from 'react';

export function DocSlot({ label, desc, icon, val, set }: { label: string; desc: string; icon: string; val: string | null; set: (v: string | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => set(reader.result as string);
    reader.readAsDataURL(f);
    e.target.value = '';
  };
  return (
    <div style={{ border: `2px solid ${val ? '#86efac' : '#e2e8f0'}`, borderRadius: '12px', overflow: 'hidden', background: val ? '#f0fdf4' : '#f8fafc' }}>
      <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      {val ? (
        <div>
          <div style={{ position: 'relative' }}>
            <img src={val} alt={label} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
            <button type="button" onClick={() => set(null)} style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '16px' }}>×</button>
          </div>
          <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>✅</span><span style={{ fontSize: '12px', fontWeight: 500, color: '#16a34a' }}>Uploaded</span>
            <button type="button" onClick={() => fileRef.current?.click()} style={{ marginLeft: 'auto', fontSize: '11px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Replace</button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>{icon}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{label}<span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 600, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '1px 5px' }}>REQUIRED</span></div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{desc}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => camRef.current?.click()} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px dashed #01ae42', background: '#fff', color: '#01ae42', fontSize: '12px', cursor: 'pointer' }}>📷 Take photo</button>
            <button type="button" onClick={() => fileRef.current?.click()} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px dashed #cbd5e1', background: '#fff', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>📁 Upload</button>
          </div>
        </div>
      )}
    </div>
  );
}
