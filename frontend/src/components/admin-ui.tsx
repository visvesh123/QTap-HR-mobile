import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow } from '../theme';

export function Surface({ children, style }: any) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function StatCard({
  label, value, hint, icon, color = colors.primary, deltaPct, testID,
}: { label: string; value: string | number; hint?: string; icon: string; color?: string; deltaPct?: number; testID?: string }) {
  return (
    <View style={styles.statCard} testID={testID}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
        {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
        {typeof deltaPct === 'number' && (
          <View style={[styles.delta, { backgroundColor: deltaPct >= 0 ? '#DCFCE7' : '#FEE2E2' }]}>
            <Ionicons
              name={deltaPct >= 0 ? 'trending-up' : 'trending-down'}
              size={11}
              color={deltaPct >= 0 ? '#16A34A' : '#DC2626'}
            />
            <Text style={[styles.deltaText, { color: deltaPct >= 0 ? '#15803D' : '#991B1B' }]}>
              {Math.abs(deltaPct)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function SectionTitle({ title, action, actionLabel, onAction }: any) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction} style={styles.primaryBtn} testID="section-action">
          <Ionicons name="add" size={16} color={colors.white} />
          <Text style={styles.primaryBtnText}>{actionLabel || 'Add'}</Text>
        </TouchableOpacity>
      ) : actionLabel ? (
        <TouchableOpacity onPress={onAction} style={styles.outlineBtn}>
          <Text style={styles.outlineBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Pill({ label, color = colors.primary, bg }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg || `${color}15` }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress, icon, testID, disabled }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.primaryBtn, disabled && { opacity: 0.5 }]}
      activeOpacity={0.8}
      testID={testID}
      disabled={disabled}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={16} color={colors.white} /> : null}
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function OutlineButton({ label, onPress, icon, testID }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.outlineBtn} activeOpacity={0.8} testID={testID}>
      {icon ? <MaterialCommunityIcons name={icon} size={16} color={colors.primary} /> : null}
      <Text style={styles.outlineBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: 20,
    ...shadow.card,
  },
  statCard: {
    flex: 1, minWidth: 200,
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: 18,
    ...shadow.card,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  statLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 12 },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 4 },
  statHint: { color: colors.textMuted, fontSize: 11 },
  delta: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  deltaText: { fontSize: 10, fontWeight: '700' },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  pillText: { fontSize: 11, fontWeight: '700' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.md,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.primary,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.md,
  },
  outlineBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
