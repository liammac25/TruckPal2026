import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { getDrives, getBreaks, getInfs, getActivity, getWalkarounds, getSyncQueueCount } from '../lib/storage';
import { fmtDur, fmtDate, fmtTime, today, LIMITS, trunc } from '../lib/helpers';
import type { DrivingActivity } from '../lib/types';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import type { InfringementRecord } from '../lib/types';

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [todayDrive, setTodayDrive] = useState(0);
  const [todayBreak, setTodayBreak] = useState(0);
  const [weekDrive, setWeekDrive] = useState(0);
  const [lastBreak, setLastBreak] = useState<string | null>(null);
  const [recentInf, setRecentInf] = useState<InfringementRecord[]>([]);
  const [liveActivity, setLiveActivity] = useState<DrivingActivity | null>(null);
  const [pendingSync, setPendingSync] = useState(0);
  const [todayWalkaround, setTodayWalkaround] = useState(false);

  const load = useCallback(async () => {
    const td = today();
    const drives = await getDrives();
    const breaks = await getBreaks();
    const infs = await getInfs();
    const tDrives = drives.filter(d => d.date === td);
    const tBreaks = breaks.filter(b => b.date === td);
    setTodayDrive(tDrives.reduce((s, d) => s + d.durationMinutes, 0));
    setTodayBreak(tBreaks.reduce((s, b) => s + b.durationMinutes, 0));
    setRecentInf(infs.slice(0, 3));
    const now = new Date(); const day = now.getDay();
    const off = day === 0 ? -6 : 1 - day;
    const mon = new Date(now); mon.setDate(now.getDate() + off); mon.setHours(0, 0, 0, 0);
    setWeekDrive(drives.filter(d => new Date(d.date) >= mon).reduce((s, d) => s + d.durationMinutes, 0));
    if (tBreaks.length > 0) {
      const sorted = [...tBreaks].sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
      setLastBreak(sorted[0].endTime);
    } else setLastBreak(null);
    const act = await getActivity();
    setLiveActivity(act && !act.endedAt ? act : null);
    const sq = await getSyncQueueCount();
    setPendingSync(sq.pending);
    const walks = await getWalkarounds();
    setTodayWalkaround(walks.some(w => w.date === td));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const pct = Math.min((todayDrive / LIMITS.dailyDrive) * 100, 100);
  const wPct = Math.min((weekDrive / LIMITS.weeklyDrive) * 100, 100);
  const remain = Math.max(LIMITS.dailyDrive - todayDrive, 0);
  const needsBreak = todayDrive >= LIMITS.breakAfter && todayBreak < LIMITS.minBreak;

  const warn = todayDrive >= LIMITS.dailyDrive
    ? { t: 'Daily driving limit reached!', c: C.danger, i: 'alert-circle' as const }
    : needsBreak
    ? { t: 'Break required \u2013 45 min after 4.5h driving', c: C.warn, i: 'warning' as const }
    : remain <= 60 && todayDrive > 0
    ? { t: `Only ${fmtDur(remain)} driving left today`, c: C.warn, i: 'time' as const }
    : null;

  return (
    <SafeAreaView style={$.safe}>
      <ScrollView style={$.scroll} contentContainerStyle={$.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={$.header}>
          <View>
            <Text style={$.dateText}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <View style={$.logoRow}>
              <View style={$.logoIcon}><Ionicons name="bus" size={20} color="#FFF" /></View>
              <Text style={$.appName}>TruckPal</Text>
            </View>
          </View>
          <TouchableOpacity style={$.profileBtn} onPress={() => nav.navigate('MainTabs', { screen: 'Profile' })}>
            <Ionicons name="person" size={20} color={C.primary} />
          </TouchableOpacity>
        </View>

        {/* Warning */}
        {warn && (
          <View style={[$.warnBanner, { backgroundColor: warn.c + '12', borderColor: warn.c + '30' }]}>
            <Ionicons name={warn.i} size={20} color={warn.c} />
            <Text style={[$.warnTxt, { color: warn.c }]}>{warn.t}</Text>
          </View>
        )}

        {/* Live Activity Card — tappable to manage */}
        {liveActivity && (
          <Card onPress={() => nav.navigate('DrivingActivity')}>
            <View style={$.cardTitleRow}>
              <View style={[$.iconBubble, { backgroundColor: (liveActivity.status === 'driving' ? C.primary : liveActivity.status === 'break' ? C.accent : C.orange) + '18' }]}>
                <Ionicons name={liveActivity.status === 'driving' ? 'car' : liveActivity.status === 'break' ? 'cafe' : 'construct'} size={18} color={liveActivity.status === 'driving' ? C.primary : liveActivity.status === 'break' ? C.accent : C.orange} />
              </View>
              <Text style={$.cardTitle}>
                {liveActivity.status === 'driving' ? 'Driving' : liveActivity.status === 'break' ? 'On Break' : liveActivity.status === 'rest' ? 'Resting' : 'Other Work'} Now
              </Text>
              <View style={$.liveBadge}>
                <View style={$.liveDot} />
                <Text style={$.liveTxt}>Live</Text>
              </View>
            </View>
            <Text style={$.liveHint}>Tap to manage your driving activity</Text>
          </Card>
        )}

        {/* Walkaround reminder — action is the banner itself */}
        {!todayWalkaround && (
          <TouchableOpacity style={[$.warnBanner, { backgroundColor: C.info + '12', borderColor: C.info + '30' }]} onPress={() => nav.navigate('AddWalkaround')}>
            <Ionicons name="clipboard-outline" size={20} color={C.info} />
            <Text style={[$.warnTxt, { color: C.info }]}>Daily walkaround check not completed</Text>
            <Ionicons name="chevron-forward" size={16} color={C.info} />
          </TouchableOpacity>
        )}

        {/* Driving section — with inline Add Drive action in the card header */}
        <Card>
          <View style={$.cardHead}>
            <View style={$.cardTitleRow}>
              <View style={[$.iconBubble, { backgroundColor: C.primary + '18' }]}>
                <Ionicons name="speedometer" size={18} color={C.primary} />
              </View>
              <Text style={$.cardTitle}>Today\u2019s Driving</Text>
            </View>
            <TouchableOpacity style={$.inlineBtn} onPress={() => nav.navigate('AddDriveTime', {})}>
              <Ionicons name="add" size={16} color={C.primary} />
              <Text style={$.inlineBtnTxt}>Add</Text>
            </TouchableOpacity>
          </View>
          <Text style={$.bigNum}>{fmtDur(todayDrive)}</Text>
          <View style={$.bar}>
            <View style={[$.barFill, { width: `${pct}%`, backgroundColor: pct > 90 ? C.danger : pct > 75 ? C.warn : C.primary }]} />
          </View>
          <View style={$.barLabels}>
            <Text style={$.barLbl}>0h</Text>
            <Text style={$.barLbl}>{fmtDur(LIMITS.dailyDrive)} limit</Text>
          </View>
          <View style={$.statsRow}>
            <View style={$.stat}>
              <Text style={$.statLbl}>Remaining</Text>
              <Text style={[$.statVal, { color: C.accent }]}>{fmtDur(remain)}</Text>
            </View>
            <View style={[$.statDiv, { backgroundColor: C.border }]} />
            <View style={$.stat}>
              <Text style={$.statLbl}>Breaks</Text>
              <Text style={[$.statVal, { color: C.info }]}>{fmtDur(todayBreak)}</Text>
            </View>
            <View style={[$.statDiv, { backgroundColor: C.border }]} />
            <View style={$.stat}>
              <Text style={$.statLbl}>Weekly</Text>
              <Text style={[$.statVal, { color: C.purple }]}>{fmtDur(weekDrive)}</Text>
            </View>
          </View>
        </Card>

        {/* Break section — with inline Add Break action */}
        <Card>
          <View style={$.cardHead}>
            <View style={$.cardTitleRow}>
              <View style={[$.iconBubble, { backgroundColor: C.accent + '18' }]}>
                <Ionicons name="cafe" size={18} color={C.accent} />
              </View>
              <Text style={$.cardTitle}>Break Status</Text>
            </View>
            <TouchableOpacity style={[$.inlineBtn, { borderColor: C.accent + '40' }]} onPress={() => nav.navigate('AddBreakTime', {})}>
              <Ionicons name="add" size={16} color={C.accent} />
              <Text style={[$.inlineBtnTxt, { color: C.accent }]}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={$.breakBody}>
            {lastBreak ? (
              <><Text style={$.breakLbl}>Last break ended</Text><Text style={$.breakVal}>{fmtTime(lastBreak)}</Text></>
            ) : (
              <><Text style={$.breakLbl}>No breaks recorded today</Text>
              <Text style={$.breakHint}>Remember: 45 min break after 4.5h driving</Text></>
            )}
          </View>
        </Card>

        {/* Start Activity — primary CTA when no live activity */}
        {!liveActivity && (
          <TouchableOpacity style={$.primaryCta} onPress={() => nav.navigate('DrivingActivity')}>
            <Ionicons name="play-circle" size={22} color="#FFF" />
            <Text style={$.primaryCtaTxt}>Start Driving Activity</Text>
          </TouchableOpacity>
        )}

        {/* Quick tools row — secondary actions, 3 across, contextual */}
        <Text style={$.section}>Quick Tools</Text>
        <View style={$.toolsRow}>
          <TouchableOpacity style={$.toolBtn} onPress={() => nav.navigate('AddWalkaround')}>
            <View style={[$.toolIcon, { backgroundColor: '#0891B2' + '20' }]}>
              <Ionicons name="clipboard" size={20} color="#0891B2" />
            </View>
            <Text style={$.toolLbl}>Walkaround</Text>
          </TouchableOpacity>
          <TouchableOpacity style={$.toolBtn} onPress={() => nav.navigate('AddInfringement', {})}>
            <View style={[$.toolIcon, { backgroundColor: C.danger + '20' }]}>
              <Ionicons name="warning" size={20} color={C.danger} />
            </View>
            <Text style={$.toolLbl}>Infringement</Text>
          </TouchableOpacity>
          <TouchableOpacity style={$.toolBtn} onPress={() => nav.navigate('AddTachoRecord', {})}>
            <View style={[$.toolIcon, { backgroundColor: C.orange + '20' }]}>
              <Ionicons name="document-text" size={20} color={C.orange} />
            </View>
            <Text style={$.toolLbl}>Tacho Note</Text>
          </TouchableOpacity>
        </View>

        {/* Sync status — informational, not an action */}
        {pendingSync > 0 && (
          <View style={[$.warnBanner, { backgroundColor: C.purple + '10', borderColor: C.purple + '25' }]}>
            <Ionicons name="cloud-offline-outline" size={18} color={C.purple} />
            <Text style={[$.warnTxt, { color: C.purple }]}>{pendingSync} item{pendingSync > 1 ? 's' : ''} waiting to sync</Text>
          </View>
        )}

        {/* Recent Infringements — with section-level action */}
        <View style={$.sectionHead}>
          <Text style={$.section}>Recent Infringements</Text>
          {recentInf.length > 0 && (
            <TouchableOpacity onPress={() => nav.navigate('MoreInfringements')}>
              <Text style={$.seeAll}>See all</Text>
            </TouchableOpacity>
          )}
        </View>
        {recentInf.length === 0 ? (
          <Card><View style={$.emptySmall}>
            <Ionicons name="shield-checkmark" size={28} color={C.success} />
            <Text style={$.emptyTxt}>No infringements recorded</Text>
          </View></Card>
        ) : recentInf.map(inf => (
          <Card key={inf.id} onPress={() => nav.navigate('InfringementDetail', { id: inf.id })}>
            <View style={$.infRow}>
              <View style={{ flex: 1 }}>
                <Text style={$.infType}>{inf.infringementType}</Text>
                <Text style={$.infMeta}>{fmtDate(inf.dateTime)} \u2022 {inf.vehicleReg}</Text>
                {inf.description ? <Text style={$.infDesc}>{trunc(inf.description, 55)}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <StatusBadge status={inf.status} small />
                <Ionicons name="chevron-forward" size={16} color={C.textMut} />
              </View>
            </View>
          </Card>
        ))}

        {/* Weekly Progress */}
        <Card>
          <View style={$.cardTitleRow}>
            <View style={[$.iconBubble, { backgroundColor: C.purple + '18' }]}>
              <Ionicons name="bar-chart" size={18} color={C.purple} />
            </View>
            <Text style={$.cardTitle}>Weekly Progress</Text>
          </View>
          <View style={{ marginTop: 12 }}>
            <View style={$.bar}>
              <View style={[$.barFill, { width: `${wPct}%`, backgroundColor: wPct > 85 ? C.warn : C.purple }]} />
            </View>
            <View style={$.barLabels}>
              <Text style={$.barLbl}>{fmtDur(weekDrive)}</Text>
              <Text style={$.barLbl}>{fmtDur(LIMITS.weeklyDrive)} limit</Text>
            </View>
          </View>
        </Card>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const $ = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  dateText: { fontSize: 13, color: C.textSec, marginBottom: 4 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  appName: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  profileBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primary + '18', justifyContent: 'center', alignItems: 'center' },
  warnBanner: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14, gap: 10 },
  warnTxt: { fontSize: 14, fontWeight: '600', flex: 1 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBubble: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  // Inline action button placed next to section header
  inlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.primary + '40', minHeight: 44 },
  inlineBtnTxt: { fontSize: 13, fontWeight: '600', color: C.primary },
  bigNum: { fontSize: 28, fontWeight: '800', color: C.primary, marginBottom: 10 },
  bar: { height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  barLbl: { fontSize: 11, color: C.textMut },
  statsRow: { flexDirection: 'row', marginTop: 16, alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statLbl: { fontSize: 11, color: C.textSec, marginBottom: 4 },
  statVal: { fontSize: 18, fontWeight: '700' },
  statDiv: { width: 1, height: 28 },
  breakBody: { alignItems: 'center', paddingVertical: 8 },
  breakLbl: { fontSize: 14, color: C.textSec, marginBottom: 4 },
  breakVal: { fontSize: 24, fontWeight: '700', color: C.text },
  breakHint: { fontSize: 13, color: C.warn, marginTop: 4, textAlign: 'center' },
  // Live activity badge
  liveBadge: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
  liveTxt: { fontSize: 13, fontWeight: '600', color: C.success },
  liveHint: { fontSize: 13, color: C.textSec, marginTop: 4 },
  // Primary CTA — single clear action
  primaryCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.primary, paddingVertical: 18, borderRadius: 16, marginBottom: 20, minHeight: 56 },
  primaryCtaTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  // Quick tools — 3-across, compact, secondary
  section: { fontSize: 18, fontWeight: '700', color: C.text, marginTop: 4, marginBottom: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 12 },
  seeAll: { fontSize: 14, fontWeight: '600', color: C.primary },
  toolsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  toolBtn: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, minHeight: 80 },
  toolIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  toolLbl: { fontSize: 12, fontWeight: '600', color: C.textSec },
  emptySmall: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  emptyTxt: { fontSize: 14, color: C.textSec },
  infRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infType: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 },
  infMeta: { fontSize: 13, color: C.textSec },
  infDesc: { fontSize: 12, color: C.textMut, marginTop: 4 },
});
