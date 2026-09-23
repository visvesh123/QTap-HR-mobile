import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { api } from '../../src/api';
import { daysUntil } from '../../src/timeago';
import { useCanAccess } from '../../src/components/PermissionGate';
import { RBAC } from '../../src/services-catalog';
import {
  AB, SearchPill, CategoryStrip, ListingCard, SectionHead, MapFab,
  type CategoryTab,
} from '../../src/components/ExploreUI';

const CATEGORIES: CategoryTab[] = [
  { key: 'For You', label: 'For you', icon: 'sparkles-outline' },
  { key: 'Academics', label: 'Academics', icon: 'school-outline' },
  { key: 'Campus Life', label: 'Life', icon: 'people-outline' },
  { key: 'Services', label: 'Services', icon: 'grid-outline' },
];
type Cat = (typeof CATEGORIES)[number]['key'];

function weatherAdvisory(code: number | null, hour: number, temp: number | null): { emoji: string; text: string } {
  const night = hour >= 19 || hour < 6;
  if (code == null) return { emoji: '🎓', text: 'Welcome to campus — have a great day!' };
  if ([95, 96, 99].includes(code)) return { emoji: '⛈️', text: 'Thunderstorms likely — stay indoors between classes.' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { emoji: '☔', text: 'Rain on campus — carry an umbrella to class.' };
  if ([45, 48].includes(code)) return { emoji: '🌫️', text: 'Foggy out — allow extra time to reach campus.' };
  if (temp != null && temp >= 38) return { emoji: '🥵', text: 'Scorching today — stay hydrated and keep to the shade.' };
  if ([0, 1].includes(code))
    return night
      ? { emoji: '🌙', text: 'Clear skies tonight — perfect for a campus stroll.' }
      : { emoji: '☀️', text: 'Clear skies — a great day out on the lawn.' };
  if ([2, 3].includes(code)) return { emoji: '⛅', text: 'Cloud cover over campus — a comfortable day ahead.' };
  return { emoji: '🌤️', text: 'Pleasant on campus today.' };
}

interface Feature {
  key: string; cat: Exclude<Cat, 'For You'>; title: string; sub: string;
  meta: string; image: string | number; route: string; rating: string; badge?: string;
}

const FEATURES: Feature[] = [
  { key: 'exams', cat: 'Academics', title: 'Examinations', sub: 'Hall ticket, schedule & results', meta: 'Academics · Open now', route: '/modules/examinations', image: 'https://images.pexels.com/photos/256431/pexels-photo-256431.jpeg?auto=compress&cs=tinysrgb&w=900', rating: '4.9', badge: 'Campus pick' },
  { key: 'library', cat: 'Academics', title: 'Central Library', sub: 'Search, issue & RFID pass', meta: 'Academics · 2 min walk', route: '/modules/library', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=900', rating: '4.8' },
  { key: 'events', cat: 'Campus Life', title: 'Events & Clubs', sub: 'TechFest, cultural nights & more', meta: 'Campus Life · This week', route: '/modules/events', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900', rating: '4.7', badge: 'Guest favourite' },
  { key: 'hostel', cat: 'Campus Life', title: 'Hostel', sub: 'Allotment, roommates & complaints', meta: 'Campus Life · Resident services', route: '/modules/hostel', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=900', rating: '4.6' },
  { key: 'mess', cat: 'Campus Life', title: 'Mess & Dining', sub: 'Menus, occupancy & live wait', meta: 'Campus Life · Serving now', route: '/modules/mess', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900', rating: '4.5' },
  { key: 'gate', cat: 'Services', title: 'Gate Pass', sub: 'Personal RFID / QR entry pass', meta: 'Services · Instant access', route: '/modules/gate', image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=900', rating: '4.9' },
  { key: 'parcel', cat: 'Services', title: 'Parcels', sub: 'Inbox, pickup & collect', meta: 'Services · Campus mail', route: '/modules/parcel', image: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=900', rating: '4.4' },
  { key: 'map', cat: 'Services', title: 'Campus Map', sub: 'Buildings, hostels & shortcuts', meta: 'Services · Explore campus', route: '/modules/map', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900', rating: '4.8' },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [cat, setCat] = useState<Cat>('For You');
  const [query, setQuery] = useState('');

  const load = async () => {
    try { setEvents(await api.events()); } catch {}
    try { const h = await api.holidays(); setHolidays((h.upcoming || []).slice(0, 3)); } catch {}
    try { setWeather(await api.weather()); } catch {}
  };
  useEffect(() => { load(); }, [user]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const canHallTicket = useCanAccess(RBAC.VIEW_HALL_TICKET);
  const canAdminDash = useCanAccess(RBAC.VIEW_ADMIN_DASHBOARD);
  const canCheckIn = useCanAccess(RBAC.CHECK_IN);
  const canViewAttendance = useCanAccess(RBAC.VIEW_ATTENDANCE);

  const roleListing: Feature | null = (() => {
    if (!user) return null;
    if (user.role === 'student' && canHallTicket) {
      return {
        key: 'hero', cat: 'Academics', title: 'Hall Ticket',
        sub: 'Released · tap to view your card', meta: 'Mid-Sem Exams · For you',
        route: '/modules/examinations',
        image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900',
        rating: 'New', badge: 'For you',
      } as Feature;
    }
    if (user.role === 'admin' && canAdminDash) {
      return {
        key: 'hero', cat: 'Services', title: 'HR Portal',
        sub: 'Live attendance, staff & analytics', meta: 'University · Admin',
        route: '/admin',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900',
        rating: 'Live', badge: 'For you',
      } as Feature;
    }
    if (canCheckIn || canViewAttendance) {
      return {
        key: 'hero', cat: 'Services', title: 'Mark Attendance',
        sub: 'Geo + face check-in / check-out', meta: (user.department || 'Faculty') + ' · For you',
        route: '/modules/attendance',
        image: require('../../assets/images/attendance-hero.png') as number,
        rating: 'Open', badge: 'For you',
      } as Feature;
    }
    return null;
  })();

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = cat === 'For You'
      ? (roleListing ? [roleListing, ...FEATURES.filter((f) => f.key !== 'exams' || !roleListing)] : FEATURES)
      : FEATURES.filter((f) => f.cat === cat);
    if (!q) return base;
    return base.filter((f) =>
      `${f.title} ${f.sub} ${f.meta}`.toLowerCase().includes(q),
    );
  }, [cat, query, roleListing]);

  if (!user) return null;

  const HONORIFICS = ['dr', 'dr.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'prof', 'prof.', 'mx', 'mx.'];
  const nameParts = user.name.split(' ').filter(Boolean);
  const firstName = user.role === 'admin'
    ? 'Admin'
    : (HONORIFICS.includes((nameParts[0] || '').toLowerCase()) ? (nameParts[1] || nameParts[0]) : nameParts[0]);
  const initials = (firstName?.[0] || 'U').toUpperCase();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const temp: number | null = weather?.temp_c ?? null;
  const code: number | null = weather?.code ?? null;
  const advisory = weatherAdvisory(code, hour, temp);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.top}>
        <SearchPill
          value={query}
          onChangeText={setQuery}
          placeholder="Start your search"
          subtitle="Services · Events · Hostel"
          testID="home-search"
        />
        <CategoryStrip
          tabs={CATEGORIES}
          active={cat}
          onChange={(k) => setCat(k as Cat)}
          testIDPrefix="cat"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AB.ink} />}
      >
        <View style={styles.helloRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>{greeting}, {firstName}</Text>
            <Text style={styles.helloSub} numberOfLines={1}>
              {advisory.emoji} {advisory.text}
              {temp != null ? ` · ${Math.round(temp)}°C` : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/profile')} testID="home-avatar">
            {user.avatar
              ? <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
              : <Text style={styles.avatarText}>{initials}</Text>}
          </TouchableOpacity>
        </View>

        {list.map((f) => (
          <ListingCard
            key={f.key}
            image={f.image}
            title={f.title}
            subtitle={f.sub}
            meta={f.meta}
            rating={f.rating}
            badge={f.badge}
            onPress={() => router.push(f.route as any)}
            testID={f.key === 'hero' ? 'hero-cta' : `feat-${f.key}`}
            likeTestID={f.key === 'hero' ? 'hero-like' : undefined}
          />
        ))}

        {list.length === 0 && (
          <Text style={styles.empty}>No matches for “{query}”.</Text>
        )}

        {events.length > 0 && (
          <>
            <SectionHead title="Upcoming events" action="Show all" onAction={() => router.push('/modules/events')} />
            {events.map((e) => (
              <ListingCard
                key={e.id}
                image={e.image}
                title={e.title}
                subtitle={`${formatDate(e.date)} · ${e.venue}`}
                meta={`${e.registered} going`}
                rating="Event"
                badge="This week"
                onPress={() => router.push('/modules/events')}
                testID={`event-${e.id}`}
              />
            ))}
          </>
        )}

        {holidays.length > 0 && (
          <>
            <SectionHead title="Upcoming holidays" />
            <View style={styles.holidayWrap}>
              {holidays.map((h) => {
                const d = daysUntil(h.date);
                const countdown = d <= 0 ? 'Today' : d === 1 ? 'Tomorrow' : `in ${d} days`;
                const dt = new Date(`${h.date}T00:00:00`);
                return (
                  <View key={h.name} style={styles.holidayRow} testID={`holiday-${h.name}`}>
                    <View style={styles.holidayDate}>
                      <Text style={styles.holidayDay}>{dt.getDate()}</Text>
                      <Text style={styles.holidayMon}>{dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.holidayName} numberOfLines={1}>{h.name}</Text>
                      <Text style={styles.holidayType} numberOfLines={1}>{h.type} · {countdown}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={AB.muted} />
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <MapFab onPress={() => router.push('/modules/map')} />
    </SafeAreaView>
  );
}

function formatDate(d: string) {
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return d; }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AB.bg },
  top: {
    backgroundColor: AB.bg,
    ...Platform.select({
      web: { boxShadow: '0 1px 0 rgba(0,0,0,0.04)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
    zIndex: 2,
  },
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 },
  helloRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22, gap: 12 },
  hello: { fontSize: 22, fontWeight: '700', color: AB.ink, letterSpacing: -0.4 },
  helloSub: { fontSize: 14, color: AB.muted, marginTop: 4, fontWeight: '400' },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: AB.red,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: AB.white, fontSize: 15, fontWeight: '700' },
  empty: { textAlign: 'center', color: AB.muted, fontSize: 15, paddingVertical: 40 },

  holidayWrap: { gap: 0, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: AB.line },
  holidayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: AB.line,
  },
  holidayDate: { width: 48, alignItems: 'center' },
  holidayDay: { fontSize: 20, fontWeight: '700', color: AB.ink, lineHeight: 24 },
  holidayMon: { fontSize: 11, fontWeight: '600', color: AB.muted, letterSpacing: 0.6, marginTop: 2 },
  holidayName: { fontSize: 15, fontWeight: '600', color: AB.ink },
  holidayType: { fontSize: 14, color: AB.muted, marginTop: 2 },
});
