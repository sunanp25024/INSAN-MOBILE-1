import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export type Approval = {
  id: string;
  created_at: string;
  request_type: 'add_user' | 'update_user' | 'deactivate_user' | 'other';
  requested_by: string; // ID pengguna yang mengajukan
  requested_by_role: 'Admin' | 'PIC';
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string; // ID MasterAdmin yang menyetujui/menolak
  approval_date?: string;
  notes?: string;
  data_json: any; // Data yang diajukan dalam format JSON
};

export type ApprovalInsert = Omit<Approval, 'id' | 'created_at'>;
export type ApprovalUpdate = Partial<Omit<Approval, 'id' | 'created_at'>>;

export class ApprovalModel {
  /**
   * Mengambil semua permintaan persetujuan
   */
  static async getAll(): Promise<Approval[]> {
    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching approvals:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil permintaan persetujuan berdasarkan ID
   */
  static async getById(id: string): Promise<Approval | null> {
    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching approval with ID ${id}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Mengambil permintaan persetujuan berdasarkan status
   */
  static async getByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<Approval[]> {
    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching approvals with status ${status}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil permintaan persetujuan berdasarkan pengguna yang mengajukan
   */
  static async getByRequestedBy(userId: string): Promise<Approval[]> {
    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .eq('requested_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching approvals requested by user ${userId}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Membuat permintaan persetujuan baru
   */
  static async create(approval: ApprovalInsert): Promise<Approval> {
    const { data, error } = await supabase
      .from('approvals')
      .insert(approval)
      .select()
      .single();

    if (error) {
      console.error('Error creating approval request:', error);
      throw error;
    }

    return data;
  }

  /**
   * Memperbarui permintaan persetujuan
   */
  static async update(id: string, updates: ApprovalUpdate): Promise<Approval> {
    const { data, error } = await supabase
      .from('approvals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating approval with ID ${id}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Menyetujui permintaan persetujuan
   */
  static async approve(id: string, masterAdminId: string, notes?: string): Promise<Approval> {
    return this.update(id, {
      status: 'approved',
      approved_by: masterAdminId,
      approval_date: new Date().toISOString(),
      notes
    });
  }

  /**
   * Menolak permintaan persetujuan
   */
  static async reject(id: string, masterAdminId: string, notes?: string): Promise<Approval> {
    return this.update(id, {
      status: 'rejected',
      approved_by: masterAdminId,
      approval_date: new Date().toISOString(),
      notes
    });
  }

  /**
   * Menghapus permintaan persetujuan
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('approvals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting approval with ID ${id}:`, error);
      throw error;
    }
  }
}