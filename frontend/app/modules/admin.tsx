import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';
import { colors, radii, shadow, spacing } from '../../src/theme';
import { Card, ScreenHeader, SectionHeader } from '../../src/ui';

export default function AdminPanel() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.adminDashboard().then(setData).catch(() => {});
  }, []);

  if (!data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Admin Console" onBack={() => router.back()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  const stats = [
    { label: 'Total Students', value: data.total_students, icon: 'school-outline', color: '#7D3ECF', lib: 'ion' },
    { label: 'Total Staff', value: data.total_staff, icon: 'account-tie', color: '#0EA5E9', lib: 'mci' },
    { label: 'Library Books', value: data.library_books, icon: 'library-outline', color: '#10B981', lib: 'ion' },
    { label: 'Books Issued', value: data.books_issued, icon: 'book-open-outline', color: '#F59E0B', lib: 'mci' },
    { label: 'Visitors Today', value: data.total_visitors, icon: 'badge-account-horizontal-outline', color: '#3B82F6', lib: 'mci' },
    { label: 'Open Complaints', value: data.open_complaints, icon: 'flag-outline', color: '#EF4444', lib: 'ion' },
    { label: 'Events', value: data.events, icon: 'ticket-confirmation-outline', color: '#EC4899', lib: 'mci' },
    { label: 'Registrations', value: data.event_registrations, icon: 'people-outline', color: '#06B6D4', lib: 'ion' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Admin Console" subtitle="University-wide oversight" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <LinearGradient colors={[colors.primaryDark, colors.primaryLight]} style={styles.heroBar}>
          <Text style={styles.heroKicker}>OPERATIONS DASHBOARD</Text>
          <Text style={styles.heroTitle}>{data.total_users} Active Users</Text>
          <Text style={styles.heroSub}>Real-time university metrics and alerts</Text>
        </LinearGradient>

        <SectionHeader title="Key Metrics" />
        <View style={styles.statsGrid}>
          {stats.map((s) => {
            const Icon = s.lib === 'mci' ? MaterialCommunityIcons : Ionicons;
            return (
              <View key={s.label} style={styles.statCard} testID={`stat-${s.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <View style={[styles.statIcon, { backgroundColor: `${s.color}1A` }]}>
                  <Icon name={s.icon as any} size={20} color={s.color} />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            );
          })}
        </View>

        <SectionHeader title="Quick Links" />
        <View style={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
          <Quick label="View All Visitors" icon="badge-account-horizontal-outline" onPress={() => router.push('/modules/visitor')} />
          <Quick label="Hostel Complaints" icon="bed-outline" onPress={() => router.push('/modules/hostel')} />
          <Quick label="Gate Logs (RFID)" icon="gate-open" onPress={() => router.push('/modules/gate-logs')} />
          <Quick label="Send Announcement" icon="bullhorn-outline" onPress={() => router.push('/(tabs)/alerts')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Quick = ({ label, icon, onPress }: any) => {
  const Icon = MaterialCommunityIcons;
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={{ flex: 1, fontWeight: '600', color: colors.text }} onPress={onPress}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} onPress={onPress} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroBar: { padding: spacing.lg, marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: radii.xl, ...shadow.cardHeavy },
  heroKicker: { fontSize: 11, fontWeight: '800', color: colors.gold, letterSpacing: 2 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: colors.white, marginTop: 4, letterSpacing: -0.5 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  sosAlertBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.sos, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, alignSelf: 'flex-start', marginTop: spacing.md },
  sosAlertText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: spacing.sm },
  statCard: { width: '48%', backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.md, ...shadow.card },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});
