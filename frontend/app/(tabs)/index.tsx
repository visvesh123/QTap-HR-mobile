import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { api } from '../../src/api';
import { colors, radii, shadow, spacing, typo, BRAND, clay } from '../../src/theme';
import { ServiceTile, SectionHeader, Card } from '../../src/ui';
import { SECTIONED_SERVICES } from '../../src/services-catalog';
import MessLiveCard from '../../src/components/MessLiveCard';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const loadStats = async () => {
    if (user?.role === 'admin') {
      try { setStats(await api.adminDashboard()); } catch {}
    }
  };

  useEffect(() => { loadStats(); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (!user) return null;
  const sections = SECTIONED_SERVICES(user.role, user.department);

  const heading = user.role === 'admin'
    ? 'Welcome, Administrator'
    : user.role === 'staff'
      ? `Hello, ${user.name.split(' ')[0]}`
      : `Hi, ${user.name.split(' ')[0]} 👋`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Top header */}
        <LinearGradient
          colors={[colors.primaryDark, colors.primaryLight]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.topBar}
        >
          <View style={styles.topRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerLogoBadge}>
                <Image source={{ uri: BRAND.logoUrl }} style={styles.headerLogo} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.brandSmall}>MAHINDRA UNIVERSITY</Text>
                <Text style={styles.brandTitle}>{user.role === 'admin' ? 'University Console' : "Today's Campus"}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/alerts')}
                style={styles.iconBtn}
                testID="header-alerts-btn"
              >
                <Ionicons name="notifications-outline" size={20} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/modules/sos')}
                style={[styles.iconBtn, { backgroundColor: 'rgba(239,68,68,0.95)' }]}
                testID="header-sos-btn"
              >
                <MaterialCommunityIcons name="shield-alert-outline" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.greet}>{heading}</Text>
          <Text style={styles.subgreet}>{user.department || user.role}</Text>

          {/* Welcome card */}
          {user.role === 'student' && (
            <Card style={styles.welcomeCard} testID="welcome-card">
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeKicker}>Mid-Sem Exams</Text>
                <Text style={styles.welcomeTitle}>Hall Ticket{`\n`}Released</Text>
                <TouchableOpacity
                  onPress={() => router.push('/modules/examinations')}
                  style={styles.welcomeBtn}
                  testID="open-hallticket-btn"
                >
                  <Text style={styles.welcomeBtnText}>View Hall Ticket</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
              <View style={styles.welcomeImg}>
                <MaterialCommunityIcons name="ticket-confirmation" size={64} color={colors.primary} />
              </View>
            </Card>
          )}

          {user.role === 'staff' && (
            <Card style={styles.welcomeCard} testID="welcome-card">
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeKicker}>{user.department}</Text>
                <Text style={styles.welcomeTitle}>Mark Your{`\n`}Attendance</Text>
                <TouchableOpacity
                  onPress={() => router.push('/modules/attendance')}
                  style={styles.welcomeBtn}
                  testID="open-attendance-btn"
                >
                  <Text style={styles.welcomeBtnText}>Check-in Now</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
              <View style={styles.welcomeImg}>
                <MaterialCommunityIcons name="map-marker-account" size={64} color={colors.primary} />
              </View>
            </Card>
          )}

          {user.role === 'admin' && stats && (
            <Card style={styles.welcomeCard} testID="welcome-card">
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeKicker}>University Snapshot</Text>
                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: 8 }}>
                  <Stat label="Students" value={stats.total_students} />
                  <Stat label="Staff" value={stats.total_staff} />
                  <Stat label="Active SOS" value={stats.active_sos} color={colors.sos} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
                  <TouchableOpacity
                    onPress={() => router.push('/admin')}
                    style={styles.welcomeBtn}
                    testID="open-web-portal"
                  >
                    <MaterialCommunityIcons name="monitor-dashboard" size={16} color={colors.white} />
                    <Text style={styles.welcomeBtnText}>Open HR Portal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/modules/admin')}
                    style={[styles.welcomeBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                    testID="open-admin-btn"
                  >
                    <Text style={styles.welcomeBtnText}>Mobile Console</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        </LinearGradient>

        {/* Quick Actions */}
        {user.role === 'student' && (
          <View style={styles.quickRow} testID="quick-actions">
            <QuickAction icon="qrcode" label="Gate Pass" onPress={() => router.push('/modules/gate')} />
            <QuickAction icon="package-variant-closed" label="My Parcels" onPress={() => router.push('/modules/parcel')} />
            <QuickAction icon="bed" label="My Hostel" onPress={() => router.push('/modules/hostel')} />
            <QuickAction icon="wallet" iconLib="ion" label="Wallet" onPress={() => router.push('/(tabs)/wallet')} />
          </View>
        )}

        {/* Promotional banner */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.promoWrap}
          onPress={() => router.push('/modules/events')}
          testID="promo-events"
        >
          <Image
            source={{ uri: 'https://images.pexels.com/photos/32213218/pexels-photo-32213218.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' }}
            style={styles.promoImg}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.85)']}
            style={styles.promoOverlay}
          >
            <Text style={styles.promoKicker}>EVENTS & CLUBS</Text>
            <Text style={styles.promoTitle}>TechFest 2026 — Registrations Open</Text>
            <View style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>Explore</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Mess live capacity */}
        <MessLiveCard />

        {/* Sectioned services */}
        {sections.map((section) => (
          <View key={section.title}>
            <SectionHeader title={section.title} />
            <View style={styles.grid}>
              {section.items.map((s) => (
                <ServiceTile
                  key={s.key}
                  label={s.label}
                  icon={s.icon}
                  iconLib={s.iconLib}
                  color={s.color}
                  onPress={() => router.push(s.route as any)}
                  testID={`service-tile-${s.key}`}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const Stat = ({ label, value, color }: { label: string; value: any; color?: string }) => (
  <View>
    <Text style={[styles.statValue, color ? { color } : null]}>{value ?? '—'}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const QuickAction = ({ icon, label, onPress, iconLib = 'mci' }: any) => {
  const Icon = iconLib === 'ion' ? Ionicons : MaterialCommunityIcons;
  return (
    <TouchableOpacity style={styles.quickItem} onPress={onPress} activeOpacity={0.8} testID={`quick-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <View style={styles.quickIcon}>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.clayBg },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLogoBadge: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  headerLogo: { width: 26, height: 26 },
  brandSmall: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 2 },
  brandTitle: { fontSize: 18, fontWeight: '700', color: colors.white, marginTop: 2 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  greet: { fontSize: 26, fontWeight: '800', color: colors.white, marginTop: spacing.md, letterSpacing: -0.5 },
  subgreet: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.clay,
    ...(clay.surface as any),
  },
  welcomeKicker: { fontSize: 11, fontWeight: '800', color: colors.gold, letterSpacing: 1.4 },
  welcomeTitle: { fontSize: 22, fontWeight: '800', color: colors.clayDark, marginTop: 4, lineHeight: 26 },
  welcomeBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 11,
    borderRadius: 999, alignSelf: 'flex-start', marginTop: spacing.sm, gap: 6,
    ...(clay.crimson as any),
  },
  welcomeBtnText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  welcomeImg: {
    width: 96, height: 96, borderRadius: radii.clay,
    backgroundColor: colors.clayPeach,
    alignItems: 'center', justifyContent: 'center',
    ...(clay.surfaceSoft as any),
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: -2 },
  quickRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: -spacing.lg, marginHorizontal: spacing.md,
    backgroundColor: colors.white, borderRadius: radii.clay, padding: spacing.md,
    ...(clay.surface as any),
  },
  quickItem: { alignItems: 'center', gap: 6, flex: 1 },
  quickIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.clayPink,
    alignItems: 'center', justifyContent: 'center',
    ...(clay.surfaceSoft as any),
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: colors.clayDark },
  promoWrap: {
    marginTop: spacing.lg, marginHorizontal: spacing.md,
    borderRadius: radii.clay, overflow: 'hidden', height: 130,
    ...(clay.surface as any),
  },
  promoImg: { width: '100%', height: '100%', position: 'absolute' },
  promoOverlay: { flex: 1, padding: spacing.md, justifyContent: 'flex-end' },
  promoKicker: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 1.5 },
  promoTitle: { fontSize: 18, fontWeight: '800', color: colors.white, marginTop: 2 },
  promoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, alignSelf: 'flex-start', marginTop: 8,
  },
  promoBtnText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.md, gap: spacing.sm,
  },
});
