import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export type Attendance = Database['public']['Tables']['attendance_records']['Row'];
export type AttendanceInsert = Database['public']['Tables']['attendance_records']['Insert'];
export type AttendanceUpdate = Database['public']['Tables']['attendance_records']['Update'];

export class AttendanceModel {
  /**
   * Mengambil semua catatan absensi
   */
  static async getAll(): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*');

    if (error) {
      console.error('Error fetching attendance records:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil catatan absensi berdasarkan ID
   */
  static async getById(id: string): Promise<Attendance | null> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching attendance record with ID ${id}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Mengambil catatan absensi berdasarkan ID pengguna
   */
  static async getByUserId(userId: string): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error(`Error fetching attendance records for user ${userId}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil catatan absensi berdasarkan tanggal
   */
  static async getByDate(date: string): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('date', date);

    if (error) {
      console.error(`Error fetching attendance records for date ${date}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil catatan absensi berdasarkan rentang tanggal
   */
  static async getByDateRange(startDate: string, endDate: string): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      console.error(`Error fetching attendance records between ${startDate} and ${endDate}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Membuat catatan absensi baru
   */
  static async create(attendance: AttendanceInsert): Promise<Attendance> {
    const { data, error } = await supabase
      .from('attendance_records')
      .insert(attendance)
      .select()
      .single();

    if (error) {
      console.error('Error creating attendance record:', error);
      throw error;
    }

    return data;
  }

  /**
   * Memperbarui catatan absensi
   */
  static async update(id: string, updates: AttendanceUpdate): Promise<Attendance> {
    const { data, error } = await supabase
      .from('attendance_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating attendance record with ID ${id}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Menghapus catatan absensi
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting attendance record with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mencatat kehadiran (check-in)
   */
  static async checkIn(userId: string, location: string, photoUrl?: string, notes?: string): Promise<Attendance> {
    const today = new Date().toISOString().split('T')[0];
    const checkInTime = new Date().toISOString();
    
    // Periksa apakah sudah ada catatan untuk hari ini
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
    
    if (existingRecord) {
      throw new Error('Anda sudah melakukan check-in hari ini');
    }
    
    return this.create({
      user_id: userId,
      date: today,
      check_in_time: checkInTime,
      check_in_location: location,
      check_in_photo_url: photoUrl || null,
      status: 'Present',
      notes: notes || null
    });
  }

  /**
   * Mencatat kepulangan (check-out)
   */
  static async checkOut(attendanceId: string, location: string, photoUrl?: string, notes?: string): Promise<Attendance> {
    const checkOutTime = new Date().toISOString();
    
    // Cari catatan absensi berdasarkan ID
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('id', attendanceId)
      .single();
    
    if (!existingRecord) {
      throw new Error('Catatan absensi tidak ditemukan');
    }
    
    if (existingRecord.check_out_time) {
      throw new Error('Anda sudah melakukan check-out hari ini');
    }
    
    const updates: AttendanceUpdate = {
      check_out_time: checkOutTime,
      check_out_location: location,
      check_out_photo_url: photoUrl || null
    };
    
    if (notes) {
      updates.notes = existingRecord.notes 
        ? `${existingRecord.notes}\n[Check-out] ${notes}` 
        : `[Check-out] ${notes}`;
    }
    
    return this.update(existingRecord.id, updates);
  }
}