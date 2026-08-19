import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  Alert, Modal, Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { C } from '../lib/theme';
import { getExps, delExp } from '../lib/storage';
import { fmtDate, fmtDateTime, fmtGBP } from '../lib/helpers';
import Card from '../components/Card';
import type { Expense } from '../lib/types';

const { width: SCREEN_W } = Dimensions.get('window');

const catIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  Fuel: 'flame', Meals: 'restaurant', Parking: 'car',
  Tolls: 'cash', Repairs: 'build', Other: 'ellipsis-horizontal',
};
const catColor: Record<string, string> = {
  Fuel: C.orange, Meals: C.accent, Parking: C.primary,
  Tolls: C.purple, Repairs: C.warn, Other: C.textSec,
};

function DRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={drs.row}>
      <Ionicons name={icon} size={17} color={C.textMut} />
      <View style={{ flex: 1 }}>
        <Text style={drs.lbl}>{label}</Text>
        <Text style={drs.val}>{value || 'Not set'}</Text>
      </View>
    </View>
  );
}
const drs = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  lbl: { fontSize: 11, color: C.textSec },
  val: { fontSize: 15, fontWeight: '500', color: C.text },
});

export default function ExpenseDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { id: eid } = route.params;
  const [exp, setExp] = useState<Expense | null>(null);
  const [showFullScreen, setShowFullScreen] = useState(false);

  useEffect(() => {
    (async () => {
      const all = await getExps();
      setExp(all.find(e => e.id === eid) || null);
    })();
  }, [eid]);

  if (!exp) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={{ color: C.textSec }}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cc = catColor[exp.category] || C.textMut;

  const handleDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await delExp(eid); nav.goBack(); },
      },
    ]);
  };

  const uploadStatusLabel = () => {
    if (!exp.receiptPhoto) return null;
    switch (exp.receiptUploadStatus) {
      case 'uploaded': return { icon: 'cloud-done' as const, text: 'Synced', color: C.success };
      case 'failed': return { icon: 'cloud-offline' as const, text: 'Sync failed', color: C.danger };
      case 'pending':
      default: return { icon: 'cloud-offline-outline' as const, text: 'Saved offline — will sync later', color: C.textMut };
    }
  };

  const syncInfo = uploadStatusLabel();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Expense Detail</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={C.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount hero */}
        <View style={[styles.amtHero, { backgroundColor: cc + '12' }]}>
          <View style={[styles.catIconLarge, { backgroundColor: cc + '25' }]}>
            <Ionicons name={catIcon[exp.category] || 'cash'} size={28} color={cc} />
          </View>
          <Text style={[styles.amtText, { color: cc }]}>{fmtGBP(exp.amount)}</Text>
          <Text style={styles.amtCategory}>{exp.category}</Text>
        </View>

        {/* Details card */}
        <Card>
          <DRow icon="calendar" label="Date" value={fmtDate(exp.date)} />
          <View style={styles.div} />
          <DRow icon="pricetag" label="Category" value={exp.category} />
          <View style={styles.div} />
          <DRow icon="cash" label="Amount" value={fmtGBP(exp.amount)} />
          {exp.note ? (
            <>
              <View style={styles.div} />
              <DRow icon="chatbox" label="Note" value={exp.note} />
            </>
          ) : null}
        </Card>

        {/* Receipt Photo Section */}
        <Text style={styles.secTitle}>Receipt</Text>

        {exp.receiptPhoto ? (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {/* Sync status */}
            {syncInfo && (
              <View style={styles.syncRow}>
                <View style={[styles.syncBadge, { backgroundColor: syncInfo.color + '15' }]}>
                  <Ionicons name={syncInfo.icon} size={14} color={syncInfo.color} />
                  <Text style={[styles.syncTxt, { color: syncInfo.color }]}>{syncInfo.text}</Text>
                </View>
                {exp.receiptCreatedAt && (
                  <Text style={styles.receiptDate}>
                    Captured {fmtDateTime(exp.receiptCreatedAt)}
                  </Text>
                )}
              </View>
            )}

            {/* Thumbnail — tap to open full-screen */}
            <TouchableOpacity
              style={styles.receiptThumbWrap}
              onPress={() => setShowFullScreen(true)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: exp.receiptPhoto }}
                style={styles.receiptThumb}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.expandOverlay}>
                <View style={styles.expandPill}>
                  <Ionicons name="expand" size={16} color="#FFF" />
                  <Text style={styles.expandTxt}>View full size</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Card>
        ) : (
          <Card>
            <View style={styles.noReceipt}>
              <View style={styles.noReceiptIcon}>
                <Ionicons name="receipt-outline" size={32} color={C.textMut} />
              </View>
              <Text style={styles.noReceiptTitle}>No receipt attached</Text>
              <Text style={styles.noReceiptSub}>Edit this expense to add a receipt photo</Text>
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actRow}>
          <TouchableOpacity
            style={[styles.actBtn, { backgroundColor: C.primary }]}
            onPress={() => nav.navigate('AddExpense', { editId: exp.id })}
          >
            <Ionicons name="create" size={18} color="#FFF" />
            <Text style={styles.actBtnTxt}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actBtn, { backgroundColor: C.danger + '20', borderWidth: 1, borderColor: C.danger + '40' }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={18} color={C.danger} />
            <Text style={[styles.actBtnTxt, { color: C.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.ts}>Created: {fmtDateTime(exp.createdAt)}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Full-screen receipt viewer */}
      <Modal visible={showFullScreen} animationType="fade" transparent statusBarTranslucent>
        <View style={styles.fullOverlay}>
          <SafeAreaView style={styles.fullSafe}>
            <View style={styles.fullHeader}>
              <TouchableOpacity style={styles.fullClose} onPress={() => setShowFullScreen(false)}>
                <Ionicons name="close" size={26} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.fullTitle}>Receipt — {fmtGBP(exp.amount)}</Text>
              <View style={{ width: 44 }} />
            </View>
            {exp.receiptPhoto && (
              <View style={styles.fullImageWrap}>
                <Image
                  source={{ uri: exp.receiptPhoto }}
                  style={styles.fullImage}
                  contentFit="contain"
                  transition={300}
                />
              </View>
            )}
            {exp.receiptCreatedAt && (
              <Text style={styles.fullFooter}>
                Captured {fmtDateTime(exp.receiptCreatedAt)}
              </Text>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 40 },
  screenTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  content: { padding: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  amtHero: {
    alignItems: 'center', paddingVertical: 28, borderRadius: 18, marginBottom: 16, gap: 8,
  },
  catIconLarge: {
    width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  amtText: { fontSize: 36, fontWeight: '800' },
  amtCategory: { fontSize: 14, fontWeight: '600', color: C.textSec },

  div: { height: 1, backgroundColor: C.border },
  secTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 16, marginBottom: 10 },

  // Receipt thumbnail
  syncRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  syncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  syncTxt: { fontSize: 12, fontWeight: '600' },
  receiptDate: { fontSize: 11, color: C.textMut },
  receiptThumbWrap: {
    marginHorizontal: 14, marginBottom: 14, borderRadius: 12,
    overflow: 'hidden', position: 'relative',
  },
  receiptThumb: { width: '100%', height: 220, borderRadius: 12 },
  expandOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center',
    paddingVertical: 10, borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
  },
  expandPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14,
    paddingVertical: 6, borderRadius: 20,
  },
  expandTxt: { fontSize: 13, color: '#FFF', fontWeight: '500' },

  // No receipt
  noReceipt: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  noReceiptIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: C.elevated,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  noReceiptTitle: { fontSize: 15, fontWeight: '600', color: C.textSec },
  noReceiptSub: { fontSize: 13, color: C.textMut },

  // Actions
  actRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 14,
  },
  actBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  ts: { fontSize: 12, color: C.textMut, marginTop: 12, textAlign: 'center' },

  // Full-screen viewer
  fullOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  fullSafe: { flex: 1 },
  fullHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  fullClose: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  fullTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  fullImageWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  fullImage: { width: SCREEN_W - 32, height: '85%', borderRadius: 8 },
  fullFooter: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingBottom: 16 },
});
