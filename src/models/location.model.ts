import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

// Base location type from database
type BaseLocation = Database['public']['Tables']['locations']['Row'];

// Extended location type with UI-specific properties
export interface Location extends BaseLocation {
  address: string;
  city: string;
  province: string;
  postal_code: string;
  latitude?: number | null;
  longitude?: number | null;
}

// Insert type with UI-specific properties
type BaseLocationInsert = Database['public']['Tables']['locations']['Insert'];
export interface LocationInsert extends BaseLocationInsert {
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  latitude?: number | null;
  longitude?: number | null;
}

// Update type with UI-specific properties
type BaseLocationUpdate = Database['public']['Tables']['locations']['Update'];
export interface LocationUpdate extends BaseLocationUpdate {
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  latitude?: number | null;
  longitude?: number | null;
}

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

    // Add UI-specific properties with default values
    // In a real implementation, these would come from a metadata table or JSON field
    return (data || []).map(location => ({
      ...location,
      address: '',  // Default empty values for UI fields
      city: '',
      province: '',
      postal_code: '',
      latitude: null,
      longitude: null
    }));
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

    if (!data) return null;
    
    // Add UI-specific properties with default values
    return {
      ...data,
      address: '',
      city: '',
      province: '',
      postal_code: '',
      latitude: null,
      longitude: null
    };
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

    // Add UI-specific properties with default values
    return (data || []).map(location => ({
      ...location,
      address: '',
      city: '',
      province: '',
      postal_code: '',
      latitude: null,
      longitude: null
    }));
  }

  /**
   * Membuat lokasi baru
   */
  static async create(location: LocationInsert): Promise<Location> {
    // Extract database fields from the location object
    const { address, city, province, postal_code, latitude, longitude, ...dbLocation } = location;
    
    // Ensure required fields are present
    if (!dbLocation.name || !dbLocation.type) {
      throw new Error('Location name and type are required');
    }
    
    // Insert only the database fields
    const { data, error } = await supabase
      .from('locations')
      .insert(dbLocation)
      .select()
      .single();

    if (error) {
      console.error('Error creating location:', error);
      throw error;
    }

    // Return the location with UI-specific properties
    return {
      ...data,
      address: address || '',
      city: city || '',
      province: province || '',
      postal_code: postal_code || '',
      latitude: latitude || null,
      longitude: longitude || null
    };
  }

  /**
   * Memperbarui lokasi
   */
  static async update(id: string, updates: LocationUpdate): Promise<Location> {
    // Extract database fields from the updates object
    const { address, city, province, postal_code, latitude, longitude, ...dbUpdates } = updates;
    
    // Update only the database fields
    const { data, error } = await supabase
      .from('locations')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating location with ID ${id}:`, error);
      throw error;
    }

    // Return the location with UI-specific properties
    return {
      ...data,
      address: address || '',
      city: city || '',
      province: province || '',
      postal_code: postal_code || '',
      latitude: latitude || null,
      longitude: longitude || null
    };
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
   * Note: In the actual database, we can only search by name since address is not in the schema
   */
  static async search(query: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .ilike('name', `%${query}%`);

    if (error) {
      console.error(`Error searching locations with query ${query}:`, error);
      throw error;
    }

    // Add UI-specific properties with default values
    return (data || []).map(location => ({
      ...location,
      address: '',
      city: '',
      province: '',
      postal_code: '',
      latitude: null,
      longitude: null
    }));
  }
}