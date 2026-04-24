'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ReservationsPage() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  
  // State for search and current active tab
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACTIVE' | 'CANCELLED'>('PENDING');

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations'],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get('/reservations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
  });

  // Rule: Tab 1 includes PENDING and DRAFT. Others are specific to their status.
  const filteredReservations = reservations?.filter((res: any) => {
    const searchTerm = search.toLowerCase();
    const matchesSearch = (
      res.fileNumber?.toLowerCase().includes(searchTerm) ||
      res.customer?.firstName?.toLowerCase().includes(searchTerm) ||
      res.customer?.lastName?.toLowerCase().includes(searchTerm) ||
      res.vehicle?.registration?.toLowerCase().includes(searchTerm)
    );

    if (!matchesSearch) return false;

    if (activeTab === 'PENDING') {
      return res.status === 'PENDING' || res.status === 'DRAFT';
    }
    return res.status === activeTab;
  }) || [];

  const tabStyle = (tab: typeof activeTab): React.CSSProperties => ({
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    color: activeTab === tab ? '#01ae42' : '#64748b',
    borderBottom: activeTab === tab ? '2px solid #01ae42' : '2px solid transparent',
    transition: 'all 0.2s'
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Reservations</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage and track all hire files</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => router.push('/dashboard/reservations/new/credit-hire')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#01ae42', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>+ Credit Hire</button>
          <button onClick={() => router.push('/dashboard/reservations/new/direct-hire')} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #01ae42', background: '#fff', color: '#01ae42', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>+ Direct Hire</button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', gap: '8px' }}>
        <button onClick={() => setActiveTab('PENDING')} style={tabStyle('PENDING')}>Pending / Drafts</button>
        <button onClick={() => setActiveTab('ACTIVE')} style={tabStyle('ACTIVE')}>Active Hires</button>
        <button onClick={() => setActiveTab('CANCELLED')} style={tabStyle('CANCELLED')}>Cancelled</button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <input 
          type="text" 
          placeholder="Search within this tab..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          style={{ width: '100%', maxWidth: '400px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }} 
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['File #', 'Customer', 'Vehicle', 'Status', 'Start Date'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : filteredReservations.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No {activeTab.toLowerCase()} reservations found.</td></tr>
            ) : (
              filteredReservations.map((res: any) => (
                <tr key={res.id} onClick={() => router.push(`/dashboard/reservations/${res.id}`)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                  <td style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 700, color: '#01ae42' }}>{res.fileNumber || '—'}</td>
                  <td style={{ padding: '8px 16px', fontSize: '13px', color: '#0f172a' }}>{res.customer?.firstName} {res.customer?.lastName}</td>
                  <td style={{ padding: '8px 16px', fontSize: '12px', color: '#64748b' }}>{res.vehicle?.registration || 'TBA'}</td>
                  <td style={{ padding: '8px 16px' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '20px', 
                      fontSize: '10px', 
                      fontWeight: 700, 
                      background: res.status === 'ACTIVE' ? '#f0fdf4' : res.status === 'CANCELLED' ? '#fef2f2' : '#f8fafc', 
                      color: res.status === 'ACTIVE' ? '#16a34a' : res.status === 'CANCELLED' ? '#ef4444' : '#64748b' 
                    }}>{res.status}</span>
                  </td>
                  <td style={{ padding: '8px 16px', fontSize: '12px', color: '#64748b' }}>{new Date(res.startDate).toLocaleDateString('en-AU')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}