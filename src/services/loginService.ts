import { supabaseSelect } from '@/lib/supabase';
import { verifyPassword } from '@/lib/security';
import { UserModel } from '@/models/user.model';

/**
 * Fungsi untuk login dengan username dan password
 * Dengan penanganan error yang lebih baik untuk mengatasi error 406
 */
export const loginUser = async (username: string, password: string) => {
  try {
    // Gunakan UserModel untuk mendapatkan user berdasarkan username
    const user = await UserModel.getByUsername(username.toLowerCase());

    if (!user) {
      throw new Error('ID atau password salah');
    }

    // Verifikasi password dengan bcryptjs
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('ID atau password salah');
    }

    return user;
  } catch (error: any) {
    console.error('Exception saat login dengan username:', error);
    throw new Error(error.message || 'ID atau password salah');
  }
};