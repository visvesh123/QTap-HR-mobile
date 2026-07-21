// Catalog of services — each UI component has one RBAC key; service tiles derive visibility from child permissions.
export type UserRole = 'student' | 'staff' | 'admin';

export interface ServiceItem {
  key: string;
  label: string;
  icon: string;
  iconLib: 'ion' | 'mci';
  color: string;
  route: string;
  roles: UserRole[];
  /**
   * All component permissions inside this service (no tile-level key).
   * Tile is visible when the user has ANY of these from login `data.rbac`.
   */
  childPermissions?: readonly string[];
  departments?: string[];
}

/** All RBAC keys — one string per component. Extend to match your DB. */
export const RBAC = {
  // Attendance module (Mark Attendance screen)
  CHECK_IN: 'CHECK_IN.CREATE_MARK_ATTENDANCE_MOBILE_SCREEN',
  CHECK_OUT: 'CHECK_OUT.CREATE_MARK_ATTENDANCE_MOBILE_SCREEN',
  VIEW_ATTENDANCE_TIMELINE: 'TIMELINE.VIEW_MARK_ATTENDANCE_MOBILE_SCREEN',
  VIEW_ATTENDANCE_LOCATIONS: 'LOCATIONS.VIEW_MARK_ATTENDANCE_MOBILE_SCREEN',
  GEO_VALIDATE: 'GEO_VALIDATE_MOBILE_BUTTON',
  FACE_VALIDATE: 'FACE_VALIDATE_MOBILE_BUTTON',
  VIEW_ATTENDANCE: 'VIEW_ATTENDANCE_MOBILE_PAGE',
  // Leave
  APPLY_LEAVE: 'APPLY_LEAVE_MOBILE_BUTTON',
  APPROVE_LEAVE: 'APPROVE_LEAVE_HR_ADMIN_MOBILE_BUTTON',
  VIEW_LEAVE: 'VIEW_LEAVE_MOBILE_PAGE',
  // Visitor
  CREATE_VISITOR: 'CREATE_VISITOR_MOBILE_BUTTON',
  APPROVE_VISITOR: 'APPROVE_VISITOR_MOBILE_BUTTON',
  VIEW_VISITOR: 'VIEW_VISITOR_MOBILE_PAGE',
  // Mess
  VIEW_MESS_MENU: 'VIEW_MESS_MENU_MOBILE_PAGE',
  MESS_LIVE: 'MESS_LIVE_MOBILE_WIDGET',
  // Examinations
  VIEW_HALL_TICKET: 'VIEW_HALL_TICKET_MOBILE_BUTTON',
  VIEW_EXAMINATIONS: 'VIEW_EXAMINATIONS_MOBILE_PAGE',
  // Admin
  VIEW_ADMIN_DASHBOARD: 'VIEW_ADMIN_DASHBOARD_MOBILE',
  OPEN_HR_PORTAL: 'OPEN_HR_PORTAL_MOBILE_BUTTON',
  OPEN_ADMIN_CONSOLE: 'OPEN_ADMIN_CONSOLE_MOBILE_BUTTON',
  // Home widgets
  VIEW_HOLIDAY: 'UPCOMINGHOLIDAY.VIEW_HOLIDAY_CALENDER_MOBILE_SCREEN',
  VIEW_CAMPUS_NEWS: 'LATESTNEWS.VIEW_NEWS_MOBILE_SCREEN',
  // Tickets
  CREATE_TICKET: 'TICKET.CREATE_TICKETING_MOBILE_SCREEN',
  VIEW_TICKETS: 'TICKETS.VIEW_TICKETING_MOBILE_SCREEN',
} as const;

