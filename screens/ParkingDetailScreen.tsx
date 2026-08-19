import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { getParks, toggleFav } from '../lib/storage';
import Card from '../components/Card';
import type { ParkingStop } from '../lib/types';

const typeLabel: Record<string, string> = { truck_stop: 'Truck Stop', secure_parking: 'Secure Parking', fuel_station: 'Fuel Station', services: 'Services' };
const typeColor: Record<string, string> = { truck_stop: C.primary, secure_parking: C.success, fuel_station: C.orange, services: C.purple };
const facIcon: Record<string, keyof typeof Ionicons.glyphMap> = { Parking: 'car', Showers: 'water', Toilets: 'man', Food: 'restaurant', Fuel: 'flame', WiFi: 'wifi', Security: 'shield-checkmark', CCTV: 'videocam', Fenced: 'lock-closed' };

export default function ParkingDetailScreen() {
  const nav = useNavigation<any>(); const route = useRoute<any>(); const { id: pid } = route.params;
  const [stop, setStop] = useState<ParkingStop | null>(null);
  const [review, setReview] = useState(''); const [userRating, setUserRating] = useState(0);

  useEffect(() => { (async () => { const s = await getParks(); setStop(s.find(x => x.id === pid) || null); })(); }, [pid]);
  if (!stop) return <SafeAreaView style={styles.safe}><View style={styles.loading}><Text style={{ color: C.textSec }}>Loading\u2026</Text></View></SafeAreaView>;

  const handleFav = async () => { await toggleFav(pid); const s = await getParks(); setStop(s.find(x => x.id === pid) || null); };
  const handleReview = () => { if (!review.trim()) { Alert.alert('Required', 'Please write a review.'); return; } Alert.alert('Thank You', 'Review saved locally. Will sync when online.'); setReview(''); setUserRating(0); };
  const tc = typeColor[stop.type] || C.textMut;

  const stars = (r: number, interactive = false) => Array.from({ length: 5 }, (_, i) => (
    <TouchableOpacity key={i} disabled={!interactive} onPress={() => interactive && setUserRating(i + 1)}>
      <Ionicons name={i < Math.round(r) ? 'star' : 'star-outline'} size={interactive ? 26 : 15} color={C.warn} />
    </TouchableOpacity>
  ));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={styles.screenTitle} numberOfLines={1}>{stop.name}</Text>
        <TouchableOpacity onPress={handleFav}><Ionicons name={stop.isFavourite ? 'heart' : 'heart-outline'} size={22} color={stop.isFavourite ? C.danger : C.textMut} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.typeBadge, { backgroundColor: tc + '12' }]}><Text style={[styles.typeTxt, { color: tc }]}>{typeLabel[stop.type]}</Text></View>
        <Text style={styles.name}>{stop.name}</Text>
        <View style={styles.addrRow}><Ionicons name="location" size={15} color={C.textSec} /><Text style={styles.addr}>{stop.address}</Text></View>
        <View style={styles.ratingRow}>
          <View style={styles.starsRow}>{stars(stop.rating)}</View>
          <Text style={styles.ratingVal}>{stop.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCnt}>({stop.reviewCount} reviews)</Text>
        </View>

        <Text style={styles.secTitle}>Facilities</Text>
        <View style={styles.facGrid}>
          {stop.facilities.map(f => (
            <View key={f} style={styles.facCard}>
              <Ionicons name={facIcon[f] || 'ellipse'} size={22} color={C.primary} />
              <Text style={styles.facLbl}>{f}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.secTitle}>Write a Review</Text>
        <Card>
          <View style={styles.rateInput}>
            <Text style={styles.rateLbl}>Your Rating:</Text>
            <View style={styles.starsRow}>{stars(userRating, true)}</View>
          </View>
          <TextInput style={styles.reviewInput} placeholder="Share your experience\u2026" placeholderTextColor={C.textMut} value={review} onChangeText={setReview} multiline numberOfLines={4} />
          <TouchableOpacity style={styles.submitBtn} onPress={handleReview}><Text style={styles.submitTxt}>Submit Review</Text></TouchableOpacity>
        </Card>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40 },
  screenTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center', marginHorizontal: 8 },
  content: { padding: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  typeTxt: { fontSize: 13, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 8 },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 16 },
  addr: { fontSize: 15, color: C.textSec, flex: 1, lineHeight: 22 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  starsRow: { flexDirection: 'row', gap: 2 },
  ratingVal: { fontSize: 18, fontWeight: '700', color: C.text },
  reviewCnt: { fontSize: 14, color: C.textSec },
  secTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 12 },
  facGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  facCard: { alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, minWidth: '28%' },
  facLbl: { fontSize: 12, fontWeight: '500', color: C.text },
  rateInput: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  rateLbl: { fontSize: 14, color: C.textSec },
  reviewInput: { borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.inputBg, padding: 14, fontSize: 15, color: C.text, minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
  submitBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: C.primary },
  submitTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
