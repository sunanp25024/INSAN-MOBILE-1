import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  useEffect(() => {
    // Gunakan middleware auth untuk validasi token
    const checkAuth = async () => {
      if (!isLoading && isAuthenticated) {
        // Validasi token dan peran
        await requireAuth();
        
        // Jika ada pembatasan peran dan pengguna tidak memiliki peran yang diizinkan
        if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
          // Middleware tidak menangani pembatasan peran, jadi kita tangani di sini
          window.location.href = '/dashboard';
        }
      }
    };
    
    checkAuth();
  }, [user, isLoading, isAuthenticated, hasRole, allowedRoles]);

  // Jika masih loading, tampilkan indikator loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Memuat...</span>
      </div>
    );
  }

  // Jika tidak terautentikasi, redirect ke halaman login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika ada pembatasan peran dan pengguna tidak memiliki peran yang diizinkan
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    // Redirect ke dashboard jika tidak memiliki akses
    return <Navigate to="/dashboard" replace />;
  }

  // Jika terautentikasi dan memiliki peran yang sesuai, tampilkan konten
  return <>{children}</>;
}