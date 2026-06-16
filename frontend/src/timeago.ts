export function timeAgo(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  if (isNaN(d)) return '';
  const sec = Math.floor((Date.now() - d) / 1000);
  if (sec < 45) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'Yesterday';
  if (day < 7) return `${day} days ago`;
  if (day < 14) return 'Last week';
  if (day < 30) return `${Math.floor(day / 7)} weeks ago`;
  if (day < 60) return 'Last month';
  if (day < 365) return `${Math.floor(day / 30)} months ago`;
  return day < 730 ? 'Last year' : `${Math.floor(day / 365)} years ago`;
}

// Whole days from today (local) until an ISO date (YYYY-MM-DD or full ISO).
export function daysUntil(iso?: string): number {
  if (!iso) return 0;
  const target = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((target.getTime() - startOfToday.getTime()) / 86400000);
}
