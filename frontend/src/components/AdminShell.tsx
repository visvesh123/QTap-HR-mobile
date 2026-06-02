import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  useWindowDimensions, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../auth';
import { colors, radii, shadow, spacing } from '../theme';

export const useIsDesktop = () => {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= 900;
};

const NAV: { route: string; label: string; icon: string }[] = [
  { route: '/admin',            label: 'Dashboard',  icon: 'view-dashboard-outline' },
  { route: '/admin/attendance', label: 'Attendance', icon: 'clock-check-outline' },
  { route: '/admin/employees',  label: 'Employees',  icon: 'account-group-outline' },
  { route: '/admin/geofences',  label: 'Geofences',  icon: 'map-marker-radius-outline' },
  { route: '/admin/reports',    label: 'Reports',    icon: 'file-chart-outline' },
];

export function AdminShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const { user, logout } = useAuth();

  if (!isDesktop) {
    // Mobile fallback: simple stacked scroll
    return (
      <ScrollView style={styles.mobileWrap} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.mobileHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.mobileTitle}>{title}</Text>
            {subtitle ? <Text style={styles.mobileSub}>{subtitle}</Text> : null}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileNav}>
          {NAV.map((n) => {
            const active = pathname === n.route;
            return (
              <TouchableOpacity
                key={n.route}
                onPress={() => router.replace(n.route as any)}
                style={[styles.mobileNavItem, active && styles.mobileNavItemActive]}
              >
                <MaterialCommunityIcons name={n.icon as any} size={16} color={active ? colors.white : colors.textSecondary} />
                <Text style={[styles.mobileNavLabel, active && { color: colors.white }]}>{n.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={{ padding: spacing.md }}>{children}</View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.root}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>MU</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Campus HR</Text>
            <Text style={styles.brandSub}>Admin Portal</Text>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          {NAV.map((n) => {
            const active = pathname === n.route || (n.route !== '/admin' && pathname.startsWith(n.route));
            return (
              <TouchableOpacity
                key={n.route}
                onPress={() => router.replace(n.route as any)}
                style={[styles.navItem, active && styles.navItemActive]}
                testID={`nav-${n.label.toLowerCase()}`}
              >
                <MaterialCommunityIcons
                  name={n.icon as any}
                  size={20}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.navLabel, active && { color: colors.primary, fontWeight: '700' }]}>
                  {n.label}
                </Text>
                {active && <View style={styles.navActiveBar} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.sidebarFooter}>
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{(user?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>{user?.name}</Text>
              <Text style={styles.userRole}>Administrator</Text>
            </View>
            <TouchableOpacity
              onPress={async () => { await logout(); router.replace('/role-select'); }}
              style={styles.signOut}
              testID="admin-signout"
            >
              <Ionicons name="log-out-outline" size={18} color={colors.sos} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backToApp}>
            <Ionicons name="arrow-back" size={14} color={colors.primary} />
            <Text style={styles.backToAppText}>Back to mobile app</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content */}
      <ScrollView style={styles.main} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.pageHead}>
          <View>
            <Text style={styles.pageTitle}>{title}</Text>
            {subtitle ? <Text style={styles.pageSub}>{subtitle}</Text> : null}
          </View>
        </View>
        <View style={styles.pageBody}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#F1F5F9' },
  sidebar: {
    width: 248,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 22,
    borderRightWidth: 1, borderRightColor: colors.border,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6 },
  brandIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  brandIconText: { color: colors.white, fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  brandTitle: { fontWeight: '800', color: colors.text, fontSize: 15 },
  brandSub: { color: colors.textMuted, fontSize: 11 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: radii.md, marginTop: 4,
    position: 'relative',
  },
  navItemActive: { backgroundColor: colors.primaryBg },
  navLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  navActiveBar: {
    position: 'absolute', left: 0, top: 8, bottom: 8, width: 3,
    backgroundColor: colors.primary, borderRadius: 2,
  },
  sidebarFooter: { marginTop: 16 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.background, borderRadius: radii.md, padding: 10,
  },
  userAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  userName: { fontWeight: '700', color: colors.text, fontSize: 12 },
  userRole: { color: colors.textMuted, fontSize: 10 },
  signOut: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  backToApp: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 10, paddingVertical: 8,
  },
  backToAppText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  main: { flex: 1 },
  pageHead: {
    padding: 28, paddingBottom: 18,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  pageSub: { color: colors.textSecondary, marginTop: 4, fontSize: 13 },
  pageBody: { padding: 28, maxWidth: 1400, width: '100%', alignSelf: 'center' },

  // Mobile fallback
  mobileWrap: { flex: 1, backgroundColor: colors.background },
  mobileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  mobileTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  mobileSub: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
  mobileNav: { padding: 10, gap: 6 },
  mobileNavItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radii.pill, ...shadow.card,
  },
  mobileNavItemActive: { backgroundColor: colors.primary },
  mobileNavLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
});
