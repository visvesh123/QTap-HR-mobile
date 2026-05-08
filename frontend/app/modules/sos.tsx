import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Easing, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { api } from '../../src/api';
import { colors, radii, shadow, spacing } from '../../src/theme';
import { Card, ScreenHeader } from '../../src/ui';

export default function SOS() {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const trigger = async () => {
    try {
      let lat: number | undefined; let lon: number | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
          lat = loc.coords.latitude; lon = loc.coords.longitude;
        }
      } catch {}
      const res = await api.sos({ latitude: lat, longitude: lon, message: 'Emergency assistance needed' });
      Alert.alert('🚨 SOS Broadcasted', `${res.message}\nETA: ${res.eta}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  const contacts = [
    { label: 'Campus Security', phone: '+91 99876 54321', icon: 'shield-account-outline' },
    { label: 'Medical Centre', phone: '+91 98765 43210', icon: 'medical-bag' },
    { label: 'Fire Emergency', phone: '101', icon: 'fire-truck' },
    { label: 'Women Helpline', phone: '1091', icon: 'human-female-girl' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="SOS Emergency" subtitle="Tap to broadcast for help" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <Text style={styles.kicker}>EMERGENCY ASSISTANCE</Text>
        <Text style={styles.title}>Press the button{`\n`}to broadcast SOS</Text>
        <Text style={styles.sub}>Security and emergency contacts are notified instantly with your live location.</Text>

        <View style={styles.btnArea}>
          <Animated.View style={[styles.pulse, { transform: [{ scale }], opacity }]} />
          <TouchableOpacity activeOpacity={0.85} onPress={trigger} testID="sos-trigger">
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.sosBtn}>
              <MaterialCommunityIcons name="shield-alert" size={56} color={colors.white} />
              <Text style={styles.sosText}>SOS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>Quick Contacts</Text>
        <View style={{ width: '100%', gap: spacing.sm }}>
          {contacts.map((c) => (
            <Card key={c.label}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={styles.contactIcon}>
                  <MaterialCommunityIcons name={c.icon as any} size={22} color={colors.sos} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{c.label}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{c.phone}</Text>
                </View>
                <View style={styles.callBtn}>
                  <Ionicons name="call" size={18} color={colors.white} />
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  kicker: { fontSize: 11, fontWeight: '800', color: colors.sos, letterSpacing: 2, marginTop: spacing.md },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: spacing.xs, lineHeight: 30 },
  sub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.md, lineHeight: 19 },
  btnArea: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl },
  pulse: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: colors.sos },
  sosBtn: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', ...shadow.cardHeavy },
  sosText: { color: colors.white, fontSize: 32, fontWeight: '800', letterSpacing: 4, marginTop: 4 },
  section: { fontSize: 14, fontWeight: '700', color: colors.text, alignSelf: 'flex-start', marginTop: spacing.xl, marginBottom: spacing.sm },
  contactIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
});
