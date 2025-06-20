import React, { useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { AuthContext, AuthContextProvider } from '@/contexts/AuthContext';
import * as AuthService from '@/services/authService';
import { AuthUser } from '@/services/authService';
import { getCurrentUserWithValidation, refreshToken, saveUserAndToken, initAuthMiddleware } from '@/lib/auth-middleware';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inisialisasi middleware autentikasi
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initAuthMiddleware();
    }
  }, []);
  
  return <AuthContextProvider>{children}</AuthContextProvider>;
}

export function useAuth() {
  const { user, isLoading, setUser, setIsLoading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        // Gunakan fungsi dari middleware untuk mendapatkan user dengan validasi token
        const currentUser = getCurrentUserWithValidation();
        if (currentUser) {
          setUser(currentUser);
          // Refresh token jika perlu
          refreshToken().catch(console.error);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setUser, setIsLoading]);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Coba login dengan email terlebih dahulu
      let authUser: AuthUser | null = null;
      
      if (usernameOrEmail.includes('@')) {
        // Login dengan email
        authUser = await AuthService.loginWithEmail(usernameOrEmail, password);
      } else {
        // Login dengan username
        authUser = await AuthService.loginWithUsername(usernameOrEmail, password);
      }
      
      if (authUser) {
        // Simpan user dan token menggunakan fungsi dari middleware
        saveUserAndToken(authUser);
        setUser(authUser);
        toast.success('Login berhasil!');
        router.push('/dashboard');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login gagal. Silakan coba lagi.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      setUser(null);
      toast.success('Logout berhasil!');
      router.push('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Logout gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<AuthUser>) => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      const updatedUser = await AuthService.updateProfile(userData);
      if (updatedUser) {
        // Update user data dan token
        saveUserAndToken(updatedUser);
        setUser(updatedUser);
        toast.success('Profil berhasil diperbarui!');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Gagal memperbarui profil. Silakan coba lagi.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      await AuthService.changePassword(currentPassword, newPassword);
      // Refresh token setelah mengubah password
      await refreshToken();
      toast.success('Password berhasil diubah!');
      return true;
    } catch (error: any) {
      console.error('Change password error:', error);
      toast.error(error.message || 'Gagal mengubah password. Silakan coba lagi.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (allowedRoles: string[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateProfile,
    changePassword,
    hasRole,
  };
}