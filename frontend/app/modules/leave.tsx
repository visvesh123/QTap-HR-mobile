import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';
import { colors, radii, spacing, typo, shadow } from '../../src/theme';
import { Card, ScreenHeader, SectionHeader, Badge, Empty } from '../../src/ui';

const TYPES = ['Casual', 'Sick', 'Earned'] as const;
const TYPE_COLOR: Record<string, string> = { Casual: '#7D3ECF', Sick: '#0EA5E9', Earned: '#16A34A' };
const STATUS_COLOR: Record<string, string> = { Pending: '#F59E0B', Approved: '#16A34A', Rejected: '#EF4444' };

export default function Leave() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balances, setBalances] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  const [type, setType] = useState<string>('Casual');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.leaveSummary();
      setBalances(res.balances || []);
      setRequests(res.requests || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s.trim());

  const submit = async () => {
    if (!validDate(from) || !validDate(to)) {
      Alert.alert('Invalid dates', 'Please enter dates as YYYY-MM-DD.');
      return;
    }
    setSubmitting(true);
    try {
      await api.leaveApply({ type, from_date: from.trim(), to_date: to.trim(), reason: reason.trim() });
      setFrom(''); setTo(''); setReason('');
      await load();
      Alert.alert('Request submitted', 'Your leave request is pending approval.');
    } catch (e: any) {
      Alert.alert('Could not submit', e.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Leaves" onBack={() => router.back()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Leaves" subtitle="Balances & requests" onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
          {/* Balances */}
          <SectionHeader title="Leave Balance" />
          <View style={styles.balanceRow}>
            {balances.map((b) => (
              <View key={b.type} style={styles.balanceCard} testID={`balance-${b.type}`}>
                <View style={[styles.balanceDot, { backgroundColor: TYPE_COLOR[b.type] || colors.primary }]} />
                <Text style={styles.balanceValue}>{b.remaining}</Text>
                <Text style={styles.balanceTotal}>of {b.total}</Text>
                <Text style={styles.balanceLabel}>{b.type}</Text>
              </View>
            ))}
          </View>

          {/* Apply */}
          <SectionHeader title="Apply for Leave" />
          <Card style={{ marginHorizontal: spacing.md }}>
            <Text style={styles.fieldLabel}>Leave type</Text>
            <View style={styles.segment}>
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.segBtn, type === t && { backgroundColor: TYPE_COLOR[t] }]}
                  onPress={() => setType(t)}
                  testID={`type-${t}`}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segText, type === t && { color: colors.white }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>From</Text>
                <View style={styles.input}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                  <TextInput
                    style={styles.inputText}
                    value={from}
                    onChangeText={setFrom}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    testID="leave-from"
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>To</Text>
                <View style={styles.input}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                  <TextInput
                    style={styles.inputText}
                    value={to}
                    onChangeText={setTo}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    testID="leave-to"
                  />
                </View>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Reason</Text>
            <View style={[styles.input, { alignItems: 'flex-start', height: 76 }]}>
              <TextInput
                style={[styles.inputText, { height: '100%' }]}
                value={reason}
                onChangeText={setReason}
                placeholder="Brief reason for leave"
                placeholderTextColor={colors.textMuted}
                multiline
                testID="leave-reason"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={submit}
              disabled={submitting}
              testID="leave-submit"
              activeOpacity={0.9}
            >
              {submitting ? <ActivityIndicator color={colors.white} /> : (
                <>
                  <Ionicons name="send" size={16} color={colors.white} />
                  <Text style={styles.submitText}>Submit Request</Text>
                </>
              )}
            </TouchableOpacity>
          </Card>

          {/* History */}
          <SectionHeader title="My Requests" />
          <View style={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
            {requests.length === 0 ? (
              <Empty icon="document-text-outline" message="No leave requests yet" />
            ) : requests.map((r) => (
              <Card key={r.id} testID={`request-${r.id}`}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.balanceDot, { backgroundColor: TYPE_COLOR[r.type] || colors.primary, marginBottom: 0 }]} />
                    <Text style={styles.reqType}>{r.type} Leave · {r.days}d</Text>
                  </View>
                  <Badge label={r.status} color={STATUS_COLOR[r.status] || colors.textMuted} />
                </View>
                <Text style={styles.reqDates}>{r.from_date} → {r.to_date}</Text>
                {!!r.reason && <Text style={styles.reqReason}>{r.reason}</Text>}
              </Card>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  balanceRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm },
  balanceCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: radii.lg,
    padding: spacing.md, alignItems: 'center', ...shadow.card,
  },
  balanceDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 8 },
  balanceValue: { fontSize: 26, fontWeight: '800', color: colors.text },
  balanceTotal: { fontSize: 11, color: colors.textMuted, marginTop: -2 },
  balanceLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, marginTop: 4 },
  segment: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  segBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center',
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
  },
  segText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.background, borderRadius: radii.md,
    paddingHorizontal: 12, height: 46, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  inputText: { flex: 1, fontSize: 14, color: colors.text },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 999, marginTop: spacing.sm,
  },
  submitText: { color: colors.white, fontSize: 15, fontWeight: '800' },

  reqType: { fontSize: 14, fontWeight: '700', color: colors.text },
  reqDates: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  reqReason: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
