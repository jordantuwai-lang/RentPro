'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
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

const section: React.CSSProperties = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px' };
const heading: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' };

function DeliveryPhotos({ deliveryId }: { deliveryId: string }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const { data: photos = [] } = useQuery({
    queryKey: ['delivery-photos', deliveryId],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/logistics/${deliveryId}/photos`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const token = await getToken();
          await api.post(`/logistics/${deliveryId}/photos`, {
            fileData: base64,
            mimeType: file.type,
            caption: '',
          }, { headers: { Authorization: `Bearer ${token}` } });
          queryClient.invalidateQueries({ queryKey: ['delivery-photos', deliveryId] });
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingPhoto(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;
    setDeletingPhotoId(photoId);
    try {
      const token = await getToken();
      await api.delete(`/logistics/${deliveryId}/photos/${photoId}`, { headers: { Authorization: `Bearer ${token}` } });
      queryClient.invalidateQueries({ queryKey: ['delivery-photos', deliveryId] });
    } finally {
      setDeletingPhotoId(null);
    }
  };

  return (
    <div style={section}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ ...heading, margin: 0 }}>Delivery photos ({photos.length}/10)</h2>
        {photos.length < 10 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleUpload} style={{ display: 'none' }} />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
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
      {photos.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No delivery photos yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {photos.map((photo: any) => (
            <div key={photo.id} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
              <img src={photo.url} alt="Delivery photo" style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
              <button
                onClick={() => handleDelete(photo.id)}
                disabled={deletingPhotoId === photo.id}
                style={{ position: 'absolute', top: '6px', right: '6px', width: '26px', height: '26px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                {deletingPhotoId === photo.id ? '…' : '×'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SchedulePage() {
  const { getToken, isLoaded } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterDriver, setFilterDriver] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [pairingJobId, setPairingJobId] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});

  const toggleCompleted = (id: string) =>
    setCompletedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const pairJobs = (idA: string, idB: string) => {
    setPairs(prev => ({ ...prev, [idA]: idB, [idB]: idA }));
    setPairingJobId(null);
  };

  const unpairJob = (id: string) => {
    setPairs(prev => {
      const partnerId = prev[id];
      const next = { ...prev };
      delete next[id];
      if (partnerId) delete next[partnerId];
      return next;
    });
  };

  const updateTime = useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: string; scheduledAt: string }) => {
      const token = await getToken();
      return api.patch(`/logistics/${id}`, { scheduledAt }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['logistics'] }),
  });

  const dateTabs = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, []);

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

  const filteredJobs = useMemo(() => {
    return (logistics || []).filter((j: any) => {
      const jobDate = new Date(j.scheduledAt).toISOString().split('T')[0];
      if (selectedDate && jobDate !== selectedDate) return false;
      if (filterStatus && j.status !== filterStatus) return false;
      if (filterDriver && j.driverId !== filterDriver) return false;
      return true;
    });
  }, [logistics, selectedDate, filterStatus, filterDriver]);

  const tableRows = useMemo(() => {
    if (!filteredJobs.length) return [];
    return filteredJobs.reduce((acc: React.ReactNode[], job: any, idx: number) => {
      const nextJob = filteredJobs[idx + 1];

      acc.push(
        <tr
          key={job.id}
          onClick={() => router.push(`/dashboard/reservations/${job.reservation?.id}`)}
          style={{
            borderBottom: '1px solid #f1f5f9',
            cursor: 'pointer',
            background: completedIds.includes(job.id) ? '#f0fdf4' : '#fff',
            transition: 'background 0.2s',
            borderLeft: pairs[job.id] ? '3px solid #8b5cf6' : '3px solid transparent',
          }}
        >
          <td style={{ padding: '14px' }} onClick={e => e.stopPropagation()}>
            <input type="checkbox" />
          </td>
          <td style={{ padding: '14px', fontSize: '13px', fontWeight: 600 }} onClick={e => e.stopPropagation()}>
            {editingTimeId === job.id ? (
              <input
                type="time"
                autoFocus
                defaultValue={new Date(job.scheduledAt).toTimeString().slice(0, 5)}
                style={{ width: '90px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #01ae42', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}
                onBlur={e => {
                  const [hours, minutes] = e.target.value.split(':');
                  const updated = new Date(job.scheduledAt);
                  updated.setHours(parseInt(hours), parseInt(minutes));
                  updateTime.mutate({ id: job.id, scheduledAt: updated.toISOString() });
                  setEditingTimeId(null);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') setEditingTimeId(null);
                }}
              />
            ) : (
              <span
                onClick={() => setEditingTimeId(job.id)}
                title="Click to edit time"
                style={{ cursor: 'text', borderBottom: '1px dashed #cbd5e1', paddingBottom: '1px' }}
              >
                {new Date(job.scheduledAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </td>
          <td style={{ padding: '14px' }}>
            <span style={{ background: jobTypeColors[job.jobType]?.bg, color: jobTypeColors[job.jobType]?.color, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
              {job.jobType}
            </span>
          </td>
          <td style={{ padding: '14px', fontSize: '13px', fontWeight: 500 }}>
            {job.reservation?.customer?.firstName} {job.reservation?.customer?.lastName}
          </td>
          <td style={{ padding: '14px', fontSize: '13px', color: '#64748b' }}>{job.suburb}</td>
          <td style={{ padding: '14px', fontSize: '13px' }}>{job.reservation?.vehicle?.registration || '—'}</td>
          <td style={{ padding: '14px', fontSize: '13px' }}>
            {job.driver ? `${job.driver.firstName[0]}. ${job.driver.lastName}` : 'Unassigned'}
          </td>
          <td style={{ padding: '14px' }}>
            <span style={{ color: statusColors[job.status], fontSize: '12px', fontWeight: 700 }}>● {job.status}</span>
          </td>
          <td style={{ padding: '14px' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => pairs[job.id] ? unpairJob(job.id) : setPairingJobId(job.id)}
              title={pairs[job.id] ? 'Remove pair' : 'Pair with another job'}
              style={{
                width: '28px', height: '28px', borderRadius: '6px',
                border: `1px solid ${pairs[job.id] ? '#01ae42' : '#e2e8f0'}`,
                background: pairs[job.id] ? '#f0fdf4' : '#fff',
                fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              🔗
            </button>
          </td>
          <td style={{ padding: '14px' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => toggleCompleted(job.id)}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: `2px solid ${completedIds.includes(job.id) ? '#01ae42' : '#e2e8f0'}`,
                background: completedIds.includes(job.id) ? '#01ae42' : '#fff',
                color: '#fff', fontSize: '16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {completedIds.includes(job.id) ? '✓' : ''}
            </button>
          </td>
        </tr>
      );

      if (nextJob && pairs[job.id] === nextJob.id) {
        acc.push(
          <tr key={`pair-${job.id}`} style={{ background: '#faf5ff' }}>
            <td colSpan={10} style={{ padding: '4px 24px', fontSize: '11px', color: '#8b5cf6', fontWeight: 600 }}>
              ↕ Paired job sequence — {job.jobType} → {nextJob.jobType}
            </td>
          </tr>
        );
      }

      return acc;
    }, []);
  }, [filteredJobs, completedIds, pairs, editingTimeId]);

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
                minWidth: '90px', cursor: 'pointer', transition: '0.2s',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8 }}>
                {isToday ? 'Today' : d.toLocaleDateString('en-AU', { weekday: 'short' })}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>{d.getDate()}</div>
            </button>
          );
        })}
        <button
          onClick={() => setSelectedDate('')}
          style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: selectedDate === '' ? '#0f172a' : '#fff', color: selectedDate === '' ? '#fff' : '#64748b' }}
        >
          All
        </button>
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
              {['Time', 'Type', 'Customer', 'Location', 'Registration', 'Driver', 'Status', 'Pair', 'Done'].map(h => (
                <th key={h} style={{ padding: '14px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading daily schedule...</td></tr>
            ) : filteredJobs.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No jobs scheduled for this date.</td></tr>
            ) : tableRows}
          </tbody>
        </table>
      </div>

      {/* Pairing Modal */}
      {pairingJobId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '480px', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Pair with job</h2>
              <button onClick={() => setPairingJobId(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Select a job to pair with this one. Paired jobs will be shown as a sequence in the schedule.</p>
            {filteredJobs
              .filter((j: any) => j.id !== pairingJobId && !pairs[j.id])
              .map((j: any) => (
                <div
                  key={j.id}
                  onClick={() => pairJobs(pairingJobId, j.id)}
                  style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                      {new Date(j.scheduledAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })} — {j.jobType}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {j.reservation?.customer?.firstName} {j.reservation?.customer?.lastName} · {j.suburb}
                    </div>
                  </div>
                  <span style={{ background: jobTypeColors[j.jobType]?.bg, color: jobTypeColors[j.jobType]?.color, padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    {j.jobType}
                  </span>
                </div>
              ))}
            {filteredJobs.filter((j: any) => j.id !== pairingJobId && !pairs[j.id]).length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>No other jobs available to pair with.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}