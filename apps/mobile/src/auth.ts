import * as SecureStore from 'expo-secure-store';
import api from './api';

export interface DriverUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  branch: { id: string; name: string } | null;
}

export async function login(email: string, password: string): Promise<DriverUser> {
  const res = await api.post('/auth/driver-login', { email, password });
  await SecureStore.setItemAsync('driver_token', res.data.token);
  await SecureStore.setItemAsync('driver_user', JSON.stringify(res.data.user));
  return res.data.user;
}

export async function logout() {
  await SecureStore.deleteItemAsync('driver_token');
  await SecureStore.deleteItemAsync('driver_user');
}

export async function getStoredUser(): Promise<DriverUser | null> {
  const raw = await SecureStore.getItemAsync('driver_user');
  return raw ? JSON.parse(raw) : null;
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('driver_token');
}

