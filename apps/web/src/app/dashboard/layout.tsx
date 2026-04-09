'use client';
import { useEffect } from 'react';
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

<<<<<<< HEAD
  // useEffect(() => {
  //   if (selectedBranch === null) {
  //     const stored = sessionStorage.getItem('selectedBranch');
  //     if (!stored) {
  //       router.push('/select-branch');
  //     }
  //   }
  // }, [selectedBranch, router]);
=======
// useEffect(() => {
  //   if (selectedBranch === null) {
  //     const stored = sessionStorage.getItem('selectedBranch');
  //     if (!stored) {
  //       router.push('/select-branch');
  //     }
  //   }
  // }, [selectedBranch, router]);
>>>>>>> Rebuild logistics page: job types, filters, bulk assign, add job modal

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
