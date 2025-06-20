import { initPushNotifications, sendPushNotification } from './push-notifications';
import { getCurrentPosition, watchPosition, clearWatch } from './geolocation';
import { takePhoto, selectPhoto, uploadPhoto } from './camera';

// Initialize all native features
export async function initNativeFeatures() {
  // Check if we're in a browser or native environment
  const isNative = typeof window !== 'undefined' && 'Capacitor' in window;
  const isBrowser = typeof window !== 'undefined';

  if (!isBrowser) {
    console.log('Not in browser environment, skipping native features initialization');
    return;
  }

  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    try {
      // Service worker is registered in register-sw.js which is loaded in layout.tsx
      console.log('Service Worker registration handled by register-sw.js');
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }

  // Initialize push notifications
  try {
    await initPushNotifications();
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
  }

  // Check for geolocation permissions
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      () => console.log('Geolocation permission granted'),
      (error) => {
        // Hanya log pesan error tanpa menampilkan objek error lengkap
        console.log('Geolocation permission denied or error occurred');
        // Log detail error hanya untuk debugging
        if (process.env.NODE_ENV === 'development') {
          console.debug('Geolocation error details:', error);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  // Check for camera permissions if in native environment
  if (isNative) {
    try {
      // Just attempt to get camera permissions by taking a photo and immediately canceling
      // This will trigger the permission prompt if not already granted
      const camera = await import('@capacitor/camera');
      await camera.Camera.checkPermissions();
    } catch (error) {
      console.error('Camera permission check failed:', error);
    }
  }

  console.log(`Native features initialized in ${isNative ? 'native' : 'browser'} environment`);
}

// Export all native features for easy access
export {
  // Geolocation
  getCurrentPosition,
  watchPosition,
  clearWatch,
  
  // Camera
  takePhoto,
  selectPhoto,
  uploadPhoto,
  
  // Push Notifications
  initPushNotifications,
  sendPushNotification,
};