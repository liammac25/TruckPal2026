import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { saveBreak, id, getUser } from '../lib/storage';
import { today } from '../lib/helpers';
import FormInput from '../components/FormInput';
import PickerSelect from '../components/PickerSelect';
import type { BreakSession } from '../lib/types';

const typeLabels: Record<string, string> = { break: 'Break', rest: 'Daily Rest', weekly_rest: 'Weekly Rest' };

export default function AddBreakTimeScreen() {
  const nav = useNavigation<any>();
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('12:45');
  const [date, setDate] = useState(today());
  const [breakType, setBreakType] = useState<'break' | 'rest' | 'weekly_rest'>('break');

  const calcDur = (): number => {
    try { const [sh, sm] = startTime.split(':').map(Number); const [eh, em] = endTime.split(':').map(Number); return Math.max(eh * 60 + em - (sh * 60 + sm), 0); } catch { return 0; }
  };

  const handleSave = async () => {
    const dur = calcDur();
    if (dur <= 0) { Alert.alert('Invalid', 'End time must be after start time.'); return; }
    const user = await getUser();
    const s: BreakSession = { id: id(), userId: user?.id || '', startTime: new Date(`${date}T${startTime}:00`).toISOString(), endTime: new Date(`${date}T${endTime}:00`).toISOString(), durationMinutes: dur, date, type: breakType };
    await saveBreak(s);
    Alert.alert('Saved', `${Math.floor(dur / 60)}h ${dur % 60}m break recorded.`, [{ text: 'OK', onPress: () => nav.goBack() }]);
  };

  const dur = calcDur(); const h = Math.floor(dur / 60); const m = dur % 60;
  const quickBreaks = [{ l: '15m', m: 15 }, { l: '30m', m: 30 }, { l: '45m', m: 45 }, { l: '1h', m: 60 }, { l: '9h', m: 540 }, { l: '11h', m: 660 }];
  const applyQuick = (mins: number) => {
    try { const [sh, sm] = startTime.split(':').map(Number); const t = sh * 60 + sm + mins; setEndTime(`${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`); } catch {}
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={styles.screenTitle}>Add Break</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.durCard}>
            <Ionicons name="cafe" size={30} color={C.accent} />
            <Text style={[styles.durText, { color: C.accent }]}>{h}h {m}m</Text>
            <Text style={styles.durLabel}>Break Duration</Text>
          </View>
          <PickerSelect label="Break Type" value={typeLabels[breakType]} options={Object.values(typeLabels)} onSelect={v => { const k = Object.entries(typeLabels).find(([, l]) => l === v)?.[0] as any || 'break'; setBreakType(k); }} icon="bed-outline" />
          <FormInput label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" icon="calendar-outline" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}><FormInput label="Start Time" value={startTime} onChangeText={setStartTime} placeholder="HH:MM" icon="time-outline" /></View>
            <View style={{ flex: 1 }}><FormInput label="End Time" value={endTime} onChangeText={setEndTime} placeholder="HH:MM" icon="time-outline" /></View>
          </View>
          <Text style={styles.quickLbl}>Quick Duration</Text>
          <View style={styles.quickRow}>
            {quickBreaks.map(q => (
              <TouchableOpacity key={q.l} style={styles.quickBtn} onPress={() => applyQuick(q.m)}>
                <Text style={styles.quickBtnTxt}>{q.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.hintCard}>
            <Ionicons name="information-circle" size={18} color={C.info} />
            <View style={{ flex: 1 }}>
              <Text style={styles.hintTitle}>UK Break Rules:</Text>
              <Text style={styles.hintBody}>{'\u2022 45 min break after 4.5h driving\n\u2022 Can split: 15 min + 30 min\n\u2022 11h daily rest (can reduce to 9h 3x/week)\n\u2022 45h weekly rest (can reduce to 24h every other week)'}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.accent }]} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" /><Text style={styles.saveBtnTxt}>Save Break</Text>
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
  durCard: { alignItems: 'center', paddingVertical: 24, borderRadius: 18, backgroundColor: C.accent + '12', marginBottom: 20, gap: 6 },
  durText: { fontSize: 36, fontWeight: '800' },
  durLabel: { fontSize: 14, color: C.textSec },
  row: { flexDirection: 'row', gap: 12 },
  quickLbl: { fontSize: 12, fontWeight: '700', color: C.textSec, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  quickBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  quickBtnTxt: { fontSize: 14, fontWeight: '600', color: C.text },
  hintCard: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, backgroundColor: C.info + '08', borderWidth: 1, borderColor: C.info + '20', marginBottom: 18 },
  hintTitle: { fontSize: 14, fontWeight: '600', color: C.info, marginBottom: 4 },
  hintBody: { fontSize: 13, color: C.textSec, lineHeight: 20 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  saveBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