/** Child component permissions grouped by service — used for tile visibility. */
export const SERVICE_CHILDREN = {
  attendance: [
    RBAC.CHECK_IN,
    RBAC.CHECK_OUT,
    RBAC.VIEW_ATTENDANCE_TIMELINE,
    RBAC.VIEW_ATTENDANCE_LOCATIONS,
    RBAC.GEO_VALIDATE,
    RBAC.FACE_VALIDATE,
    RBAC.VIEW_ATTENDANCE,
  ],
  leave: [RBAC.APPLY_LEAVE, RBAC.APPROVE_LEAVE, RBAC.VIEW_LEAVE],
  visitor: [RBAC.CREATE_VISITOR, RBAC.APPROVE_VISITOR, RBAC.VIEW_VISITOR],
  mess: [RBAC.VIEW_MESS_MENU, RBAC.MESS_LIVE],
  examinations: [RBAC.VIEW_HALL_TICKET, RBAC.VIEW_EXAMINATIONS],
  admin: [RBAC.VIEW_ADMIN_DASHBOARD, RBAC.OPEN_HR_PORTAL, RBAC.OPEN_ADMIN_CONSOLE],
  library: ['VIEW_LIBRARY_MOBILE_PAGE', 'BORROW_BOOK_MOBILE_BUTTON'],
  results: ['VIEW_RESULTS_MOBILE_PAGE'],
  hostel: ['VIEW_HOSTEL_MOBILE_PAGE', 'APPLY_HOSTEL_LEAVE_MOBILE_BUTTON'],
  events: ['VIEW_EVENTS_MOBILE_PAGE', 'REGISTER_EVENT_MOBILE_BUTTON'],
  certificates: ['VIEW_CERTIFICATES_MOBILE_PAGE', 'REQUEST_CERTIFICATE_MOBILE_BUTTON'],
  campusMap: ['VIEW_CAMPUS_MAP_MOBILE_PAGE'],
  parcel: ['VIEW_PARCEL_MOBILE_PAGE', 'TRACK_PARCEL_MOBILE_BUTTON'],
  gate: ['VIEW_GATE_PASS_MOBILE_PAGE', 'APPLY_GATE_PASS_MOBILE_BUTTON'],
  alerts: ['VIEW_ALERTS_MOBILE_PAGE'],
  gateLogs: ['VIEW_GATE_LOGS_MOBILE_PAGE'],
  tickets: [RBAC.CREATE_TICKET, RBAC.VIEW_TICKETS],
} as const;

/** @deprecated Use RBAC */
export const ATTENDANCE_ACTIONS = {
  checkIn: RBAC.CHECK_IN,
  checkOut: RBAC.CHECK_OUT,
  timeline: RBAC.VIEW_ATTENDANCE_TIMELINE,
  locations: RBAC.VIEW_ATTENDANCE_LOCATIONS,
  geo: RBAC.GEO_VALIDATE,
  face: RBAC.FACE_VALIDATE,
  view: RBAC.VIEW_ATTENDANCE,
} as const;

/** @deprecated Use RBAC */
export const HOME_COMPONENTS = {
  staffCheckIn: RBAC.CHECK_IN,
  studentHallTicket: RBAC.VIEW_HALL_TICKET,
  adminDashboard: RBAC.VIEW_ADMIN_DASHBOARD,
  messLive: RBAC.MESS_LIVE,
  holiday: RBAC.VIEW_HOLIDAY,
  campusNews: RBAC.VIEW_CAMPUS_NEWS,
} as const;

