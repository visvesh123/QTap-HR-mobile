/**
 * API layer — HR backend (auth, attendance, leave, profile) + Hostels backend.
 * Auth lives on HR (`EXPO_PUBLIC_HR_API_URL` / `EXPO_PUBLIC_BACKEND_URL`).
 * Hostels uses the same JWT (issuer `hrlms`).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from './auth';
import { mockApi, dalmartGeoValidate, dalmartFaceValidate } from './mock';
import {
  isTicketingApiConfigured,
  fetchTicketDepartments,
  fetchTicketsList,
  fetchTicketDetail,
  createTicketRemote,
  addTicketCommentRemote,
  reopenTicketRemote,
  mapProfileToRequester,
} from './ticketingApi';

const HR_BASE =
  process.env.EXPO_PUBLIC_HR_API_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';
const HOSTELS_BASE = process.env.EXPO_PUBLIC_HOSTELS_API_URL || '';

const TOKEN_KEY = 'campus_hub_token';
const REFRESH_TOKEN_KEY = 'campus_hub_refresh_token';
const PERMISSIONS_KEY = 'campus_hub_permissions';
const OTP_REQUEST_PATH = process.env.EXPO_PUBLIC_OTP_REQUEST_PATH || '/api/v1/otp/send';
const OTP_VERIFY_PATH = process.env.EXPO_PUBLIC_OTP_VERIFY_PATH || '/api/v1/otp/verify';
const OTP_REFRESH_PATH = process.env.EXPO_PUBLIC_OTP_REFRESH_PATH || '/api/v1/otp/refresh';
const STAFF_PROFILE_PATH = process.env.EXPO_PUBLIC_STAFF_PROFILE_PATH || '/api/v1/staff/me/profile';
const NEWS_PATH = process.env.EXPO_PUBLIC_NEWS_PATH || '/api/v1/news';
const HOLIDAYS_PATH = process.env.EXPO_PUBLIC_HOLIDAYS_PATH || '/api/v1/holidays';
const AUTHORIZED_LOCATIONS_PATH =
  process.env.EXPO_PUBLIC_AUTHORIZED_LOCATIONS_PATH || '/api/v1/staff/me/authorized-locations';
const ATTENDANCE_STATUS_PATH =
  process.env.EXPO_PUBLIC_ATTENDANCE_STATUS_PATH || '/api/v1/attendance/status';
const ATTENDANCE_VALIDATE_LOCATION_PATH =
  process.env.EXPO_PUBLIC_ATTENDANCE_VALIDATE_LOCATION_PATH || '/api/v1/attendance/validate/location';
const ATTENDANCE_VALIDATE_FACE_PATH =
  process.env.EXPO_PUBLIC_ATTENDANCE_VALIDATE_FACE_PATH || '/api/v1/attendance/validate/face';
const ATTENDANCE_CALENDAR_PATH =
  process.env.EXPO_PUBLIC_ATTENDANCE_CALENDAR_PATH || '/api/v1/attendance/history/calendar';
const ATTENDANCE_STREAK_PATH =
  process.env.EXPO_PUBLIC_ATTENDANCE_STREAK_PATH || '/api/v1/attendance/streak';
const LEAVE_CONTEXT_PATH = process.env.EXPO_PUBLIC_LEAVE_CONTEXT_PATH || '/api/v1/leave/context';
const LEAVE_APPLY_PATH = process.env.EXPO_PUBLIC_LEAVE_APPLY_PATH || '/api/v1/leave/apply';
const LEAVE_MY_PATH = process.env.EXPO_PUBLIC_LEAVE_MY_PATH || '/api/v1/leave/my-leaves';
const HOSTELS_USER_INFO_PATH = '/api/userInfoForLeave';
const HOSTELS_APPLY_LEAVE_PATH = '/api/applyLeave';
const MICROSOFT_LOGIN_PATH = process.env.EXPO_PUBLIC_MICROSOFT_LOGIN_PATH || '/auth/microsoft';
const ME_CACHE_MS = 60_000;

export function isHrApiConfigured() {
  return Boolean(HR_BASE);
}

export function isHostelsApiConfigured() {
  return Boolean(HOSTELS_BASE);
}

let meCache: { user: User; at: number } | null = null;
let meInflight: Promise<User> | null = null;

function invalidateMeCache() {
  meCache = null;
  meInflight = null;
}

function formatRequestError(data: any, status: number): string {
  if (typeof data?.message === 'string' && data.message) return data.message;
  if (typeof data?.error?.message === 'string' && data.error.message) return data.error.message;
  if (data?.errors && typeof data.errors === 'object') {
    return Object.entries(data.errors)
      .flatMap(([k, v]) => (Array.isArray(v) ? v.map((e) => `${k}: ${e}`) : [`${k}: ${v}`]))
      .join(', ');
  }
  const detail = data?.detail ?? data;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d: any) => d.msg ?? JSON.stringify(d)).join(', ');
  if (detail && typeof detail === 'object') return JSON.stringify(detail);
  return `HTTP ${status}`;
}

export async function setToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  invalidateMeCache();
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setRefreshToken(token: string) {
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearToken() {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, PERMISSIONS_KEY]);
  invalidateMeCache();
}

export async function setStoredPermissions(permissions: string[]) {
  const normalized = Array.from(
    new Set(
      permissions
        .filter((p): p is string => typeof p === 'string')
        .map((p) => p.trim())
        .filter(Boolean),
    ),
  );
  await AsyncStorage.setItem(PERMISSIONS_KEY, JSON.stringify(normalized));
}

export async function getStoredPermissions(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(PERMISSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === 'string').map((p) => p.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function resolveUrl(base: string | undefined, rawPath: string) {
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const normalizedBase = (base || '').replace(/\/+$/, '');
  if (!normalizedBase) return normalizedPath;

  let baseHasApiSegment = false;
  try {
    baseHasApiSegment = new URL(normalizedBase).pathname.split('/').some((segment) => segment.toLowerCase() === 'api');
  } catch {
    baseHasApiSegment = /\/api(?:\/|$)/i.test(normalizedBase);
  }

  const baseEndsWithApi = /\/api$/i.test(normalizedBase);
  const pathStartsWithApi = /^\/api(?:\/|$)/i.test(normalizedPath);

  let resolvedPath = normalizedPath;
  if (baseEndsWithApi && pathStartsWithApi) {
    resolvedPath = normalizedPath.replace(/^\/api(?=\/|$)/i, '');
  } else if (!baseHasApiSegment && !pathStartsWithApi) {
    resolvedPath = `/api${normalizedPath}`;
  }

  return `${normalizedBase}${resolvedPath}`;
}

let refreshInflight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInflight) return refreshInflight;
  refreshInflight = (async () => {
    const refresh = await getRefreshToken();
    if (!refresh || !HR_BASE) return null;
    const res = await fetch(resolveUrl(HR_BASE, OTP_REFRESH_PATH), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    const txt = await res.text();
    let data: any = null;
    try {
      data = txt ? JSON.parse(txt) : null;
    } catch {
      data = txt;
    }
    if (!res.ok) {
      await clearToken();
      return null;
    }
    const payload = data?.data ?? data ?? {};
    const access = payload.access_token || payload.token;
    const nextRefresh = payload.refresh_token;
    if (!access) return null;
    await setToken(access);
    if (typeof nextRefresh === 'string' && nextRefresh) await setRefreshToken(nextRefresh);
    return access as string;
  })().finally(() => {
    refreshInflight = null;
  });
  return refreshInflight;
}

async function requestAgainstBase<T = any>(
  base: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: any,
  retried = false,
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(resolveUrl(base, path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const txt = await res.text();
  let data: any = null;
  try {
    data = txt ? JSON.parse(txt) : null;
  } catch {
    data = txt;
  }

  if (res.status === 401 && !retried && base === HR_BASE) {
    const next = await refreshAccessToken();
    if (next) return requestAgainstBase(base, method, path, body, true);
  }

  if (!res.ok) throw new Error(formatRequestError(data, res.status));
  return data as T;
}

/** HR / auth API (default). */
export async function request<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: any,
): Promise<T> {
  if (!HR_BASE) throw new Error('HR API URL is not configured');
  return requestAgainstBase(HR_BASE, method, path, body);
}

