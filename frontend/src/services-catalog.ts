// Catalog of services per role. Used in Home and Services screens.
import { colors } from './theme';

export interface ServiceItem {
  key: string;
  label: string;
  icon: string;
  iconLib: 'ion' | 'mci';
  color: string;
  route: string;
  roles: ('student' | 'staff' | 'admin')[];
  departments?: string[]; // restrict by department for staff
}

export const ALL_SERVICES: ServiceItem[] = [
  // Academics
  { key: 'examinations', label: 'Exams', icon: 'school-outline', iconLib: 'ion', color: '#7D3ECF', route: '/modules/examinations', roles: ['student', 'staff', 'admin'] },
  { key: 'library', label: 'Library', icon: 'library-outline', iconLib: 'ion', color: '#0EA5E9', route: '/modules/library', roles: ['student', 'staff', 'admin'] },
  { key: 'results', label: 'Results', icon: 'ribbon-outline', iconLib: 'ion', color: '#10B981', route: '/modules/results', roles: ['student'] },

  // Campus Life
  { key: 'hostel', label: 'Hostel', icon: 'bed-outline', iconLib: 'ion', color: '#F59E0B', route: '/modules/hostel', roles: ['student', 'staff', 'admin'] },
  { key: 'mess', label: 'Mess', icon: 'silverware-fork-knife', iconLib: 'mci', color: '#16A34A', route: '/modules/mess', roles: ['student', 'staff', 'admin'] },
  { key: 'events', label: 'Events', icon: 'ticket-confirmation-outline', iconLib: 'mci', color: '#EC4899', route: '/modules/events', roles: ['student', 'staff', 'admin'] },
  { key: 'certificates', label: 'Certificates', icon: 'certificate-outline', iconLib: 'mci', color: '#8B5CF6', route: '/modules/certificates', roles: ['student'] },

  // Services
  { key: 'visitor', label: 'Visitors', icon: 'badge-account-horizontal-outline', iconLib: 'mci', color: '#3B82F6', route: '/modules/visitor', roles: ['staff', 'admin'] },
  { key: 'attendance', label: 'Attendance', icon: 'map-marker-account-outline', iconLib: 'mci', color: '#06B6D4', route: '/modules/attendance', roles: ['staff'] },
  { key: 'parcel', label: 'Parcels', icon: 'package-variant-closed', iconLib: 'mci', color: '#F97316', route: '/modules/parcel', roles: ['student', 'staff'] },
  { key: 'gate', label: 'Gate Pass', icon: 'gate-open', iconLib: 'mci', color: '#14B8A6', route: '/modules/gate', roles: ['student', 'staff', 'admin'] },

  // Communication
  { key: 'alerts', label: 'Alerts', icon: 'bullhorn-outline', iconLib: 'mci', color: '#6366F1', route: '/(tabs)/alerts', roles: ['student', 'staff', 'admin'] },
  { key: 'sos', label: 'SOS', icon: 'shield-alert-outline', iconLib: 'mci', color: '#EF4444', route: '/modules/sos', roles: ['student', 'staff', 'admin'] },

  // Admin only
  { key: 'admin-panel', label: 'Admin Panel', icon: 'view-dashboard-outline', iconLib: 'mci', color: '#7D3ECF', route: '/modules/admin', roles: ['admin'] },
  { key: 'gate-logs', label: 'Gate Logs', icon: 'security', iconLib: 'mci', color: '#0F766E', route: '/modules/gate-logs', roles: ['admin'], departments: ['Security'] },
];

export function servicesForUser(role: string, department?: string) {
  return ALL_SERVICES.filter((s) => {
    if (!s.roles.includes(role as any)) return false;
    if (s.departments && department && !s.departments.includes(department)) {
      // For staff with specific dept restrictions
      if (role === 'staff' && !s.departments.includes(department)) return false;
    }
    return true;
  });
}

export const SECTIONED_SERVICES = (role: string, department?: string) => {
  const all = servicesForUser(role, department);
  const inSection = (keys: string[]) => all.filter((s) => keys.includes(s.key));
  return [
    { title: 'Academics', items: inSection(['examinations', 'library', 'results']) },
    { title: 'Campus Life', items: inSection(['hostel', 'mess', 'events', 'certificates']) },
    { title: 'Campus Services', items: inSection(['visitor', 'attendance', 'parcel', 'gate']) },
    { title: 'Communication', items: inSection(['alerts', 'sos']) },
    { title: 'Administration', items: inSection(['admin-panel', 'gate-logs']) },
  ].filter((s) => s.items.length > 0);
};
