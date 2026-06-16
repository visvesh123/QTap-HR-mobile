import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  useWindowDimensions, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../auth';
import { colors, radii, spacing, clay, BRAND } from '../theme';

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

// Reference design black sidebar tones
const SB_BG       = '#0F0F12';
const SB_BG_SOFT  = '#16161C';
const SB_BORDER   = '#26262E';
const SB_TEXT     = '#FFFFFF';
const SB_MUTED    = '#7B8794';
const SB_HOVER    = '#1F1F26';

export function AdminShell({
  title, subtitle, breadcrumb, children,
}: {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const { user, logout } = useAuth();
  const initials = (user?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  if (!isDesktop) {
    // Mobile fallback (no major redesign needed here — keep working)
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
      {/* ─────────────── Black Sidebar ─────────────── */}
      <View style={styles.sidebar}>
        <View>
          <View style={styles.brand}>
            <View style={styles.brandLogo}>
              <Text style={styles.brandLogoText}>MU</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandTitle} numberOfLines={1}>{BRAND.name}</Text>
              <Text style={styles.brandSub}>HR · WORKFORCE</Text>
            </View>
          </View>
        </View>

        <Text style={styles.navHeader}>NAVIGATION</Text>
        <View>
          {NAV.map((n) => {
            const active = pathname === n.route || (n.route !== '/admin' && pathname.startsWith(n.route));
            return (
              <TouchableOpacity
                key={n.route}
                onPress={() => router.replace(n.route as any)}
                style={[styles.navItem, active && styles.navItemActive]}
                testID={`nav-${n.label.toLowerCase()}`}
              >
                {active && <View style={styles.navActiveBar} />}
                <MaterialCommunityIcons
                  name={n.icon as any}
                  size={18}
                  color={active ? colors.white : SB_MUTED}
                />
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {n.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.sidebarFooter}>
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <MaterialCommunityIcons name="shield-check-outline" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>HR Operations</Text>
              <Text style={styles.userRole}>Workforce Analytics · Live</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ─────────────── Main Column ─────────────── */}
      <View style={styles.main}>
        {/* Top bar: breadcrumb / title + search + user pill */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <View style={styles.crumbRow}>
              <Text style={styles.crumb}>{breadcrumb || 'VMS'}</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
              <Text style={styles.crumbActive}>Overview</Text>
            </View>
            <Text style={styles.pageTitle}>{title}</Text>
            {subtitle ? <Text style={styles.pageSub}>{subtitle}</Text> : null}
          </View>

          <View style={styles.topRight}>
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search visitors, hosts, passes…"
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.kbd}><Text style={styles.kbdText}>⌘K</Text></View>
            </View>

            <TouchableOpacity style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={18} color={colors.text} />
              <View style={styles.bellDot} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => { await logout(); router.replace('/login'); }}
              style={styles.userPill}
              testID="admin-signout"
            >
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.userPillName} numberOfLines={1}>{user?.name || 'Administrator'}</Text>
                <Text style={styles.userPillRole}>HR Operations · Admin</Text>
              </View>
              <View style={styles.userPillAvatar}>
                <Text style={styles.userPillAvatarText}>{initials}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }}>
          <View style={styles.pageBody}>{children}</View>
        </ScrollView>
      </View>
    </View>
  );
}

