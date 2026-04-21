'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useBranch } from '@/context/BranchContext';
import api from '@/lib/api';

type VehicleClass = {
  id: string;
  code: string;
  description: string;
  example: string | null;
  sortOrder: number;
};

type RateEntry = {
  vehicleClass: VehicleClass;
  rate: {
    id: string;
    daily: string | null;
    weekly: string | null;
    monthly: string | null;
    effectiveFrom: string;
  } | null;
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontSize: '11px',
  fontWeight: 600, color: '#64748b', textTransform: 'uppercase',
  letterSpacing: '0.07em', background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
};
const tdStyle: React.CSSProperties = {
  padding: '13px 16px', fontSize: '14px', color: '#0f172a',
  borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle',
};
const tdRight: React.CSSProperties = { ...tdStyle, textAlign: 'right' };
const inputStyle: React.CSSProperties = {
  width: '90px', padding: '7px 10px', borderRadius: '6px',
  border: '1px solid #01ae42', fontSize: '14px', color: '#0f172a',
  background: '#f0fdf4', textAlign: 'right', boxSizing: 'border-box',
};

function fmt(val: string | null | undefined) {
  if (!val) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : '$' + n.toFixed(2);
}

export default function RatesPage() {
  const { getToken } = useAuth();
  const { selectedBranch } = useBranch();
  const qc = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVals, setEditVals] = useState({ daily: '', weekly: '', monthly: '' });
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newRow, setNewRow] = useState({ code: '', description: '', example: '', daily: '', weekly: '', monthly: '' });

  const branchId = selectedBranch?.id;

  const { data: rates = [], isLoading } = useQuery<RateEntry[]>({
    queryKey: ['rates', branchId],
    enabled: !!branchId,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/rates?branchId=${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const setRate = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      return api.post('/rates', data, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['rates', branchId] });
      setEditingId(null);
      setSavedId(vars.vehicleClassId);
      setTimeout(() => setSavedId(null), 2000);
    },
  });

  const createClass = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      return api.post('/rates/classes', data, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: (res) => {
      // If rates were provided, also set them for this branch
      const vc = res.data;
      if (newRow.daily || newRow.weekly || newRow.monthly) {
        setRate.mutate({
          vehicleClassId: vc.id,
          branchId,
          daily: newRow.daily ? parseFloat(newRow.daily) : null,
          weekly: newRow.weekly ? parseFloat(newRow.weekly) : null,
          monthly: newRow.monthly ? parseFloat(newRow.monthly) : null,
        });
      } else {
        qc.invalidateQueries({ queryKey: ['rates', branchId] });
      }
      setShowAddModal(false);
      setNewRow({ code: '', description: '', example: '', daily: '', weekly: '', monthly: '' });
    },
  });

  async function loadHistory(vehicleClassId: string) {
    const token = await getToken();
    const res = await api.get(`/rates/history?branchId=${branchId}&vehicleClassId=${vehicleClassId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setHistory(res.data);
    setShowHistory(vehicleClassId);
  }

  function startEdit(entry: RateEntry) {
    setEditingId(entry.vehicleClass.id);
    setEditVals({
      daily: entry.rate?.daily ? parseFloat(entry.rate.daily).toFixed(2) : '',
      weekly: entry.rate?.weekly ? parseFloat(entry.rate.weekly).toFixed(2) : '',
      monthly: entry.rate?.monthly ? parseFloat(entry.rate.monthly).toFixed(2) : '',
    });
    setEffectiveFrom(new Date().toISOString().split('T')[0]);
  }

  function saveEdit(vehicleClassId: string) {
    setRate.mutate({
      vehicleClassId,
      branchId,
      daily: editVals.daily ? parseFloat(editVals.daily) : null,
      weekly: editVals.weekly ? parseFloat(editVals.weekly) : null,
      monthly: editVals.monthly ? parseFloat(editVals.monthly) : null,
      effectiveFrom: effectiveFrom || new Date().toISOString(),
    });
  }

  if (!branchId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        No branch selected. Please select a branch to manage rates.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Hire Rates</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Branch-specific rates for <strong>{selectedBranch?.name}</strong>. Click a row to edit.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ background: '#01ae42', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
        >
          + Add class
        </button>
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '16px' }}>ℹ️</span>
        <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', lineHeight: '1.5' }}>
          All amounts in AUD (ex. GST). Each save creates a new history entry with an effective date — previous rates are preserved for reporting.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '52px', textAlign: 'center' }}>Class</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Example Vehicles</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Daily</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Weekly</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Monthly</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Effective</th>
              <th style={{ ...thStyle, width: '120px' }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : rates.map((entry) => {
              const vc = entry.vehicleClass;
              const isEditing = editingId === vc.id;
              const justSaved = savedId === vc.id;

              return (
                <tr
                  key={vc.id}
                  style={{ background: isEditing ? '#f0fdf4' : justSaved ? '#f0fdf4' : 'transparent', transition: 'background 0.3s', cursor: isEditing ? 'default' : 'pointer' }}
                  onClick={() => !isEditing && startEdit(entry)}
                >
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', background: '#01ae4215', color: '#01ae42', fontSize: '13px', fontWeight: 700 }}>
                      {vc.code}
                    </span>
                  </td>
                  <td style={tdStyle}><span style={{ fontWeight: 500 }}>{vc.description}</span></td>
                  <td style={{ ...tdStyle, color: '#64748b', fontSize: '13px' }}>{vc.example || '—'}</td>

                  {isEditing ? (
                    <>
                      {(['daily', 'weekly', 'monthly'] as const).map(period => (
                        <td key={period} style={tdRight} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                            <span style={{ color: '#64748b', fontSize: '13px' }}>$</span>
                            <input
                              style={inputStyle}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={editVals[period]}
                              onChange={e => setEditVals(v => ({ ...v, [period]: e.target.value }))}
                              autoFocus={period === 'daily'}
                            />
                          </div>
                        </td>
                      ))}
                      <td style={tdRight} onClick={e => e.stopPropagation()}>
                        <input
                          type="date"
                          value={effectiveFrom}
                          onChange={e => setEffectiveFrom(e.target.value)}
                          style={{ ...inputStyle, width: '130px' }}
                        />
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => saveEdit(vc.id)}
                            disabled={setRate.isPending}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            {setRate.isPending ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={tdRight}>{fmt(entry.rate?.daily) ? <span style={{ fontWeight: 500 }}>{fmt(entry.rate?.daily)}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                      <td style={tdRight}>{fmt(entry.rate?.weekly) ? <span style={{ fontWeight: 500 }}>{fmt(entry.rate?.weekly)}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                      <td style={tdRight}>{fmt(entry.rate?.monthly) ? <span style={{ fontWeight: 500 }}>{fmt(entry.rate?.monthly)}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                      <td style={{ ...tdRight, fontSize: '12px', color: '#94a3b8' }}>
                        {entry.rate ? new Date(entry.rate.effectiveFrom).toLocaleDateString('en-AU') : '—'}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={e => { e.stopPropagation(); startEdit(entry); }}
                            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); loadHistory(vc.id); }}
                            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '560px', maxWidth: '95vw', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                Rate History — Class {rates.find(r => r.vehicleClass.id === showHistory)?.vehicleClass.code}
              </h2>
              <button onClick={() => setShowHistory(null)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>
            {history.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No history yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    {['Effective From', 'Daily', 'Weekly', 'Monthly'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Effective From' ? 'left' : 'right', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9', background: i === 0 ? '#f0fdf4' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#0f172a' }}>
                        {new Date(h.effectiveFrom).toLocaleDateString('en-AU')}
                        {i === 0 && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#01ae42', fontWeight: 600 }}>CURRENT</span>}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px' }}>{fmt(h.daily) || '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px' }}>{fmt(h.weekly) || '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px' }}>{fmt(h.monthly) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '480px', maxWidth: '95vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>Add vehicle class</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Code *</label>
                  <input
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', textAlign: 'center', fontWeight: 700 }}
                    placeholder="O"
                    value={newRow.code}
                    onChange={e => setNewRow(v => ({ ...v, code: e.target.value.toUpperCase() }))}
                    maxLength={2}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Description *</label>
                  <input
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="e.g. Electric Vehicle"
                    value={newRow.description}
                    onChange={e => setNewRow(v => ({ ...v, description: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Example vehicles</label>
                <input
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="e.g. Tesla Model 3 / BYD Atto 3"
                  value={newRow.example}
                  onChange={e => setNewRow(v => ({ ...v, example: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Starting rates for {selectedBranch?.name} (optional)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {(['daily', 'weekly', 'monthly'] as const).map(period => (
                    <div key={period}>
                      <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'capitalize' }}>{period} ($)</label>
                      <input
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', textAlign: 'right' }}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newRow[period]}
                        onChange={e => setNewRow(v => ({ ...v, [period]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => createClass.mutate({ code: newRow.code, description: newRow.description, example: newRow.example || undefined })}
                disabled={!newRow.code || !newRow.description || createClass.isPending}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: !newRow.code || !newRow.description ? '#d1fae5' : '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: !newRow.code || !newRow.description ? 'not-allowed' : 'pointer' }}
              >
                {createClass.isPending ? 'Adding...' : 'Add class'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
