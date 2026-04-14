'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';

// --- Constants & Styles ---
const statusColors: Record<string, string> = {
  SCHEDULED: '#01ae42', DISPATCHED: '#f59e0b', EN_ROUTE: '#8b5cf6', DELIVERED: '#10b981', FAILED: '#ef4444',
};

const jobTypeColors: Record<string, { bg: string; color: string }> = {
  DELIVERY: { bg: '#dbeafe', color: '#1d4ed8' },
  RETURN: { bg: '#fef9c3', color: '#a16207' },
  EXCHANGE: { bg: '#f3e8ff', color: '#7e22ce' },
  IN_PROGRESS: { bg: '#dcfce7', color: '#15803d' },
  DOCU_RESIGN: { bg: '#fee2e2', color: '#b91c1c' },
};

const jobTypeLabels: Record<string, string> = {
  DELIVERY: 'Delivery', RETURN: 'Return', EXCHANGE: 'Exchange', IN_PROGRESS: 'In Progress', DOCU_RESIGN: 'Docu Resign',
};

// Styles
const section: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px' };
const heading: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' };

// --- Sub-components ---

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: value ? '#0f172a' : '#cbd5e1' }}>{value || '—'}</div>
    </div>
  );
}

function SignatureCanvas({ onSave, onCancel }: { onSave: (data: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.lineCap = 'round'; }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getPos = (e: any) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const touch = e.touches?.[0] || e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const start = (e: any) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    isDrawing.current = true;
    const pos = getPos(e);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  };

  const move = (e: any) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
  };

  return (
    <div>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>Please sign below to authorize this agreement.</p>
      <div ref={containerRef} style={{ border: '2px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', marginBottom: '12px' }}>
        <canvas ref={canvasRef} style={{ display: 'block', touchAction: 'none', cursor: 'crosshair' }} 
          onMouseDown={start} onMouseMove={move} onMouseUp={() => isDrawing.current = false}
          onTouchStart={start} onTouchMove={move} onTouchEnd={() => isDrawing.current = false} />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}>Cancel</button>
        <button onClick={() => onSave(canvasRef.current?.toDataURL() || '')} style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontWeight: 600 }}>Confirm</button>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function SchedulePage() {
  const { getToken, isLoaded } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showOnHireModal, setShowOnHireModal] = useState(false);
  const [signingMode, setSigningMode] = useState<'choose' | 'screen' | 'link' | 'done'>('choose');
  
  // Filtering State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterDriver, setFilterDriver] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Generate 7-day ribbon
  const dateTabs = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, []);

  // Queries
  const { data: logistics, isLoading } = useQuery({
    queryKey: ['logistics'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/logistics', { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers'], enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      return (await api.get('/users?role=DRIVER', { headers: { Authorization: `Bearer ${token}` } })).data;
    },
  });

  // Filtered Logic
  const filteredJobs = useMemo(() => {
    return (logistics || []).filter((j: any) => {
      const jobDate = new Date(j.scheduledAt).toISOString().split('T')[0];
      if (selectedDate && jobDate !== selectedDate) return false;
      if (filterStatus && j.status !== filterStatus) return false;
      if (filterDriver && j.driverId !== filterDriver) return false;
      return true;
    });
  }, [logistics, selectedDate, filterStatus, filterDriver]);

  // Mutations
  const markOnHire = useMutation({
    mutationFn: async ({ id, sig }: { id: string; sig: string }) => {
      const token = await getToken();
      await api.post(`/documents/signatures/${id}`, { signatureData: sig, signingMethod: 'screen' }, { headers: { Authorization: `Bearer ${token}` } });
      return api.post(`/reservations/${id}/on-hire`, {}, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics'] });
      setShowOnHireModal(false); setSelectedJob(null);
    },
  });

  const r = selectedJob?.reservation;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>Fleet Logistics</h1>
        <button style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontWeight: 600 }}>+ Add Job</button>
      </div>

      {/* Date Toggle Ribbon */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {dateTabs.map((dateStr) => {
          const isSelected = selectedDate === dateStr;
          const d = new Date(dateStr);
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          return (
            <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
              style={{
                padding: '12px 20px', borderRadius: '12px', border: '1px solid', 
                borderColor: isSelected ? '#01ae42' : '#e2e8f0',
                background: isSelected ? '#01ae42' : '#fff',
                color: isSelected ? '#fff' : '#64748b',
                minWidth: '90px', cursor: 'pointer', transition: '0.2s'
              }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8 }}>
                {isToday ? 'Today' : d.toLocaleDateString('en-AU', { weekday: 'short' })}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>{d.getDate()}</div>
            </button>
          );
        })}
        <button onClick={() => setSelectedDate('')} style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: selectedDate === '' ? '#0f172a' : '#fff', color: selectedDate === '' ? '#fff' : '#64748b' }}>All</button>
      </div>

      {/* Quick Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <select style={{ ...inputStyle, width: '200px' }} value={filterDriver} onChange={e => setFilterDriver(e.target.value)}>
          <option value="">All Drivers</option>
          {drivers?.map((dr: any) => <option key={dr.id} value={dr.id}>{dr.firstName} {dr.lastName}</option>)}
        </select>
        <select style={{ ...inputStyle, width: '200px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Jobs Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '14px', width: '40px' }}><input type="checkbox" /></th>
              {['Time', 'Type', 'Customer', 'Location', 'Registration', 'Driver', 'Status'].map(h => (
                <th key={h} style={{ padding: '14px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading daily schedule...</td></tr>
            ) : filteredJobs.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No jobs scheduled for this date.</td></tr>
            ) : filteredJobs.map((job: any) => (
              <tr key={job.id} onClick={() => setSelectedJob(job)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', hover: { background: '#f8fafc' } }}>
                <td style={{ padding: '14px' }} onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                <td style={{ padding: '14px', fontSize: '13px', fontWeight: 600 }}>{new Date(job.scheduledAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</td>
                <td style={{ padding: '14px' }}>
                  <span style={{ background: jobTypeColors[job.jobType]?.bg, color: jobTypeColors[job.jobType]?.color, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{job.jobType}</span>
                </td>
                <td style={{ padding: '14px', fontSize: '13px', fontWeight: 500 }}>{job.reservation?.customer?.firstName} {job.reservation?.customer?.lastName}</td>
                <td style={{ padding: '14px', fontSize: '13px', color: '#64748b' }}>{job.suburb}</td>
                <td style={{ padding: '14px', fontSize: '13px' }}>{job.reservation?.vehicle?.registration || '—'}</td>
                <td style={{ padding: '14px', fontSize: '13px' }}>{job.driver ? `${job.driver.firstName[0]}. ${job.driver.lastName}` : 'Unassigned'}</td>
                <td style={{ padding: '14px' }}>
                  <span style={{ color: statusColors[job.status], fontSize: '12px', fontWeight: 700 }}>● {job.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Overlay */}
      {selectedJob && (
        <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 100, padding: '40px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
              <button onClick={() => setSelectedJob(null)} style={{ background: 'none', border: 'none', color: '#01ae42', cursor: 'pointer', fontWeight: 600 }}>← Back to List</button>
              <button onClick={() => setShowOnHireModal(true)} style={{ padding: '12px 24px', background: '#01ae42', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700 }}>Process On Hire</button>
            </div>
            
            <div style={section}>
              <h2 style={heading}>Job Overview</h2>
              <div style={grid2}>
                <Field label="Reservation" value={r?.reservationNumber} />
                <Field label="Job Type" value={selectedJob.jobType} />
                <Field label="Customer" value={`${r?.customer?.firstName} ${r?.customer?.lastName}`} />
                <Field label="Location" value={`${selectedJob.address}, ${selectedJob.suburb}`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showOnHireModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '500px' }}>
            <h2 style={{ marginTop: 0 }}>Digital Signature</h2>
            <SignatureCanvas 
              onSave={(sig) => markOnHire.mutate({ id: r.id, sig })} 
              onCancel={() => setShowOnHireModal(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}