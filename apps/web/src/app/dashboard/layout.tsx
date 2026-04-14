'use client';
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

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: '#f8fafc', // Slightly more neutral than fdf9 for high-contrast data
      color: '#0f172a' 
    }}>
      <AuthSync />
      
      {/* Sidebar - Assuming it has its own internal width/scroll */}
      <Sidebar />

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        minWidth: 0 // Prevents flex children from pushing container width
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