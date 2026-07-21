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
      <Image
        source={BRAND.logo}
        style={styles.logo}
        resizeMode="contain"
        testID="splash-logo"
        accessibilityLabel="MUOne — Connected by One."
      />
      <ActivityIndicator color={colors.primary} style={{ marginTop: 36 }} />

      <View style={styles.footer}>
        <Text style={styles.poweredText}>Powered by</Text>
        <Image source={{ uri: BRAND.poweredByLogoUrl }} style={styles.qtapLogo} resizeMode="contain" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo: { width: 280, height: 118 },
  footer: { position: 'absolute', bottom: 40, alignItems: 'center', flexDirection: 'row', gap: 8 },
  poweredText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  qtapLogo: { width: 70, height: 24 },
});
