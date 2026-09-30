/**
 * API layer — currently MOCK-ONLY (no backend).
 *
 * Every method below delegates to the mock layer in `src/mock.ts`. The function
 * names and response shapes match the original FastAPI so screens are untouched.
 *
 * To integrate your real backend SCREEN BY SCREEN: set EXPO_PUBLIC_BACKEND_URL and
 * replace the relevant method's `mockApi.*` call with a real `request(...)` call
 * (the `request` helper below is kept ready for exactly that).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockApi, dalmartGeoValidate, dalmartFaceValidate } from './mock';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
const TOKEN_KEY = 'campus_hub_token';

export async function setToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}
export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/**
 * Real-backend request helper — kept for when you wire individual screens to your
 * API. Not used while the app runs on mock data.
 */
export async function request<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any,
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  let data: any = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  if (!res.ok) {
    const detail = data?.detail ?? data ?? `HTTP ${res.status}`;
    const msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((d: any) => d.msg ?? JSON.stringify(d)).join(', ') : JSON.stringify(detail);
    throw new Error(msg);
  }
  return data as T;
}

// Direct dalmart attendance calls (currently mocked in src/mock.ts).
export { dalmartGeoValidate, dalmartFaceValidate };

// The app's API surface — delegates to the mock layer.
export const api = mockApi;
