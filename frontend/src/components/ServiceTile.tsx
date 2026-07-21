import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../theme';
import type { ServiceItem } from '../services-catalog';

function UpcomingBadge({ testID }: { testID?: string }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] });
  return (
    <Animated.View style={[styles.upcomingBadge, { transform: [{ scale }], opacity }]} testID={testID}>
      <MaterialCommunityIcons name="clock-outline" size={10} color={colors.white} />
      <Text style={styles.upcomingBadgeText}>UPCOMING</Text>
    </Animated.View>
  );
}

export type ServiceTileProps = {
  service: ServiceItem;
  width: number;
  caption: string;
  upcoming?: boolean;
  onPress: () => void;
};

export function ServiceTile({ service, width, caption, upcoming = false, onPress }: ServiceTileProps) {
  const Icon = service.iconLib === 'mci' ? MaterialCommunityIcons : Ionicons;
  return (
    <TouchableOpacity
      style={[styles.tile, { width }]}
      onPress={onPress}
      activeOpacity={upcoming ? 1 : 0.85}
      disabled={upcoming}
      testID={`service-tile-${service.key}`}
    >
      {upcoming && <UpcomingBadge testID={`upcoming-badge-${service.key}`} />}
      <View style={[styles.tileBody, upcoming && styles.contentDim]}>
        <View style={[styles.iconChip, { backgroundColor: `${service.color}1A` }, upcoming && styles.iconChipDim]}>
          <Icon name={service.icon as any} size={26} color={upcoming ? colors.textMuted : service.color} />
        </View>
        <Text style={styles.tileLabel} numberOfLines={1}>{service.label}</Text>
        <Text style={styles.tileCaption} numberOfLines={1}>{caption}</Text>
      </View>
      <View style={[styles.accent, { backgroundColor: upcoming ? colors.border : service.color }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: 8,
    alignItems: 'center',
    minHeight: 132,
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.card,
  },
  iconChip: {
    width: 54, height: 54, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  iconChipDim: { backgroundColor: '#EEF1F4' },
  tileBody: { alignItems: 'center', width: '100%' },
  contentDim: { opacity: 0.5 },
  upcomingBadge: {
    position: 'absolute', top: 8, right: 8, zIndex: 3,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 4,
    shadowColor: '#F59E0B', shadowOpacity: 0.45, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  upcomingBadgeText: { fontSize: 9.5, fontWeight: '900', color: colors.white, letterSpacing: 0.6 },
  tileLabel: { fontSize: 13, fontWeight: '800', color: colors.text, textAlign: 'center' },
  tileCaption: { fontSize: 10.5, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  accent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
});
