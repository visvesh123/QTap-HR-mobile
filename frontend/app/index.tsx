import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/auth';
import { colors } from '../src/theme';

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
        <MaterialCommunityIcons name="school" size={56} color={colors.white} />
      </View>
      <Text style={styles.title}>Campus Hub</Text>
      <Text style={styles.subtitle}>One app for every campus moment</Text>
      <ActivityIndicator color={colors.white} style={{ marginTop: 32 }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 96, height: 96, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 32, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6 },
});
