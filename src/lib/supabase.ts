import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

import { env } from '@/lib/env';

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Konfigurasi klien Supabase umum untuk operasi insert, update, delete
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'X-Client-Info': 'supabase-js/2.0.0',
      'Prefer': 'return=representation',
    },
  },
});

// Konfigurasi klien Supabase khusus untuk operasi select dengan header yang benar
export const supabaseSelect = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'X-Client-Info': 'supabase-js/2.0.0',
      // Tidak menggunakan header 'Prefer' untuk menghindari error 406 pada operasi select dengan filter
    },
  },
});

/**
 * Fungsi untuk mengunggah file ke Supabase Storage
 * Dengan penanganan error yang lebih baik untuk mengatasi error 406
 * 
 * @param bucket Nama bucket di Supabase Storage
 * @param path Path file di bucket
 * @param file File yang akan diunggah (File atau Blob)
 * @param options Opsi tambahan untuk upload
 * @returns URL publik file yang diunggah atau null jika gagal
 */
export async function uploadFileToStorage(bucket: string, path: string, file: File | Blob | string, options?: {
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}) {
  try {
    // Pastikan file dalam bentuk Blob
    let fileBlob: Blob;
    
    if (typeof file === 'string') {
      // Jika file adalah string (data URL), konversi ke Blob
      const response = await fetch(file);
      fileBlob = await response.blob();
    } else if (file instanceof File) {
      // Jika file adalah File, konversi ke Blob
      fileBlob = new Blob([await file.arrayBuffer()], { type: options?.contentType || 'image/jpeg' });
    } else {
      // File sudah dalam bentuk Blob
      fileBlob = file;
    }
    
    // Set default options jika tidak disediakan
    const uploadOptions = {
      contentType: options?.contentType || 'image/jpeg',
      cacheControl: options?.cacheControl || '3600',
      upsert: options?.upsert !== undefined ? options.upsert : false
    };
    
    console.log(`Uploading file to ${bucket}/${path} with options:`, uploadOptions);
    
    // Upload file ke Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileBlob, uploadOptions);
    
    if (error) {
      console.error(`Error uploading file to ${bucket}/${path}:`, error);
      console.error('Error details:', JSON.stringify(error));
      return { publicUrl: null, error };
    }
    
    // Dapatkan URL publik file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    console.log(`File uploaded successfully to ${bucket}/${path}:`, urlData?.publicUrl);
    return { publicUrl: urlData?.publicUrl, error: null };
  } catch (error) {
    console.error(`Unexpected error uploading file to ${bucket}/${path}:`, error);
    return { publicUrl: null, error };
  }
}

// Fungsi untuk mendengarkan perubahan realtime pada tabel tertentu
export function subscribeToTableChanges(
  tableName: string,
  callback: (payload: any) => void,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
): RealtimeChannel {
  return supabase
    .channel(`public:${tableName}`)
    .on(
      'postgres_changes' as any,
      { event, schema: 'public', table: tableName },
      (payload: any) => callback(payload)
    )
    .subscribe();
}

// Fungsi untuk berhenti mendengarkan perubahan realtime
export function unsubscribeFromChannel(channel: RealtimeChannel): void {
  if (channel) {
    supabase.removeChannel(channel);
  }
}

// Fungsi untuk mengambil data dari tabel dengan filter opsional
export async function fetchDataFromTable<T extends keyof Database['public']['Tables']>(
  tableName: T, 
  filters?: Record<string, any>
) {
  let query = supabase.from(tableName as any).select('*');
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    return null;
  }
  
  return data;
}