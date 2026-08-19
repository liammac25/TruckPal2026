import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { getInfs } from '../lib/storage';
import { fmtDate, fmtTime, trunc } from '../lib/helpers';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import type { InfringementRecord } from '../lib/types';

export default function InfringementsScreen() {
  const nav = useNavigation<any>();
  const [recs, setRecs] = useState<InfringementRecord[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'completed' | 'exported'>('all');

  const load = useCallback(async () => setRecs(await getInfs()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = recs.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return r.infringementType.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.vehicleReg.toLowerCase().includes(q) || r.location.toLowerCase().includes(q) || r.driverName.toLowerCase().includes(q);
  });

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'draft', label: 'Draft' }, { key: 'completed', label: 'Done' }, { key: 'exported', label: 'Exported' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={styles.screenTitle}>Infringements</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: C.danger }]} onPress={() => nav.navigate('AddInfringement', {})}>
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={C.textMut} />
          <TextInput style={styles.searchInput} placeholder="Search infringements\u2026" placeholderTextColor={C.textMut} value={search} onChangeText={setSearch} returnKeyType="search" />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={C.textMut} /></TouchableOpacity> : null}
        </View>
      </View>
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity key={f.key} style={[styles.filterChip, { backgroundColor: filter === f.key ? C.primary : C.card, borderColor: filter === f.key ? C.primary : C.border }]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterTxt, { color: filter === f.key ? '#FFF' : C.textSec }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={filtered} keyExtractor={i => i.id} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        renderItem={({ item }) => (
          <Card onPress={() => nav.navigate('InfringementDetail', { id: item.id })}>
            <View style={styles.recTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recType}>{item.infringementType}</Text>
                <Text style={styles.recMeta}>{fmtDate(item.dateTime)} \u2022 {fmtTime(item.dateTime)}</Text>
              </View>
              <StatusBadge status={item.status} small />
            </View>
            <Text style={styles.recVeh}>{item.vehicleReg}{item.location ? ` \u2022 ${item.location}` : ''}</Text>
            {item.description ? <Text style={styles.recDesc}>{trunc(item.description, 90)}</Text> : null}
            <View style={styles.recFoot}>
              <View style={styles.indicators}>
                {item.signatureImage && <View style={[styles.ind, { backgroundColor: C.success + '18' }]}><Ionicons name="finger-print" size={13} color={C.success} /><Text style={[styles.indTxt, { color: C.success }]}>Signed</Text></View>}
                {item.printoutPhoto && <View style={[styles.ind, { backgroundColor: C.info + '18' }]}><Ionicons name="camera" size={13} color={C.info} /><Text style={[styles.indTxt, { color: C.info }]}>Photo</Text></View>}
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.textMut} />
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState icon="shield-checkmark-outline" title="No Infringements" msg="Record infringements here for your records. Tap + to add one." action="Add Infringement" onAction={() => nav.navigate('AddInfringement', {})} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  screenTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: C.text },
  addBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 14, minHeight: 48 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, minHeight: 44, justifyContent: 'center' },
  filterTxt: { fontSize: 13, fontWeight: '600' },
  list: { padding: 16, paddingTop: 8 },
  recTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  recType: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  recMeta: { fontSize: 13, color: C.textSec },
  recVeh: { fontSize: 13, color: C.textSec, marginBottom: 4 },
  recDesc: { fontSize: 13, color: C.textMut, marginBottom: 8, lineHeight: 18 },
  recFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  indicators: { flexDirection: 'row', gap: 8 },
  ind: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  indTxt: { fontSize: 11, fontWeight: '600' },
});
