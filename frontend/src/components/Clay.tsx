import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, spacing, clay } from '../theme';

/**
 * Soft chunky "clay" card. Slightly elevated, rounded corners, gentle gradient
 * to simulate top-left light source.
 */
export function ClayCard({
  children, style, testID, tint,
}: { children: React.ReactNode; style?: any; testID?: string; tint?: string }) {
  return (
    <View style={[s.card, tint ? { backgroundColor: tint } : null, style]} testID={testID}>
      {/* Highlight overlay (only visible on white-ish surfaces) */}
      <View pointerEvents="none" style={s.cardHighlight} />
      {children}
    </View>
  );
}

/** Pill-shaped clay button — primary action. */
export function ClayButton({
  label, onPress, icon, tone = 'primary', testID, style, disabled, small,
}: {
  label: string;
  onPress?: () => void;
  icon?: string;
  tone?: 'primary' | 'success' | 'neutral' | 'soft';
  testID?: string;
  style?: ViewStyle;
  disabled?: boolean;
  small?: boolean;
}) {
  const gradient =
    tone === 'primary' ? [colors.primaryLight, colors.primary, colors.primaryDark] :
    tone === 'success' ? ['#5DD39E', '#22C55E', '#15803D'] :
    tone === 'soft' ? ['#FFFFFF', '#F4EDE7'] :
    ['#FFFFFF', '#E8E0D6'];
  const textColor = tone === 'neutral' || tone === 'soft' ? colors.text : '#FFFFFF';
  const Icon = icon?.includes('-') && icon?.length > 3 ? MaterialCommunityIcons : Ionicons;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={[
        s.btnWrap,
        tone === 'primary' ? clay.crimson : clay.surfaceSoft,
        small && { borderRadius: 18 },
        disabled && { opacity: 0.55 },
        style,
      ]}
    >
      <LinearGradient
        colors={gradient as any}
        start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={[s.btn, small && { paddingVertical: 10, paddingHorizontal: 16 }]}
      >
        {icon ? (
          <Icon name={icon as any} size={small ? 16 : 20} color={textColor} />
        ) : null}
        <Text style={[s.btnText, { color: textColor }, small && { fontSize: 13 }]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/** Round chip with clay shadow. */
export function ClayChip({
  label, active, onPress, color, testID,
}: { label: string; active?: boolean; onPress?: () => void; color?: string; testID?: string }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      testID={testID}
      style={[
        s.chip,
        active ? (clay.crimson as any) : (clay.surfaceSoft as any),
        active && { backgroundColor: color || colors.primary },
      ]}
    >
      <Text style={[s.chipText, active && { color: '#FFFFFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Stat tile with a pastel coloured icon orb. */
export function ClayStat({
  label, value, icon, iconColor = colors.primary, tint = colors.clayPink, sub,
}: { label: string; value: string | number; icon: string; iconColor?: string; tint?: string; sub?: string }) {
  return (
    <View style={[s.stat, clay.surface as any]}>
      <View style={[s.statOrb, { backgroundColor: tint }, clay.surfaceSoft as any]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub ? <Text style={s.statSub}>{sub}</Text> : null}
    </View>
  );
}

/** Inset clay surface (looks "pressed in" — perfect for inputs / pressed states). */
export function ClayInset({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.inset, clay.pressed as any, style]}>{children}</View>;
}

/** Inset clay input row with optional left/right icon slots. */
export function ClayInput({
  children, style,
}: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[s.clayInput, clay.pressed as any, style]}>
      {children}
    </View>
  );
}

/** Section label (UPPERCASE tracked) commonly used above clay surfaces. */
export function ClayLabel({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[s.clayLabel, style]}>{children}</Text>;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.clay,
    padding: spacing.md,
    position: 'relative',
    ...(clay.surface as any),
  },
  cardHighlight: {
    position: 'absolute',
    top: 1, left: 1, right: 1, height: 14,
    borderTopLeftRadius: radii.clay - 1,
    borderTopRightRadius: radii.clay - 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    opacity: Platform.OS === 'web' ? 0 : 0.5,
  },
  btnWrap: {
    borderRadius: 26,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 26,
  },
  btnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.text },
  stat: {
    flex: 1,
    minWidth: 130,
    backgroundColor: colors.white,
    borderRadius: radii.clay,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  statOrb: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginTop: 2 },
  statSub: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  inset: {
    backgroundColor: colors.clayBgSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  clayInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.clayBgSoft,
    borderRadius: radii.clay,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  clayLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: colors.clayMuted,
    textTransform: 'uppercase',
  },
});
