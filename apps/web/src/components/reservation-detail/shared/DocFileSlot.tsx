'use client';
import { useRef } from 'react';

export type DocFile = { name: string; dataUrl: string };

export function DocFileSlot({ label, desc, icon, val, onUpload, onRemove, uploading }: {
  label: string; desc: string; icon: string; val: DocFile | null;
  onUpload: (file: File) => void; onRemove: () => void; uploading?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onUpload(f);
    e.target.value = '';
  };
  return (
    <div style={{ border: `1px solid ${val ? '#86efac' : '#e2e8f0'}`, borderRadius: '8px', overflow: 'hidden', background: val ? '#f0fdf4' : '#fff', opacity: uploading ? 0.6 : 1 }}>
      <input ref={fileRef} type="file" accept=".pdf,application/pdf,image/*" onChange={handleFile} style={{ display: 'none' }} disabled={uploading} />
      {val ? (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>📄</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val.name}</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a' }}>{uploading ? 'Uploading…' : '✅ Uploaded'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
            <a href={val.dataUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#16a34a', textDecoration: 'underline' }}>View</a>
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} style={{ fontSize: '11px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Replace</button>
            <button type="button" disabled={uploading} onClick={onRemove} style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '22px' }}>{icon}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{label}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{desc}</div>
            </div>
          </div>
          <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1.5px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>
            {uploading ? 'Uploading…' : '📁 Upload document'}
          </button>
        </div>
      )}
    </div>
  );
}
