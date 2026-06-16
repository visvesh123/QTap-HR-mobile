import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

const DALMART_BASE = 'https://api-dot-dalmart.el.r.appspot.com';

/** Direct call to the dalmart MU attendance service (bypasses our FastAPI). */
export async function dalmartGeoValidate(
  qid: string,
  lat: number,
  long: number,
  status: 'IN' | 'OUT',
): Promise<any> {
  // Round to 6 decimals (~0.11m). Prevents over-long coordinate strings that can
  // overflow dalmart's varchar(30) location column (their server-side limit).
  const round6 = (n: number) => Math.round(n * 1e6) / 1e6;
  const res = await fetch(`${DALMART_BASE}/api/v2/attendance/validate/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: '*/*' },
    body: JSON.stringify({ qid, lat: round6(lat), long: round6(long), status }),
  });
  const txt = await res.text();
  try { return txt ? JSON.parse(txt) : null; } catch { return null; }
}

/** Direct call to the dalmart face-recognition step (multipart). Bypasses our FastAPI. */
export async function dalmartFaceValidate(
  qid: string,
  photo: { uri?: string | null; base64?: string | null },
): Promise<any> {
  const form = new FormData();
  form.append('qid', qid);
  if (Platform.OS === 'web') {
    if (photo.base64) {
      const blobRes = await fetch(`data:image/jpeg;base64,${photo.base64}`);
      const blob = await blobRes.blob();
      form.append('photo', blob, 'selfie.jpg');
    }
  } else if (photo.uri) {
    form.append('photo', { uri: photo.uri, name: 'selfie.jpg', type: 'image/jpeg' } as any);
  }
  const res = await fetch(`${DALMART_BASE}/api/v2/attendance/validate/face`, {
    method: 'POST',
    headers: { accept: 'application/json' },
    body: form,
  });
  const txt = await res.text();
  try { return txt ? JSON.parse(txt) : null; } catch { return null; }
}

async function request<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any
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

export const api = {
  // auth
  login: (email: string, password: string, role?: string) =>
    request<{ token: string; user: any }>('POST', '/auth/login', { email, password, role }),
  otpRequest: (phone: string) =>
    request<{ ok: boolean; phone: string; demo_otp?: string; message: string }>('POST', '/auth/otp/request', { phone }),
  otpVerify: (phone: string, code: string) =>
    request<{ token: string; user: any }>('POST', '/auth/otp/verify', { phone, code }),
  microsoft: (email?: string) =>
    request<{ token: string; user: any }>('POST', '/auth/microsoft', { email }),
  me: () => request<any>('GET', '/auth/me'),
  demoAccounts: () => request<any[]>('GET', '/auth/demo-accounts'),

  // exams
  hallTicket: () => request<any>('GET', '/exams/hall-ticket'),
  examAttendance: () => request<any[]>('GET', '/exams/attendance-log'),
  results: () => request<any>('GET', '/exams/results'),

  // visitor
  visitorRequest: (data: any) => request<any>('POST', '/visitors/request', data),
  visitorList: () => request<any[]>('GET', '/visitors/list'),

  // attendance
  attendanceCheck: (data: any) => request<any>('POST', '/attendance/check', data),
  attendanceHistory: () => request<any[]>('GET', '/attendance/history'),
  attendanceToday: () => request<any>('GET', '/attendance/today'),
  attendanceStats: () => request<any>('GET', '/attendance/stats'),
  attendanceGeofences: () => request<any[]>('GET', '/attendance/geofences'),
  geoValidate: (lat: number, long: number, status: 'IN' | 'OUT') =>
    request<{ success: boolean; message: string | null; venue_id: number | null; venue_name: string | null; attendance_id: number | null; current_state: string | null }>(
      'POST', '/attendance/geo-validate', { lat, long, status }),
  attendanceRecordDalmart: (body: any) => request('POST', '/attendance/record-dalmart', body),
  attendanceAdminToday: () => request<any>('GET', '/attendance/admin/today'),

  // library
  books: (q?: string) => request<any[]>('GET', `/library/books${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  issueBook: (id: string) => request<any>('POST', `/library/issue/${id}`),
  myIssues: () => request<any[]>('GET', '/library/my-issues'),

  // hostel
  myRoom: () => request<any>('GET', '/hostel/my-room'),
  createComplaint: (d: any) => request<any>('POST', '/hostel/complaint', d),
  complaints: () => request<any[]>('GET', '/hostel/complaints'),

  // events
  events: () => request<any[]>('GET', '/events'),
  registerEvent: (event_id: string) => request<any>('POST', '/events/register', { event_id }),
  myRegistrations: () => request<any[]>('GET', '/events/my-registrations'),
  certificates: () => request<any[]>('GET', '/events/certificates'),

  // communication
  alerts: () => request<any[]>('GET', '/alerts'),
  sos: (data: any) => request<any>('POST', '/sos', data),
  activeSos: () => request<any[]>('GET', '/sos/active'),

  // parcels
  parcels: () => request<any[]>('GET', '/parcels'),
  collectParcel: (id: string) => request<any>('POST', `/parcels/${id}/collect`),

  // wallet
  wallet: () => request<any>('GET', '/wallet'),
  rewardsStore: () => request<any[]>('GET', '/wallet/rewards-store'),

  // gate
  gateLogs: () => request<any[]>('GET', '/gate/logs'),
  myPass: () => request<any>('GET', '/gate/my-pass'),

  // admin
  adminDashboard: () => request<any>('GET', '/admin/dashboard'),
  adminEmployees: (params?: { q?: string; role?: string; department?: string }) => {
    const q = params ? Object.entries(params).filter(([_, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&') : '';
    return request<any[]>('GET', `/admin/employees${q ? `?${q}` : ''}`);
  },
  adminAttendanceTrend: () => request<any[]>('GET', '/admin/attendance/trend'),
  adminAttendanceByDept: () => request<any[]>('GET', '/admin/attendance/by-department'),
  adminCreateGeofence: (data: any) => request<any>('POST', '/admin/geofences', data),
  adminUpdateGeofence: (id: string, data: any) => request<any>('PUT', `/admin/geofences/${id}`, data),
  adminDeleteGeofence: (id: string) => request<any>('DELETE', `/admin/geofences/${id}`),
  adminMonthlyReport: (month?: string) => request<any>('GET', `/admin/reports/monthly${month ? `?month=${month}` : ''}`),

  // mess
  messList: (demo?: string) => request<any>('GET', `/mess/list${demo ? `?demo=${demo}` : ''}`),

  // weather
  weather: () => request<{ city: string; temp_c: number | null; high_c: number | null; low_c: number | null; code: number | null; condition: string | null; unavailable?: boolean }>('GET', '/weather'),

  // leave
  leaveSummary: () => request<{ balances: any[]; requests: any[] }>('GET', '/leave/summary'),
  leaveApply: (payload: { type: string; from_date: string; to_date: string; reason: string }) =>
    request<any>('POST', '/leave/apply', payload),

  // holidays & news
  holidays: () => request<{ upcoming: any[]; holidays: any[] }>('GET', '/holidays'),
  news: () => request<any[]>('GET', '/news'),
};
