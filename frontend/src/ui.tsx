import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing, typo } from './theme';

export const ServiceTile = ({
  label,
  icon,
  iconLib = 'ion',
  color = colors.primary,
  onPress,
  testID,
}: {
  label: string;
  icon: any;
  iconLib?: 'ion' | 'mci';
  color?: string;
  onPress?: () => void;
  testID?: string;
}) => {
  const Icon = iconLib === 'mci' ? MaterialCommunityIcons : Ionicons;
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      testID={testID}
      style={styles.tile}
    >
      <View style={[styles.tileIconWrap, { backgroundColor: `${color}1A` }]}>
        <Icon name={icon} size={28} color={color} />
      </View>
      <Text numberOfLines={2} style={styles.tileLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

export const SectionHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={styles.sectionHeader}>{title}</Text>
    {action}
  </View>
);

export const PrimaryButton = ({
  label,
  onPress,
  disabled,
  testID,
  style,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
  loading?: boolean;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    disabled={disabled || loading}
    onPress={onPress}
    testID={testID}
    style={[{ borderRadius: radii.lg, overflow: 'hidden', opacity: disabled ? 0.5 : 1 }, style]}
  >
    <LinearGradient
      colors={[colors.primaryDark, colors.primaryLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.primaryBtn}
    >
      <Text style={styles.primaryBtnText}>{loading ? 'Please wait…' : label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

export const Card = ({ children, style, testID }: { children: React.ReactNode; style?: ViewStyle; testID?: string }) => (
  <View testID={testID} style={[styles.card, style]}>{children}</View>
);

export const Pill = ({ label, active, onPress, testID }: { label: string; active?: boolean; onPress?: () => void; testID?: string }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    testID={testID}
    style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
  >
    <Text style={[styles.pillText, { color: active ? colors.primary : colors.textSecondary }]}>{label}</Text>
  </TouchableOpacity>
);

export const Badge = ({ label, color = colors.primary, bg }: { label: string; color?: string; bg?: string }) => (
  <View style={[styles.badge, { backgroundColor: bg ?? `${color}1A` }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

export const ScreenHeader = ({ title, subtitle, onBack, right }: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) => (
  <View style={styles.screenHeader}>
    {onBack && (
      <TouchableOpacity onPress={onBack} testID="back-btn" style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>
    )}
    <View style={{ flex: 1 }}>
      <Text style={styles.screenTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.screenSubtitle}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

export const Empty = ({ icon = 'document-outline', message }: { icon?: any; message: string }) => (
  <View style={styles.empty}>
    <Ionicons name={icon} size={56} color={colors.textMuted} />
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  tile: {
    width: '23%',
    aspectRatio: 0.85,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    ...shadow.card,
  },
  tileIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    ...typo.section,
    color: colors.textSecondary,
  },
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  pill: {
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: radii.pill,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  pillActive: {
    backgroundColor: colors.primaryBg,
  },
  pillInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  screenTitle: {
    ...typo.h3,
    color: colors.text,
  },
  screenSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontSize: 14,
  },
});
