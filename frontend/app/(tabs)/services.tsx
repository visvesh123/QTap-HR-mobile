import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { SECTIONED_SERVICES, tabServicesForUser } from '../../src/services-catalog';
import { ServicePermissionGate } from '../../src/components/PermissionGate';
import { AB, SearchPill, WishlistCard } from '../../src/components/ExploreUI';

const UPCOMING = new Set(['leave', 'visitor']);

const SERVICE_IMAGES: Record<string, string> = {
  examinations: 'https://images.pexels.com/photos/256431/pexels-photo-256431.jpeg?auto=compress&cs=tinysrgb&w=900',
  library: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=900',
  results: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900',
  hostel: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=900',
  mess: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900',
  events: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900',
  certificates: 'https://images.unsplash.com/photo-1523580846011-d3a5bc257519?w=900',
  'campus-map': 'https://images.unsplash.com/photo-1524661131558-7411f62d0c1d?w=900',
  visitor: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900',
  attendance: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900',
  parcel: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=900',
  gate: 'https://images.unsplash.com/photo-1562774053-701939374585?w=900',
  alerts: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900',
  'admin-panel': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900',
  'gate-logs': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900',
  tickets: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900',
  leave: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=900',
};

const SERVICE_SUB: Record<string, string> = {
  examinations: 'Hall ticket & schedule',
  library: 'Search, issue & RFID',
  results: 'Grades and transcripts',
  hostel: 'Room & complaints',
  mess: 'Menus and occupancy',
  events: 'Clubs and fests',
  certificates: 'Bonafide & more',
  'campus-map': 'Buildings & shortcuts',
  visitor: 'Invite and approve',
  attendance: 'Check-in / check-out',
  parcel: 'Pickup and collect',
  gate: 'RFID / QR pass',
  alerts: 'Campus announcements',
  'admin-panel': 'Staff and analytics',
  'gate-logs': 'Entry and exit',
  tickets: 'Raise and track',
  leave: 'Apply and approve',
};

export default function Services() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);

  const enabled = tabServicesForUser(user?.role ?? '', user?.department, user?.permissions ?? []);
  const sections = SECTIONED_SERVICES(user?.role ?? '', user?.department, user?.permissions ?? []);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromSections = sections.flatMap((s) => s.items.map((item) => ({ ...item, section: s.title })));
    const extras = enabled
      .filter((s) => !fromSections.some((item) => item.key === s.key))
      .map((item) => ({ ...item, section: 'Services' }));
    const merged = [...fromSections, ...extras];
    const seen = new Set<string>();
    const unique = merged.filter((s) => {
      if (seen.has(s.key)) return false;
      seen.add(s.key);
      return true;
    });
    if (!q) return unique;
    return unique.filter((s) =>
      `${s.label} ${SERVICE_SUB[s.key] || ''} ${s.section}`.toLowerCase().includes(q),
    );
  }, [query, sections, enabled]);

  if (!user) return null;

  const collageImages = items.slice(0, 4).map((s) => SERVICE_IMAGES[s.key] || SERVICE_IMAGES.tickets);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Services</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing((v) => !v)} testID="services-search">
          <Text style={styles.editText}>{editing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>
      {editing && (
        <SearchPill
          value={query}
          onChangeText={setQuery}
          placeholder="Search a service"
          subtitle="Attendance, tickets, mess…"
        />
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {items.length >= 4 && !query && (
            <WishlistCard
              images={collageImages}
              title="Recently used"
              subtitle="Your campus shortcuts"
              onPress={() => {}}
              testID="service-tile-recent"
            />
          )}
          {items.map((s) => {
            const upcoming = UPCOMING.has(s.key);
            return (
              <ServicePermissionGate key={s.key} service={s}>
                <WishlistCard
                  image={SERVICE_IMAGES[s.key] || SERVICE_IMAGES.tickets}
                  title={s.label}
                  subtitle={upcoming ? 'Coming soon' : SERVICE_SUB[s.key] || s.section}
                  onPress={() => { if (!upcoming) router.push(s.route as any); }}
                  testID={`service-tile-${s.key}`}
                />
              </ServicePermissionGate>
            );
          })}
        </View>

        {enabled.length === 0 && items.length === 0 && (
          <Text style={styles.empty}>No services are enabled for your account yet.</Text>
        )}
        {items.length === 0 && enabled.length > 0 && (
          <Text style={styles.empty}>No matches for “{query}”.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AB.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 10,
  },
  pageTitle: { fontSize: 32, fontWeight: '700', color: AB.ink, letterSpacing: -0.8 },
  editBtn: {
    backgroundColor: AB.field, paddingHorizontal: 16, height: 36,
    borderRadius: 999, alignItems: 'center', justifyContent: 'center',
  },
  editText: { fontSize: 14, fontWeight: '600', color: AB.ink },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  empty: { width: '100%', textAlign: 'center', color: AB.muted, fontSize: 14, paddingVertical: 24 },
});
