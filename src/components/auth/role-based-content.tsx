'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/models/user.model';

interface RoleBasedContentProps {
  children: ReactNode;
  allowedRoles: User['role'][];
  fallback?: ReactNode;
}

/**
 * Komponen untuk menampilkan konten berdasarkan peran pengguna
 * @param children Konten yang akan ditampilkan jika pengguna memiliki peran yang diizinkan
 * @param allowedRoles Daftar peran yang diizinkan untuk melihat konten
 * @param fallback Konten alternatif yang akan ditampilkan jika pengguna tidak memiliki peran yang diizinkan
 */
export function RoleBasedContent({ children, allowedRoles, fallback = null }: RoleBasedContentProps) {
  const { user } = useAuth();

  // Jika user tidak terautentikasi atau tidak memiliki peran yang diizinkan, tampilkan fallback
  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  // Jika user memiliki peran yang diizinkan, tampilkan children
  return <>{children}</>;
}