'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AuthSync from '@/components/AuthSync';
import { useBranch } from '@/context/BranchContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { selectedBranch } = useBranch();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setSidebarOpen(false);
  }, []);

  const toggle = () => {
    setSidebarOpen(prev => {
      localStorage.setItem('sidebar-collapsed', String(prev));
      return !prev;
    });
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#f8fafc',
      color: '#0f172a'
    }}>
      <AuthSync />

      {/* Sidebar + toggle wrapper */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: sidebarOpen ? '240px' : '0px',
          overflow: 'hidden',
          transition: 'width 0.22s ease',
        }}>
          <Sidebar />
        </div>

        {/* Toggle tab */}
        <button
          onClick={toggle}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          style={{
            position: 'absolute',
            top: '72px',
            right: '-14px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '1px solid #e2e8f0',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            color: '#475569',
            zIndex: 50,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}>
        {/* Global Header Bar */}
        <header style={{
          height: '64px',
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 40 // Stays above content but below your modals (which were 100+)
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
              Current Branch:
            </span>
            <div style={{ 
              padding: '6px 12px', 
              background: '#f1f5f9', 
              borderRadius: '6px', 
              fontSize: '13px', 
              fontWeight: 600,
              color: '#01ae42'
            }}>
              {selectedBranch?.name || 'All Branches'}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{ 
          flex: 1, 
          padding: '32px', 
          width: '100%',
          maxWidth: '1600px', // Prevents table rows from becoming too long on ultrawide monitors
          margin: '0 auto',
          boxSizing: 'border-box'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}