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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fdf9' }}>
      <AuthSync />
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
