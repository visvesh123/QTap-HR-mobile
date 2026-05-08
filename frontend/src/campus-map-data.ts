// Stylized Mahindra University campus map (illustrative — not to scale).
// Canvas: 720 x 1240 (designed for vertical scroll on phones)
export const MAP_W = 720;
export const MAP_H = 1240;

export type Category =
  | 'gate' | 'admin' | 'academic' | 'library'
  | 'mess' | 'hostel' | 'sports' | 'auditorium'
  | 'medical' | 'parking' | 'recreation';

export const CATEGORY_META: Record<Category, { label: string; color: string; icon: string; iconLib: 'mci' | 'ion' }> = {
  gate:        { label: 'Gate',        color: '#0F766E', icon: 'gate-open',                  iconLib: 'mci' },
  admin:       { label: 'Admin',       color: '#7D3ECF', icon: 'office-building-cog-outline',iconLib: 'mci' },
  academic:    { label: 'Academic',    color: '#3B82F6', icon: 'school-outline',             iconLib: 'ion' },
  library:     { label: 'Library',     color: '#0EA5E9', icon: 'library-outline',            iconLib: 'ion' },
  mess:        { label: 'Mess',        color: '#16A34A', icon: 'silverware-fork-knife',      iconLib: 'mci' },
  hostel:      { label: 'Hostel',      color: '#F59E0B', icon: 'bed-outline',                iconLib: 'ion' },
  sports:      { label: 'Sports',      color: '#EF4444', icon: 'basketball',                 iconLib: 'mci' },
  auditorium:  { label: 'Auditorium',  color: '#EC4899', icon: 'theater',                    iconLib: 'mci' },
  medical:     { label: 'Medical',     color: '#DC2626', icon: 'medical-bag',                iconLib: 'mci' },
  parking:     { label: 'Parking',     color: '#475569', icon: 'parking',                    iconLib: 'mci' },
  recreation:  { label: 'Recreation',  color: '#8B5CF6', icon: 'pine-tree',                  iconLib: 'mci' },
};

export interface Building {
  id: string;
  name: string;
  short?: string;
  category: Category;
  rect: { x: number; y: number; w: number; h: number; rx?: number };
  pin: { x: number; y: number };
  description?: string;
  // Path from "Main Gate" to this building (waypoints follow the road grid)
  route: [number, number][];
}

// Major intersections for road/route reference
//   gate (360, 1180)  → entry stem (360, 1080)
//   south loop:  L (160, 1080) ← center (360, 1080) → R (560, 1080)
//   mid loop:    L (160, 660)  ← center (360, 660)  → R (560, 660)
//   north loop:  L (160, 260)  ← center (360, 260)  → R (560, 260)
//
const G_ENTRY: [number, number]   = [360, 1180];
const SC: [number, number]        = [360, 1080]; // south center
const SL: [number, number]        = [160, 1080];
const SR: [number, number]        = [560, 1080];
const MC: [number, number]        = [360, 660];
const ML: [number, number]        = [160, 660];
const MR: [number, number]        = [560, 660];
const NC: [number, number]        = [360, 260];
const NL: [number, number]        = [160, 260];
const NR: [number, number]        = [560, 260];

export const ROAD_LINES: [number, number][][] = [
  // entry
  [G_ENTRY, SC],
  // south loop
  [SL, SC, SR],
  // verticals
  [SL, ML, NL],
  [SC, MC, NC],
  [SR, MR, NR],
  // mid loop
  [ML, MC, MR],
  // north loop
  [NL, NC, NR],
];