async function requestHostels<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: any,
): Promise<T> {
  if (!HOSTELS_BASE) throw new Error('Hostels API URL is not configured');
  return requestAgainstBase(HOSTELS_BASE, method, path, body);
}

async function requestMultipart<T = any>(path: string, form: FormData, retried = false): Promise<T> {
  if (!HR_BASE) throw new Error('HR API URL is not configured');
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(resolveUrl(HR_BASE, path), {
    method: 'POST',
    headers,
    body: form,
  });

  const txt = await res.text();
  let data: any = null;
  try {
    data = txt ? JSON.parse(txt) : null;
  } catch {
    data = txt;
  }

  if (res.status === 401 && !retried) {
    const next = await refreshAccessToken();
    if (next) return requestMultipart(path, form, true);
  }

  if (!res.ok) throw new Error(formatRequestError(data, res.status));
  return data as T;
}

function isStudentProfile(profile: any, info: Record<string, any>): boolean {
  if (profile.htno) return true;
  if (info.program || info.academic_status || info.course_allotted) return true;
  if (info.school && !info.designation && !info.category) return true;
  return false;
}

function displayNameFromProfile(profile: any, info: Record<string, any>, qid: string): string {
  const candidates = [
    profile?.name,
    profile?.full_name,
    profile?.display_name,
    info?.name,
    info?.full_name,
  ];
  for (const value of candidates) {
    const name = String(value ?? '').trim();
    // Never treat QID / id as a human display name on the hero.
    if (name && name.toLowerCase() !== String(qid).toLowerCase()) return name;
  }
  return 'User';
}

