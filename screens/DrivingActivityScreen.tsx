import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { getActivity, saveActivity, clearActivity, saveDrive, saveBreak, id, getUser, getVehicle, getDrives, getBreaks } from '../lib/storage';
import { fmtDur, today, LIMITS } from '../lib/helpers';
import Card from '../components/Card';
import type { DrivingActivity, DriveSession, BreakSession } from '../lib/types';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
} catch (e) { /* not available on web */ }

type Status = DrivingActivity['status'];
const STATUS_META: Record<Status, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  driving: { label: 'Driving', icon: 'car', color: C.primary },
  other_work: { label: 'Other Work', icon: 'construct', color: C.orange },
  break: { label: 'On Break', icon: 'cafe', color: C.accent },
  rest: { label: 'Resting', icon: 'bed', color: C.purple },
  idle: { label: 'Idle', icon: 'pause-circle', color: C.textMut },
};

export default function DrivingActivityScreen() {
  const nav = useNavigation<any>();
  const [activity, setActivity] = useState<DrivingActivity | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [todayDriveTotal, setTodayDriveTotal] = useState(0);
  const [todayBreakTotal, setTodayBreakTotal] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breakNotifRef = useRef(false);

  const loadTotals = useCallback(async () => {
    const td = today();
    const drives = await getDrives();
    const breaks = await getBreaks();
    setTodayDriveTotal(drives.filter(d => d.date === td).reduce((s, d) => s + d.durationMinutes, 0));
    setTodayBreakTotal(breaks.filter(b => b.date === td).reduce((s, b) => s + b.durationMinutes, 0));
  }, []);

  const loadActivity = useCallback(async () => {
    const a = await getActivity();
    setActivity(a);
    if (a && !a.endedAt) {
      const diff = Math.floor((Date.now() - new Date(a.startedAt).getTime()) / 60000);
      setElapsed(diff);
    } else setElapsed(0);
  }, []);

  useFocusEffect(useCallback(() => { loadActivity(); loadTotals(); }, [loadActivity, loadTotals]));

  useEffect(() => {
    if (activity && !activity.endedAt) {
      timerRef.current = setInterval(() => {
        const diff = Math.floor((Date.now() - new Date(activity.startedAt).getTime()) / 60000);
        setElapsed(diff);
        if (activity.status === 'driving' && !breakNotifRef.current) {
          const totalDrive = todayDriveTotal + diff;
          if (totalDrive >= LIMITS.breakAfter && todayBreakTotal < LIMITS.minBreak) {
            breakNotifRef.current = true;
            scheduleBreakNotification();
          }
        }
      }, 10000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activity, todayDriveTotal, todayBreakTotal]);

  const scheduleBreakNotification = async () => {
    if (!Notifications) return;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      await Notifications.scheduleNotificationAsync({
        content: { title: '\u23f0 Break Required', body: 'You have been driving for 4.5 hours. Take a 45-minute break now.', sound: true },
        trigger: null,
      });
    } catch {}
  };

  const startActivity = async (status: Status) => {
    if (activity && !activity.endedAt) await stopActivity(false);
    const user = await getUser(); const veh = await getVehicle();
    const a: DrivingActivity = { id: id(), userId: user?.id || '', vehicleReg: veh?.registration || '', status, startedAt: new Date().toISOString(), endedAt: null, elapsed: 0, breakNotifiedAt: null };
    await saveActivity(a); setActivity(a); setElapsed(0); breakNotifRef.current = false; await loadTotals();
  };

  const stopActivity = async (showAlert = true) => {
    if (!activity || activity.endedAt) return;
    const endedAt = new Date().toISOString();
    const dur = Math.max(1, Math.floor((new Date(endedAt).getTime() - new Date(activity.startedAt).getTime()) / 60000));
    await saveActivity({ ...activity, endedAt, elapsed: dur });
    const user = await getUser(); const veh = await getVehicle();
    if (activity.status === 'driving' || activity.status === 'other_work') {
      const session: DriveSession = { id: id(), userId: user?.id || '', vehicleId: veh?.id || '', startTime: activity.startedAt, endTime: endedAt, durationMinutes: dur, date: today(), notes: `Auto-logged: ${STATUS_META[activity.status].label}` };
      await saveDrive(session);
    } else if (activity.status === 'break' || activity.status === 'rest') {
      const session: BreakSession = { id: id(), userId: user?.id || '', startTime: activity.startedAt, endTime: endedAt, durationMinutes: dur, date: today(), type: activity.status === 'rest' ? 'rest' : 'break' };
      await saveBreak(session);
    }
    await clearActivity(); setActivity(null); setElapsed(0); await loadTotals();
    if (showAlert) Alert.alert('Stopped', `${STATUS_META[activity.status].label} session ended: ${fmtDur(dur)} recorded.`);
  };

  const isActive = activity && !activity.endedAt;
  const meta = activity ? STATUS_META[activity.status] : null;
  const remainDrive = Math.max(LIMITS.dailyDrive - todayDriveTotal - (isActive && activity?.status === 'driving' ? elapsed : 0), 0);
  const showBreakWarn = (todayDriveTotal + (isActive && activity?.status === 'driving' ? elapsed : 0)) >= LIMITS.breakAfter && todayBreakTotal < LIMITS.minBreak;

  return (
    <SafeAreaView style={$.safe}>
      <View style={$.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={$.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={$.screenTitle}>Driving Activity</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={$.content} showsVerticalScrollIndicator={false}>
        {/* Status display with stop action directly attached */}
        <View style={[$.statusCard, { borderColor: isActive ? meta!.color + '40' : C.border }]}>
          <View style={$.statusTop}>
            <View style={[$.statusCircle, { borderColor: isActive ? meta!.color : C.border }]}>
              <Ionicons name={isActive ? meta!.icon : 'pause-circle'} size={36} color={isActive ? meta!.color : C.textMut} />
            </View>
            <View style={$.statusInfo}>
              <Text style={[$.statusLabel, isActive && { color: meta!.color }]}>{isActive ? meta!.label : 'Not Active'}</Text>
              {isActive && <Text style={$.elapsed}>{fmtDur(elapsed)}</Text>}
              {!isActive && <Text style={$.statusHint}>Choose an activity below to start</Text>}
            </View>
          </View>
          {/* Stop button — directly inside the active status card, not bunched at bottom */}
          {isActive && (
            <TouchableOpacity style={$.stopBtn} onPress={() => stopActivity()}>
              <Ionicons name="stop-circle" size={22} color="#FFF" />
              <Text style={$.stopBtnTxt}>Stop {meta!.label}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Break warning — contextual, near the status */}
        {showBreakWarn && (
          <View style={$.warnBanner}>
            <Ionicons name="warning" size={18} color={C.warn} />
            <Text style={$.warnTxt}>Break required \u2014 45 min after 4.5h driving</Text>
          </View>
        )}

        {/* Today's summary */}
        <View style={$.sumRow}>
          <View style={$.sumCard}>
            <Ionicons name="car" size={18} color={C.primary} />
            <Text style={[$.sumVal, { color: C.primary }]}>{fmtDur(todayDriveTotal + (isActive && activity?.status === 'driving' ? elapsed : 0))}</Text>
            <Text style={$.sumLbl}>Driving</Text>
          </View>
          <View style={$.sumCard}>
            <Ionicons name="cafe" size={18} color={C.accent} />
            <Text style={[$.sumVal, { color: C.accent }]}>{fmtDur(todayBreakTotal + (isActive && activity?.status === 'break' ? elapsed : 0))}</Text>
            <Text style={$.sumLbl}>Breaks</Text>
          </View>
          <View style={$.sumCard}>
            <Ionicons name="time" size={18} color={remainDrive <= 60 ? C.danger : C.info} />
            <Text style={[$.sumVal, { color: remainDrive <= 60 ? C.danger : C.info }]}>{fmtDur(remainDrive)}</Text>
            <Text style={$.sumLbl}>Left</Text>
          </View>
        </View>

        {/* Activity controls — each is a clear action with good spacing */}
        <Text style={$.controlTitle}>{isActive ? 'Switch To' : 'Start Activity'}</Text>
        <View style={$.controlGrid}>
          {(['driving', 'other_work', 'break', 'rest'] as Status[]).map(status => {
            const m = STATUS_META[status];
            const isCurrent = isActive && activity?.status === status;
            return (
              <TouchableOpacity key={status} style={[$.controlBtn, isCurrent && { borderColor: m.color, backgroundColor: m.color + '15' }]} onPress={() => !isCurrent && startActivity(status)} disabled={isCurrent}>
                <Ionicons name={m.icon} size={26} color={isCurrent ? m.color : C.textSec} />
                <Text style={[$.controlLbl, isCurrent && { color: m.color }]}>{m.label}</Text>
                {isCurrent && <Text style={[$.controlSub, { color: m.color }]}>Active</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const $ = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  screenTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  content: { padding: 16 },
  // Status card — contains status + stop action together
  statusCard: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1.5, padding: 20, marginBottom: 14 },
  statusTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statusCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 20, fontWeight: '700', color: C.textMut },
  elapsed: { fontSize: 32, fontWeight: '800', color: C.text, marginTop: 2 },
  statusHint: { fontSize: 13, color: C.textMut, marginTop: 4 },
  // Stop button — inside the status card, directly below the status
  stopBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.danger, paddingVertical: 16, borderRadius: 14, marginTop: 16, minHeight: 52 },
  stopBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  warnBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: C.warn + '12', borderWidth: 1, borderColor: C.warn + '30', marginBottom: 14 },
  warnTxt: { fontSize: 14, fontWeight: '600', color: C.warn, flex: 1 },
  sumRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  sumCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, gap: 4 },
  sumVal: { fontSize: 18, fontWeight: '800' },
  sumLbl: { fontSize: 11, color: C.textSec },
  controlTitle: { fontSize: 14, fontWeight: '700', color: C.textSec, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  controlGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  controlBtn: { width: '47%', flexGrow: 1, alignItems: 'center', paddingVertical: 22, borderRadius: 16, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, gap: 6, minHeight: 90 },
  controlLbl: { fontSize: 14, fontWeight: '600', color: C.textSec },
  controlSub: { fontSize: 11, fontWeight: '700' },
});
