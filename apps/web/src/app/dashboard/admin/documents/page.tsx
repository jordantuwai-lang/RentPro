'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const section: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px' };
const heading: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' };

function DocumentCard({ type, title, description, onUpload, template, uploading }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpload(type, {
        name: file.name,
        url: reader.result as string,
        key: `${type}-${Date.now()}`,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div style={section}>
      <h2 style={heading}>{title}</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>{description}</p>

      {template ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📄</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#065f46' }}>{template.name}</div>
              <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px' }}>
                Last updated: {new Date(template.updatedAt).toLocaleDateString('en-AU')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                const a = document.createElement('a');
                a.href = template.url;
                a.download = template.name;
                a.click();
              }}
              style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #bbf7d0', background: '#fff', color: '#059669', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              View
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{ padding: '40px', border: '2px dashed #e2e8f0', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', marginBottom: '16px' }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📤</div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', marginBottom: '4px' }}>Upload {title}</div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>Click to select a PDF file</div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleFile} style={{ display: 'none' }} />

      {uploading && (
        <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '8px', color: '#059669', fontSize: '13px', textAlign: 'center' }}>
          Uploading...
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: templates } = useQuery({
    queryKey: ['document-templates'],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/documents/templates', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ type, data }: { type: string; data: any }) => {
      const token = await getToken();
      return api.post(`/documents/templates/${type}`, data, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      setUploading(null);
      setSuccess(type);
      setTimeout(() => setSuccess(null), 3000);
    },
  });

  const handleUpload = (type: string, data: any) => {
    setUploading(type);
    uploadMutation.mutate({ type, data });
  };

  const getTemplate = (type: string) => templates?.find((t: any) => t.type === type);

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Documents</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Upload and manage document templates used during the On Hire process</p>
      </div>

      {success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#065f46', fontSize: '14px' }}>
          Document uploaded successfully!
        </div>
      )}

      <DocumentCard
        type="authority-to-act"
        title="Authority to Act"
        description="This document authorises Right2Drive to act on behalf of the customer in relation to their accident replacement vehicle claim."
        template={getTemplate('authority-to-act')}
        onUpload={handleUpload}
        uploading={uploading === 'authority-to-act'}
      />

      <DocumentCard
        type="rental-agreement"
        title="Rental Agreement"
        description="The rental agreement outlines the terms and conditions of the vehicle hire between Right2Drive and the customer."
        template={getTemplate('rental-agreement')}
        onUpload={handleUpload}
        uploading={uploading === 'rental-agreement'}
      />
    </div>
  );
}
