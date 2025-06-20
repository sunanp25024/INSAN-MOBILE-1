/**
 * Validasi input dasar menggunakan Zod
 * Memastikan data yang dimasukkan pengguna valid sebelum dikirim ke server
 */

import { z } from 'zod';

// Validasi untuk login
export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, { message: 'User ID atau Email harus diisi' }),
  password: z.string().min(1, { message: 'Password harus diisi' }),
});

// Validasi untuk profil pengguna
export const profileSchema = z.object({
  fullName: z.string().min(1, { message: 'Nama lengkap harus diisi' }),
  email: z.string().email({ message: 'Format email tidak valid' }).optional().or(z.literal('')),
  phone: z.string().regex(/^[0-9+\-\s]+$/, { message: 'Format nomor telepon tidak valid' }).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

// Validasi untuk perubahan password
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Password saat ini harus diisi' }),
  newPassword: z.string().min(6, { message: 'Password baru minimal 6 karakter' }),
  confirmPassword: z.string().min(1, { message: 'Konfirmasi password harus diisi' }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Password baru dan konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});

// Validasi untuk input paket harian
export const dailyPackageInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal harus YYYY-MM-DD' }),
  total_packages: z.number().int().positive({ message: 'Jumlah paket harus lebih dari 0' }),
  processed_packages: z.number().int().min(0, { message: 'Jumlah paket yang diproses tidak boleh negatif' }),
  pending_packages: z.number().int().min(0, { message: 'Jumlah paket tertunda tidak boleh negatif' }),
  notes: z.string().optional(),
}).refine(data => data.processed_packages + data.pending_packages === data.total_packages, {
  message: 'Total paket harus sama dengan jumlah paket yang diproses dan tertunda',
  path: ['total_packages'],
});

// Validasi untuk aktivitas pengiriman
export const deliveryActivitySchema = z.object({
  package_id: z.string().uuid({ message: 'ID paket tidak valid' }),
  recipient_name: z.string().min(1, { message: 'Nama penerima harus diisi' }),
  notes: z.string().optional(),
});

// Validasi untuk absensi
export const attendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal harus YYYY-MM-DD' }),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

// Validasi untuk input resi
export const resiInputSchema = z.object({
  resi: z.string().min(1, { message: 'Nomor resi harus diisi' }),
});

// Validasi untuk input COD
export const codInputSchema = z.object({
  amount: z.number().min(0, { message: 'Jumlah COD tidak boleh negatif' }),
});

// Fungsi helper untuk validasi
export function validateInput<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Ambil pesan error pertama
      const errorMessage = error.errors[0]?.message || 'Input tidak valid';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Terjadi kesalahan validasi' };
  }
}