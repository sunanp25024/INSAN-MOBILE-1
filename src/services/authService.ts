import { supabase } from '@/lib/supabase';
import { UserModel, User } from '@/models/user.model';
import { verifyPassword, hashPassword } from '@/lib/security';

export interface AuthUser {
  id: string;
  fullName: string;
  role: User['role'];
  avatarUrl?: string;
  email?: string;
  workLocation?: string;
  joinDate?: string;
  token?: string;
  tokenExpiry?: number;
}

export class AuthService {
  /**
   * Login dengan email dan password
   */
  static async loginWithEmail(email: string, password: string): Promise<AuthUser> {
    try {
      // Gunakan Supabase Auth untuk login dengan penanganan error yang lebih baik
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password,
        });

        if (authError) {
          console.error('Error saat login dengan Supabase Auth:', authError);
          throw new Error(authError.message);
        }
        
        if (!authData.user) {
          throw new Error('Login gagal');
        }

        // Dapatkan data user dari database
        const userData = await UserModel.getById(authData.user.id);

        if (!userData) {
          // Logout jika data user tidak ditemukan
          await this.logout();
          throw new Error('Data pengguna tidak ditemukan');
        }

        // Simpan data user ke localStorage
        const authUser: AuthUser = {
          id: userData.id,
          fullName: userData.full_name,
          role: userData.role,
          avatarUrl: userData.profile_image_url,
          email: userData.email,
          workLocation: userData.location_id,
          joinDate: userData.created_at,
          token: authData.session?.access_token,
          tokenExpiry: authData.session?.expires_at ? authData.session.expires_at * 1000 : undefined,
        };

        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('loggedInUser', JSON.stringify(authUser));

