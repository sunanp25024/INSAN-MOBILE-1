# INSAN MOBILE - PWA dan APK Android

Dokumen ini berisi panduan untuk menggunakan INSAN MOBILE sebagai Progressive Web App (PWA) dan mengkonversinya menjadi aplikasi Android (APK).

## Progressive Web App (PWA)

### Fitur PWA yang Diimplementasikan

- **Installable**: Aplikasi dapat diinstal di perangkat pengguna
- **Offline Support**: Aplikasi dapat berfungsi bahkan ketika offline
- **Push Notifications**: Dukungan untuk notifikasi push
- **Responsive Design**: Tampilan yang responsif untuk berbagai ukuran layar
- **App-like Experience**: Pengalaman seperti aplikasi native

### Cara Menggunakan PWA

1. **Mengakses Aplikasi**:
   - Buka aplikasi di browser menggunakan URL yang disediakan
   - Aplikasi akan secara otomatis mendeteksi jika dapat diinstal sebagai PWA

2. **Menginstal PWA**:
   - Di perangkat mobile: Ketuk tombol "Instal Aplikasi" yang muncul di aplikasi, atau gunakan opsi "Tambahkan ke Layar Utama" dari menu browser
   - Di desktop: Klik ikon instalasi di bilah alamat browser atau gunakan tombol "Instal Aplikasi" di dalam aplikasi

3. **Menggunakan Offline**:
   - Setelah diinstal, aplikasi akan menyimpan aset-aset penting di cache
   - Aplikasi dapat digunakan bahkan ketika tidak ada koneksi internet
   - Data akan disinkronkan ketika koneksi internet tersedia kembali

## Aplikasi Android (APK)

### Prasyarat untuk Build APK

- Node.js dan npm terinstal
- Android Studio terinstal
- JDK (Java Development Kit) terinstal
- Android SDK terinstal

### Langkah-langkah Build APK

1. **Persiapan Lingkungan**:
   ```bash
   # Instal dependensi
   npm install
   ```

2. **Build Aplikasi Web**:
   ```bash
   # Build aplikasi Next.js dengan PWA
   npm run build:pwa
   ```

3. **Konversi ke APK Android**:
   ```bash
   # Tambahkan platform Android dan build APK
   npm run build:android
   ```

4. **Lokasi APK**:
   - APK debug akan tersedia di: `android/app/build/outputs/apk/debug/app-debug.apk`
   - APK release akan tersedia di: `android/app/build/outputs/apk/release/app-release.apk`

### Konfigurasi Android

Konfigurasi Android dapat diubah di file `capacitor.config.ts`. Beberapa pengaturan yang dapat disesuaikan:

- `appId`: ID aplikasi Android (format: com.example.app)
- `appName`: Nama aplikasi yang akan ditampilkan
- `webDir`: Direktori output build web
- Pengaturan plugin seperti SplashScreen dan Push Notifications

## Fitur Native yang Diimplementasikan

- **Kamera**: Akses kamera untuk memindai QR code dan mengambil foto
- **Geolokasi**: Akses lokasi untuk fitur absensi dan tracking pengiriman
- **Push Notifications**: Notifikasi untuk update status pengiriman dan informasi penting
- **Offline Storage**: Penyimpanan data lokal untuk operasi offline

## Troubleshooting

### PWA

- **Aplikasi Tidak Muncul di Layar Utama**: Pastikan browser mendukung PWA dan cache telah dibersihkan
- **Konten Tidak Diperbarui**: Coba bersihkan cache aplikasi atau reinstall PWA

### APK Android

- **Build Gagal**: Pastikan Android Studio, JDK, dan Android SDK terinstal dengan benar
- **Aplikasi Crash**: Periksa log Android Studio untuk detail error
- **Izin Ditolak**: Pastikan aplikasi memiliki izin yang diperlukan di pengaturan Android

## Kontak Support

Jika Anda mengalami masalah atau memiliki pertanyaan, silakan hubungi tim support di:

- Email: support@insanmobile.com
- Telepon: +62-XXX-XXXX-XXXX