// Service Worker untuk menangani notifikasi push

// Pastikan service worker diaktifkan dengan benar
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker...');
  // Memaksa service worker untuk mengambil alih halaman segera
  event.waitUntil(
    self.skipWaiting().then(() => {
      console.log('[Service Worker] Skip Waiting successful');
    }).catch(error => {
      console.error('[Service Worker] Skip Waiting failed:', error);
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker...');
  // Mengklaim semua klien yang terbuka dan memastikan service worker diaktifkan
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('[Service Worker] Clients claimed successfully');
      // Kirim pesan ke semua klien bahwa service worker telah diaktifkan
      return self.clients.matchAll().then(clients => {
        return Promise.all(clients.map(client => {
          return client.postMessage({
            type: 'SW_ACTIVATED',
            timestamp: new Date().toISOString()
          });
        }));
      });
    }).catch(error => {
      console.error('[Service Worker] Client claim failed:', error);
    })
  );
});

// Event listener untuk push event
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  
  // Periksa apakah event.data ada sebelum mencoba mengaksesnya
  if (!event.data) {
    console.log('[Service Worker] Push event but no data');
    // Tampilkan notifikasi default jika tidak ada data
    event.waitUntil(self.registration.showNotification('INSAN MOBILE', {
      body: 'Anda menerima notifikasi baru',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png'
    }));
    return;
  }
  
  let pushText = '';
  try {
    pushText = event.data.text();
    console.log(`[Service Worker] Push had this data: "${pushText}"`);
  } catch (e) {
    console.error('[Service Worker] Error reading push data:', e);
    pushText = 'Anda menerima notifikasi baru';
  }

  let notificationData = {};
  
  try {
    // Coba parse data sebagai JSON
    notificationData = event.data.json();
  } catch (e) {
    console.log('[Service Worker] Error parsing JSON data:', e);
    // Jika gagal parse JSON, gunakan text data sebagai fallback
    try {
      notificationData = {
        title: 'INSAN MOBILE',
        body: pushText,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        timestamp: new Date().toISOString()
      };
    } catch (textError) {
      console.error('[Service Worker] Error reading text data:', textError);
      // Fallback ke notifikasi default jika semua gagal
      notificationData = {
        title: 'INSAN MOBILE',
        body: 'Anda menerima notifikasi baru',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        timestamp: new Date().toISOString()
      };
    }
  }

  const title = notificationData.title || 'INSAN MOBILE';
  const options = {
    body: notificationData.body || 'Anda menerima notifikasi baru',
    icon: notificationData.icon || '/icons/icon-192x192.png',
    badge: notificationData.badge || '/icons/icon-72x72.png',
    data: {
      ...notificationData.data || {},
      timestamp: notificationData.data?.timestamp || new Date().toISOString(),
      url: notificationData.data?.url || '/dashboard'
    },
    vibrate: notificationData.vibrate || [100, 50, 100],
    requireInteraction: notificationData.requireInteraction || true,
    renotify: notificationData.renotify || true,
    tag: notificationData.tag || `insan-mobile-notification-${Date.now()}`,
    actions: notificationData.actions || [
      { action: 'explore', title: 'Lihat Detail' },
      { action: 'close', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[Service Worker] Notification shown successfully'))
      .catch(error => console.error('[Service Worker] Error showing notification:', error))
  );
});

// Event listener untuk notificationclick event
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const notificationData = event.notification.data;
  let url = '/';

  if (notificationData && notificationData.url) {
    url = notificationData.url;
  }

  if (event.action === 'explore' && notificationData && notificationData.detailUrl) {
    url = notificationData.detailUrl;
  }

  event.waitUntil(
    clients.matchAll({type: 'window'}).then(function(windowClients) {
      // Cek apakah ada window/tab yang sudah terbuka
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Jika tidak ada window yang terbuka, buka window baru
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});