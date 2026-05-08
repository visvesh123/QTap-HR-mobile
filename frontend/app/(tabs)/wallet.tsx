import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/api';
import { colors, radii, shadow, spacing, typo } from '../../src/theme';
import { Card, SectionHeader, Empty } from '../../src/ui';
import { useAuth } from '../../src/auth';

export default function Wallet() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [w, r] = await Promise.all([api.wallet(), api.rewardsStore()]);
        setData(w); setRewards(r);
      } catch {}
    })();
  }, []);

  if (user?.role !== 'student') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ padding: spacing.md }}>
          <Text style={styles.heading}>Campus Wallet</Text>
        </View>
        <Empty icon="wallet-outline" message={'Wallet is currently available\nfor students only'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.md }}>
          <Text style={styles.heading}>Campus Wallet</Text>
          <Text style={styles.sub}>Spend, earn, and redeem on campus</Text>
        </View>

        <LinearGradient
          colors={[colors.primaryDark, colors.primaryLight]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
              <Text style={styles.balanceAmount} testID="wallet-balance">₹{data?.balance ?? '—'}</Text>
            </View>
            <View style={styles.cardChip}>
              <MaterialCommunityIcons name="contactless-payment" size={28} color={colors.white} />
            </View>
          </View>

          <View style={styles.rewardRow}>
            <Ionicons name="star" size={16} color={colors.gold} />
            <Text style={styles.rewardText}>
              {data?.reward_points ?? 0} Reward Points
            </Text>
          </View>

          <View style={styles.actionRow}>
            <ActionBtn icon="add-circle" label="Add Money" />
            <ActionBtn icon="qr-code" label="Scan & Pay" />
            <ActionBtn icon="swap-horizontal" label="Transfer" />
          </View>
        </LinearGradient>

        <SectionHeader title="Recent Transactions" />
        <View style={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
          {(data?.transactions ?? []).map((t: any) => (
            <Card key={t.id} testID={`txn-${t.id}`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={[styles.txnIcon, { backgroundColor: t.type === 'credit' ? '#10B98120' : '#EF444420' }]}>
                  <Ionicons
                    name={t.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                    size={18}
                    color={t.type === 'credit' ? colors.success : colors.sos}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txnDesc}>{t.description}</Text>
                  <Text style={styles.txnDate}>{new Date(t.date).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.txnAmount, { color: t.type === 'credit' ? colors.success : colors.sos }]}>
                  {t.type === 'credit' ? '+' : '−'}₹{t.amount}
                </Text>
              </View>
            </Card>
          ))}
        </View>

        <SectionHeader title="Rewards Store" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardScroll}>
          {rewards.map((r) => (
            <TouchableOpacity key={r.id} style={styles.rewardCard} activeOpacity={0.85} testID={`reward-${r.id}`}>
              <Image source={{ uri: r.image }} style={styles.rewardImg} />
              <View style={{ padding: spacing.sm }}>
                <Text style={styles.rewardTitle} numberOfLines={2}>{r.title}</Text>
                <View style={styles.rewardPts}>
                  <Ionicons name="star" size={11} color={colors.gold} />
                  <Text style={styles.rewardPtsText}>{r.points} pts</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const ActionBtn = ({ icon, label }: any) => (
  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
    <Ionicons name={icon} size={20} color={colors.white} />
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heading: { ...typo.h2, color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  balanceCard: {
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    ...shadow.cardHeavy,
  },
  balanceLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 1.5, fontWeight: '700' },
  balanceAmount: { fontSize: 36, color: colors.white, fontWeight: '800', marginTop: 4, letterSpacing: -1 },
  cardChip: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  rewardText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  actionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: spacing.lg, gap: 8,
  },
  actionBtn: {
    flex: 1, alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 10, borderRadius: 12,
  },
  actionLabel: { color: colors.white, fontSize: 11, fontWeight: '600' },
  txnIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txnDesc: { fontSize: 14, fontWeight: '600', color: colors.text },
  txnDate: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '700' },
  rewardScroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  rewardCard: {
    width: 150, marginRight: spacing.sm,
    backgroundColor: colors.white, borderRadius: radii.lg, overflow: 'hidden',
    ...shadow.card,
  },
  rewardImg: { width: '100%', height: 90 },
  rewardTitle: { fontSize: 12, fontWeight: '700', color: colors.text, lineHeight: 16 },
  rewardPts: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, backgroundColor: colors.goldLight,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start',
  },
  rewardPtsText: { fontSize: 10, fontWeight: '700', color: colors.gold },
});