// ─────────────── Re-usable stat card matching reference design ───────────────
export function AdminStatCard({
  label, value, sub, icon, iconColor = colors.primary, iconBg = colors.primaryBg,
  tone, testID,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  iconColor?: string;
  iconBg?: string;
  tone?: 'alert' | 'live';
  testID?: string;
}) {
  const isAlert = tone === 'alert';
  return (
    <View
      style={[
        adminStat.card,
        isAlert && adminStat.cardAlert,
        clay.surface as any,
      ]}
      testID={testID}
    >
      <View style={[
        adminStat.iconWrap,
        { backgroundColor: isAlert ? colors.primary : iconBg },
      ]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={isAlert ? colors.white : iconColor}
        />
      </View>
      {tone === 'live' && (
        <View style={adminStat.liveTag}>
          <View style={adminStat.liveDot} />
          <Text style={adminStat.liveText}>LIVE</Text>
        </View>
      )}
      <Text style={[adminStat.label, isAlert && { color: colors.primary }]}>{label}</Text>
      <Text style={[adminStat.value, isAlert && { color: colors.primaryDark }]}>{value}</Text>
      {sub ? (
        <Text style={[adminStat.sub, isAlert && { color: colors.primary, fontWeight: '700' }]}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

const adminStat = StyleSheet.create({
  card: {
    flex: 1, minWidth: 170,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    gap: 10,
    minHeight: 168,
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardAlert: {
    backgroundColor: '#FCEEF1',
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  liveTag: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  liveText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  value: { fontSize: 38, fontWeight: '800', color: colors.ink, letterSpacing: -1, lineHeight: 42 },
  sub: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
});

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },

  // ─────────── BLACK SIDEBAR ───────────
  sidebar: {
    width: 268,
    backgroundColor: SB_BG,
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderRightWidth: 1, borderRightColor: SB_BORDER,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: SB_BORDER },
  brandLogo: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  brandLogoText: { color: colors.primary, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  brandTitle: { fontWeight: '700', color: SB_TEXT, fontSize: 14 },
  brandSub: { color: SB_MUTED, fontSize: 10, letterSpacing: 1.3, marginTop: 2, fontWeight: '600' },
  navHeader: {
    color: SB_MUTED, fontSize: 10, fontWeight: '700', letterSpacing: 1.6,
    marginTop: 22, marginBottom: 10, marginLeft: 4,
  },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 10, marginTop: 2,
    position: 'relative',
  },
  navItemActive: { backgroundColor: SB_HOVER },
  navLabel: { color: SB_MUTED, fontSize: 13, fontWeight: '600' },
  navLabelActive: { color: SB_TEXT, fontWeight: '700' },
  navActiveBar: {
    position: 'absolute', left: -18, top: 6, bottom: 6, width: 3,
    backgroundColor: colors.primary, borderRadius: 2,
  },
  sidebarFooter: { paddingTop: 18, borderTopWidth: 1, borderTopColor: SB_BORDER },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: SB_BG_SOFT, borderRadius: 12, padding: 12,
  },
  userAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#26262E', alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { color: SB_TEXT, fontWeight: '800', fontSize: 11 },
  userName: { fontWeight: '700', color: SB_TEXT, fontSize: 12 },
  userRole: { color: SB_MUTED, fontSize: 10, marginTop: 2 },

  // ─────────── MAIN COLUMN ───────────
  main: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 36, paddingTop: 28, paddingBottom: 18,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.background,
    gap: 24,
  },
  crumbRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  crumb: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  crumbActive: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  pageTitle: { fontSize: 36, fontWeight: '800', color: colors.ink, letterSpacing: -1.0 },
  pageSub: { color: colors.textSecondary, marginTop: 4, fontSize: 13 },

  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 42, paddingHorizontal: 14, minWidth: 320,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.text, outlineStyle: 'none' as any, height: '100%' },
  kbd: {
    paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: colors.steel50, borderRadius: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  kbdText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },

  bellBtn: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border,
    position: 'relative',
  },
  bellDot: {
    position: 'absolute', top: 8, right: 10,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5, borderColor: colors.white,
  },

  userPill: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  userPillName: { fontSize: 13, fontWeight: '700', color: colors.ink },
  userPillRole: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  userPillAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center',
  },
  userPillAvatarText: { color: colors.white, fontWeight: '800', fontSize: 11 },

  pageBody: { paddingHorizontal: 36, paddingTop: 28, maxWidth: 1500, width: '100%', alignSelf: 'center' },

  // ─────────── Mobile fallback ───────────
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
    borderRadius: radii.pill,
  },
  mobileNavItemActive: { backgroundColor: colors.primary },
  mobileNavLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
});
