import React, { useState } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** Airbnb-inspired tokens, keeping MU crimson as the brand accent. */
export const AB = {
  bg: '#FFFFFF',
  ink: '#222222',
  inkSoft: '#3F3F3F',
  muted: '#717171',
  line: '#EBEBEB',
  field: '#F7F7F7',
  white: '#FFFFFF',
  red: '#DC143C',
  redSoft: '#FCEEF1',
  star: '#222222',
};

export const AB_SHADOW = Platform.select({
  web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)' } as any,
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
});

export const AB_FAB_SHADOW = Platform.select({
  web: { boxShadow: '0 6px 16px rgba(0,0,0,0.28)' } as any,
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
});

export type CategoryTab = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export function SearchPill({
  value,
  onChangeText,
  placeholder = 'Start your search',
  subtitle,
  onFilter,
  testID,
  autoFocus,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  subtitle?: string;
  onFilter?: () => void;
  testID?: string;
  autoFocus?: boolean;
}) {
  return (
    <View style={s.searchWrap}>
      <View style={s.searchPill} testID={testID}>
        <View style={s.searchIcon}>
          <Ionicons name="search" size={18} color={AB.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={AB.ink}
            style={s.searchInput}
            autoFocus={autoFocus}
            returnKeyType="search"
            autoCorrect={false}
          />
          {!!subtitle && !value && (
            <Text style={s.searchSub} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>
        <TouchableOpacity
          style={s.filterBtn}
          onPress={onFilter}
          activeOpacity={0.8}
          testID={testID ? `${testID}-filter` : undefined}
        >
          <Ionicons name="options-outline" size={16} color={AB.ink} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function CategoryStrip({
  tabs,
  active,
  onChange,
  testIDPrefix = 'cat',
}: {
  tabs: CategoryTab[];
  active: string;
  onChange: (key: string) => void;
  testIDPrefix?: string;
}) {
  return (
    <View style={s.catWrap}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.catRow}
    >
      {tabs.map((tab) => {
        const on = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={s.catItem}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.75}
            testID={`${testIDPrefix}-${tab.key}`}
          >
            <Ionicons
              name={tab.icon}
              size={24}
              color={on ? AB.ink : '#B0B0B0'}
            />
            <Text style={[s.catLabel, on && s.catLabelOn]}>{tab.label}</Text>
            <View style={[s.catUnderline, on && s.catUnderlineOn]} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
    </View>
  );
}

export function ListingCard({
  image,
  title,
  subtitle,
  meta,
  rating,
  badge,
  onPress,
  testID,
  likeTestID,
  style,
}: {
  image: string | number;
  title: string;
  subtitle?: string;
  meta?: string;
  rating?: string;
  badge?: string;
  onPress: () => void;
  testID?: string;
  likeTestID?: string;
  style?: ViewStyle;
}) {
  const [liked, setLiked] = useState(false);
  const source = typeof image === 'number' ? image : { uri: image };

  return (
    <View style={[s.listing, style]}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress}
        testID={testID}
      >
        <View style={s.photoWrap}>
          <Image source={source} style={s.photo} />
          {!!badge && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <View style={s.listingBody}>
          <View style={s.titleRow}>
            <Text style={s.listingTitle} numberOfLines={1}>{title}</Text>
            {!!rating && (
              <View style={s.rating}>
                <Ionicons name="star" size={12} color={AB.star} />
                <Text style={s.ratingText}>{rating}</Text>
              </View>
            )}
          </View>
          {!!subtitle && (
            <Text style={s.listingSub} numberOfLines={1}>{subtitle}</Text>
          )}
          {!!meta && (
            <Text style={s.listingMeta} numberOfLines={1}>{meta}</Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={s.heart}
        onPress={() => setLiked((v) => !v)}
        hitSlop={10}
        testID={likeTestID || (testID ? `${testID}-like` : 'listing-like')}
      >
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={24}
          color={liked ? AB.red : AB.white}
          style={s.heartIcon}
        />
      </TouchableOpacity>
    </View>
  );
}

export function SectionHead({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={s.sectionHead}>
      <Text style={s.sectionTitle}>{title}</Text>
      {!!action && (
        <TouchableOpacity onPress={onAction} testID="events-see-all">
          <Text style={s.seeAll}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function WishlistCard({
  image,
  images,
  title,
  subtitle,
  avatars,
  onPress,
  testID,
}: {
  image?: string;
  images?: string[];
  title: string;
  subtitle?: string;
  avatars?: string[];
  onPress: () => void;
  testID?: string;
}) {
  const collage = (images && images.length >= 4) ? images.slice(0, 4) : null;
  return (
    <TouchableOpacity style={s.wishCard} activeOpacity={0.88} onPress={onPress} testID={testID}>
      <View style={s.wishPhoto}>
        {collage ? (
          <View style={s.wishCollage}>
            {collage.map((uri, i) => (
              <Image key={i} source={{ uri }} style={s.wishTile} />
            ))}
          </View>
        ) : (
          <Image source={{ uri: image }} style={s.wishImg} />
        )}
        {!!avatars?.length && (
          <View style={s.wishAvatars}>
            {avatars.slice(0, 3).map((uri, i) => (
              <Image key={i} source={{ uri }} style={s.wishAvatar} />
            ))}
          </View>
        )}
      </View>
      <Text style={s.wishTitle} numberOfLines={1}>{title}</Text>
      {!!subtitle && <Text style={s.wishSub} numberOfLines={1}>{subtitle}</Text>}
    </TouchableOpacity>
  );
}

export function MapFab({ onPress, label = 'Map' }: { onPress: () => void; label?: string }) {
  return (
    <TouchableOpacity style={s.fab} onPress={onPress} activeOpacity={0.9} testID="map-fab">
      <Text style={s.fabText}>{label}</Text>
      <Ionicons name="map" size={16} color={AB.white} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: AB.bg,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AB.white,
    borderRadius: 999,
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 8,
    minHeight: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AB.line,
    ...AB_SHADOW,
  },
  searchIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  searchInput: {
    fontSize: 14,
    fontWeight: '600',
    color: AB.ink,
    padding: 0,
    margin: 0,
    height: 20,
  },
  searchSub: {
    fontSize: 12,
    color: AB.muted,
    marginTop: 1,
  },
  filterBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: AB.line,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 6,
  },
  catWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AB.line,
    backgroundColor: AB.bg,
  },
  catRow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 4,
  },
  catItem: {
    minWidth: 78,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B0B0B0',
    marginTop: 6,
    marginBottom: 10,
  },
  catLabelOn: { color: AB.ink },
  catUnderline: {
    height: 2, width: '100%', borderRadius: 2, backgroundColor: 'transparent',
  },
  catUnderlineOn: { backgroundColor: AB.ink },

  listing: { marginBottom: 28, position: 'relative' },
  photoWrap: { position: 'relative', borderRadius: 12, overflow: 'hidden' },
  photo: {
    width: '100%',
    aspectRatio: 1.05,
    borderRadius: 12,
    backgroundColor: AB.field,
  },
  badge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: AB.white,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
    ...AB_SHADOW,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: AB.ink },
  heart: {
    position: 'absolute', top: 12, right: 12,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  heartIcon: {
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  listingBody: { paddingTop: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  listingTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: AB.ink },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 14, fontWeight: '500', color: AB.ink },
  listingSub: { fontSize: 15, color: AB.muted, marginTop: 2 },
  listingMeta: { fontSize: 15, color: AB.muted, marginTop: 2 },

  sectionHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, marginTop: 8,
  },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: AB.ink, letterSpacing: -0.4 },
  seeAll: { fontSize: 14, fontWeight: '600', color: AB.ink, textDecorationLine: 'underline' },

  fab: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AB.ink,
    paddingHorizontal: 18,
    height: 46,
    borderRadius: 999,
    ...AB_FAB_SHADOW,
  },
  fabText: { color: AB.white, fontSize: 14, fontWeight: '700' },

  wishCard: { width: '48%', marginBottom: 22 },
  wishPhoto: {
    width: '100%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden',
    backgroundColor: AB.field,
  },
  wishImg: { width: '100%', height: '100%' },
  wishCollage: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  wishTile: { width: '50%', height: '50%' },
  wishAvatars: { position: 'absolute', right: 8, bottom: 8, flexDirection: 'row' },
  wishAvatar: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: AB.white,
    backgroundColor: AB.field, marginLeft: -6,
  },
  wishTitle: { fontSize: 15, fontWeight: '600', color: AB.ink, marginTop: 10 },
  wishSub: { fontSize: 13, color: AB.muted, marginTop: 2 },
});
