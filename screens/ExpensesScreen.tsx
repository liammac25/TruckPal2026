import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { C } from '../lib/theme';
import { getExps } from '../lib/storage';
import { fmtDate, fmtGBP, EXPENSE_CATS } from '../lib/helpers';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import type { Expense } from '../lib/types';

const catIcon: Record<string, keyof typeof Ionicons.glyphMap> = { Fuel: 'flame', Meals: 'restaurant', Parking: 'car', Tolls: 'cash', Repairs: 'build', Other: 'ellipsis-horizontal' };
const catColor: Record<string, string> = { Fuel: C.orange, Meals: C.accent, Parking: C.primary, Tolls: C.purple, Repairs: C.warn, Other: C.textSec };

export default function ExpensesScreen() {
  const nav = useNavigation<any>();
  const [exps, setExps] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCat, setActiveCat] = useState('All');

  const load = useCallback(async () => setExps(await getExps()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const cats = ['All', ...EXPENSE_CATS];
  const filtered = activeCat === 'All' ? exps : exps.filter(e => e.category === activeCat);
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={styles.screenTitle}>Expenses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => nav.navigate('AddExpense', {})}>
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.totalCard}>
        <View>
          <Text style={styles.totalLbl}>{activeCat === 'All' ? 'Total Expenses' : `${activeCat} Total`}</Text>
          <Text style={styles.totalAmt}>{fmtGBP(total)}</Text>
        </View>
        <View style={styles.totalIcon}><Ionicons name="wallet" size={26} color={C.primary} /></View>
      </View>
      <FlatList horizontal data={cats} keyExtractor={i => i} showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.catChip, { backgroundColor: activeCat === item ? C.primary : C.card, borderColor: activeCat === item ? C.primary : C.border }]} onPress={() => setActiveCat(item)}>
            <Text style={[styles.catTxt, { color: activeCat === item ? '#FFF' : C.textSec }]}>{item}</Text>
          </TouchableOpacity>
        )}
      />
      <FlatList data={filtered} keyExtractor={i => i.id} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        renderItem={({ item }) => {
          const cc = catColor[item.category] || C.textMut;
          const hasReceipt = !!item.receiptPhoto;
          return (
            <Card onPress={() => nav.navigate('ExpenseDetail', { id: item.id })}>
              <View style={styles.expRow}>
                <View style={[styles.expIcon, { backgroundColor: cc + '18' }]}>
                  <Ionicons name={catIcon[item.category] || 'cash'} size={18} color={cc} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expCat}>{item.category}</Text>
                  <Text style={styles.expDate}>{fmtDate(item.date)}</Text>
                  {item.note ? <Text style={styles.expNote}>{item.note}</Text> : null}
                  {/* Receipt indicator */}
                  {hasReceipt && (
                    <View style={styles.receiptIndicator}>
                      <Ionicons name="receipt" size={12} color={C.success} />
                      <Text style={styles.receiptIndicatorTxt}>Receipt attached</Text>
                    </View>
                  )}
                </View>
                {/* Receipt thumbnail */}
                <View style={styles.rightCol}>
                  <Text style={styles.expAmt}>{fmtGBP(item.amount)}</Text>
                  {hasReceipt && item.receiptPhoto && (
                    <View style={styles.thumbWrap}>
                      <Image
                        source={{ uri: item.receiptPhoto }}
                        style={styles.thumb}
                        contentFit="cover"
                        transition={150}
                      />
                      <View style={styles.thumbBadge}>
                        <Ionicons name="receipt-outline" size={8} color="#FFF" />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={<EmptyState icon="wallet-outline" title="No Expenses" msg="Track your fuel, meals, parking, tolls and other work expenses." action="Add Expense" onAction={() => nav.navigate('AddExpense', {})} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  screenTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: C.text },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: 16, marginBottom: 0, padding: 20, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  totalLbl: { fontSize: 13, color: C.textSec, marginBottom: 4 },
  totalAmt: { fontSize: 28, fontWeight: '800', color: C.text },
  totalIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: C.primary + '14', justifyContent: 'center', alignItems: 'center' },
  catRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 8, minHeight: 44, justifyContent: 'center' },
  catTxt: { fontSize: 13, fontWeight: '600' },
  list: { padding: 16, paddingTop: 4 },
  expRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  expIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  expCat: { fontSize: 15, fontWeight: '600', color: C.text },
  expDate: { fontSize: 13, color: C.textSec, marginTop: 2 },
  expNote: { fontSize: 12, color: C.textMut, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 8 },
  expAmt: { fontSize: 17, fontWeight: '700', color: C.text },

  // Receipt indicator
  receiptIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5,
    backgroundColor: C.success + '12', paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 6, alignSelf: 'flex-start',
  },
  receiptIndicatorTxt: { fontSize: 10, fontWeight: '600', color: C.success },

  // Thumbnail
  thumbWrap: { position: 'relative' },
  thumb: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  thumbBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.success, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.card,
  },
});
