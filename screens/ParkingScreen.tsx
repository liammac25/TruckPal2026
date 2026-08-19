import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { getParks, toggleFav, seedParks } from '../lib/storage';
import Card from '../components/Card';
import type { ParkingStop } from '../lib/types';

const typeIcon: Record<string, keyof typeof Ionicons.glyphMap> = { truck_stop: 'bus', secure_parking: 'shield-checkmark', fuel_station: 'flame', services: 'restaurant' };
const typeColor: Record<string, string> = { truck_stop: C.primary, secure_parking: C.success, fuel_station: C.orange, services: C.purple };
const facIcon: Record<string, keyof typeof Ionicons.glyphMap> = { Parking: 'car', Showers: 'water', Toilets: 'man', Food: 'restaurant', Fuel: 'flame', WiFi: 'wifi', Security: 'shield-checkmark', CCTV: 'videocam', Fenced: 'lock-closed' };

export default function ParkingScreen() {
  const nav = useNavigation<any>();
  const [stops, setStops] = useState<ParkingStop[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const load = useCallback(async () => { await seedParks(); setStops(await getParks()); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleFav = async (id: string) => { await toggleFav(id); await load(); };

  const filtered = stops.filter(s => {
    if (filter === 'favourites' && !s.isFavourite) return false;
    if (filter !== 'all' && filter !== 'favourites' && s.type !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
  });

  const stars = (r: number) => Array.from({ length: 5 }, (_, i) => (
    <Ionicons key={i} name={i < Math.round(r) ? 'star' : 'star-outline'} size={13} color={C.warn} />
  ));

  const filterOpts: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'all', label: 'All', icon: 'grid' },
    { key: 'favourites', label: 'Favs', icon: 'heart' },
    { key: 'truck_stop', label: 'Truck', icon: 'bus' },
    { key: 'secure_parking', label: 'Secure', icon: 'shield-checkmark' },
    { key: 'fuel_station', label: 'Fuel', icon: 'flame' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={styles.screenTitle}>Parking & Stops</Text>
      </View>
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={C.textMut} />
          <TextInput style={styles.searchInput} placeholder="Search stops\u2026" placeholderTextColor={C.textMut} value={search} onChangeText={setSearch} returnKeyType="search" />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={C.textMut} /></TouchableOpacity> : null}
        </View>
      </View>
      <View style={styles.filterRow}>
        {filterOpts.map(f => (
          <TouchableOpacity key={f.key} style={[styles.filterChip, { backgroundColor: filter === f.key ? C.primary : C.card, borderColor: filter === f.key ? C.primary : C.border }]} onPress={() => setFilter(f.key)}>
            <Ionicons name={f.icon} size={13} color={filter === f.key ? '#FFF' : C.textSec} />
            <Text style={[styles.filterTxt, { color: filter === f.key ? '#FFF' : C.textSec }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={filtered} keyExtractor={i => i.id} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        renderItem={({ item }) => {
          const tc = typeColor[item.type] || C.textMut;
          return (
            <Card onPress={() => nav.navigate('ParkingDetail', { id: item.id })}>
              <View style={styles.stopHead}>
                <View style={[styles.typeIcon, { backgroundColor: tc + '18' }]}><Ionicons name={typeIcon[item.type] || 'location'} size={20} color={tc} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stopName}>{item.name}</Text>
                  <Text style={styles.stopAddr}>{item.address}</Text>
                </View>
                <TouchableOpacity onPress={() => handleFav(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={item.isFavourite ? 'heart' : 'heart-outline'} size={22} color={item.isFavourite ? C.danger : C.textMut} />
                </TouchableOpacity>
              </View>
              <View style={styles.ratingRow}>
                <View style={styles.starsRow}>{stars(item.rating)}</View>
                <Text style={styles.ratingTxt}>{item.rating.toFixed(1)} ({item.reviewCount})</Text>
              </View>
              <View style={styles.facRow}>
                {item.facilities.slice(0, 6).map(f => (
                  <View key={f} style={styles.facChip}>
                    <Ionicons name={facIcon[f] || 'ellipse'} size={11} color={C.textSec} />
                    <Text style={styles.facTxt}>{f}</Text>
                  </View>
                ))}
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={<View style={styles.emptyBox}><Ionicons name="location-outline" size={44} color={C.textMut} /><Text style={styles.emptyTxt}>No stops found</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  screenTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: C.text },
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 14, minHeight: 48 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, minHeight: 44 },
  filterTxt: { fontSize: 12, fontWeight: '600' },
  list: { padding: 16, paddingTop: 8 },
  stopHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  typeIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  stopName: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  stopAddr: { fontSize: 13, color: C.textSec },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  starsRow: { flexDirection: 'row', gap: 2 },
  ratingTxt: { fontSize: 13, color: C.textSec },
  facRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  facChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.elevated, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  facTxt: { fontSize: 11, color: C.textSec },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTxt: { fontSize: 15, color: C.textSec },
});
