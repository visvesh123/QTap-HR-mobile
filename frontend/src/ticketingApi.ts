/**
 * QTicket ticketing API — maps backend responses to mobile UI shapes.
 * Base: EXPO_PUBLIC_TICKETING_API_URL (e.g. https://dalmart.el.r.appspot.com)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from './auth';

const TOKEN_KEY = 'campus_hub_token';
const TICKETING_BASE = (process.env.EXPO_PUBLIC_TICKETING_API_URL || '').replace(/\/+$/, '');

export function isTicketingApiConfigured() {
  return Boolean(TICKETING_BASE);
}

function ticketingUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!TICKETING_BASE) return normalizedPath;
  const apiPath = normalizedPath.startsWith('/api/') ? normalizedPath : `/api${normalizedPath}`;
  return `${TICKETING_BASE}${apiPath}`;
}

function formatRequestError(data: any, status: number): string {
  if (typeof data?.message === 'string' && data.message) return data.message;
  const detail = data?.detail ?? data;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d: any) => d.msg ?? JSON.stringify(d)).join(', ');
  if (detail && typeof detail === 'object') return JSON.stringify(detail);
  return `HTTP ${status}`;
}

async function ticketingRequest<T = any>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: any,
): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(ticketingUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const txt = await res.text();
  let data: any = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }

  if (!res.ok) throw new Error(formatRequestError(data, res.status));
  return data as T;
}

export type TicketDepartment = { id: string; name: string };

export function mapProfileToRequester(user: User) {
  return {
    id: user.student_id || user.employee_id || user.qid || user.id,
    name: user.name,
    program: user.program || user.designation || '—',
    department: user.department || user.school || '—',
    year: user.batch || (user.role === 'student' ? '—' : 'Staff'),
    email: user.email,
    mobile: user.phone ? (user.phone.startsWith('+') ? user.phone : `+91 ${user.phone}`) : '—',
    student_id: user.student_id,
  };
}

function activityLabel(a: any): string {
  const type = a.type || '';
  const meta = a.meta || {};
  switch (type) {
    case 'ticket_created':
      return 'Ticket created';
    case 'comment_added':
      return `Comment from ${a.actor?.name || 'User'}`;
    case 'internal_note_added':
      return `Internal note from ${a.actor?.name || 'Staff'}`;
    case 'department_transfer':
      if (meta.from_department_name && meta.to_department_name) {
        return `Transferred from ${meta.from_department_name} to ${meta.to_department_name}`;
      }
      return 'Ticket transferred';
    case 'ticket_assigned':
    case 'ticket_reassigned':
      return meta.assignee_name ? `Assigned to ${meta.assignee_name}` : 'Ticket assigned';
    case 'ticket_reopened':
      return 'Ticket reopened';
    case 'priority_changed':
      return meta.priority ? `Priority changed to ${meta.priority}` : 'Priority changed';
    default:
      return type.replace(/_/g, ' ') || 'Activity';
  }
}

function activityType(a: any): string {
  const type = a.type || '';
  if (type === 'ticket_created') return 'created';
  if (type.includes('comment') || type.includes('note')) return 'comment';
  if (type.includes('transfer')) return 'transfer';
  return 'status';
}

function buildMessages(
  comments: any[] = [],
  transfers: any[] = [],
  ticket?: { description?: string; subject?: string; created_at?: string },
) {
  const items: any[] = [];

  const initialText = ticket?.description?.trim() || ticket?.subject?.trim();
  if (initialText) {
    items.push({
      id: 'initial',
      author: 'You',
      author_type: 'requester',
      text: initialText,
      at: ticket?.created_at,
      sort_at: ticket?.created_at,
    });
  }

  for (const c of comments) {
    if (c.is_internal) continue;
    const actor = c.actor || {};
    const isRequester = actor.is_self || actor.role === 'requester';
    items.push({
      id: String(c.id),
      author: isRequester ? 'You' : (actor.name || 'Department'),
      author_type: isRequester ? 'requester' : 'dept',
      text: c.body || '',
      at: c.created_at,
      sort_at: c.created_at,
    });
  }

  for (const tr of transfers) {
    items.push({
      id: `tr-${tr.id}`,
      author_type: 'transfer',
      from: tr.from_department_name || tr.from_department_id || '?',
      to: tr.to_department_name || tr.to_department_id || '?',
      at: tr.created_at,
      sort_at: tr.created_at,
    });
  }

  items.sort((a, b) => new Date(a.sort_at).getTime() - new Date(b.sort_at).getTime());
  return items.map(({ sort_at, ...rest }) => rest);
}

function buildJourney(detail: any): string[] {
  const fromTransfers = (detail.transfers || [])
    .flatMap((tr: any, i: number) => {
      const parts: string[] = [];
      if (i === 0 && tr.from_department_name) parts.push(tr.from_department_name);
      if (tr.to_department_name) parts.push(tr.to_department_name);
      return parts;
    });
  if (fromTransfers.length) return fromTransfers;
  if (detail.current_department_name) return [detail.current_department_name];
  return [];
}

function mapListTicket(t: any, unreadMap: Record<string, number> = {}) {
  const id = t.id || t.number;
  const unreadCount = unreadMap[id] ?? unreadMap[t.number] ?? 0;
  return {
    id,
    ticket_no: t.number || t.id,
    subject: t.subject,
    description: t.description,
    department: t.current_department_name || '',
    status: t.status,
    priority: t.priority,
    channel: t.channel,
    created_at: t.created_at,
    updated_at: t.updated_at,
    journey: t.dept_journey?.length ? t.dept_journey : [t.current_department_name].filter(Boolean),
    unread: unreadCount > 0,
  };
}

function mapTicketDetail(raw: any) {
  const journey = buildJourney(raw);
  const activities = (raw.activities || []).map((a: any) => ({
    id: String(a.id),
    type: activityType(a),
    label: activityLabel(a),
    note: a.remarks || a.meta?.remarks || '',
    at: a.created_at,
  }));

  return {
    id: raw.id || raw.number,
    ticket_no: raw.number || raw.id,
    subject: raw.subject,
    description: raw.description || '',
    department: raw.current_department_name || '',
    status: raw.status,
    priority: raw.priority,
    channel: raw.channel || 'Portal',
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    journey,
    messages: buildMessages(raw.comments, raw.transfers, raw),
    activity: activities,
    current_department_id: raw.current_department_id,
  };
}

export async function fetchTicketDepartments(): Promise<TicketDepartment[]> {
  const rows = await ticketingRequest<any[]>('GET', '/departments');
  return (Array.isArray(rows) ? rows : []).map((d) => ({
    id: String(d.id),
    name: d.name || String(d.id),
  }));
}

export async function fetchTicketsList(): Promise<any[]> {
  const [tickets, unreadMap] = await Promise.all([
    ticketingRequest<any[]>('GET', '/my/tickets'),
    ticketingRequest<Record<string, number>>('GET', '/notifications/unread-by-ticket').catch(() => ({})),
  ]);
  return (Array.isArray(tickets) ? tickets : []).map((t) => mapListTicket(t, unreadMap || {}));
}

export async function fetchTicketDetail(id: string): Promise<any | null> {
  const raw = await ticketingRequest<any>('GET', `/tickets/${encodeURIComponent(id)}`);
  return raw ? mapTicketDetail(raw) : null;
}

export async function createTicketRemote(payload: {
  subject: string;
  description: string;
  department_id: string;
}) {
  const created = await ticketingRequest<any>('POST', '/tickets', {
    subject: payload.subject,
    description: payload.description,
    department_id: payload.department_id,
  });
  return mapListTicket(created);
}

export async function addTicketCommentRemote(ticketId: string, text: string) {
  await ticketingRequest('POST', `/tickets/${encodeURIComponent(ticketId)}/comments`, { body: text });
  return fetchTicketDetail(ticketId);
}

export async function reopenTicketRemote(ticketId: string, departmentId: string) {
  await ticketingRequest('POST', `/tickets/${encodeURIComponent(ticketId)}/reopen`, {
    department_id: departmentId,
  });
  return fetchTicketDetail(ticketId);
}
