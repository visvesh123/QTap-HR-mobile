import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/auth';
import { colors, BRAND } from '../src/theme';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (user) router.replace('/(tabs)');
      else router.replace('/login');
    }, 1100);
    return () => clearTimeout(t);
  }, [loading, user]);

  return (
    <LinearGradient colors={['#FFFFFF', '#FFE7EC']} style={styles.container}>
      <View style={styles.logoCard} testID="splash-logo">
        <Image source={{ uri: BRAND.logoUrl }} style={styles.muLogo} resizeMode="contain" />
      </View>
      <Text style={styles.brand}>{BRAND.name.toUpperCase()}</Text>
      <View style={styles.wmRow}>
        <Text style={styles.wmMU}>MU</Text>
        <Text style={styles.wmOne}>One</Text>
      </View>
      <Text style={styles.subtitle}>{BRAND.tagline}</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />

      <View style={styles.footer}>
        <Text style={styles.poweredText}>Powered by</Text>
        <Image source={{ uri: BRAND.poweredByLogoUrl }} style={styles.qtapLogo} resizeMode="contain" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logoCard: {
    width: 140, height: 140, borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 8,
  },
  muLogo: { width: 88, height: 88 },
  brand: { fontSize: 12, fontWeight: '800', color: colors.primary, letterSpacing: 3, marginTop: 4 },
  wmRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  wmMU: { fontSize: 40, fontWeight: '900', color: colors.primary, letterSpacing: -0.5 },
  wmOne: { fontSize: 40, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 6, fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 40, alignItems: 'center', flexDirection: 'row', gap: 8 },
  poweredText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  qtapLogo: { width: 70, height: 24 },
});
