import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export type Package = Database['public']['Tables']['packages']['Row'];
export type PackageInsert = Database['public']['Tables']['packages']['Insert'];
export type PackageUpdate = Database['public']['Tables']['packages']['Update'];

export class PackageModel {
  /**
   * Mengambil semua paket
   */
  static async getAll(): Promise<Package[]> {
    const { data, error } = await supabase
      .from('packages')
      .select('*');

    if (error) {
      console.error('Error fetching packages:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil paket berdasarkan ID
   */
  static async getById(id: string): Promise<Package | null> {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching package with ID ${id}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Mengambil paket berdasarkan status
   */
  static async getByStatus(status: Package['status']): Promise<Package[]> {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('status', status);

    if (error) {
      console.error(`Error fetching packages with status ${status}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil paket berdasarkan kurir
   */
  static async getByCourier(courierId: string): Promise<Package[]> {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('courier_id', courierId);

    if (error) {
      console.error(`Error fetching packages for courier ${courierId}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Membuat paket baru
   */
  static async create(pkg: PackageInsert): Promise<Package> {
    const { data, error } = await supabase
      .from('packages')
      .insert(pkg)
      .select()
      .single();

    if (error) {
      console.error('Error creating package:', error);
      throw error;
    }

    return data;
  }

  /**
   * Memperbarui paket
   */
  static async update(id: string, updates: PackageUpdate): Promise<Package> {
    const { data, error } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating package with ID ${id}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Menghapus paket
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting package with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mengubah status paket
   */
  static async updateStatus(id: string, status: Package['status'], notes?: string): Promise<Package> {
    const updates: PackageUpdate = { 
      status, 
      updated_at: new Date().toISOString() 
    };
    
    if (notes) {
      updates.notes = notes;
    }

    return this.update(id, updates);
  }

  /**
   * Menetapkan kurir untuk paket
   */
  static async assignCourier(id: string, courierId: string): Promise<Package> {
    return this.update(id, { 
      courier_id: courierId,
      updated_at: new Date().toISOString() 
    });
  }
}