export const ALL_SERVICES: ServiceItem[] = [
  { key: 'examinations', label: 'Exams', icon: 'school-outline', iconLib: 'ion', color: '#7D3ECF', route: '/modules/examinations', roles: ['student', 'staff', 'admin'], childPermissions: SERVICE_CHILDREN.examinations },
  { key: 'library', label: 'Library', icon: 'library-outline', iconLib: 'ion', color: '#0EA5E9', route: '/modules/library', roles: ['student', 'staff', 'admin'], childPermissions: SERVICE_CHILDREN.library },
  { key: 'results', label: 'Results', icon: 'ribbon-outline', iconLib: 'ion', color: '#10B981', route: '/modules/results', roles: ['student'], childPermissions: SERVICE_CHILDREN.results },
  { key: 'hostel', label: 'Hostel', icon: 'bed-outline', iconLib: 'ion', color: '#F59E0B', route: '/modules/hostel', roles: ['student', 'staff', 'admin'], childPermissions: SERVICE_CHILDREN.hostel },
  { key: 'mess', label: 'Mess', icon: 'silverware-fork-knife', iconLib: 'mci', color: '#16A34A', route: '/modules/mess', roles: ['student', 'staff', 'admin'], childPermissions: SERVICE_CHILDREN.mess },
  { key: 'events', label: 'Events', icon: 'ticket-confirmation-outline', iconLib: 'mci', color: '#EC4899', route: '/modules/events', roles: ['student', 'staff', 'admin'], childPermissions: SERVICE_CHILDREN.events },
  { key: 'certificates', label: 'Certificates', icon: 'certificate-outline', iconLib: 'mci', color: '#8B5CF6', route: '/modules/certificates', roles: ['student'], childPermissions: SERVICE_CHILDREN.certificates },
  { key: 'campus-map', label: 'Campus Map', icon: 'map-outline', iconLib: 'ion', color: '#16A34A', route: '/modules/map', roles: ['student', 'staff', 'admin'], childPermissions: SERVICE_CHILDREN.campusMap },
  { key: 'visitor', label: 'Visitors', icon: 'badge-account-horizontal-outline', iconLib: 'mci', color: '#3B82F6', route: '/modules/visitor', roles: ['staff', 'admin'], childPermissions: SERVICE_CHILDREN.visitor },
  { key: 'attendance', label: 'Attendance', icon: 'map-marker-account-outline', iconLib: 'mci', color: '#06B6D4', route: '/modules/attendance', roles: ['staff'], childPermissions: SERVICE_CHILDREN.attendance },
  { key: 'parcel', label: 'Parcels', icon: 'package-variant-closed', iconLib: 'mci', color: '#F97316', route: '/modules/parcel', roles: ['student', 'staff'], childPermissions: SERVICE_CHILDREN.parcel },
  { key: 'gate', label: 'Gate Pass', icon: 'gate-open', iconLib: 'mci', color: '#14B8A6', route: '/modules/gate', roles: ['student', 'staff', 'admin'], childPermissions: SERVICE_CHILDREN.gate },
  { key: 'alerts', label: 'Alerts', icon: 'bullhorn-outline', iconLib: 'mci', color: '#6366F1', route: '/(tabs)/alerts', roles: ['student', 'staff', 'admin'], childPermissions: SERVICE_CHILDREN.alerts },
  { key: 'admin-panel', label: 'Admin Panel', icon: 'view-dashboard-outline', iconLib: 'mci', color: '#7D3ECF', route: '/modules/admin', roles: ['admin'], childPermissions: SERVICE_CHILDREN.admin },
  { key: 'gate-logs', label: 'Gate Logs', icon: 'security', iconLib: 'mci', color: '#0F766E', route: '/modules/gate-logs', roles: ['admin'], childPermissions: SERVICE_CHILDREN.gateLogs, departments: ['Security'] },
  { key: 'tickets', label: 'Tickets', icon: 'ticket-outline', iconLib: 'mci', color: '#7C3AED', route: '/modules/tickets', roles: ['student', 'staff', 'admin'], childPermissions: SERVICE_CHILDREN.tickets },
];

