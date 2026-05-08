import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
      else router.replace('/role-select');
    }, 900);
    return () => clearTimeout(t);
  }, [loading, user]);

  return (
    <LinearGradient
      colors={[colors.primaryDark, colors.primaryLight]}
      style={styles.container}
    >
      <View style={styles.logo} testID="splash-logo">
        <Text style={styles.logoLetter}>M</Text>
      </View>
      <Text style={styles.kicker}>{BRAND.name.toUpperCase()}</Text>
      <Text style={styles.title}>Campus Hub</Text>
      <Text style={styles.subtitle}>{BRAND.tagline}</Text>
      <ActivityIndicator color={colors.white} style={{ marginTop: 32 }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 110, height: 110, borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  logoLetter: { fontSize: 64, fontWeight: '900', color: colors.primary, letterSpacing: -2, marginTop: -6 },
  kicker: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.95)', letterSpacing: 3 },
  title: { fontSize: 36, fontWeight: '800', color: colors.white, letterSpacing: -0.5, marginTop: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontStyle: 'italic' },
});
