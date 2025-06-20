// Register Service Worker for PWA functionality

// Fungsi untuk meminta izin notifikasi dengan penanganan error yang lebih baik
async function requestNotificationPermission() {
  try {
    if (!('Notification' in window)) {
      console.log('Browser ini tidak mendukung notifikasi');
      return 'not-supported';
    }
    
    // Jika izin sudah diberikan, tidak perlu meminta lagi
    if (Notification.permission === 'granted') {
      console.log('Izin notifikasi sudah diberikan sebelumnya');
      return 'granted';
    }
    
    // Jika izin sudah ditolak, tidak bisa meminta lagi secara otomatis
    if (Notification.permission === 'denied') {
      console.log('Izin notifikasi telah ditolak sebelumnya. Pengguna harus mengubah izin di pengaturan browser');
      return 'denied';
    }
    
    // Minta izin notifikasi
    console.log('Meminta izin notifikasi...');
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Izin notifikasi diberikan');
    } else if (permission === 'denied') {
      console.log('Izin notifikasi ditolak');
    } else {
      console.log('Permintaan izin notifikasi diabaikan');
    }
    
    return permission;
  } catch (error) {
    console.error('Error saat meminta izin notifikasi:', error);
    return 'error';
  }
}

// Fungsi untuk mendaftarkan service worker dengan penanganan error yang lebih baik
async function registerServiceWorker(swPath, name) {
  try {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker tidak didukung di browser ini');
    }
    
    // Periksa apakah service worker sudah terdaftar
    const existingRegistration = await navigator.serviceWorker.getRegistration(swPath);
    if (existingRegistration) {
      console.log(`${name} sudah terdaftar dengan scope:`, existingRegistration.scope);
      return existingRegistration;
    }
    
    // Daftarkan service worker baru
    console.log(`Mendaftarkan ${name}...`);
    const registration = await navigator.serviceWorker.register(swPath);
    console.log(`${name} berhasil terdaftar dengan scope:`, registration.scope);
    return registration;
  } catch (error) {
    console.error(`Gagal mendaftarkan ${name}:`, error);
    
    // Berikan pesan error yang lebih spesifik
    if (error.name === 'SecurityError' || error.name === 'NotAllowedError') {
      console.log('Izin ditolak untuk mendaftarkan service worker. Pastikan Anda menggunakan HTTPS atau localhost.');
    } else if (error.name === 'NetworkError') {
      console.log('Gagal mendaftarkan service worker karena masalah jaringan. Periksa koneksi internet Anda.');
    } else if (error.name === 'AbortError') {
      console.log('Pendaftaran service worker dibatalkan.');
    } else {
      console.log(`Gagal mendaftarkan ${name}. Coba muat ulang halaman.`);
    }
    
    throw error;
  }
}

// Inisialisasi service worker dan notifikasi saat halaman dimuat
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Daftarkan service worker utama untuk PWA
      await registerServiceWorker('/sw.js', 'Service Worker PWA');
      
      // Daftarkan service worker khusus untuk notifikasi push
      const pushSWRegistration = await registerServiceWorker('/service-worker.js', 'Service Worker Notifikasi Push');
      
      // Tambahkan listener untuk pesan dari service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_ACTIVATED') {
          console.log('Service Worker telah diaktifkan pada:', event.data.timestamp);
          // Minta izin notifikasi setelah service worker diaktifkan
          requestNotificationPermission().then((permission) => {
            if (permission === 'granted') {
              // Kirim pesan ke service worker bahwa izin telah diberikan
              if (pushSWRegistration.active) {
                pushSWRegistration.active.postMessage({
                  type: 'NOTIFICATION_PERMISSION_GRANTED',
                  timestamp: new Date().toISOString()
                });
              }
            }
          });
        }
      });
      
      // Minta izin notifikasi jika service worker berhasil terdaftar
      if ('Notification' in window) {
        const permission = await requestNotificationPermission();
        console.log('Status izin notifikasi:', permission);
      }
    } catch (error) {
      console.error('Gagal menginisialisasi service worker dan notifikasi:', error);
    }
  });
}

// Handle PWA installation prompt
let deferredPrompt;
const installButton = document.getElementById('install-button');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show the install button if it exists
  if (installButton) {
    installButton.style.display = 'block';
    
    installButton.addEventListener('click', () => {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        
        // Clear the deferredPrompt variable
        deferredPrompt = null;
        
        // Hide the install button
        installButton.style.display = 'none';
      });
    });
  }
});

// Handle installed event
window.addEventListener('appinstalled', (evt) => {
  console.log('INSAN MOBILE has been installed');
});