import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { colors, radii, shadow, spacing } from '../../src/theme';
import { Card, Pill, Badge, ScreenHeader, Empty } from '../../src/ui';

export default function Library() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<'browse' | 'mine' | 'access'>('browse');
  const [q, setQ] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (query?: string) => {
    setLoading(true);
    try { setBooks(await api.books(query)); } catch {}
    setLoading(false);
  };

  useEffect(() => { search(); api.myIssues().then(setIssues).catch(() => {}); }, []);

  const issueBook = async (id: string) => {
    try {
      await api.issueBook(id);
      Alert.alert('Issued', 'Book issued successfully. Due in 14 days.');
      await search(q); setIssues(await api.myIssues());
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Library" subtitle="Koha LMS • RFID Access" onBack={() => router.back()} />
      <View style={styles.tabs}>
        <Pill label="Browse" active={tab === 'browse'} onPress={() => setTab('browse')} testID="tab-browse" />
        <Pill label="My Books" active={tab === 'mine'} onPress={() => setTab('mine')} testID="tab-mine" />
        <Pill label="RFID Pass" active={tab === 'access'} onPress={() => setTab('access')} testID="tab-rfid" />
      </View>

      {tab === 'browse' && (
        <>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              value={q} onChangeText={setQ}
              onSubmitEditing={() => search(q)}
              placeholder="Search title or author"
              placeholderTextColor={colors.textMuted}
              style={styles.search}
              testID="library-search"
            />
            {!!q && (
              <TouchableOpacity onPress={() => { setQ(''); search(''); }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : (
            <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
              {books.map((b) => (
                <Card key={b.id} style={{ marginBottom: spacing.sm }} testID={`book-${b.id}`}>
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <Image source={{ uri: b.cover }} style={styles.cover} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bookTitle} numberOfLines={2}>{b.title}</Text>
                      <Text style={styles.bookAuthor}>{b.author}</Text>
                      <Text style={styles.bookCat}>{b.category} • {b.isbn}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <Badge
                          label={b.available ? 'AVAILABLE' : 'ISSUED'}
                          color={b.available ? colors.success : colors.sos}
                        />
                        <TouchableOpacity
                          disabled={!b.available}
                          onPress={() => issueBook(b.id)}
                          style={[styles.issueBtn, { opacity: b.available ? 1 : 0.5 }]}
                          testID={`issue-${b.id}`}
                        >
                          <Text style={styles.issueBtnText}>Issue</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {tab === 'mine' && (
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          {issues.length === 0 ? <Empty icon="book-outline" message="You have no issued books" /> : issues.map((i) => (
            <Card key={i.id} style={{ marginBottom: spacing.sm }} testID={`issue-${i.id}`}>
              <Text style={styles.bookTitle}>{i.book_title}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={styles.metaText}>Issued: {new Date(i.issued_at).toLocaleDateString()}</Text>
                <Text style={[styles.metaText, { color: colors.warning }]}>Due: {new Date(i.due_at).toLocaleDateString()}</Text>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {tab === 'access' && (
        <ScrollView contentContainerStyle={{ padding: spacing.md, alignItems: 'center' }}>
          <Card style={{ alignItems: 'center', padding: spacing.lg, alignSelf: 'stretch' }}>
            <View style={styles.rfidIcon}>
              <MaterialCommunityIcons name="contactless-payment" size={36} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.sm }}>RFID Library Pass</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Tap at the gate for entry</Text>
            <View style={{ marginTop: spacing.md, padding: 8, backgroundColor: colors.white, borderRadius: 12 }}>
              <QRCode value={`LIB|${user?.id}|${user?.role}`} size={180} color={colors.primaryDark} />
            </View>
            <Text style={{ marginTop: spacing.md, fontSize: 13, fontWeight: '700', color: colors.text }}>{user?.name}</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>{user?.student_id ?? user?.employee_id}</Text>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', padding: spacing.md, gap: 8 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.white, marginHorizontal: spacing.md,
    borderRadius: radii.md, paddingHorizontal: spacing.md, height: 44,
    borderWidth: 1, borderColor: colors.border,
  },
  search: { flex: 1, fontSize: 14, color: colors.text },
  cover: { width: 64, height: 84, borderRadius: 8, backgroundColor: colors.background },
  bookTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  bookAuthor: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  bookCat: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  metaText: { fontSize: 11, color: colors.textSecondary },
  issueBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  issueBtnText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  rfidIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
});
