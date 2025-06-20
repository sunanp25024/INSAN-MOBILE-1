import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface RoleBasedContentProps {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Komponen untuk menampilkan konten berdasarkan peran pengguna
 * @param allowedRoles - Array peran yang diizinkan untuk melihat konten
 * @param children - Konten yang akan ditampilkan jika pengguna memiliki peran yang sesuai
 * @param fallback - Konten alternatif yang akan ditampilkan jika pengguna tidak memiliki peran yang sesuai
 */
export function RoleBasedContent({ allowedRoles, children, fallback }: RoleBasedContentProps) {
  const { user, hasRole } = useAuth();

  // Jika pengguna tidak login atau tidak memiliki peran yang diizinkan
  if (!user || !hasRole(allowedRoles)) {
    // Tampilkan fallback jika ada, atau null jika tidak ada
    return fallback ? <>{fallback}</> : null;
  }

  // Jika pengguna memiliki peran yang diizinkan, tampilkan konten
  return <>{children}</>;
}