import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { colors, radii, spacing } from '../../src/theme';
import { Card, Pill, Badge, ScreenHeader, PrimaryButton, Empty } from '../../src/ui';

export default function Hostel() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<'room' | 'complaint' | 'list'>('room');
  const [room, setRoom] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState('Maintenance');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isWarden = user?.department === 'Hostel' || user?.role === 'admin';

  useEffect(() => {
    if (user?.role === 'student') api.myRoom().then(setRoom).catch(() => {});
    api.complaints().then(setComplaints).catch(() => {});
  }, [user]);

  const submit = async () => {
    if (!title || !desc) { Alert.alert('Missing', 'Please add title and description'); return; }
    setSubmitting(true);
    try {
      await api.createComplaint({ title, category: cat, description: desc });
      Alert.alert('Submitted', 'Your complaint has been registered');
      setTitle(''); setDesc(''); setCat('Maintenance');
      setComplaints(await api.complaints());
      setTab('list');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Hostel" subtitle="Room • Complaints" onBack={() => router.back()} />
      <View style={styles.tabs}>
        {user?.role === 'student' && <Pill label="My Room" active={tab === 'room'} onPress={() => setTab('room')} testID="tab-room" />}
        <Pill label="Raise Complaint" active={tab === 'complaint'} onPress={() => setTab('complaint')} testID="tab-complaint" />
        <Pill label={isWarden ? 'All Complaints' : 'My Complaints'} active={tab === 'list'} onPress={() => setTab('list')} testID="tab-list" />
      </View>

      {tab === 'room' && (
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
          {!room ? <ActivityIndicator color={colors.primary} /> : (
            <>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View>
                    <Text style={styles.kicker}>YOUR ROOM</Text>
                    <Text style={styles.bigTitle}>{room.room}</Text>
                    <Text style={styles.subtitle}>{room.hostel} • Block {room.block} • Floor {room.floor}</Text>
                  </View>
                  <Badge label={room.occupancy} color={colors.primary} />
                </View>
                <View style={styles.metaGrid}>
                  <Meta icon="cash-outline" label="Rent" value={room.monthly_rent} />
                  <Meta icon="person-outline" label="Warden" value={room.warden} />
                </View>
              </Card>

              <Text style={styles.section}>Roommates</Text>
              {room.roommates?.map((r: any, i: number) => (
                <Card key={i} style={{ marginTop: spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{r.name.split(' ').map((p: string) => p[0]).join('')}</Text></View>
                    <View>
                      <Text style={{ fontWeight: '700', color: colors.text }}>{r.name}</Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>{r.year} • {r.department}</Text>
                    </View>
                  </View>
                </Card>
              ))}

              <Text style={styles.section}>Facilities</Text>
              <View style={styles.chips}>
                {(room.facilities ?? []).map((f: string) => (
                  <View key={f} style={styles.chip}><Text style={styles.chipText}>{f}</Text></View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {tab === 'complaint' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: spacing.md }}>
            <Card>
              <Text style={styles.label}>Category</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {['Maintenance', 'Cleanliness', 'Mess', 'Safety', 'Other'].map((c) => (
                  <Pill key={c} label={c} active={cat === c} onPress={() => setCat(c)} testID={`cat-${c}`} />
                ))}
              </View>
              <Text style={[styles.label, { marginTop: spacing.md }]}>Title</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="Brief title" placeholderTextColor={colors.textMuted} style={styles.input} testID="complaint-title" />
              <Text style={[styles.label, { marginTop: spacing.md }]}>Description</Text>
              <TextInput value={desc} onChangeText={setDesc} placeholder="Describe the issue..." placeholderTextColor={colors.textMuted} multiline numberOfLines={5} style={[styles.input, { height: 110, textAlignVertical: 'top' }]} testID="complaint-desc" />
              <PrimaryButton label="Submit Complaint" onPress={submit} loading={submitting} testID="complaint-submit" style={{ marginTop: spacing.md }} />
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {tab === 'list' && (
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          {complaints.length === 0 ? <Empty icon="file-tray-outline" message="No complaints to show" /> :
            complaints.map((c) => (
              <Card key={c.id} style={{ marginBottom: spacing.sm }} testID={`complaint-${c.id}`}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge label={c.category.toUpperCase()} color={colors.primary} />
                  <Badge label={c.status.toUpperCase()} color={c.status === 'open' ? colors.warning : colors.success} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 8 }}>{c.title}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{c.description}</Text>
                {isWarden && <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6 }}>by {c.user_name}</Text>}
              </Card>
            ))
          }
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const Meta = ({ icon, label, value }: any) => (
  <View style={{ flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
    <Ionicons name={icon} size={14} color={colors.textSecondary} />
    <View><Text style={{ fontSize: 10, color: colors.textMuted }}>{label}</Text><Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>{value}</Text></View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', padding: spacing.md, gap: 8, flexWrap: 'wrap' },
  kicker: { fontSize: 10, fontWeight: '700', color: colors.gold, letterSpacing: 1.5 },
  bigTitle: { fontSize: 32, fontWeight: '800', color: colors.text, marginTop: 4, letterSpacing: -1 },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  metaGrid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  section: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: 4 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', color: colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { backgroundColor: colors.primaryBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.md,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 14, backgroundColor: colors.white,
  },
});
