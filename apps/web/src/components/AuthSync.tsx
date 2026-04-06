'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { setAuthToken } from '@/lib/api';

export default function AuthSync() {
  const { getToken } = useAuth();

  useEffect(() => {
    const sync = async () => {
      const token = await getToken();
      setAuthToken(token);
    };
    sync();
    const interval = setInterval(sync, 50000);
    return () => clearInterval(interval);
  }, [getToken]);

  return null;
}