function mapProfile(raw: any): User {
  const profile = raw?.data ?? raw ?? {};
  const info = profile.info ?? {};
  const qid = profile.id || profile.qid || 'user';
  const student = isStudentProfile(profile, info);

  const base: User = {
    id: qid,
    qid,
    email: profile.mail || profile.mail_id || `${String(qid).toLowerCase()}@local.user`,
    name: displayNameFromProfile(profile, info, qid),
    role: student ? 'student' : 'staff',
    phone: profile.number ?? profile.phone_number ?? undefined,
    gender: profile.gender ?? undefined,
    avatar: info.image || profile.image || null,
  };

  if (student) {
    return {
      ...base,
      student_id: profile.htno ?? undefined,
      school: info.school ?? undefined,
      batch: info.batch ?? undefined,
      program: info.program ?? undefined,
      course_allotted: info.course_allotted ?? undefined,
      academic_status: info.academic_status ?? undefined,
      blood_group: info.blood_group ?? undefined,
      date_of_admission: info.date_of_admission ?? undefined,
    };
  }

  return {
    ...base,
    employee_id: profile.eid ?? undefined,
    department: info.department ?? profile.department ?? undefined,
    type: info.category ?? profile.category ?? undefined,
    designation: info.designation ?? profile.designation ?? undefined,
    entity: info.entity ?? undefined,
  };
}

export { dalmartGeoValidate, dalmartFaceValidate };

async function otpRequest(phone: string) {
  if (!HR_BASE) return mockApi.otpRequest(phone);
  return request('POST', OTP_REQUEST_PATH, { phone_number: phone });
}

async function otpVerify(phone: string, code: string) {
  if (!HR_BASE) return mockApi.otpVerify(phone, code);
  return request('POST', OTP_VERIFY_PATH, { phone_number: phone, otp: code });
}

async function me(force = false): Promise<User> {
  if (!HR_BASE) return mockApi.me();

  const now = Date.now();
  if (!force && meCache && now - meCache.at < ME_CACHE_MS) {
    return meCache.user;
  }
  if (meInflight) return meInflight;

  meInflight = request('GET', STAFF_PROFILE_PATH)
    .then(mapProfile)
    .then((user) => {
      meCache = { user, at: Date.now() };
      return user;
    })
    .finally(() => {
      meInflight = null;
    });

  return meInflight;
}

