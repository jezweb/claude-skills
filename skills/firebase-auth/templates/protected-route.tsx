// src/components/ProtectedRoute.tsx
// Client-side route protection

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerified?: boolean;
  requireAdmin?: boolean;
  fallbackUrl?: string;
}

export function ProtectedRoute({
  children,
  requireEmailVerified = false,
  requireAdmin = false,
  fallbackUrl = '/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push(fallbackUrl);
      return;
    }

    if (requireEmailVerified && !user.emailVerified) {
      router.push('/verify-email');
      return;
    }

    // For admin check, you'd need to verify custom claims
    // This is a simplified example
    if (requireAdmin) {
      user.getIdTokenResult().then((tokenResult) => {
        if (!tokenResult.claims.admin) {
          router.push('/unauthorized');
        }
      });
    }
  }, [user, loading, router, requireEmailVerified, requireAdmin, fallbackUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireEmailVerified && !user.emailVerified) {
    return null;
  }

  return <>{children}</>;
}
