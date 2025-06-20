/**
 * Middleware untuk validasi token dan autentikasi
 * Mencegah logout yang tidak diinginkan dan menangani refresh token
 */

import { supabase } from '@/lib/supabase';
import { AuthUser } from '@/services/authService';

// Konstanta untuk token dan autentikasi
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 menit dalam milidetik
const AUTH_STORAGE_KEY = 'loggedInUser';
const AUTH_STATUS_KEY = 'isAuthenticated';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

/**
 * Memeriksa apakah token masih valid
 */
export function isTokenValid(): boolean {
  const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!tokenExpiry) return false;
  
  const expiryTime = parseInt(tokenExpiry, 10);
  const currentTime = Date.now();
  
  return currentTime < expiryTime;
}

/**
 * Memeriksa apakah token perlu diperbarui
 */
export function shouldRefreshToken(): boolean {
  const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!tokenExpiry) return true;
  
  const expiryTime = parseInt(tokenExpiry, 10);
  const currentTime = Date.now();
  
  // Perbarui token jika akan kedaluwarsa dalam waktu dekat
  return expiryTime - currentTime < TOKEN_REFRESH_THRESHOLD;
}

/**
 * Memperbarui token secara otomatis dengan penanganan error yang lebih baik
 */
export async function refreshToken(): Promise<boolean> {
  try {
    // Periksa apakah ada sesi aktif sebelum mencoba refresh
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.warn('Tidak ada sesi aktif untuk diperbarui');
      return false;
    }
    
    // Coba refresh token dengan penanganan error yang lebih baik
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Gagal memperbarui token:', error);
      // Jika error adalah 406, coba lagi dengan pendekatan berbeda
      if (error.status === 406) {
        console.warn('Error 406 saat refresh token, mencoba pendekatan alternatif');
        // Simpan token yang ada dengan waktu kedaluwarsa yang diperpanjang
        // Ini hanya solusi sementara sampai user login ulang
        const currentUser = getCurrentUserWithValidation();
        if (currentUser && currentUser.token) {
          const extendedExpiry = Date.now() + (60 * 60 * 1000); // Perpanjang 1 jam
          localStorage.setItem(TOKEN_EXPIRY_KEY, extendedExpiry.toString());
          return true;
        }
      }
      return false;
    }
    
    if (!data.session) {
      console.warn('Refresh berhasil tapi tidak ada sesi baru');
      return false;
    }
    
    // Simpan waktu kedaluwarsa token baru
    const expiryTime = new Date(data.session.expires_at || '').getTime();
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // Perbarui token di localStorage jika user ada
    const userJson = localStorage.getItem(AUTH_STORAGE_KEY);
    if (userJson) {
      try {
        const user = JSON.parse(userJson) as AuthUser;
        user.token = data.session.access_token;
        user.tokenExpiry = expiryTime;
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } catch (parseError) {
        console.error('Error parsing user data saat refresh token:', parseError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Exception saat memperbarui token:', error);
    return false;
  }
}

/**
 * Mendapatkan user yang sedang login dengan validasi token
 */
export function getCurrentUserWithValidation(): AuthUser | null {
  // Periksa status autentikasi
  const isAuthenticated = localStorage.getItem(AUTH_STATUS_KEY) === 'true';
  if (!isAuthenticated) return null;
  
  // Periksa validitas token
  if (!isTokenValid()) {
    // Coba refresh token jika tidak valid
    refreshToken().catch(() => {
      // Jika gagal refresh, jangan logout user langsung
      // Biarkan mereka tetap bisa mengakses data yang di-cache
      console.warn('Token tidak valid dan gagal diperbarui, tetapi tetap mempertahankan sesi');
    });
  }
  
  // Ambil data user dari localStorage
  const userJson = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson) as AuthUser;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

/**
 * Menyimpan data user dan token ke localStorage
 */
export function saveUserAndToken(user: AuthUser, expiresIn: number = 3600): void {
  localStorage.setItem(AUTH_STATUS_KEY, 'true');
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  
  // Simpan waktu kedaluwarsa token (dalam milidetik)
  const expiryTime = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

/**
 * Inisialisasi middleware autentikasi
 */
export function initAuthMiddleware(): void {
  // Periksa dan refresh token secara berkala
  setInterval(() => {
    if (localStorage.getItem(AUTH_STATUS_KEY) === 'true' && shouldRefreshToken()) {
      refreshToken().catch(console.error);
    }
  }, 60000); // Periksa setiap menit
  
  // Tambahkan listener untuk event storage untuk sinkronisasi antar tab
  window.addEventListener('storage', (event) => {
    if (event.key === AUTH_STATUS_KEY && event.newValue !== 'true') {
      // User logout di tab lain
      window.location.href = '/login';
    }
  });
}

/**
 * Middleware untuk memeriksa autentikasi pada halaman tertentu
 * @param allowedRoles - Daftar peran yang diizinkan untuk mengakses halaman
 * @param redirectTo - URL untuk redirect jika tidak terautentikasi
 * @returns Promise<boolean> - true jika terautentikasi dan memiliki peran yang sesuai
 */
export async function requireAuth(allowedRoles?: string[], redirectTo: string = '/login'): Promise<boolean> {
  const user = getCurrentUserWithValidation();
  
  if (!user) {
    // Redirect ke halaman login jika tidak terautentikasi
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    return false;
  }
  
  // Jika token perlu diperbarui, lakukan refresh
  if (shouldRefreshToken()) {
    try {
      await refreshToken();
    } catch (error) {
      console.error('Error refreshing token in requireAuth:', error);
      // Tetap lanjutkan meskipun refresh gagal
    }
  }
  
  // Jika ada pembatasan peran, periksa apakah user memiliki peran yang diizinkan
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.includes(user.role);
    if (!hasAllowedRole) {
      return false;
    }
  }
  
  return true;
}