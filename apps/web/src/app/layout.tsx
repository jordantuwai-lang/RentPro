'use client';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BranchProvider } from '@/context/BranchContext';
import './globals.css';

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <BranchProvider>
          <html lang="en">
            <body>{children}</body>
          </html>
        </BranchProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