async function microsoft(email?: string) {
  if (!HR_BASE) return mockApi.microsoft(email);
  return request('POST', MICROSOFT_LOGIN_PATH, email ? { email } : undefined);
}

export type NewsItem = {
  id: string;
  category: string;
  title: string;
  summary: string;
  image: string;
  date: string;
};

type ApiNewsRecord = {
  news_id: number;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
};

function mapNewsItem(record: ApiNewsRecord): NewsItem {
  return {
    id: String(record.news_id),
    category: 'Campus News',
    title: record.title,
    summary: record.description,
    image: record.image_url,
    date: record.created_at,
  };
}

async function news(): Promise<NewsItem[]> {
  if (!HR_BASE) return mockApi.news();
  const res = await request<{ data?: { news?: ApiNewsRecord[] } }>('GET', NEWS_PATH);
  const items = res?.data?.news ?? [];
  return (Array.isArray(items) ? items : []).map(mapNewsItem);
}

export type HolidayItem = {
  id: string;
  name: string;
  date: string;
  type: string;
};

type ApiHolidayRecord = {
  holiday_id: number;
  holiday_date: string;
  holiday_name: string;
};

function todayIstDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

function mapHolidayItem(record: ApiHolidayRecord): HolidayItem {
  return {
    id: String(record.holiday_id),
    name: record.holiday_name,
    date: record.holiday_date,
    type: 'Public Holiday',
  };
}