export const BUILDINGS: Building[] = [
  {
    id: 'main-gate',
    name: 'Main Gate',
    short: 'Gate',
    category: 'gate',
    rect: { x: 300, y: 1180, w: 120, h: 36, rx: 6 },
    pin: { x: 360, y: 1198 },
    description: 'Primary entry with security check & RFID gate.',
    route: [G_ENTRY],
  },
  {
    id: 'parking',
    name: 'Visitor Parking',
    short: 'Parking',
    category: 'parking',
    rect: { x: 460, y: 1100, w: 130, h: 70, rx: 8 },
    pin: { x: 525, y: 1135 },
    description: '2-wheeler & 4-wheeler parking near main gate.',
    route: [G_ENTRY, SC, SR, [560, 1110]],
  },
  {
    id: 'reception',
    name: 'Reception & Visitor Mgmt',
    short: 'Reception',
    category: 'admin',
    rect: { x: 130, y: 1100, w: 150, h: 70, rx: 8 },
    pin: { x: 205, y: 1135 },
    description: 'Visitor pass, lost & found, info desk.',
    route: [G_ENTRY, SC, SL, [160, 1110]],
  },
  {
    id: 'admin-block',
    name: 'Admin Block',
    short: 'Admin',
    category: 'admin',
    rect: { x: 295, y: 940, w: 130, h: 90, rx: 10 },
    pin: { x: 360, y: 985 },
    description: 'Registrar, Dean Office, Examination Cell.',
    route: [G_ENTRY, SC, [360, 985]],
  },
  {
    id: 'it-block',
    name: 'IT Academic Block',
    short: 'IT Block',
    category: 'academic',
    rect: { x: 60, y: 720, w: 180, h: 200, rx: 14 },
    pin: { x: 150, y: 820 },
    description: 'CSE, AI/ML, Cyber Security departments.',
    route: [G_ENTRY, SC, SL, ML, [150, 820]],
  },
  {
    id: 'ecm-block',
    name: 'ECE & Mech Block',
    short: 'ECE/Mech',
    category: 'academic',
    rect: { x: 480, y: 720, w: 180, h: 200, rx: 14 },
    pin: { x: 570, y: 820 },
    description: 'Electronics, Communication & Mechanical.',
    route: [G_ENTRY, SC, SR, MR, [570, 820]],
  },
  {
    id: 'library',
    name: 'Central Library',
    short: 'Library',
    category: 'library',
    rect: { x: 285, y: 740, w: 150, h: 150, rx: 14 },
    pin: { x: 360, y: 815 },
    description: 'Books, journals, digital resources, Koha LMS.',
    route: [G_ENTRY, SC, [360, 815]],
  },
  {
    id: 'it-mess',
    name: 'IT Mess',
    short: 'IT Mess',
    category: 'mess',
    rect: { x: 250, y: 720, w: 60, h: 60, rx: 10 },
    pin: { x: 280, y: 750 },
    description: 'Capacity 280. Closest to IT block.',
    route: [G_ENTRY, SC, [280, 750]],
  },
  {
    id: 'boys-hostel',
    name: 'Boys Hostel (Dorms)',
    short: 'Boys Hostel',
    category: 'hostel',
    rect: { x: 60, y: 410, w: 180, h: 220, rx: 14 },
    pin: { x: 150, y: 520 },
    description: 'Block A, B, C — capacity 1500+ residents.',
    route: [G_ENTRY, SC, SL, ML, [150, 520]],
  },
  {
    id: 'girls-hostel',
    name: 'Girls Hostel (Phase-2)',
    short: 'Girls Hostel',
    category: 'hostel',
    rect: { x: 480, y: 410, w: 180, h: 220, rx: 14 },
    pin: { x: 570, y: 520 },
    description: 'Phase-2 hostel — separate gated entry.',
    route: [G_ENTRY, SC, SR, MR, [570, 520]],
  },
  {
    id: 'dorms-mess',
    name: 'Dorms Mess',
    short: 'Dorms Mess',
    category: 'mess',
    rect: { x: 245, y: 480, w: 70, h: 60, rx: 10 },
    pin: { x: 280, y: 510 },
    description: 'Capacity 420. Largest mess on campus.',
    route: [G_ENTRY, SC, MC, [280, 510]],
  },
  {
    id: 'phase2-mess',
    name: 'Phase-2 Mess',
    short: 'Phase-2 Mess',
    category: 'mess',
    rect: { x: 405, y: 480, w: 70, h: 60, rx: 10 },
    pin: { x: 440, y: 510 },
    description: 'Capacity 320. Serves Phase-2 hostels.',
    route: [G_ENTRY, SC, MC, [440, 510]],
  },
  {
    id: 'sports',
    name: 'Sports Complex',
    short: 'Sports',
    category: 'sports',
    rect: { x: 60, y: 100, w: 220, h: 140, rx: 14 },
    pin: { x: 170, y: 170 },
    description: 'Indoor + outdoor courts, gym, swimming pool.',
    route: [G_ENTRY, SC, MC, NC, NL, [170, 260]],
  },
  {
    id: 'auditorium',
    name: 'Main Auditorium',
    short: 'Auditorium',
    category: 'auditorium',
    rect: { x: 295, y: 130, w: 150, h: 110, rx: 14 },
    pin: { x: 370, y: 185 },
    description: 'Convocation hall, seats 800. Q-Tap demo venue.',
    route: [G_ENTRY, SC, MC, NC, [370, 260]],
  },
  {
    id: 'medical',
    name: 'Medical Center',
    short: 'Medical',
    category: 'medical',
    rect: { x: 480, y: 130, w: 180, h: 100, rx: 14 },
    pin: { x: 570, y: 180 },
    description: '24×7 first aid, doctor on call, ambulance.',
    route: [G_ENTRY, SC, MC, NC, NR, [570, 260]],
  },
  {
    id: 'amphitheater',
    name: 'Amphitheater',
    short: 'Amphi',
    category: 'recreation',
    rect: { x: 285, y: 290, w: 150, h: 70, rx: 35 },
    pin: { x: 360, y: 325 },
    description: 'Open-air amphitheater for events & cultural nights.',
    route: [G_ENTRY, SC, MC, [360, 325]],
  },
];

export const YOU_ARE_HERE: [number, number] = [360, 1198]; // at the gate

// Quick-access helpers
export function findById(id: string) {
  return BUILDINGS.find((b) => b.id === id);
}
