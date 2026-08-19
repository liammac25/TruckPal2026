import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { getTachos } from '../lib/storage';
import { fmtDate, trunc } from '../lib/helpers';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import type { TachoRecord } from '../lib/types';

const modeColor: Record<string, string> = { driving: C.primary, other_work: C.orange, availability: C.info, rest: C.accent };
const modeLabel: Record<string, string> = { driving: 'Driving', other_work: 'Other Work', availability: 'Availability', rest: 'Rest' };

export default function TachoScreen() {
  const nav = useNavigation<any>();
  const [recs, setRecs] = useState<TachoRecord[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => setRecs(await getTachos()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = recs.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.driverName.toLowerCase().includes(q) || r.vehicleReg.toLowerCase().includes(q) || r.date.includes(q) || r.notes.toLowerCase().includes(q);
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={styles.screenTitle}>Tacho Records</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => nav.navigate('AddTachoRecord', {})}>
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={C.textMut} />
          <TextInput style={styles.searchInput} placeholder="Search by date, vehicle, driver\u2026" placeholderTextColor={C.textMut} value={search} onChangeText={setSearch} returnKeyType="search" />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={C.textMut} /></TouchableOpacity> : null}
        </View>
      </View>
      <FlatList data={filtered} keyExtractor={i => i.id} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        renderItem={({ item }) => {
          const mc = modeColor[item.mode] || C.textMut;
          return (
            <Card onPress={() => nav.navigate('TachoDetail', { id: item.id })}>
              <View style={styles.recRow}>
                <View style={[styles.modeBar, { backgroundColor: mc }]} />
                <View style={{ flex: 1 }}>
                  <View style={styles.recHead}>
                    <Text style={styles.recDate}>{fmtDate(item.date)}</Text>
                    <View style={[styles.modeBadge, { backgroundColor: mc + '18' }]}><Text style={[styles.modeTxt, { color: mc }]}>{modeLabel[item.mode]}</Text></View>
                  </View>
                  <Text style={styles.recVeh}>{item.vehicleReg} \u2022 {item.driverName}</Text>
                  {item.notes ? <Text style={styles.recNotes}>{trunc(item.notes, 75)}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.textMut} />
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={<EmptyState icon="document-text-outline" title="No Tacho Records" msg="Add your first tachograph record to keep track of driving modes and notes." action="Add Record" onAction={() => nav.navigate('AddTachoRecord', {})} />}
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
  searchWrap: { padding: 16, paddingBottom: 0 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 14, minHeight: 48 },
  list: { padding: 16 },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modeBar: { width: 4, height: 48, borderRadius: 2 },
  recHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  recDate: { fontSize: 15, fontWeight: '600', color: C.text },
  modeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  modeTxt: { fontSize: 11, fontWeight: '600' },
  recVeh: { fontSize: 13, color: C.textSec },
  recNotes: { fontSize: 12, color: C.textMut, marginTop: 4 },
});
