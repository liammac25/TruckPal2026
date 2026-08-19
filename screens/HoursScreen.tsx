import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, SafeAreaView, Switch, Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import {
  getDrives, getBreaks, getActivity, saveActivity, clearActivity,
  saveDrive, saveBreak, id, getUser, getVehicle, getAutoTrack, saveAutoTrack,
} from '../lib/storage';
import { fmtDur, fmtTime, today, LIMITS } from '../lib/helpers';
import Card from '../components/Card';
import type { DrivingActivity, DriveSession, BreakSession } from '../lib/types';

// Safe notification import — won't crash on web
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
} catch (e) { /* notifications not available on web */ }

type Status = DrivingActivity['status'];

const META: Record<Status, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  driving:    { label: 'Driving',    icon: 'car',          color: C.primary },
  other_work: { label: 'Other Work', icon: 'construct',    color: C.orange  },
  break:      { label: 'Break',      icon: 'cafe',         color: C.accent  },
  rest:       { label: 'Rest',       icon: 'bed',          color: C.purple  },
  idle:       { label: 'Idle',       icon: 'pause-circle', color: C.textMut },
};

type Entry = {
  id: string; type: 'drive' | 'break';
  startTime: string; endTime: string;
  durationMinutes: number; date: string; notes?: string;
};

