import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your Mac's local IP when testing on device
// For EAS builds pointing at Railway, use your Railway URL
const DEV_URL = 'http://192.168.1.88:3001';
const PROD_URL = 'https://YOUR_RAILWAY_URL';

export const API_BASE = __DEV__ ? DEV_URL : PROD_URL;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('driver_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

