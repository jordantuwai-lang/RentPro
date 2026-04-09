'use client';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef } from 'react';
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

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<'upload' | 'preview'>('upload');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkFile = (file: File) => {
    setBulkFile(file);
    setBulkStep('preview');
    setBulkPreview([
      { registration: 'ABC123', state: 'VIC', year: '2022', make: 'Toyota', model: 'Camry', colour: 'White', category: 'Sedan', branch: 'KPK', valid: true },
      { registration: 'XYZ789', state: 'NSW', year: '2023', make: 'Mazda', model: 'CX-5', colour: 'Black', category: 'SUV', branch: 'COB', valid: true },
      { registration: '', state: 'QLD', year: '2021', make: 'Honda', model: 'Civic', colour: 'Silver', category: 'Small', branch: 'KPK', valid: false },
    ]);
  };

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
      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '700px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Bulk Add Vehicles</h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                  {bulkStep === 'upload' ? 'Upload an Excel spreadsheet to import multiple vehicles at once.' : `${bulkPreview.length} vehicles found — review before importing.`}
                </p>
              </div>
              <button onClick={() => setShowBulkModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {['upload', 'preview'].map((step, i) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: bulkStep === step ? '#01ae42' : (bulkStep === 'preview' && step === 'upload' ? '#01ae42' : '#e2e8f0'), color: bulkStep === step ? '#fff' : (bulkStep === 'preview' && step === 'upload' ? '#fff' : '#94a3b8'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>{i + 1}</div>
                  <span style={{ fontSize: '13px', color: bulkStep === step ? '#0f172a' : '#94a3b8', fontWeight: bulkStep === step ? 500 : 400, textTransform: 'capitalize' }}>{step}</span>
                  {i < 1 && <span style={{ color: '#e2e8f0', margin: '0 4px' }}>→</span>}
                </div>
              ))}
            </div>

            {/* Upload step */}
            {bulkStep === 'upload' && (
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '48px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleBulkFile(file); }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📂</div>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#0f172a', margin: '0 0 4px' }}>Drop your Excel file here</p>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>or click to browse — .xlsx files only</p>
                  <button style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: '13px', cursor: 'pointer' }}>Browse file</button>
                  <input ref={fileInputRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleBulkFile(e.target.files[0]); }} />
                </div>

                <div style={{ marginTop: '20px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#166534', margin: '0 0 8px' }}>📥 Download template</p>
                  <p style={{ fontSize: '13px', color: '#166534', margin: '0 0 12px' }}>Use our Excel template to ensure your data is formatted correctly.</p>
                  <button style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Download Template</button>
                </div>
              </div>
            )}

            {/* Preview step */}
            {bulkStep === 'preview' && (
              <div>
                <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
                  📄 <strong style={{ color: '#0f172a' }}>{bulkFile?.name}</strong> — {bulkPreview.filter(r => r.valid).length} valid, {bulkPreview.filter(r => !r.valid).length} with errors
                </div>

                <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Registration', 'State', 'Year', 'Make', 'Model', 'Colour', 'Category', 'Branch', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.map((row, i) => (
                        <tr key={i} style={{ background: row.valid ? '#fff' : '#fef2f2', borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', color: row.registration ? '#0f172a' : '#ef4444', fontWeight: row.registration ? 400 : 600 }}>{row.registration || '⚠ Missing'}</td>
                          <td style={{ padding: '10px 12px', color: '#0f172a' }}>{row.state}</td>
                          <td style={{ padding: '10px 12px', color: '#0f172a' }}>{row.year}</td>
                          <td style={{ padding: '10px 12px', color: '#0f172a' }}>{row.make}</td>
                          <td style={{ padding: '10px 12px', color: '#0f172a' }}>{row.model}</td>
                          <td style={{ padding: '10px 12px', color: '#0f172a' }}>{row.colour}</td>
                          <td style={{ padding: '10px 12px', color: '#0f172a' }}>{row.category}</td>
                          <td style={{ padding: '10px 12px', color: '#0f172a' }}>{row.branch}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 500, background: row.valid ? '#f0fdf4' : '#fef2f2', color: row.valid ? '#01ae42' : '#ef4444' }}>
                              {row.valid ? 'Ready' : 'Error'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setBulkStep('upload')} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Back</button>
                  <button
                    disabled={bulkPreview.filter(r => r.valid).length === 0}
                    style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: bulkPreview.filter(r => r.valid).length === 0 ? 0.6 : 1 }}
                  >
                    Import {bulkPreview.filter(r => r.valid).length} Vehicles
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#0a2e14', margin: 0 }}>Fleet</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>All vehicles across KPK and COB</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => router.push('/dashboard/fleet/new')} style={{ background: '#01ae42', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
            + Add vehicle
          </button>
          <button onClick={() => { setShowBulkModal(true); setBulkStep('upload'); setBulkFile(null); setBulkPreview([]); }} style={{ background: '#01ae42', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
            + Bulk Add
          </button>
        </div>
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
