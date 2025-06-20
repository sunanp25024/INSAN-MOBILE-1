import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { requireAuth } from '@/lib/auth-middleware';
import { User } from '@/models/user.model';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: User['role'][];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Gunakan middleware auth untuk validasi token
    const checkAuth = async () => {
      if (!isLoading) {
        if (!isAuthenticated) {
          // Redirect ke halaman login jika tidak terautentikasi
          router.replace({
            pathname: '/login',
            query: { returnUrl: router.asPath }
          });
        } else {
          // Validasi token dan peran
          await requireAuth();
          
          // Jika ada pembatasan peran dan pengguna tidak memiliki peran yang diizinkan
          if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
            // Redirect ke dashboard jika tidak memiliki akses
            router.replace('/dashboard');
          } else {
            setAuthorized(true);
          }
        }
      }
    };
    
    checkAuth();
  }, [user, isLoading, isAuthenticated, hasRole, allowedRoles, router]);

  // Jika masih loading, tampilkan indikator loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Memuat...</span>
      </div>
    );
  }

  // Jika tidak terautentikasi atau tidak memiliki peran yang sesuai, tampilkan loading
  // (redirect akan terjadi di useEffect)
  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Memeriksa akses...</span>
      </div>
    );
  }

  // Jika terautentikasi dan memiliki peran yang sesuai, tampilkan konten
  return <>{children}</>;
}