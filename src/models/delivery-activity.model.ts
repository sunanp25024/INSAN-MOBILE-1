import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export type DeliveryActivity = Database['public']['Tables']['delivery_activities']['Row'];
export type DeliveryActivityInsert = Database['public']['Tables']['delivery_activities']['Insert'];
export type DeliveryActivityUpdate = Database['public']['Tables']['delivery_activities']['Update'];

export class DeliveryActivityModel {
  /**
   * Mengambil semua aktivitas pengiriman
   */
  static async getAll(): Promise<DeliveryActivity[]> {
    const { data, error } = await supabase
      .from('delivery_activities')
      .select('*');

    if (error) {
      console.error('Error fetching delivery activities:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil aktivitas pengiriman berdasarkan ID
   */
  static async getById(id: string): Promise<DeliveryActivity | null> {
    const { data, error } = await supabase
      .from('delivery_activities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching delivery activity with ID ${id}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Mengambil aktivitas pengiriman berdasarkan ID paket
   */
  static async getByPackageId(packageId: string): Promise<DeliveryActivity[]> {
    const { data, error } = await supabase
      .from('delivery_activities')
      .select('*')
      .eq('package_id', packageId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error(`Error fetching delivery activities for package ${packageId}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil aktivitas pengiriman berdasarkan ID kurir
   */
  static async getByCourierId(courierId: string): Promise<DeliveryActivity[]> {
    const { data, error } = await supabase
      .from('delivery_activities')
      .select('*')
      .eq('courier_id', courierId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error(`Error fetching delivery activities for courier ${courierId}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Mengambil aktivitas pengiriman berdasarkan tanggal
   */
  static async getByDate(date: string): Promise<DeliveryActivity[]> {
    // Mengasumsikan timestamp disimpan dalam format ISO string
    const startOfDay = new Date(`${date}T00:00:00Z`).toISOString();
    const endOfDay = new Date(`${date}T23:59:59Z`).toISOString();

    const { data, error } = await supabase
      .from('delivery_activities')
      .select('*')
      .gte('timestamp', startOfDay)
      .lte('timestamp', endOfDay)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error(`Error fetching delivery activities for date ${date}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Membuat aktivitas pengiriman baru
   */
  static async create(activity: DeliveryActivityInsert): Promise<DeliveryActivity> {
    const { data, error } = await supabase
      .from('delivery_activities')
      .insert(activity)
      .select()
      .single();

    if (error) {
      console.error('Error creating delivery activity:', error);
      throw error;
    }

    return data;
  }

  /**
   * Memperbarui aktivitas pengiriman
   */
  static async update(id: string, updates: DeliveryActivityUpdate): Promise<DeliveryActivity> {
    const { data, error } = await supabase
      .from('delivery_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating delivery activity with ID ${id}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Menghapus aktivitas pengiriman
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('delivery_activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting delivery activity with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mencatat aktivitas pengambilan paket oleh kurir
   */
  static async recordPickup(packageId: string, courierId: string, notes?: string): Promise<DeliveryActivity> {
    return this.create({
      package_id: packageId,
      courier_id: courierId,
      activity_type: 'pickup',
      timestamp: new Date().toISOString(),
      notes: notes || null,
      location_data: null // Bisa ditambahkan data lokasi jika tersedia
    });
  }

  /**
   * Mencatat aktivitas pengiriman paket
   */
  static async recordDelivery(
    packageId: string, 
    courierId: string, 
    status: 'delivered' | 'failed', 
    locationData?: { latitude: number; longitude: number }, 
    notes?: string
  ): Promise<DeliveryActivity> {
    return this.create({
      package_id: packageId,
      courier_id: courierId,
      activity_type: status === 'delivered' ? 'delivery_success' : 'delivery_failed',
      timestamp: new Date().toISOString(),
      notes: notes || null,
      location_data: locationData ? JSON.stringify(locationData) : null
    });
  }

  /**
   * Mencatat aktivitas pembaruan status paket
   */
  static async recordStatusUpdate(
    packageId: string, 
    courierId: string, 
    status: string, 
    notes?: string
  ): Promise<DeliveryActivity> {
    return this.create({
      package_id: packageId,
      courier_id: courierId,
      activity_type: 'status_update',
      timestamp: new Date().toISOString(),
      notes: `Status diperbarui menjadi: ${status}${notes ? ` - ${notes}` : ''}`,
      location_data: null
    });
  }
}