export default function HoursScreen() {
  const nav = useNavigation<any>();

  const [refreshing, setRefreshing] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tDrive, setTDrive] = useState(0);
  const [tBreak, setTBreak] = useState(0);
  const [tOther, setTOther] = useState(0);
  const [wDrive, setWDrive] = useState(0);

  const [autoTrack, setAutoTrack] = useState(false);
  const [activity, setActivity] = useState<DrivingActivity | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breakNotifRef = useRef(false);

  const loadTotals = useCallback(async () => {
    const td = today();
    const drives = await getDrives();
    const breaks = await getBreaks();
    const all: Entry[] = [
      ...drives.map(d => ({ id: d.id, type: 'drive' as const, startTime: d.startTime, endTime: d.endTime, durationMinutes: d.durationMinutes, date: d.date, notes: d.notes })),
      ...breaks.map(b => ({ id: b.id, type: 'break' as const, startTime: b.startTime, endTime: b.endTime, durationMinutes: b.durationMinutes, date: b.date })),
    ].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    setEntries(all);
    const todayDrives = drives.filter(d => d.date === td);
    const todayBreaks = breaks.filter(b => b.date === td);
    setTDrive(todayDrives.filter(d => !(d.notes || '').includes('Other Work')).reduce((s, d) => s + d.durationMinutes, 0));
    setTOther(todayDrives.filter(d => (d.notes || '').includes('Other Work')).reduce((s, d) => s + d.durationMinutes, 0));
    setTBreak(todayBreaks.reduce((s, b) => s + b.durationMinutes, 0));
    const now = new Date(); const day = now.getDay();
    const off = day === 0 ? -6 : 1 - day;
    const mon = new Date(now); mon.setDate(now.getDate() + off); mon.setHours(0, 0, 0, 0);
    setWDrive(drives.filter(d => new Date(d.date) >= mon).reduce((s, d) => s + d.durationMinutes, 0));
  }, []);

  const loadActivity = useCallback(async () => {
    const a = await getActivity();
    if (a && !a.endedAt) {
      setActivity(a);
      setElapsed(Math.floor((Date.now() - new Date(a.startedAt).getTime()) / 60000));
    } else {
      setActivity(null);
      setElapsed(0);
    }
    setAutoTrack(await getAutoTrack());
  }, []);

  useFocusEffect(useCallback(() => { loadTotals(); loadActivity(); }, [loadTotals, loadActivity]));

  // Live timer
  useEffect(() => {
    if (activity && !activity.endedAt) {
      timerRef.current = setInterval(() => {
        const diff = Math.floor((Date.now() - new Date(activity.startedAt).getTime()) / 60000);
        setElapsed(diff);
        if (activity.status === 'driving' && !breakNotifRef.current && Notifications) {
          if (tDrive + diff >= LIMITS.breakAfter && tBreak < LIMITS.minBreak) {
            breakNotifRef.current = true;
            try {
              Notifications.scheduleNotificationAsync({
                content: { title: '\u23f0 Break Required', body: '4.5h driving reached. Take a 45-min break.', sound: true },
                trigger: null,
              }).catch(() => {});
            } catch (e) { /* ignore */ }
          }
        }
      }, 5000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activity, tDrive, tBreak]);

  const switchActivity = async (status: Status) => {
    if (activity && !activity.endedAt) {
      const endedAt = new Date().toISOString();
      const dur = Math.max(1, Math.floor((new Date(endedAt).getTime() - new Date(activity.startedAt).getTime()) / 60000));
      await saveActivity({ ...activity, endedAt, elapsed: dur });
      const user = await getUser();
      const veh = await getVehicle();
      if (activity.status === 'driving' || activity.status === 'other_work') {
        const s: DriveSession = { id: id(), userId: user?.id || '', vehicleId: veh?.id || '', startTime: activity.startedAt, endTime: endedAt, durationMinutes: dur, date: today(), notes: `Auto: ${META[activity.status].label}` };
        await saveDrive(s);
      } else if (activity.status === 'break' || activity.status === 'rest') {
        const s: BreakSession = { id: id(), userId: user?.id || '', startTime: activity.startedAt, endTime: endedAt, durationMinutes: dur, date: today(), type: activity.status === 'rest' ? 'rest' : 'break' };
        await saveBreak(s);
      }
    }
    const user = await getUser();
    const veh = await getVehicle();
    const a: DrivingActivity = {
      id: id(), userId: user?.id || '', vehicleReg: veh?.registration || '',
      status, startedAt: new Date().toISOString(), endedAt: null, elapsed: 0, breakNotifiedAt: null,
    };
    await saveActivity(a);
    setActivity(a);
    setElapsed(0);
    breakNotifRef.current = false;
    await loadTotals();
  };

  const stopAll = async () => {
    if (!activity || activity.endedAt) return;
    const endedAt = new Date().toISOString();
    const dur = Math.max(1, Math.floor((new Date(endedAt).getTime() - new Date(activity.startedAt).getTime()) / 60000));
    await saveActivity({ ...activity, endedAt, elapsed: dur });
    const user = await getUser();
    const veh = await getVehicle();
    if (activity.status === 'driving' || activity.status === 'other_work') {
      const s: DriveSession = { id: id(), userId: user?.id || '', vehicleId: veh?.id || '', startTime: activity.startedAt, endTime: endedAt, durationMinutes: dur, date: today(), notes: `Auto: ${META[activity.status].label}` };
      await saveDrive(s);
    } else if (activity.status === 'break' || activity.status === 'rest') {
      const s: BreakSession = { id: id(), userId: user?.id || '', startTime: activity.startedAt, endTime: endedAt, durationMinutes: dur, date: today(), type: activity.status === 'rest' ? 'rest' : 'break' };
      await saveBreak(s);
    }
    await clearActivity();
    setActivity(null);
    setElapsed(0);
    await loadTotals();
  };

  const toggleAutoTrack = async (val: boolean) => {
    setAutoTrack(val);
    await saveAutoTrack(val);
    if (val && !activity) {
      await switchActivity('other_work');
    }
    if (!val && activity && !activity.endedAt) {
      await stopAll();
    }
  };

  const onRefresh = async () => { setRefreshing(true); await loadTotals(); await loadActivity(); setRefreshing(false); };

  // Derived — all null-safe
  const isActive = activity !== null && !activity.endedAt;
  const curStatus: Status | null = isActive ? activity!.status : null;
  const curMeta = curStatus ? META[curStatus] : null;
  const liveDrive = tDrive + (curStatus === 'driving' ? elapsed : 0);
  const liveOther = tOther + (curStatus === 'other_work' ? elapsed : 0);
  const liveBreak = tBreak + (curStatus === 'break' ? elapsed : 0);
  const remainD = Math.max(LIMITS.dailyDrive - liveDrive, 0);
  const needsBreak = liveDrive >= LIMITS.breakAfter && liveBreak < LIMITS.minBreak;

  const renderEntry = ({ item }: { item: Entry }) => (
    <Card>
      <View style={$.entryRow}>
        <View style={[$.entryIcon, { backgroundColor: (item.type === 'drive' ? C.primary : C.accent) + '18' }]}>
          <Ionicons name={item.type === 'drive' ? 'car' : 'cafe'} size={16} color={item.type === 'drive' ? C.primary : C.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={$.entryType}>
            {item.type === 'drive' ? ((item.notes || '').includes('Other Work') ? 'Other Work' : 'Driving') : 'Break'}
          </Text>
          <Text style={$.entryTime}>{fmtTime(item.startTime)} \u2013 {fmtTime(item.endTime)}</Text>
        </View>
        <Text style={[$.entryDur, { color: item.type === 'drive' ? C.primary : C.accent }]}>{fmtDur(item.durationMinutes)}</Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={$.safe}>
      <View style={$.headerBar}>
        <Text style={$.screenTitle}>Hours & Breaks</Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={i => i.id}
        renderItem={renderEntry}
        contentContainerStyle={$.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        ListHeaderComponent={
          <>
            {/* Auto-Tracking Toggle */}
            <View style={$.autoCard}>
              <View style={$.autoTop}>
                <View style={$.autoLeft}>
                  <View style={[$.autoIconWrap, { backgroundColor: autoTrack ? C.accent + '18' : C.border }]}>
                    <Ionicons name={autoTrack ? 'pulse' : 'pulse-outline'} size={18} color={autoTrack ? C.accent : C.textMut} />
                  </View>
                  <View>
                    <Text style={$.autoTitle}>Smart Auto-Tracking</Text>
                    <Text style={$.autoSub}>{autoTrack ? 'Motion-based detection active' : 'Manual mode'}</Text>
                  </View>
                </View>
                <Switch
                  value={autoTrack}
                  onValueChange={toggleAutoTrack}
                  trackColor={{ false: C.border, true: C.accent + '50' }}
                  thumbColor={autoTrack ? C.accent : C.textMut}
                />
              </View>

              {autoTrack && isActive && curMeta && (
                <View style={[$.liveBar, { backgroundColor: curMeta.color + '12', borderColor: curMeta.color + '25' }]}>
                  <View style={[$.liveDot, { backgroundColor: curMeta.color }]} />
                  <Ionicons name={curMeta.icon} size={16} color={curMeta.color} />
                  <Text style={[$.liveTxt, { color: curMeta.color }]}>Auto-Tracking: {curMeta.label}</Text>
                  <Text style={[$.liveElapsed, { color: curMeta.color }]}>{fmtDur(elapsed)}</Text>
                </View>
              )}
              {autoTrack && !isActive && (
                <View style={[$.liveBar, { backgroundColor: C.textMut + '10', borderColor: C.border }]}>
                  <View style={[$.liveDot, { backgroundColor: C.textMut }]} />
                  <Text style={[$.liveTxt, { color: C.textMut }]}>Waiting for motion\u2026</Text>
                </View>
              )}
            </View>

            {/* Break Warning */}
            {needsBreak && (
              <View style={$.alertBanner}>
                <Ionicons name="warning" size={18} color={C.warn} />
                <Text style={$.alertTxt}>Break required! 45 min after 4.5h driving.</Text>
              </View>
            )}

            {/* Live Timers */}
            <View style={$.timersRow}>
              {([
                { key: 'driving' as Status, label: 'Drive', icon: 'car' as const, color: C.primary, val: liveDrive },
                { key: 'other_work' as Status, label: 'Other Work', icon: 'construct' as const, color: C.orange, val: liveOther },
                { key: 'break' as Status, label: 'Break', icon: 'cafe' as const, color: C.accent, val: liveBreak },
              ]).map(t => {
                const isCur = curStatus === t.key;
                return (
                  <View key={t.key} style={[$.timerCard, isCur && { borderColor: t.color, borderWidth: 1.5 }]}>
                    <View style={$.timerHead}>
                      <Ionicons name={t.icon} size={16} color={t.color} />
                      <Text style={$.timerLabel}>{t.label}</Text>
                    </View>
                    <Text style={[$.timerVal, { color: t.color }]}>{fmtDur(t.val)}</Text>
                    {isCur && (
                      <View style={[$.timerLive, { backgroundColor: t.color + '18' }]}>
                        <View style={[$.timerLiveDot, { backgroundColor: t.color }]} />
                        <Text style={[$.timerLiveTxt, { color: t.color }]}>Live</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Quick Override Buttons */}
            <View style={$.overrideRow}>
              {([
                { status: 'driving' as Status, label: 'Drive', icon: 'car' as const, c: C.primary },
                { status: 'other_work' as Status, label: 'Work', icon: 'construct' as const, c: C.orange },
                { status: 'break' as Status, label: 'Break', icon: 'cafe' as const, c: C.accent },
                { status: 'rest' as Status, label: 'Rest', icon: 'bed' as const, c: C.purple },
              ]).map(btn => {
                const isCur = curStatus === btn.status;
                return (
                  <TouchableOpacity
                    key={btn.status}
                    style={[$.overrideBtn, isCur && { backgroundColor: btn.c + '18', borderColor: btn.c }]}
                    onPress={() => switchActivity(btn.status)}
                    disabled={isCur}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={btn.icon} size={18} color={isCur ? btn.c : C.textSec} />
                    <Text style={[$.overrideLbl, isCur && { color: btn.c }]}>{btn.label}</Text>
                  </TouchableOpacity>
                );
              })}
              {isActive && (
                <TouchableOpacity style={$.stopChip} onPress={stopAll} activeOpacity={0.7}>
                  <Ionicons name="stop" size={16} color={C.danger} />
                  <Text style={$.stopChipTxt}>Stop</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Compliance Summary */}
            <View style={$.compRow}>
              <View style={$.compCard}>
                <Text style={$.compLabel}>Daily Left</Text>
                <Text style={[$.compVal, { color: remainD <= 60 ? C.danger : C.info }]}>{fmtDur(remainD)}</Text>
              </View>
              <View style={$.compCard}>
                <Text style={$.compLabel}>This Week</Text>
                <Text style={[$.compVal, { color: C.purple }]}>{fmtDur(wDrive)}</Text>
              </View>
            </View>

            {/* Manual add links */}
            <View style={$.manualRow}>
              <TouchableOpacity style={$.manualBtn} onPress={() => nav.navigate('AddDriveTime')}>
                <Ionicons name="create-outline" size={14} color={C.textSec} />
                <Text style={$.manualTxt}>Manual Drive Entry</Text>
              </TouchableOpacity>
              <View style={$.manualDot} />
              <TouchableOpacity style={$.manualBtn} onPress={() => nav.navigate('AddBreakTime')}>
                <Ionicons name="create-outline" size={14} color={C.textSec} />
                <Text style={$.manualTxt}>Manual Break Entry</Text>
              </TouchableOpacity>
            </View>

            <Text style={$.secTitle}>Today's Log</Text>
          </>
        }
        ListEmptyComponent={
          <View style={$.emptyBox}>
            <View style={$.emptyCircle}><Ionicons name="time-outline" size={36} color={C.primary} /></View>
            <Text style={$.emptyTitle}>No entries yet</Text>
            <Text style={$.emptyMsg}>Turn on Smart Auto-Tracking or add entries manually</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const $ = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  screenTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  list: { padding: 16 },

  autoCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 14 },
  autoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  autoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  autoIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  autoTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  autoSub: { fontSize: 12, color: C.textSec, marginTop: 1 },
  liveBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveTxt: { fontSize: 13, fontWeight: '600', flex: 1 },
  liveElapsed: { fontSize: 14, fontWeight: '800' },

  alertBanner: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: C.warn + '12', borderWidth: 1, borderColor: C.warn + '30', marginBottom: 14, gap: 10 },
  alertTxt: { fontSize: 14, fontWeight: '600', color: C.warn, flex: 1 },

  timersRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  timerCard: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, gap: 2 },
  timerHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerLabel: { fontSize: 11, fontWeight: '600', color: C.textSec },
  timerVal: { fontSize: 20, fontWeight: '800' },
  timerLive: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 2 },
  timerLiveDot: { width: 5, height: 5, borderRadius: 2.5 },
  timerLiveTxt: { fontSize: 10, fontWeight: '700' },

  overrideRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  overrideBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, minHeight: 44 },
  overrideLbl: { fontSize: 13, fontWeight: '600', color: C.textSec },
  stopChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.danger + '40', backgroundColor: C.danger + '10', minHeight: 44 },
  stopChipTxt: { fontSize: 13, fontWeight: '700', color: C.danger },

  compRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  compCard: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  compLabel: { fontSize: 12, color: C.textSec, fontWeight: '600' },
  compVal: { fontSize: 17, fontWeight: '800' },

  manualRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 18 },
  manualBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 8 },
  manualTxt: { fontSize: 12, color: C.textSec, fontWeight: '500' },
  manualDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.border },

  secTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },

  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  entryType: { fontSize: 14, fontWeight: '600', color: C.text },
  entryTime: { fontSize: 12, color: C.textSec, marginTop: 1 },
  entryDur: { fontSize: 16, fontWeight: '700' },

  emptyBox: { alignItems: 'center', paddingVertical: 36 },
  emptyCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.primary + '14', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptyMsg: { fontSize: 13, color: C.textSec, textAlign: 'center', paddingHorizontal: 20 },
});
