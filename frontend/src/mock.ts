/**
 * MOCK DATA LAYER (frontend-only).
 *
 * The app currently runs WITHOUT a backend — every `api.*` method resolves from
 * the mock data / local state defined here. Function names & response shapes mirror
 * the original FastAPI responses, so you can integrate your real backend SCREEN BY
 * SCREEN: just replace the matching method body in `src/api.ts` with a real `fetch`.
 *
 * Stateful flows (attendance timeline, leave, events, complaints, visitors, book
 * issues) are persisted in AsyncStorage so the UI reflects user actions across reloads.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------- helpers ----------
const delay = (ms = 120) => new Promise<void>((r) => setTimeout(r, ms));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const nowIso = () => new Date().toISOString();
const todayKey = () => new Date().toISOString().slice(0, 10);

async function getStore<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
async function setStore(key: string, val: any) {
  try { await AsyncStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const K = {
  user: 'mock_current_user',
  timeline: (d: string) => `mock_timeline_${d}`,
  leave: 'mock_leave_requests',
  eventRegs: 'mock_event_regs',
  complaints: 'mock_complaints',
  visitors: 'mock_visitors',
  issues: 'mock_book_issues',
};

// ---------- mock identities (used for role-based access later) ----------
const VENUE = [{ venue_id: 2, venue_name: 'ECSOE Building', latitude: 17.5685454, longitude: 78.4354396, accuracy: null, radius: 100 }];

const STAFF_USER = {
  id: 'mock-staff-visvesh', email: 'visvesh.naraharisetty@mahindrauniversity.edu.in',
  name: 'Mr. Visvesh Naraharisetty', role: 'staff', department: 'Warden',
  student_id: null, employee_id: 'MUCS2722', avatar: null, phone: '9059721442',
  qid: 'QT208195', gender: 'Male', type: 'Staff', designated_locations: VENUE,
};
const ADMIN_USER = {
  id: 'mock-admin-suresh', email: 'admin@mahindrauniversity.edu.in',
  name: 'Prof. Suresh Mehta', role: 'admin', department: 'Administration',
  student_id: null, employee_id: 'MU-ADM001', avatar: null, phone: '9000000001',
  qid: 'QADM001', gender: 'Male', type: 'Admin', designated_locations: VENUE,
};
const STUDENT_USER = {
  id: 'mock-student-aarav', email: 'student@mahindrauniversity.edu.in',
  name: 'Aarav Sharma', role: 'student', department: 'Computer Science',
  student_id: 'MU22CS045', employee_id: null, avatar: null, phone: '9000000002',
  qid: null, gender: 'Male', type: 'Student', designated_locations: [],
};

const DEMO_ACCOUNTS = [
  { role: 'student', email: 'student@mahindrauniversity.edu.in', password: 'student123', name: 'Aarav Sharma' },
  { role: 'staff', email: 'faculty@mahindrauniversity.edu.in', password: 'faculty123', name: 'Dr. Rajesh Kumar (Faculty)' },
  { role: 'staff', email: 'warden@mahindrauniversity.edu.in', password: 'warden123', name: 'Mr. Vikram Singh (Warden)' },
  { role: 'admin', email: 'admin@mahindrauniversity.edu.in', password: 'admin123', name: 'Prof. Suresh Mehta' },
];

function userForEmail(email?: string): any {
  const e = (email || '').toLowerCase();
  if (e.includes('admin')) return clone(ADMIN_USER);
  if (e.includes('student')) return clone(STUDENT_USER);
  if (e) return { ...clone(STAFF_USER), email: e };
  return clone(STAFF_USER);
}
function userForPhone(phone?: string): any {
  // Map demo phones to roles for RBAC testing; default to the staff identity.
  if (phone === ADMIN_USER.phone) return clone(ADMIN_USER);
  if (phone === STUDENT_USER.phone) return clone(STUDENT_USER);
  return { ...clone(STAFF_USER), phone: phone || STAFF_USER.phone };
}

// ---------- static datasets (captured from the original API) ----------
const WEATHER = { city: 'Hyderabad', temp_c: 32, high_c: 37, low_c: 27, code: 3, condition: 'Overcast' };

const GEOFENCES = [
  { id: 'mu-main', name: 'Mahindra University — Main Campus', address: 'Bahadurpally, Hyderabad, Telangana', lat: 17.5234, lon: 78.3941, radius_m: 500, type: 'office', active: true },
  { id: 'mu-hyd-office', name: 'MU Corporate Office — HITEC City', address: 'Madhapur, Hyderabad', lat: 17.4474, lon: 78.3762, radius_m: 200, type: 'branch', active: true },
  { id: 'wfh-zone', name: 'Work From Home', address: 'Any location with attendance type = WFH', lat: 0, lon: 0, radius_m: 0, type: 'wfh', active: true },
  { id: 'mu-research-park', name: 'MU Research Park — Genome Valley', address: 'Turkapally, Genome Valley, Hyderabad', lat: 17.543, lon: 78.4071, radius_m: 300, type: 'branch', active: true },
];

const HOLIDAYS = [
  { name: 'Bonalu', date: '2026-07-13', type: 'Regional Holiday' },
  { name: 'Independence Day', date: '2026-08-15', type: 'National Holiday' },
  { name: 'Ganesh Chaturthi', date: '2026-09-14', type: 'Festival' },
  { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'National Holiday' },
  { name: 'Dussehra', date: '2026-10-20', type: 'Festival' },
  { name: 'Diwali', date: '2026-11-08', type: 'Festival' },
  { name: 'Christmas', date: '2026-12-25', type: 'National Holiday' },
];

const NEWS = [
  { id: 'n1', category: 'Achievements', title: 'MU Robotics Team Clinches National Title', summary: "The university's robotics squad bagged first place at the National Robo-League 2026, beating 60+ institutes with their autonomous rover.", image: 'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=800', date: '2026-06-19T13:35:46Z' },
  { id: 'n2', category: 'Research', title: 'New Centre for AI Research Inaugurated', summary: 'The School of Engineering opened a state-of-the-art AI & Data Science research centre to drive innovation in healthcare and sustainability.', image: 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=800', date: '2026-06-18T13:35:46Z' },
  { id: 'n3', category: 'Sports', title: 'Annual Sports Meet 2026 Begins This Friday', summary: 'Get ready to cheer! The inter-department sports meet kicks off with athletics, cricket, and basketball across the campus grounds.', image: 'https://images.pexels.com/photos/1205651/pexels-photo-1205651.jpeg?auto=compress&cs=tinysrgb&w=800', date: '2026-06-16T13:35:46Z' },
  { id: 'n4', category: 'Academics', title: 'Distinguished Lecture Series: The Future of Work', summary: 'Industry leaders join faculty for a week-long lecture series on AI, automation, and the evolving workplace.', image: 'https://images.pexels.com/photos/256431/pexels-photo-256431.jpeg?auto=compress&cs=tinysrgb&w=800', date: '2026-06-14T13:35:46Z' },
];

const ALERTS = [
  { id: 'alt1', title: 'Library Closure', message: 'Central library will remain closed on Feb 18 for maintenance.', type: 'info', audience: 'all', created_at: '2026-02-12T09:00:00Z' },
  { id: 'alt2', title: 'Mid-Sem Hall Tickets Released', message: 'Download your hall tickets from the Examinations module. Mid-sems start Feb 25.', type: 'academic', audience: 'all', created_at: '2026-02-11T16:30:00Z' },
];

const LEAVE_BALANCES = [
  { type: 'Casual', total: 12, used: 2, remaining: 10 },
  { type: 'Sick', total: 8, used: 1, remaining: 7 },
  { type: 'Earned', total: 18, used: 0, remaining: 18 },
];

const MESS = {
  meal: 'lunch', next_meal: 'snacks', server_time: nowIso(),
  messes: [
    { id: 'mess_it', name: 'IT Mess', location: 'Behind IT Block, Phase-1', capacity: 280, distance_m: 120, hours: { breakfast: '7:30 - 9:30 AM', lunch: '12:30 - 2:30 PM', snacks: '5:00 - 6:30 PM', dinner: '7:30 - 9:30 PM' }, menu: { breakfast: ['Idli & Sambar', 'Mini Dosa', 'Boiled Eggs', 'Upma', 'Tea / Coffee'], lunch: ['Veg Biryani', 'Dal Tadka', 'Aloo Gobi', 'Curd Rice', 'Salad', 'Gulab Jamun'], snacks: ['Veg Puff', 'Masala Chai', 'Bhel Puri'], dinner: ['Roti', 'Paneer Butter Masala', 'Jeera Rice', 'Mixed Veg', 'Ice Cream'] }, current: 153, occupancy_pct: 54.6, current_meal: 'lunch', next_meal: 'snacks', display_meal: 'lunch', today_menu: ['Veg Biryani', 'Dal Tadka', 'Aloo Gobi', 'Curd Rice', 'Salad', 'Gulab Jamun'], next_meal_hours: '5:00 - 6:30 PM', status: { label: 'Comfortable', color: '#22C55E', tone: 'good' }, wait_minutes: 0, updated_at: nowIso(), recommended: true },
    { id: 'mess_dorms', name: 'Dorms Mess', location: 'Boys Hostel Complex, Block-C', capacity: 420, distance_m: 380, hours: { breakfast: '7:00 - 9:30 AM', lunch: '12:30 - 2:30 PM', snacks: '5:00 - 6:30 PM', dinner: '7:30 - 10:00 PM' }, menu: { breakfast: ['Aloo Paratha', 'Poha', 'Omelette', 'Cornflakes & Milk', 'Tea / Coffee'], lunch: ['Chicken Curry', 'Veg Pulao', 'Dal Makhani', 'Mixed Veg', 'Roti', 'Pickle'], snacks: ['Samosa', 'Vada Pav', 'Filter Coffee'], dinner: ['Butter Roti', 'Egg Curry', 'Steamed Rice', 'Bhindi Fry', 'Sweet Lassi'] }, current: 292, occupancy_pct: 69.5, current_meal: 'lunch', next_meal: 'snacks', display_meal: 'lunch', today_menu: ['Chicken Curry', 'Veg Pulao', 'Dal Makhani', 'Mixed Veg', 'Roti', 'Pickle'], next_meal_hours: '5:00 - 6:30 PM', status: { label: 'Crowded', color: '#F59E0B', tone: 'warn' }, wait_minutes: 2, updated_at: nowIso(), recommended: false },
    { id: 'mess_phase2', name: 'Phase-2 Mess', location: 'Girls Hostel Complex, Phase-2', capacity: 320, distance_m: 540, hours: { breakfast: '7:30 - 9:30 AM', lunch: '12:30 - 2:30 PM', snacks: '5:00 - 6:30 PM', dinner: '7:30 - 9:30 PM' }, menu: { breakfast: ['Masala Dosa', 'Pongal', 'Boiled Eggs', 'Fruits', 'Tea / Coffee'], lunch: ['Hyderabadi Biryani', 'Dal Fry', 'Bhindi Masala', 'Raita', 'Salad', 'Kheer'], snacks: ['Pav Bhaji', 'Cold Coffee', 'Cookies'], dinner: ['Tandoori Roti', 'Veg Kofta', 'Steamed Rice', 'Aloo Methi', 'Gulab Jamun'] }, current: 193, occupancy_pct: 60.3, current_meal: 'lunch', next_meal: 'snacks', display_meal: 'lunch', today_menu: ['Hyderabadi Biryani', 'Dal Fry', 'Bhindi Masala', 'Raita', 'Salad', 'Kheer'], next_meal_hours: '5:00 - 6:30 PM', status: { label: 'Crowded', color: '#F59E0B', tone: 'warn' }, wait_minutes: 2, updated_at: nowIso(), recommended: false },
  ],
};

const EVENTS = [
  { id: 'evt1', title: 'TechFest 2026', category: 'Tech', date: '2026-03-15', venue: 'Main Auditorium', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600', description: 'Annual technology festival with hackathons, workshops, and guest speakers from industry leaders.', organizer: 'Computer Science Club', registered: 247 },
  { id: 'evt2', title: 'Cultural Night - Rang', category: 'Cultural', date: '2026-02-28', venue: 'Open Air Theatre', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600', description: 'An evening of music, dance, and drama performances by students.', organizer: 'Cultural Committee', registered: 412 },
  { id: 'evt3', title: 'Inter-College Sports Meet', category: 'Sports', date: '2026-03-05', venue: 'Sports Complex', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600', description: 'Compete with the best across athletics, cricket, football, and basketball.', organizer: 'Sports Council', registered: 178 },
  { id: 'evt4', title: 'Entrepreneurship Summit', category: 'Career', date: '2026-03-22', venue: 'Conference Hall A', image: 'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=600', description: 'Meet successful founders, learn about startup ecosystem, and pitch your ideas.', organizer: 'E-Cell', registered: 156 },
];

const CERTIFICATES = [
  { id: 'cert1', event: 'Hackathon Winter 2025', date: '2025-12-15', type: 'Winner', issuer: 'Computer Science Club' },
  { id: 'cert2', event: 'Cultural Fest 2025', date: '2025-10-20', type: 'Participant', issuer: 'Cultural Committee' },
  { id: 'cert3', event: 'Coding Marathon 2025', date: '2025-09-12', type: 'Top 10', issuer: 'Tech Club' },
];

const BOOKS = [
  { id: 'bk1', title: 'Introduction to Algorithms', author: 'Cormen, Leiserson', isbn: '9780262033848', available: true, category: 'Computer Science', cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400' },
  { id: 'bk2', title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', available: false, category: 'Computer Science', cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400' },
  { id: 'bk3', title: 'The Lean Startup', author: 'Eric Ries', isbn: '9780307887894', available: true, category: 'Business', cover: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400' },
  { id: 'bk4', title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', available: true, category: 'Self-Help', cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400' },
  { id: 'bk5', title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316097', available: true, category: 'History', cover: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=400' },
  { id: 'bk6', title: 'Deep Learning', author: 'Ian Goodfellow', isbn: '9780262035613', available: false, category: 'Computer Science', cover: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400' },
];

const WALLET = { balance: 1240, reward_points: 320, transactions: [
  { id: 't1', type: 'credit', amount: 500, description: 'Monthly allowance', date: '2026-06-01T09:00:00Z' },
  { id: 't2', type: 'debit', amount: 80, description: 'Cafeteria - Lunch', date: '2026-06-10T13:30:00Z' },
  { id: 't3', type: 'debit', amount: 50, description: 'Library print', date: '2026-06-08T11:15:00Z' },
  { id: 't4', type: 'credit', amount: 100, description: 'Reward points redeemed', date: '2026-06-05T16:00:00Z' },
] };

const REWARDS = [
  { id: 'r1', title: 'University Hoodie', points: 500, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400', stock: 25 },
  { id: 'r2', title: 'Coffee Coupon (5x)', points: 150, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', stock: 100 },
  { id: 'r3', title: 'Movie Pass', points: 300, image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400', stock: 50 },
  { id: 'r4', title: 'Premium Notebook', points: 200, image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400', stock: 75 },
];

const GATE_LOGS = [
  { id: 'g1', type: 'entry', gate: 'Main Gate', time: '2026-06-19T08:42:00Z', method: 'RFID' },
  { id: 'g2', type: 'exit', gate: 'Main Gate', time: '2026-06-18T18:15:00Z', method: 'RFID' },
  { id: 'g3', type: 'entry', gate: 'Main Gate', time: '2026-06-18T08:30:00Z', method: 'RFID' },
];

const HALL_TICKET = { student_name: STAFF_USER.name, student_id: 'MUCS2722', department: 'Warden', exam_name: 'Mid Semester Examination - Spring 2026', exam_dates: 'Feb 25 - Mar 5, 2026', ticket_no: 'HT-EC4621', qr_data: 'HALLTICKET|mock|MIDSEM-2026', subjects: [
  { code: 'CS301', name: 'Data Structures', date: '2026-02-25', time: '10:00 AM', room: 'Hall A-201', seat: 'A-12' },
  { code: 'CS302', name: 'Operating Systems', date: '2026-02-27', time: '10:00 AM', room: 'Hall B-105', seat: 'B-08' },
  { code: 'CS303', name: 'Database Systems', date: '2026-03-01', time: '02:00 PM', room: 'Hall A-201', seat: 'A-12' },
], instructions: ['Carry this hall ticket and college ID at all times during exam.', 'Reach the exam hall 30 minutes before reporting time.', 'Electronic devices including phones are strictly prohibited.'] };

const RESULTS = { semester: 'Fall 2025', gpa: 8.7, total_credits: 24, subjects: [
  { code: 'CS201', name: 'Discrete Math', grade: 'A', credits: 4 },
  { code: 'CS202', name: 'Computer Architecture', grade: 'A+', credits: 4 },
  { code: 'CS203', name: 'Programming Lab', grade: 'A', credits: 4 },
  { code: 'CS204', name: 'Linear Algebra', grade: 'B+', credits: 4 },
  { code: 'CS205', name: 'Communication Skills', grade: 'A', credits: 2 },
] };

// Static recent attendance history (most-recent first).
function buildHistory() {
  const out: any[] = [];
  const base = new Date();
  for (let i = 1; i <= 10; i++) {
    const d = new Date(base); d.setDate(base.getDate() - i);
    const day = d.toISOString().slice(0, 10);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends
    out.push({ id: `h-in-${i}`, type: 'in', attendance_type: 'office', geofence_name: 'ECSOE Building', inside_geofence: true, face_passed: true, face_score: 0.99, accepted: true, status: 'present', timestamp: `${day}T03:55:00+00:00`, source: 'dalmart', on_campus: true });
    out.push({ id: `h-out-${i}`, type: 'out', attendance_type: 'office', geofence_name: 'ECSOE Building', inside_geofence: true, face_passed: true, face_score: 0.99, accepted: true, status: null, timestamp: `${day}T12:35:00+00:00`, source: 'dalmart', on_campus: true });
  }
  return out;
}

function buildStats() {
  return { month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }), working_days_so_far: 15, present_days: 9, late_days: 1, half_days: 0, wfh_days: 2, absent_days: 3, attendance_pct: 80, total_work_hours: 76.5, avg_work_hours: 8.5, failed_face_verifications: 0, spoof_attempts: 0, daily: [] };
}

// ---------- dalmart attendance (mocked success responses) ----------
export async function dalmartGeoValidate(qid: string, _lat: number, _long: number, status: 'IN' | 'OUT'): Promise<any> {
  await delay(500);
  return {
    success: true,
    message: 'Geo validation successful',
    data: {
      attendance: { qid, venue_id: 2, geo_validation: true, status },
      status: { current_state: 'PENDING_FACE', geo_validation: true, venue_id: 2 },
    },
  };
}

export async function dalmartFaceValidate(qid: string, _photo: { uri?: string | null; base64?: string | null }): Promise<any> {
  await delay(700);
  const ts = nowIso();
  return {
    success: true,
    message: 'Face recognition completed',
    data: {
      attendance: { qid, venue_id: 2, geo_validation: true, face_recognition: true, face_recognition_marked_at: ts, status: 'IN', mode: 'Manual' },
      status: { current_state: 'CHECKED_IN', current_status: 'IN', geo_validation: true, face_recognition: true, face_recognition_marked_at: ts, venue_id: 2 },
      face_match: { matched: true, image_id: qid, confidence: 99.2 },
    },
  };
}

// ---------- the mock API (mirrors src/api.ts `api`) ----------
export const mockApi = {
  // auth
  login: async (email: string, _password: string, _role?: string) => {
    await delay(); const user = userForEmail(email); await setStore(K.user, user);
    return { token: `mock-token-${user.id}`, user };
  },
  otpRequest: async (phone: string) => {
    await delay(); return { ok: true, phone, demo_otp: '123456', message: 'OTP sent (demo: 123456)' };
  },
  otpVerify: async (phone: string, _code: string) => {
    await delay(); const user = userForPhone(phone); await setStore(K.user, user);
    return { token: `mock-token-${user.id}`, user };
  },
  microsoft: async (email?: string) => {
    await delay(); const user = userForEmail(email || STAFF_USER.email); await setStore(K.user, user);
    return { token: `mock-token-${user.id}`, user };
  },
  me: async (): Promise<any> => { await delay(60); return getStore(K.user, clone(STAFF_USER)); },
  demoAccounts: async () => { await delay(); return clone(DEMO_ACCOUNTS); },

  // exams
  hallTicket: async () => { await delay(); return clone(HALL_TICKET); },
  examAttendance: async () => { await delay(); return []; },
  results: async () => { await delay(); return clone(RESULTS); },

  // visitors
  visitorRequest: async (data: any) => {
    await delay(); const list = await getStore<any[]>(K.visitors, []);
    const rec = { id: `v${Date.now()}`, status: 'Pending', created_at: nowIso(), ...data };
    list.unshift(rec); await setStore(K.visitors, list); return rec;
  },
  visitorList: async () => { await delay(); return getStore<any[]>(K.visitors, []); },

  // attendance
  attendanceCheck: async (data: any) => { await delay(); return { accepted: true, ...data }; },
  attendanceHistory: async () => { await delay(); return buildHistory(); },
  attendanceToday: async () => { await delay(); return { date: todayKey(), check_in: null, check_out: null, events: [], work_seconds: 0, status: 'absent' }; },
  attendanceStats: async () => { await delay(); return buildStats(); },
  attendanceGeofences: async () => { await delay(); return clone(GEOFENCES); },
  geoValidate: async (_lat: number, _long: number, _status: 'IN' | 'OUT') => {
    await delay(); return { success: true, message: null, venue_id: 2, venue_name: 'ECSOE Building', attendance_id: null, current_state: 'PENDING_FACE' };
  },
  attendanceRecordDalmart: async (body: any) => { await delay(); return { accepted: true, ...body }; },

  // attendance timeline (persisted locally)
  timelineRecord: async (body: { status: 'IN' | 'OUT'; marked_at?: string; venue_name?: string; venue_id?: number; confidence?: number; response?: any }) => {
    await delay();
    const key = K.timeline(todayKey());
    const t = await getStore<any>(key, { check_in_at: null, check_out_at: null, venue: null, events: [] });
    const ts = body.marked_at || nowIso();
    if (body.status === 'IN') t.check_in_at = ts; else t.check_out_at = ts;
    if (body.venue_name) t.venue = body.venue_name;
    t.events.push({ type: body.status.toLowerCase(), timestamp: ts, geofence_name: body.venue_name, confidence: body.confidence, raw_response: body.response });
    await setStore(key, t);
    return { ...body, timestamp: ts };
  },
  timelineToday: async () => {
    await delay();
    const key = K.timeline(todayKey());
    const t = await getStore<any>(key, { check_in_at: null, check_out_at: null, venue: null, events: [] });
    let work_seconds = 0;
    if (t.check_in_at && t.check_out_at) {
      work_seconds = Math.max(0, Math.floor((new Date(t.check_out_at).getTime() - new Date(t.check_in_at).getTime()) / 1000));
    }
    return { date: todayKey(), check_in_at: t.check_in_at, check_out_at: t.check_out_at, venue: t.venue, work_seconds, events: t.events };
  },
  attendanceAdminToday: async () => {
    await delay();
    return { summary: { total: 25, present: 18, absent: 5, late: 2, remote: 2 }, staff: [
      { id: 's1', name: 'Dr. Rajesh Kumar', department: 'Faculty - Computer Science', employee_id: 'MU-FAC1023', status: 'present', attendance_type: 'office', check_in: `${todayKey()}T03:55:00+00:00`, check_out: null, geofence_name: 'ECSOE Building' },
      { id: 's2', name: 'Mrs. Anita Nair', department: 'Library', employee_id: 'MU-LIB204', status: 'late', attendance_type: 'office', check_in: `${todayKey()}T05:10:00+00:00`, check_out: null, geofence_name: 'ECSOE Building' },
      { id: 's3', name: 'Mr. Ramesh Kale', department: 'Security', employee_id: 'MU-SEC011', status: 'absent', attendance_type: '—', check_in: null, check_out: null, geofence_name: null },
    ] };
  },

  // library
  books: async (_q?: string) => { await delay(); return clone(BOOKS); },
  issueBook: async (id: string) => {
    await delay(); const list = await getStore<string[]>(K.issues, []);
    if (!list.includes(id)) list.push(id); await setStore(K.issues, list);
    const bk = BOOKS.find((b) => b.id === id); return { ok: true, book: bk };
  },
  myIssues: async () => {
    await delay(); const ids = await getStore<string[]>(K.issues, []);
    return BOOKS.filter((b) => ids.includes(b.id)).map((b) => ({ ...b, due_date: '2026-07-15', issued_at: nowIso() }));
  },

  // hostel
  myRoom: async () => { await delay(); return { hostel: '—', block: '—', room: '—', roommates: [] }; },
  createComplaint: async (d: any) => {
    await delay(); const list = await getStore<any[]>(K.complaints, []);
    const rec = { id: `c${Date.now()}`, status: 'Open', created_at: nowIso(), ...d };
    list.unshift(rec); await setStore(K.complaints, list); return rec;
  },
  complaints: async () => { await delay(); return getStore<any[]>(K.complaints, []); },

  // events
  events: async () => { await delay(); return clone(EVENTS); },
  registerEvent: async (event_id: string) => {
    await delay(); const list = await getStore<string[]>(K.eventRegs, []);
    if (!list.includes(event_id)) list.push(event_id); await setStore(K.eventRegs, list);
    return { ok: true, event_id };
  },
  myRegistrations: async () => {
    await delay(); const ids = await getStore<string[]>(K.eventRegs, []);
    return EVENTS.filter((e) => ids.includes(e.id));
  },
  certificates: async () => { await delay(); return clone(CERTIFICATES); },

  // communication
  alerts: async () => { await delay(); return clone(ALERTS); },
  sos: async (data: any) => { await delay(); return { ok: true, id: `sos${Date.now()}`, ...data }; },
  activeSos: async () => { await delay(); return []; },

  // parcels
  parcels: async () => { await delay(); return []; },
  collectParcel: async (id: string) => { await delay(); return { ok: true, id }; },

  // wallet
  wallet: async () => { await delay(); return clone(WALLET); },
  rewardsStore: async () => { await delay(); return clone(REWARDS); },

  // gate
  gateLogs: async () => { await delay(); return clone(GATE_LOGS); },
  myPass: async () => {
    await delay(); const u = await getStore<any>(K.user, STAFF_USER);
    return { name: u.name, id_no: u.employee_id || u.student_id || u.qid, role: u.role, department: u.department, qr_data: `GATEPASS|${u.id}|${u.role}`, rfid_tag: `RFID-${String(u.id).slice(0, 8).toUpperCase()}`, valid_until: '2026-12-31' };
  },

  // admin
  adminDashboard: async () => { await delay(); return { total_staff: 25, present_today: 18, on_leave: 3, pending_approvals: 4, attendance_pct: 80 }; },
  adminEmployees: async (_params?: any) => {
    await delay();
    return [
      { id: 'e1', name: 'Dr. Rajesh Kumar', role: 'staff', department: 'Faculty - Computer Science', employee_id: 'MU-FAC1023', email: 'faculty@mahindrauniversity.edu.in', status: 'active' },
      { id: 'e2', name: 'Mrs. Anita Nair', role: 'staff', department: 'Library', employee_id: 'MU-LIB204', email: 'librarian@mahindrauniversity.edu.in', status: 'active' },
      { id: 'e3', name: 'Mr. Ramesh Kale', role: 'staff', department: 'Security', employee_id: 'MU-SEC011', email: 'security@mahindrauniversity.edu.in', status: 'active' },
    ];
  },
  adminAttendanceTrend: async () => { await delay(); return [
    { date: 'Mon', present: 20 }, { date: 'Tue', present: 22 }, { date: 'Wed', present: 19 }, { date: 'Thu', present: 21 }, { date: 'Fri', present: 18 },
  ]; },
  adminAttendanceByDept: async () => { await delay(); return [
    { department: 'Computer Science', present: 8, total: 10 }, { department: 'ECE', present: 6, total: 8 }, { department: 'Library', present: 2, total: 3 },
  ]; },
  adminCreateGeofence: async (data: any) => { await delay(); return { id: `gf${Date.now()}`, ...data }; },
  adminUpdateGeofence: async (id: string, data: any) => { await delay(); return { id, ...data }; },
  adminDeleteGeofence: async (id: string) => { await delay(); return { ok: true, id }; },
  adminMonthlyReport: async (_month?: string) => { await delay(); return { month: 'June 2026', rows: [] }; },

  // mess
  messList: async (_demo?: string) => { await delay(); return { ...clone(MESS), server_time: nowIso() }; },

  // weather
  weather: async () => { await delay(); return clone(WEATHER); },

  // leave
  leaveSummary: async () => {
    await delay(); const requests = await getStore<any[]>(K.leave, []);
    return { balances: clone(LEAVE_BALANCES), requests };
  },
  leaveApply: async (payload: { type: string; from_date: string; to_date: string; reason: string }) => {
    await delay(); const list = await getStore<any[]>(K.leave, []);
    const rec = { id: `lv${Date.now()}`, status: 'Pending', applied_at: nowIso(), ...payload };
    list.unshift(rec); await setStore(K.leave, list); return rec;
  },

  // holidays & news
  holidays: async () => { await delay(); return { upcoming: clone(HOLIDAYS), holidays: clone(HOLIDAYS) }; },
  news: async () => { await delay(); return clone(NEWS); },
};