function nearestUpcomingHolidays(items: HolidayItem[], limit = 3): HolidayItem[] {
  const today = todayIstDate();
  return items
    .filter((h) => h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

async function holidays(): Promise<{ upcoming: HolidayItem[]; holidays: HolidayItem[] }> {
  if (!HR_BASE) {
    const mock = await mockApi.holidays();
    const all = (mock.holidays ?? mock.upcoming ?? []) as HolidayItem[];
    const upcoming = nearestUpcomingHolidays(all);
    return { holidays: all, upcoming };
  }

  const res = await request<{ data?: { holidays?: ApiHolidayRecord[] } }>('POST', HOLIDAYS_PATH, { next: false });
  const items = (res?.data?.holidays ?? []).map(mapHolidayItem);
  return {
    holidays: items,
    upcoming: nearestUpcomingHolidays(items),
  };
}

export type AuthorizedLocation = {
  venue_id: number;
  venue_name: string;
  latitude: number;
  longitude: number;
  radius: number;
  accuracy: number | null;
};

async function authorizedLocations(): Promise<AuthorizedLocation[]> {
  if (!HR_BASE) return mockApi.authorizedLocations();
  const res = await request<{ data?: { authorized_locations?: AuthorizedLocation[] } }>(
    'GET',
    AUTHORIZED_LOCATIONS_PATH,
  );
  const items = res?.data?.authorized_locations ?? [];
  return Array.isArray(items) ? items : [];
}

export type AttendanceStatusData = {
  current_state: string | null;
  current_status: 'IN' | 'OUT' | null;
  geo_validation: boolean;
  face_recognition: boolean;
  geo_marked_at: string | null;
  face_recognition_marked_at: string | null;
  last_activity: string | null;
  mode: string | null;
  attendance_id: number | null;
  roster_assignment_id: number | null;
  venue_id: number | null;
  reason: string | null;
  previous_session_auto_closed?: boolean;
};

export type AttendanceActionDecision =
  | { allowed: true; skipGeo?: boolean }
  | { allowed: false; message: string };

/** Gate check-in/out from GET /attendance/status before opening the capture flow. */
export function resolveAttendanceAction(
  status: AttendanceStatusData,
  kind: 'in' | 'out',
): AttendanceActionDecision {
  const state = status.current_state || 'NO_RECORD';
  const pendingStatus = status.current_status;
  const wantIn = kind === 'in';
  const wantOut = kind === 'out';

  switch (state) {
    case 'NO_RECORD':
    case 'EXPIRED':
      if (wantOut) {
        return { allowed: false, message: 'Cannot check out before check in.' };
      }
      return { allowed: true };

    case 'PENDING_FACE':
      if (pendingStatus === 'IN') {
        if (wantOut) {
          return { allowed: false, message: 'Complete face recognition for your pending check-in first.' };
        }
        return { allowed: true, skipGeo: true };
      }
      if (pendingStatus === 'OUT') {
        if (wantIn) {
          return { allowed: false, message: 'Complete face recognition for your pending check-out first.' };
        }
        return { allowed: true, skipGeo: true };
      }
      return { allowed: true, skipGeo: true };

    case 'CHECKED_IN':
      if (wantIn) {
        return { allowed: false, message: 'You are already checked in. Please check out first.' };
      }
      return { allowed: true };

    case 'CHECKED_OUT':
      if (wantOut) {
        return { allowed: false, message: 'You are already checked out. Please check in first.' };
      }
      return { allowed: true };

    default:
      return { allowed: false, message: 'Invalid attendance state. Please try again.' };
  }
}

async function attendanceStatus(): Promise<AttendanceStatusData> {
  if (!HR_BASE) return mockApi.attendanceStatus();
  const res = await request<{ data?: AttendanceStatusData }>('GET', ATTENDANCE_STATUS_PATH);
  return res?.data ?? (res as unknown as AttendanceStatusData);
}

async function attendanceValidateLocation(
  lat: number,
  long: number,
  status: 'IN' | 'OUT',
  qid?: string,
) {
  if (!HR_BASE) return dalmartGeoValidate(qid || 'mock', lat, long, status);
  return request('POST', ATTENDANCE_VALIDATE_LOCATION_PATH, { lat, long, status });
}

async function attendanceValidateFace(
  photo: { uri?: string | null; base64?: string | null },
  qid?: string,
) {
  if (!HR_BASE) return dalmartFaceValidate(qid || 'mock', photo);

  const form = new FormData();
  if (photo.uri) {
    form.append('photo', {
      uri: photo.uri,
      name: 'selfie.jpg',
      type: 'image/jpeg',
    } as any);
  } else if (photo.base64) {
    form.append('photo', {
      uri: `data:image/jpeg;base64,${photo.base64}`,
      name: 'selfie.jpg',
      type: 'image/jpeg',
    } as any);
  }

  return requestMultipart(ATTENDANCE_VALIDATE_FACE_PATH, form);
}

function mapCalendarDayStatus(dayStatus?: string): string {
  const s = String(dayStatus || '').toUpperCase();
  if (s === 'COMPLETED' || s === 'PRESENT') return 'present';
  if (s === 'INCOMPLETE') return 'half_day';
  return 'present';
}

function mapCalendarToHistoryItems(data: any): any[] {
  const days = data?.days ?? [];
  const out: any[] = [];
  for (const day of Array.isArray(days) ? days : []) {
    const date = day?.date;
    if (!date) continue;
    const events = Array.isArray(day.events) ? day.events : [];
    if (!events.length) {
      out.push({
        id: `day-${date}`,
        type: 'in',
        accepted: true,
        status: mapCalendarDayStatus(day.day_status),
        timestamp: `${date}T00:00:00+00:00`,
        geofence_name: null,
      });
      continue;
    }
    for (const ev of events) {
      const kind = String(ev.status || '').toUpperCase() === 'OUT' ? 'out' : 'in';
      const ts =
        ev.face_recognition_marked_at ||
        ev.geo_marked_at ||
        `${date}T00:00:00+00:00`;
      out.push({
        id: `${date}-${kind}-${ts}`,
        type: kind,
        accepted: true,
        status: kind === 'in' ? mapCalendarDayStatus(day.day_status) : null,
        timestamp: ts,
        geofence_name: ev.venue_name || null,
        venue_id: ev.venue_id,
        face_passed: !!ev.face_recognition,
        inside_geofence: !!ev.geo_validation,
        attendance_type: 'office',
        source: 'hr',
      });
    }
  }
  return out;
}

async function attendanceHistory(month?: number, year?: number) {
  if (!HR_BASE) return mockApi.attendanceHistory();
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();
  const res = await request<{ data?: any }>(
    'GET',
    `${ATTENDANCE_CALENDAR_PATH}?month=${m}&year=${y}`,
  );
  return mapCalendarToHistoryItems(res?.data ?? res);
}

async function attendanceStats() {
  if (!HR_BASE) return mockApi.attendanceStats();
  const now = new Date();
  const [calRes, streakRes] = await Promise.all([
    request<{ data?: any }>('GET', `${ATTENDANCE_CALENDAR_PATH}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).catch(() => null),
    request<{ data?: any }>('GET', ATTENDANCE_STREAK_PATH).catch(() => null),
  ]);
  const days = calRes?.data?.days ?? [];
  const present = (Array.isArray(days) ? days : []).filter((d: any) => {
    const s = String(d?.day_status || '').toUpperCase();
    return s === 'COMPLETED' || s === 'PRESENT';
  }).length;
  const incomplete = (Array.isArray(days) ? days : []).filter(
    (d: any) => String(d?.day_status || '').toUpperCase() === 'INCOMPLETE',
  ).length;
  const streak = streakRes?.data ?? {};
  return {
    month: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    working_days_so_far: (Array.isArray(days) ? days : []).length,
    present_days: present,
    late_days: 0,
    half_days: incomplete,
    wfh_days: 0,
    absent_days: Math.max(0, (Array.isArray(days) ? days : []).length - present - incomplete),
    attendance_pct: (Array.isArray(days) ? days : []).length
      ? Math.round((present / days.length) * 100)
      : 0,
    total_work_hours: 0,
    avg_work_hours: 0,
    failed_face_verifications: 0,
    spoof_attempts: 0,
    current_streak: streak.current_streak ?? 0,
    longest_streak: streak.longest_streak ?? 0,
    daily: [],
  };
}

async function attendanceGeofences() {
  if (!HR_BASE) return mockApi.attendanceGeofences();
  const locs = await authorizedLocations();
  return locs.map((l) => ({
    id: String(l.venue_id),
    name: l.venue_name,
    lat: l.latitude,
    lon: l.longitude,
    radius_m: l.radius,
  }));
}

function shortLeaveType(leaveType: string): string {
  return String(leaveType || '')
    .replace(/\s+Leave$/i, '')
    .trim() || leaveType;
}

function toHrLeaveType(type: string): string {
  const t = String(type || '').trim();
  if (/leave$/i.test(t)) return t;
  return `${t} Leave`;
}

function mapLeaveStatus(status: string): string {
  const s = String(status || '').toUpperCase();
  if (s === 'APPROVED' || s === 'MANAGER_APPROVED' || s === 'HR_APPROVED') return 'Approved';
  if (s === 'REJECTED' || s === 'CANCELLED') return 'Rejected';
  return 'Pending';
}

async function leaveSummary() {
  if (!HR_BASE) return mockApi.leaveSummary();
  const year = new Date().getFullYear();
  const [ctxRes, myRes] = await Promise.all([
    request<{ data?: any }>('GET', LEAVE_CONTEXT_PATH),
    request<{ data?: any }>('GET', `${LEAVE_MY_PATH}?year=${year}`),
  ]);
  const balances = (ctxRes?.data?.leave_balances ?? []).map((b: any) => ({
    type: shortLeaveType(b.leave_type),
    total: Number(b.allocated ?? 0),
    used: Number(b.used ?? 0),
    remaining: Number(b.available ?? 0),
  }));
  const requests = (myRes?.data?.leaves ?? []).map((lv: any) => ({
    id: String(lv.leave_id),
    type: shortLeaveType(lv.leave_type),
    from_date: lv.from_date,
    to_date: lv.to_date,
    reason: lv.reason,
    status: mapLeaveStatus(lv.status),
    applied_at: lv.applied_on,
  }));
  return { balances, requests };
}

async function leaveApply(payload: {
  type: string;
  from_date: string;
  to_date: string;
  reason: string;
}) {
  if (!HR_BASE) return mockApi.leaveApply(payload);
  return request('POST', LEAVE_APPLY_PATH, {
    leave_type: toHrLeaveType(payload.type),
    leave_duration: 'FULL',
    from_date: payload.from_date,
    to_date: payload.to_date,
    reason: payload.reason,
  });
}

async function myRoom() {
  if (!HOSTELS_BASE) return mockApi.myRoom();
  try {
    const rows = await requestHostels<any[]>('GET', HOSTELS_USER_INFO_PATH);
    const row = Array.isArray(rows) ? rows[0] : rows;
    const hd = row?.hostel_details ?? {};
    return {
      hostel: hd.hostel_name || hd.hostel || 'Hostel',
      block: hd.block_id || hd.block || '—',
      room: hd.room_no || hd.room || '—',
      floor: hd.floor || '—',
      occupancy: hd.occupancy || '—',
      monthly_rent: hd.monthly_rent || '—',
      warden: hd.warden || '—',
      roommates: Array.isArray(hd.roommates) ? hd.roommates : [],
      facilities: Array.isArray(hd.facilities) ? hd.facilities : [],
    };
  } catch {
    return mockApi.myRoom();
  }
}

/** Hostel outpass leave (student hosteller) — separate from HR staff leave. */
async function hostelLeaveApply(payload: {
  reason: string;
  leaveType: 'LongLeave' | 'ShortLeave' | 'TemporaryOuting';
  fromDate?: string;
  toDate?: string;
}) {
  if (!HOSTELS_BASE) throw new Error('Hostels API is not configured');
  return requestHostels('POST', HOSTELS_APPLY_LEAVE_PATH, payload);
}

async function ticketDepartments() {
  if (!isTicketingApiConfigured()) return mockApi.ticketDepartments();
  return fetchTicketDepartments();
}

async function ticketLookup(_studentId?: string) {
  if (!isTicketingApiConfigured()) return mockApi.ticketLookup(_studentId);
  const user = await me();
  return mapProfileToRequester(user);
}

async function ticketsList() {
  if (!isTicketingApiConfigured()) return mockApi.ticketsList();
  return fetchTicketsList();
}

async function ticketDetail(id: string) {
  if (!isTicketingApiConfigured()) return mockApi.ticketDetail(id);
  return fetchTicketDetail(id);
}

async function createTicket(payload: {
  subject: string;
  description: string;
  department?: string;
  department_id?: string;
  requester?: any;
}) {
  if (!isTicketingApiConfigured()) {
    return mockApi.createTicket({ ...payload, department: payload.department || payload.department_id || '' });
  }
  if (!payload.department_id) throw new Error('Department is required');
  return createTicketRemote({
    subject: payload.subject,
    description: payload.description,
    department_id: payload.department_id,
  });
}

async function addTicketComment(id: string, text: string) {
  if (!isTicketingApiConfigured()) return mockApi.addTicketComment(id, text);
  return addTicketCommentRemote(id, text);
}

async function reopenTicket(id: string, departmentId?: string) {
  if (!isTicketingApiConfigured()) return mockApi.reopenTicket(id);
  let deptId = departmentId;
  if (!deptId) {
    const detail = await fetchTicketDetail(id);
    deptId = detail?.current_department_id;
  }
  if (!deptId) throw new Error('Could not determine department for reopen');
  return reopenTicketRemote(id, String(deptId));
}

export const api = {
  ...mockApi,
  otpRequest,
  otpVerify,
  me,
  microsoft,
  news,
  holidays,
  authorizedLocations,
  attendanceStatus,
  attendanceValidateLocation,
  attendanceValidateFace,
  attendanceHistory,
  attendanceStats,
  attendanceGeofences,
  leaveSummary,
  leaveApply,
  myRoom,
  hostelLeaveApply,
  ticketDepartments,
  ticketLookup,
  ticketsList,
  ticketDetail,
  createTicket,
  addTicketComment,
  reopenTicket,
};
