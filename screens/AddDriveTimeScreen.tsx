import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { saveDrive, id, getUser, getVehicle } from '../lib/storage';
import { today } from '../lib/helpers';
import FormInput from '../components/FormInput';
import type { DriveSession } from '../lib/types';

export default function AddDriveTimeScreen() {
  const nav = useNavigation<any>();
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:00');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(today());

  const calcDur = (): number => {
    try { const [sh, sm] = startTime.split(':').map(Number); const [eh, em] = endTime.split(':').map(Number); return Math.max(eh * 60 + em - (sh * 60 + sm), 0); } catch { return 0; }
  };

  const handleSave = async () => {
    const dur = calcDur();
    if (dur <= 0) { Alert.alert('Invalid', 'End time must be after start time.'); return; }
    const user = await getUser(); const veh = await getVehicle();
    const s: DriveSession = { id: id(), userId: user?.id || '', vehicleId: veh?.id || '', startTime: new Date(`${date}T${startTime}:00`).toISOString(), endTime: new Date(`${date}T${endTime}:00`).toISOString(), durationMinutes: dur, date, notes };
    await saveDrive(s);
    Alert.alert('Saved', `${Math.floor(dur / 60)}h ${dur % 60}m drive time recorded.`, [{ text: 'OK', onPress: () => nav.goBack() }]);
  };

  const dur = calcDur(); const h = Math.floor(dur / 60); const m = dur % 60;
  const quickDurs = [{ l: '30m', m: 30 }, { l: '1h', m: 60 }, { l: '2h', m: 120 }, { l: '3h', m: 180 }, { l: '4h', m: 240 }, { l: '4.5h', m: 270 }];
  const applyQuick = (mins: number) => {
    try { const [sh, sm] = startTime.split(':').map(Number); const t = sh * 60 + sm + mins; setEndTime(`${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`); } catch {}
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={styles.screenTitle}>Add Drive Time</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.durCard}>
            <Ionicons name="car" size={30} color={C.primary} />
            <Text style={styles.durText}>{h}h {m}m</Text>
            <Text style={styles.durLabel}>Drive Duration</Text>
          </View>
          <FormInput label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" icon="calendar-outline" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}><FormInput label="Start Time" value={startTime} onChangeText={setStartTime} placeholder="HH:MM" icon="time-outline" /></View>
            <View style={{ flex: 1 }}><FormInput label="End Time" value={endTime} onChangeText={setEndTime} placeholder="HH:MM" icon="time-outline" /></View>
          </View>
          <Text style={styles.quickLbl}>Quick Duration</Text>
          <View style={styles.quickRow}>
            {quickDurs.map(q => (
              <TouchableOpacity key={q.l} style={styles.quickBtn} onPress={() => applyQuick(q.m)}>
                <Text style={styles.quickBtnTxt}>{q.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FormInput label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any notes\u2026" multiline numberOfLines={3} icon="create-outline" />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" /><Text style={styles.saveBtnTxt}>Save Drive Time</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40 },
  screenTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  content: { padding: 16 },
  durCard: { alignItems: 'center', paddingVertical: 24, borderRadius: 18, backgroundColor: C.primary + '12', marginBottom: 20, gap: 6 },
  durText: { fontSize: 36, fontWeight: '800', color: C.primary },
  durLabel: { fontSize: 14, color: C.textSec },
  row: { flexDirection: 'row', gap: 12 },
  quickLbl: { fontSize: 12, fontWeight: '700', color: C.textSec, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  quickBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  quickBtnTxt: { fontSize: 14, fontWeight: '600', color: C.text },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, paddingVertical: 16, borderRadius: 14, marginTop: 16 },
  saveBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
