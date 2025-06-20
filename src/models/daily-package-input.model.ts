import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export type DailyPackageInput = Database['public']['Tables']['daily_package_inputs']['Row'];
export type DailyPackageInputInsert = Database['public']['Tables']['daily_package_inputs']['Insert'];
export type DailyPackageInputUpdate = Database['public']['Tables']['daily_package_inputs']['Update'];

export class DailyPackageInputModel {
  /**
   * Mengambil semua input paket harian
   */
  static async getAll(): Promise<DailyPackageInput[]> {
    const { data, error } = await supabase
      .from('daily_package_inputs')
      .select('*');

    if (error) {
      console.error('Error fetching daily package inputs:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil input paket harian berdasarkan ID
   */
  static async getById(id: string): Promise<DailyPackageInput | null> {
    const { data, error } = await supabase
      .from('daily_package_inputs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching daily package input with ID ${id}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Mengambil input paket harian berdasarkan ID pengguna
   */
  static async getByUserId(userId: string): Promise<DailyPackageInput[]> {
    const { data, error } = await supabase
      .from('daily_package_inputs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error(`Error fetching daily package inputs for user ${userId}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil input paket harian berdasarkan tanggal
   */
  static async getByDate(date: string): Promise<DailyPackageInput[]> {
    const { data, error } = await supabase
      .from('daily_package_inputs')
      .select('*')
      .eq('date', date);

    if (error) {
      console.error(`Error fetching daily package inputs for date ${date}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil input paket harian berdasarkan rentang tanggal
   */
  static async getByDateRange(startDate: string, endDate: string): Promise<DailyPackageInput[]> {
    const { data, error } = await supabase
      .from('daily_package_inputs')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      console.error(`Error fetching daily package inputs between ${startDate} and ${endDate}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Membuat input paket harian baru
   */
  static async create(input: DailyPackageInputInsert): Promise<DailyPackageInput> {
    const { data, error } = await supabase
      .from('daily_package_inputs')
      .insert(input)
      .select()
      .single();

    if (error) {
      console.error('Error creating daily package input:', error);
      throw error;
    }

    return data;
  }

  /**
   * Memperbarui input paket harian
   */
  static async update(id: string, updates: DailyPackageInputUpdate): Promise<DailyPackageInput> {
    const { data, error } = await supabase
      .from('daily_package_inputs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating daily package input with ID ${id}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Menghapus input paket harian
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('daily_package_inputs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting daily package input with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mendapatkan ringkasan input paket harian berdasarkan rentang tanggal
   */
  static async getSummaryByDateRange(startDate: string, endDate: string): Promise<{
    totalInputs: number;
    totalPackages: number;
    averagePackagesPerDay: number;
    inputsByUser: Record<string, number>;
  }> {
    const inputs = await this.getByDateRange(startDate, endDate);
    
    if (!inputs.length) {
      return {
        totalInputs: 0,
        totalPackages: 0,
        averagePackagesPerDay: 0,
        inputsByUser: {}
      };
    }
    
    const totalInputs = inputs.length;
    const totalPackages = inputs.reduce((sum, input) => sum + input.package_count, 0);
    
    // Hitung jumlah hari unik dalam rentang data
    const uniqueDays = new Set(inputs.map(input => input.date)).size;
    const averagePackagesPerDay = uniqueDays > 0 ? totalPackages / uniqueDays : 0;
    
    // Hitung input per pengguna
    const inputsByUser: Record<string, number> = {};
    inputs.forEach(input => {
      const userId = input.user_id;
      inputsByUser[userId] = (inputsByUser[userId] || 0) + input.package_count;
    });
    
    return {
      totalInputs,
      totalPackages,
      averagePackagesPerDay,
      inputsByUser
    };
  }
}