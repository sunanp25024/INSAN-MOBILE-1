import { supabase, supabaseSelect } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import { hashPassword, verifyPassword } from '@/lib/security';

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export class UserModel {
  /**
   * Mengambil semua pengguna
   */
  static async getAll(): Promise<User[]> {
    const { data, error } = await supabaseSelect
      .from('users')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil pengguna berdasarkan ID
   */
  static async getById(id: string): Promise<User | null> {
    const { data, error } = await supabaseSelect
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Mengambil pengguna berdasarkan peran
   */
  static async getByRole(role: User['role']): Promise<User[]> {
    const { data, error } = await supabaseSelect
      .from('users')
      .select('*')
      .eq('role', role);

    if (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      throw error;
    }

    return data || [];
  }
  
  /**
   * Mengambil pengguna berdasarkan username
   */
  static async getByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabaseSelect
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error) {
      console.error(`Error fetching user with username ${username}:`, error);
      return null;
    }

    return data;
  }
  
  /**
   * Mengambil pengguna berdasarkan email
   */
  static async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseSelect
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      console.error(`Error fetching user with email ${email}:`, error);
      return null;
    }

    return data;
  }

  /**
   * Membuat pengguna baru dengan password yang di-hash
   */
  static async create(user: UserInsert): Promise<User> {
    // Pastikan username dan email dalam lowercase
    const userData = {
      ...user,
      username: user.username?.toLowerCase(),
      email: user.email?.toLowerCase()
    };
    
    // Hash password jika ada
    if (userData.password_hash) {
      userData.password_hash = await hashPassword(userData.password_hash);
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    return data;
  }

  /**
   * Memperbarui pengguna dengan password yang di-hash jika diperbarui
   */
  static async update(id: string, updates: UserUpdate): Promise<User> {
    // Pastikan username dan email dalam lowercase jika diperbarui
    const userData = {
      ...updates,
      username: updates.username?.toLowerCase(),
      email: updates.email?.toLowerCase()
    };
    
    // Hash password jika diperbarui
    if (userData.password_hash) {
      userData.password_hash = await hashPassword(userData.password_hash);
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Menghapus pengguna
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Autentikasi pengguna dengan verifikasi password yang aman
   */
  static async authenticate(username: string, password: string): Promise<User> {
    // Gunakan getByUsername untuk mendapatkan user
    const user = await this.getByUsername(username.toLowerCase());
    
    if (!user) {
      throw new Error('ID atau password salah');
    }

    // Verifikasi password dengan bcryptjs
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('ID atau password salah');
    }

    return user;
  }
}