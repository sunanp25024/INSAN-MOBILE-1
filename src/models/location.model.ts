import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export type Location = Database['public']['Tables']['locations']['Row'];
export type LocationInsert = Database['public']['Tables']['locations']['Insert'];
export type LocationUpdate = Database['public']['Tables']['locations']['Update'];

export class LocationModel {
  /**
   * Mengambil semua lokasi
   */
  static async getAll(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*');

    if (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil lokasi berdasarkan ID
   */
  static async getById(id: string): Promise<Location | null> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching location with ID ${id}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Mengambil lokasi berdasarkan tipe
   */
  static async getByType(type: Location['type']): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('type', type);

    if (error) {
      console.error(`Error fetching locations with type ${type}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Membuat lokasi baru
   */
  static async create(location: LocationInsert): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .insert(location)
      .select()
      .single();

    if (error) {
      console.error('Error creating location:', error);
      throw error;
    }

    return data;
  }

  /**
   * Memperbarui lokasi
   */
  static async update(id: string, updates: LocationUpdate): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating location with ID ${id}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Menghapus lokasi
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting location with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mencari lokasi berdasarkan nama atau alamat
   */
  static async search(query: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .or(`name.ilike.%${query}%,address.ilike.%${query}%`);

    if (error) {
      console.error(`Error searching locations with query ${query}:`, error);
      throw error;
    }

    return data || [];
  }
}