export const TAB_SERVICES: ServiceItem[] = [
  {
    key: 'attendance',
    label: 'Attendance',
    icon: 'map-marker-account-outline',
    iconLib: 'mci',
    color: '#06B6D4',
    route: '/modules/attendance',
    roles: ['student', 'staff', 'admin'],
    childPermissions: SERVICE_CHILDREN.attendance,
  },
  {
    key: 'tickets',
    label: 'Tickets',
    icon: 'ticket-outline',
    iconLib: 'mci',
    color: '#7C3AED',
    route: '/modules/tickets',
    roles: ['student', 'staff', 'admin'],
    childPermissions: SERVICE_CHILDREN.tickets,
  },
  {
    key: 'leave',
    label: 'Leaves',
    icon: 'calendar-account-outline',
    iconLib: 'mci',
    color: '#7D3ECF',
    route: '/modules/leave',
    roles: ['student', 'staff', 'admin'],
    childPermissions: SERVICE_CHILDREN.leave,
  },
  {
    key: 'visitor',
    label: 'Visitors',
    icon: 'badge-account-horizontal-outline',
    iconLib: 'mci',
    color: '#3B82F6',
    route: '/modules/visitor',
    roles: ['student', 'staff', 'admin'],
    childPermissions: SERVICE_CHILDREN.visitor,
  },
  {
    key: 'mess',
    label: 'Mess',
    icon: 'silverware-fork-knife',
    iconLib: 'mci',
    color: '#16A34A',
    route: '/modules/mess',
    roles: ['student', 'staff', 'admin'],
    childPermissions: SERVICE_CHILDREN.mess,
  },
];

function normalizePermission(permission: string): string {
  return permission.trim().toLowerCase();
}

/** True when the user has this single permission key. */
export function hasPermission(granted: string[], key: string): boolean {
  if (!key) return false;
  const grantedSet = new Set(
    granted.filter((p): p is string => typeof p === 'string').map(normalizePermission),
  );
  if (!grantedSet.size) return false;
  return grantedSet.has(normalizePermission(key));
}

/** True when the user has at least one permission from the list (service tile logic only). */
export function hasAnyPermission(granted: string[], keys: readonly string[]): boolean {
  if (keys.length === 0) return false;
  return keys.some((key) => hasPermission(granted, key));
}

function isRoleAndDepartmentAllowed(service: ServiceItem, role: string, department?: string): boolean {
  if (!service.roles.includes(role as UserRole)) return false;
  if (!service.departments || service.departments.length === 0) return true;
  if (role !== 'staff') return true;
  if (!department) return false;
  return service.departments.includes(department);
}

function isServiceVisible(
  service: ServiceItem,
  role: string,
  department: string | undefined,
  permissions: string[],
): boolean {
  const childKeys = service.childPermissions ?? [];
  if (childKeys.length === 0) return false;

  const cleanPermissions = permissions
    .filter((p): p is string => typeof p === 'string')
    .map((p) => p.trim())
    .filter(Boolean);

  if (!hasAnyPermission(cleanPermissions, childKeys)) return false;
  return isRoleAndDepartmentAllowed(service, role, department);
}

function filterServicesByAccess(
  services: ServiceItem[],
  role: string,
  department?: string,
  permissions: string[] = [],
): ServiceItem[] {
  return services.filter((service) => isServiceVisible(service, role, department, permissions));
}

/** Service tile visible when user has ANY child component permission for that service. */
export function isServiceEnabledForUser(
  service: ServiceItem,
  role: string,
  department: string | undefined,
  permissions: string[] = [],
): boolean {
  return isServiceVisible(service, role, department, permissions);
}

export function servicesForUser(role: string, department?: string, permissions: string[] = []) {
  return filterServicesByAccess(ALL_SERVICES, role, department, permissions);
}

export function tabServicesForUser(role: string, department?: string, permissions: string[] = []) {
  return filterServicesByAccess(TAB_SERVICES, role, department, permissions);
}

export const SECTIONED_SERVICES = (role: string, department?: string, permissions: string[] = []) => {
  const all = servicesForUser(role, department, permissions);
  const inSection = (keys: string[]) => all.filter((s) => keys.includes(s.key));
  return [
    { title: 'Academics', items: inSection(['examinations', 'library', 'results']) },
    { title: 'Campus Life', items: inSection(['hostel', 'mess', 'events', 'certificates']) },
    { title: 'Campus Services', items: inSection(['campus-map', 'visitor', 'attendance', 'parcel', 'gate']) },
    { title: 'Communication', items: inSection(['tickets', 'alerts']) },
    { title: 'Administration', items: inSection(['admin-panel', 'gate-logs']) },
  ].filter((s) => s.items.length > 0);
};
