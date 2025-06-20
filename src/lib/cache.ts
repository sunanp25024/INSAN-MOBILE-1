/**
 * Modul untuk mengelola caching data lokal menggunakan IndexedDB
 * Memungkinkan aplikasi tetap berfungsi dalam mode offline
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Definisi skema database IndexedDB
interface AppDB extends DBSchema {
  packages: {
    key: string;
    value: any;
    indexes: { 'by-status': string };
  };
  delivery_activities: {
    key: string;
    value: any;
    indexes: { 'by-package': string };
  };
  attendance_records: {
    key: string;
    value: any;
    indexes: { 'by-date': string; 'by-user': string };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      table: string;
      action: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
      synced: boolean;
    };
    indexes: { 'by-synced': boolean };
  };
}

// Nama database dan versi
const DB_NAME = 'insan-mobile-db';
const DB_VERSION = 1;

// Inisialisasi database
let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

/**
 * Inisialisasi database IndexedDB
 */
export async function initDB(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Buat object store untuk paket
        if (!db.objectStoreNames.contains('packages')) {
          const packageStore = db.createObjectStore('packages', { keyPath: 'id' });
          packageStore.createIndex('by-status', 'status');
        }

        // Buat object store untuk aktivitas pengiriman
        if (!db.objectStoreNames.contains('delivery_activities')) {
          const activitiesStore = db.createObjectStore('delivery_activities', { keyPath: 'id' });
          activitiesStore.createIndex('by-package', 'package_id');
        }

        // Buat object store untuk absensi
        if (!db.objectStoreNames.contains('attendance_records')) {
          const attendanceStore = db.createObjectStore('attendance_records', { keyPath: 'id' });
          attendanceStore.createIndex('by-date', 'date');
          attendanceStore.createIndex('by-user', 'user_id');
        }

        // Buat object store untuk antrian sinkronisasi
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('by-synced', 'synced');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Menyimpan data ke cache lokal
 */
export async function saveToCache<T>(storeName: keyof AppDB, data: T | T[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);

  if (Array.isArray(data)) {
    for (const item of data) {
      await store.put(item);
    }
  } else {
    await store.put(data);
  }

  await tx.done;
}

/**
 * Mengambil data dari cache lokal
 */
export async function getFromCache<T>(
  storeName: keyof AppDB,
  id?: string
): Promise<T | T[] | null> {
  const db = await initDB();
  if (id) {
    return db.get(storeName, id) as Promise<T | null>;
  } else {
    return db.getAll(storeName) as Promise<T[]>;
  }
}

/**
 * Mengambil data dari cache berdasarkan index
 */
export async function getFromCacheByIndex<T>(
  storeName: keyof AppDB,
  indexName: string,
  value: any
): Promise<T[]> {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readonly');
  const index = tx.store.index(indexName);
  return index.getAll(value) as Promise<T[]>;
}

/**
 * Menghapus data dari cache lokal
 */
export async function removeFromCache(
  storeName: keyof AppDB,
  id: string
): Promise<void> {
  const db = await initDB();
  await db.delete(storeName, id);
}

/**
 * Menambahkan operasi ke antrian sinkronisasi
 */
export async function addToSyncQueue(
  table: string,
  action: 'create' | 'update' | 'delete',
  data: any
): Promise<void> {
  const db = await initDB();
  const syncItem = {
    id: `${table}_${data.id}_${Date.now()}`,
    table,
    action,
    data,
    timestamp: Date.now(),
    synced: false,
  };

  await db.add('sync_queue', syncItem);
}

/**
 * Sinkronisasi data dengan server saat kembali online
 */
export async function syncWithServer(supabase: any): Promise<void> {
  if (!navigator.onLine) {
    console.log('Tidak ada koneksi internet. Sinkronisasi ditunda.');
    return;
  }

  const db = await initDB();
  const unsyncedItems = await db.getAllFromIndex('sync_queue', 'by-synced', false);

  for (const item of unsyncedItems) {
    try {
      let result;

      switch (item.action) {
        case 'create':
          result = await supabase.from(item.table).insert(item.data);
          break;
        case 'update':
          result = await supabase
            .from(item.table)
            .update(item.data)
            .eq('id', item.data.id);
          break;
        case 'delete':
          result = await supabase.from(item.table).delete().eq('id', item.data.id);
          break;
      }

      if (result.error) {
        console.error(`Gagal sinkronisasi ${item.action} untuk ${item.table}:`, result.error);
        continue;
      }

      // Tandai sebagai sudah disinkronkan
      await db.put('sync_queue', { ...item, synced: true });
    } catch (error) {
      console.error(`Error saat sinkronisasi ${item.action} untuk ${item.table}:`, error);
    }
  }
}

/**
 * Mendengarkan perubahan status koneksi dan melakukan sinkronisasi saat online
 */
export function setupSyncListeners(supabase: any): void {
  window.addEventListener('online', () => {
    console.log('Koneksi internet tersedia. Memulai sinkronisasi...');
    syncWithServer(supabase);
  });

  window.addEventListener('offline', () => {
    console.log('Koneksi internet terputus. Beralih ke mode offline.');
  });
}