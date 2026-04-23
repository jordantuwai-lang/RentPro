import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { API_BASE } from '../api';

export const LOCATION_TASK = 'background-location-task';

// Register the background task — must be called at top level, outside any component
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('[GPS Task] Error:', error.message);
    return;
  }

  if (!data?.locations?.length) return;

  const { latitude, longitude } = data.locations[0].coords;

  try {
    const token = await SecureStore.getItemAsync('driver_token');
    const userRaw = await SecureStore.getItemAsync('driver_user');
    if (!token || !userRaw) return;

    const user = JSON.parse(userRaw);

    await fetch(`${API_BASE}/users/${user.id}/location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ lat: latitude, lng: longitude }),
    });
  } catch (err) {
    // Silent — we don't want background task crashes to surface to the user
    console.error('[GPS Task] Failed to send location:', err);
  }
});

export async function startLocationTracking() {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') throw new Error('Foreground location permission denied');

  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  if (bg !== 'granted') throw new Error('Background location permission denied');

  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (isRunning) return;

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 15000,       // every 15 seconds
    distanceInterval: 0,       // regardless of distance
    foregroundService: {
      notificationTitle: 'RentPro Driver',
      notificationBody: 'Sharing your location with dispatch',
      notificationColor: '#01ae42',
    },
    pausesUpdatesAutomatically: false,
  });
}

export async function stopLocationTracking() {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
}

