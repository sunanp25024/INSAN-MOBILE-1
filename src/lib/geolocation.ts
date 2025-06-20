import { Geolocation, Position } from '@capacitor/geolocation';

// Interface for location data
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

// Get current position with high accuracy
export async function getCurrentPosition(): Promise<LocationData> {
  try {
    const position: Position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });

    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };

    // Optionally get address from coordinates
    try {
      const address = await getAddressFromCoordinates(position.coords.latitude, position.coords.longitude);
      locationData.address = address;
    } catch (error) {
      console.error('Error getting address:', error);
    }

    return locationData;
  } catch (error) {
    console.error('Error getting current position:', error);
    throw new Error('Tidak dapat mengakses lokasi. Pastikan GPS diaktifkan dan izin lokasi diberikan.');
  }
}

// Watch position changes
export function watchPosition(callback: (location: LocationData) => void): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000 },
        (position, err) => {
          if (err) {
            console.error('Error watching position:', err);
            return;
          }

          if (position) {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };

            callback(locationData);
          }
        }
      );

      resolve(watchId);
    } catch (error) {
      console.error('Error setting up watch position:', error);
      reject(error);
    }
  });
}

// Clear watch
export async function clearWatch(watchId: string): Promise<void> {
  try {
    await Geolocation.clearWatch({ id: watchId });
  } catch (error) {
    console.error('Error clearing watch:', error);
  }
}

// Get address from coordinates using reverse geocoding
async function getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'INSAN MOBILE App'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding service error');
    }

    const data = await response.json();
    return data.display_name || 'Alamat tidak diketahui';
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return 'Alamat tidak diketahui';
  }
}

// Calculate distance between two points in kilometers
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Check if user is within a certain radius of a location
export function isWithinRadius(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  return distance <= radiusKm;
}