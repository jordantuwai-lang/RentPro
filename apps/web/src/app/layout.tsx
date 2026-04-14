'use client';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BranchProvider } from '@/context/BranchContext';
import { ThemeProvider } from '@/context/ThemeContext';
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
          <ThemeProvider>
            <html lang="en">
              <body>{children}</body>
            </html>
          </ThemeProvider>
        </BranchProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
