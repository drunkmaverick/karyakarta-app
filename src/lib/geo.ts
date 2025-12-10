// Geolocation utilities for distance calculations

export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param pointA First point
 * @param pointB Second point
 * @returns Distance in meters
 */
export function distanceMeters(pointA: GeoPoint, pointB: GeoPoint): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (pointB.lat - pointA.lat) * Math.PI / 180;
  const dLng = (pointB.lng - pointA.lng) * Math.PI / 180;
  const lat1 = pointA.lat * Math.PI / 180;
  const lat2 = pointB.lat * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a point is within a given radius of a center point
 * @param center Center point
 * @param point Point to check
 * @param radiusM Radius in meters
 * @returns True if point is within radius
 */
export function isWithinRadius(center: GeoPoint, point: GeoPoint, radiusM: number): boolean {
  return distanceMeters(center, point) <= radiusM;
}

/**
 * Get user's current location using browser geolocation API
 * This function requests location permission only when called (ask-on-action pattern)
 * @param options Optional configuration for location request
 * @returns Promise resolving to user's location or null if denied/unavailable
 */
export async function getCurrentLocation(options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  showRationale?: boolean;
}): Promise<GeoPoint | null> {
  if (!navigator.geolocation) {
    console.warn('Geolocation is not supported by this browser');
    return null;
  }

  // Show rationale if requested (for better UX)
  if (options?.showRationale) {
    console.log('Location access helps us find nearby service providers and show you relevant services in your area.');
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location access granted');
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Location access denied or error:', error.message);
        // Provide user-friendly error messages
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.warn('Location permission denied by user');
            break;
          case error.POSITION_UNAVAILABLE:
            console.warn('Location information unavailable');
            break;
          case error.TIMEOUT:
            console.warn('Location request timed out');
            break;
          default:
            console.warn('Unknown location error');
            break;
        }
        resolve(null);
      },
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 300000, // 5 minutes
      }
    );
  });
}

/**
 * Request location permission with user-friendly rationale
 * Use this before calling getCurrentLocation() for better UX
 * @returns Promise resolving to permission status
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!navigator.geolocation) {
    return false;
  }

  // Check if permission is already granted
  if (navigator.permissions) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'granted') {
        return true;
      }
    } catch (error) {
      console.warn('Permission API not supported:', error);
    }
  }

  // Request permission by attempting to get location
  const location = await getCurrentLocation({ 
    showRationale: true,
    timeout: 5000 // Shorter timeout for permission check
  });
  
  return location !== null;
}