        return authUser;
      } catch (authError: any) {
        // Coba alternatif login dengan username jika email gagal
        // Cari user berdasarkan email
        const userByEmail = await UserModel.getByEmail(email.toLowerCase());

        if (!userByEmail) {
          throw new Error('Email atau password salah');
        }

        // Verifikasi password dengan bcryptjs
        const isPasswordValid = await verifyPassword(password, userByEmail.password_hash);
        if (!isPasswordValid) {
          throw new Error('Email atau password salah');
        }

        // Buat authUser tanpa token (karena login Supabase Auth gagal)
        const authUser: AuthUser = {
          id: userByEmail.id,
          fullName: userByEmail.full_name,
          role: userByEmail.role,
          avatarUrl: userByEmail.profile_image_url,
          email: userByEmail.email,
          workLocation: userByEmail.location_id,
          joinDate: userByEmail.created_at,
        };

        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('loggedInUser', JSON.stringify(authUser));

        return authUser;
      }
    } catch (error: any) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('loggedInUser');
      throw error;
    }
  }

  /**
   * Login dengan username dan password (untuk kompatibilitas dengan sistem lama)
   */
  static async loginWithUsername(username: string, password: string): Promise<AuthUser> {
    try {
      // Cari user berdasarkan username
      const userByUsername = await UserModel.getByUsername(username.toLowerCase());

      if (!userByUsername) {
        throw new Error('Username atau password salah');
      }

      // Verifikasi password dengan bcryptjs
      const isPasswordValid = await verifyPassword(password, userByUsername.password_hash);
      if (!isPasswordValid) {
        throw new Error('Username atau password salah');
      }

      // Login ke Supabase Auth jika user memiliki email
      let token = undefined;
      let tokenExpiry = undefined;
      
      if (userByUsername.email) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: userByUsername.email,
            password: password,
          });
          
          if (authError) {
            console.warn('Error saat login ke Supabase Auth:', authError);
            // Lanjutkan meskipun ada error, karena kita sudah memverifikasi user dari database
          } else if (authData.session) {
            token = authData.session.access_token;
            tokenExpiry = authData.session.expires_at ? authData.session.expires_at * 1000 : undefined;
          }
        } catch (authError) {
          console.warn('Exception saat login ke Supabase Auth:', authError);
          // Lanjutkan meskipun ada error, karena kita sudah memverifikasi user dari database
        }
      }

      // Simpan data user ke localStorage
      const authUser: AuthUser = {
        id: userByUsername.id,
        fullName: userByUsername.full_name,
        role: userByUsername.role,
        avatarUrl: userByUsername.profile_image_url,
        email: userByUsername.email,
        workLocation: userByUsername.location_id,
        joinDate: userByUsername.created_at,
        token,
        tokenExpiry,
      };

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('loggedInUser', JSON.stringify(authUser));

      return authUser;
    } catch (error: any) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('loggedInUser');
      throw error;
    }
  }

  /**
   * Mendaftar pengguna baru (hanya untuk Admin dan MasterAdmin)
   */
  static async register(email: string, password: string, userData: Partial<User>): Promise<AuthUser> {
    try {
      // Hanya Admin dan MasterAdmin yang bisa mendaftarkan pengguna baru
      const currentUser = this.getCurrentUser();
      if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'MasterAdmin')) {
        throw new Error('Anda tidak memiliki izin untuk mendaftarkan pengguna baru');
      }

      // Daftarkan pengguna di Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Pendaftaran gagal');

      // Buat data pengguna di database
      const newUser = await UserModel.create({
        id: authData.user.id,
        email,
        full_name: userData.full_name || '',
        role: userData.role || 'Kurir',
        username: userData.username || email.split('@')[0],
        password_hash: password, // Dalam implementasi nyata, jangan simpan password mentah
        status: 'active',
        created_at: new Date().toISOString(),
        location_id: userData.location_id,
        ...userData,
      });

      return {
        id: newUser.id,
        fullName: newUser.full_name,
        role: newUser.role,
        avatarUrl: newUser.profile_image_url,
        email: newUser.email,
        workLocation: newUser.location_id,
        joinDate: newUser.created_at,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Logout
   */
  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('loggedInUser');
    } catch (error: any) {
      console.error('Error during logout:', error);
      // Tetap hapus data lokal meskipun terjadi error
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('loggedInUser');
    }
  }

  /**
   * Mendapatkan user yang sedang login
   */
  static getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) return null;
    
    const userJson = localStorage.getItem('loggedInUser');
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson) as AuthUser;
    } catch {
      return null;
    }
  }

  /**
   * Memeriksa apakah user sedang login
   */
  static isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  /**
   * Memeriksa apakah user memiliki peran tertentu
   */
  static hasRole(role: User['role'] | User['role'][]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  }

  /**
   * Memperbarui profil pengguna
   */
  static async updateProfile(updates: Partial<User>): Promise<AuthUser> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Anda harus login terlebih dahulu');
    }

    const updatedUser = await UserModel.update(currentUser.id, updates);

    // Perbarui data di localStorage
    const authUser: AuthUser = {
      id: updatedUser.id,
      fullName: updatedUser.full_name,
      role: updatedUser.role,
      avatarUrl: updatedUser.profile_image_url,
      email: updatedUser.email,
      workLocation: updatedUser.location_id,
      joinDate: updatedUser.created_at,
      token: currentUser.token,
      tokenExpiry: currentUser.tokenExpiry,
    };

    localStorage.setItem('loggedInUser', JSON.stringify(authUser));

    return authUser;
  }

  /**
   * Mengubah password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('Anda harus login terlebih dahulu');
    }

    // Dapatkan data user dari database
    const userData = await UserModel.getById(user.id);
    if (!userData) {
      throw new Error('Gagal memverifikasi password saat ini');
    }

    // Verifikasi password saat ini dengan bcryptjs
    const isPasswordValid = await verifyPassword(currentPassword, userData.password_hash);
    if (!isPasswordValid) {
      throw new Error('Password saat ini salah');
    }

    // Ubah password di Supabase Auth (jika menggunakan Auth)
    const { data: authData, error: authError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    // Perbarui token jika ada
    if (authData.session) {
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        currentUser.token = authData.session.access_token;
        currentUser.tokenExpiry = authData.session.expires_at ? authData.session.expires_at * 1000 : undefined;
        localStorage.setItem('loggedInUser', JSON.stringify(currentUser));
      }
    }

    // Hash password baru dan simpan ke database
    const hashedPassword = await hashPassword(newPassword);
    await UserModel.update(user.id, {
      password_hash: hashedPassword,
    });
  }

  /**
   * Refresh token
   */
  static async refreshToken(): Promise<string | null> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.error('Error refreshing token:', error);
        return null;
      }
      
      // Perbarui token di localStorage
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        currentUser.token = data.session.access_token;
        currentUser.tokenExpiry = data.session.expires_at ? data.session.expires_at * 1000 : undefined;
        localStorage.setItem('loggedInUser', JSON.stringify(currentUser));
      }
      
      return data.session.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }
}

// Ekspor fungsi-fungsi untuk kemudahan penggunaan
export const { 
  loginWithEmail, 
  loginWithUsername, 
  logout, 
  getCurrentUser, 
  isAuthenticated, 
  hasRole, 
  updateProfile, 
  changePassword,
  refreshToken
} = AuthService;