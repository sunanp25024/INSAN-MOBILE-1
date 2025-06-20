import { PushNotifications } from '@capacitor/push-notifications';

// Interface for push notification payload
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  renotify?: boolean;
  silent?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export async function initPushNotifications() {
  // Check if we're in a browser environment and if the Push API is supported
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
    try {
      // Request permission for notifications
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker is ready for push notifications');

      // Get VAPID key from environment variable
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not defined in environment variables');
        throw new Error('VAPID public key is required for push notifications');
      }
      
      console.log('Using VAPID key:', vapidPublicKey.substring(0, 10) + '...');
      
      // Convert VAPID key to the correct format
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      console.log('Push notification subscription successful');

      // Send the subscription to your server
      await sendSubscriptionToServer(subscription);
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  } else if (typeof window !== 'undefined' && 'Capacitor' in window) {
    // Capacitor environment (native app)
    try {
      // Request permission to use push notifications
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();
        console.log('Push notification registration success');
      } else {
        console.log('Push notification permission denied');
      }

      // Add listeners for push notifications
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token:', token.value);
        // Send token to your server
        await sendTokenToServer(token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed:', notification.actionId, notification.inputValue);
      });
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  } else {
    console.log('Push notifications not supported in this environment');
  }
}

// Helper function to convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (!base64String || base64String.trim() === '') {
    console.error('VAPID key is empty or not defined');
    throw new Error('VAPID key is required for push notifications');
  }
  
  try {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  } catch (error) {
    console.error('Error converting VAPID key:', error);
    throw new Error('Invalid VAPID key format');
  }

}

// Function to send subscription to server
async function sendSubscriptionToServer(subscription: PushSubscription) {
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user) {
      console.error('User not authenticated, cannot store push subscription');
      return;
    }
    
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.user.id,
        subscription: JSON.stringify(subscription),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        platform: 'web'
      }, { onConflict: 'user_id' });
    
    if (error) {
      throw error;
    }
    
    console.log('Push subscription stored successfully');
    return data;
  } catch (error) {
    console.error('Failed to store push subscription:', error);
    throw error;
  }
}

// Function to send token to server (for native apps)
async function sendTokenToServer(token: string) {
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user) {
      console.error('User not authenticated, cannot store push token');
      return;
    }
    
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.user.id,
        token: token,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        platform: 'native'
      }, { onConflict: 'user_id' });
    
    if (error) {
      throw error;
    }
    
    console.log('Push token stored successfully');
    return data;
  } catch (error) {
    console.error('Failed to store push token:', error);
    throw error;
  }
}

// Function to send push notification to a specific user or all users
export async function sendPushNotification(payload: PushNotificationPayload, userId?: string) {
  try {
    // Periksa apakah browser mendukung notifikasi
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      console.error('Push notifications are not supported in this environment');
      throw new Error('Notifikasi push tidak didukung di lingkungan ini');
    }

    // Periksa apakah service worker sudah terdaftar
    const swRegistration = await navigator.serviceWorker.getRegistration('/service-worker.js');
    if (!swRegistration) {
      console.error('Service worker for push notifications is not registered');
      throw new Error('Service worker untuk notifikasi push belum terdaftar');
    }

    // Periksa izin notifikasi terlebih dahulu
    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted, requesting permission...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Izin notifikasi ditolak');
      }
    }

    const { supabase } = await import('@/lib/supabase');
    
    // Get subscriptions from database
    let query = supabase.from('push_subscriptions').select('*');
    
    // If userId is provided, filter by user_id
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data: subscriptions, error } = await query;
    
    if (error) {
      console.error('Error fetching push subscriptions:', error);
      throw error;
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found');
      throw new Error('Tidak ada langganan notifikasi yang ditemukan');
    }
    
    console.log(`Sending push notification to ${subscriptions.length} devices`);
    
    // Process web and native subscriptions separately
    const webSubscriptions = subscriptions.filter(sub => sub.platform === 'web' && sub.subscription);
    const nativeTokens = subscriptions.filter(sub => sub.platform === 'native' && sub.token);
    
    // For web subscriptions, use the Web Push API
    if (webSubscriptions.length > 0 && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        // Pastikan service worker sudah siap
        const registration = await navigator.serviceWorker.ready;
        console.log('Service worker ready for sending notifications');
        
        let successCount = 0;
        
        for (const sub of webSubscriptions) {
          try {
            if (!sub.subscription) {
              console.warn('Empty subscription found for user:', sub.user_id);
              continue;
            }

            const parsedSubscription = JSON.parse(sub.subscription);
            console.log('Sending notification to subscription:', sub.user_id);
            
            await registration.showNotification(payload.title, {
              body: payload.body,
              icon: payload.icon || '/icons/icon-192x192.png',
              badge: payload.badge || '/icons/icon-72x72.png',
              tag: payload.tag || `insan-mobile-notification-${Date.now()}`,
              requireInteraction: payload.requireInteraction || true,
              renotify: payload.renotify || true,
              silent: payload.silent || false,
              data: {
                ...payload.data,
                timestamp: new Date().getTime(),
                userId: sub.user_id,
                url: payload.data?.url || '/dashboard'
              },
              actions: payload.actions || [
                { action: 'view', title: 'Lihat' },
                { action: 'close', title: 'Tutup' }
              ]
            });
            
            successCount++;
          } catch (error) {
            console.error('Error sending web push notification to user:', sub.user_id, error);
          }
        }
        
        console.log(`Successfully sent ${successCount} out of ${webSubscriptions.length} web notifications`);
        
        if (successCount === 0 && webSubscriptions.length > 0) {
          throw new Error('Gagal mengirim semua notifikasi web');
        }
      } catch (error) {
        console.error('Error preparing web push notifications:', error);
        throw error;
      }
    }
    
    // For native tokens, we would typically send to FCM/APNS via a server
    // This would be implemented on the backend
    if (nativeTokens.length > 0) {
      console.log('Native push notifications require a server implementation');
      // In a real implementation, you would call your backend API to send the notifications
      // Example: await fetch('/api/send-push', { method: 'POST', body: JSON.stringify({ tokens: nativeTokens.map(t => t.token), payload }) });
    }
    
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}