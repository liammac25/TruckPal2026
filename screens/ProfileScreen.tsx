import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Switch } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { getUser, saveUser, getVehicle, saveVehicle, id } from '../lib/storage';
import Card from '../components/Card';
import FormInput from '../components/FormInput';
import type { User, Vehicle } from '../lib/types';

function PRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={ps.row}>
      <Ionicons name={icon} size={17} color={C.textMut} />
      <View style={{ flex: 1 }}><Text style={ps.lbl}>{label}</Text><Text style={ps.val}>{value || 'Not set'}</Text></View>
    </View>
  );
}
const ps = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }, lbl: { fontSize: 11, color: C.textSec }, val: { fontSize: 15, fontWeight: '500', color: C.text } });

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState<User>({ id: id(), firstName: '', lastName: '', licenceNumber: '', cpcExpiry: '', phone: '', email: '', company: '', depotLocation: '', notificationsEnabled: true, darkMode: true, createdAt: new Date().toISOString() });
  const [veh, setVeh] = useState<Vehicle>({ id: id(), registration: '', make: '', model: '', type: 'HGV', motExpiry: '', insuranceExpiry: '', tachoCalibration: '' });

  const load = useCallback(async () => { const u = await getUser(); const v = await getVehicle(); if (u) setUser(u); if (v) setVeh(v); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSave = async () => { await saveUser(user); await saveVehicle(veh); setEditing(false); Alert.alert('Saved', 'Profile updated.'); };

  const Section = ({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) => (
    <View style={styles.section}>
      <View style={styles.secHead}><Ionicons name={icon} size={18} color={C.primary} /><Text style={styles.secTitle}>{title}</Text></View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <Text style={styles.screenTitle}>Profile</Text>
        <TouchableOpacity style={[styles.editBtn, { backgroundColor: editing ? C.success : C.primary }]} onPress={editing ? handleSave : () => setEditing(true)}>
          <Ionicons name={editing ? 'checkmark' : 'create'} size={18} color="#FFF" />
          <Text style={styles.editBtnTxt}>{editing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Ionicons name="person" size={44} color={C.primary} /></View>
          <Text style={styles.userName}>{user.firstName || user.lastName ? `${user.firstName} ${user.lastName}` : 'Set Your Name'}</Text>
          {user.company ? <Text style={styles.userCo}>{user.company}</Text> : null}
        </View>

        <Section title="Driver Details" icon="person-outline">
          <Card>{editing ? (
            <><FormInput label="First Name" value={user.firstName} onChangeText={t => setUser({ ...user, firstName: t })} icon="person-outline" />
            <FormInput label="Last Name" value={user.lastName} onChangeText={t => setUser({ ...user, lastName: t })} icon="person-outline" />
            <FormInput label="Licence Number" value={user.licenceNumber} onChangeText={t => setUser({ ...user, licenceNumber: t })} icon="id-card-outline" autoCapitalize="characters" />
            <FormInput label="CPC Expiry (YYYY-MM-DD)" value={user.cpcExpiry} onChangeText={t => setUser({ ...user, cpcExpiry: t })} icon="calendar-outline" placeholder="2025-12-31" />
            <FormInput label="Phone" value={user.phone} onChangeText={t => setUser({ ...user, phone: t })} icon="call-outline" keyboardType="phone-pad" />
            <FormInput label="Email" value={user.email} onChangeText={t => setUser({ ...user, email: t })} icon="mail-outline" keyboardType="email-address" autoCapitalize="none" /></>
          ) : (
            <><PRow icon="person" label="Name" value={`${user.firstName} ${user.lastName}`.trim()} />
            <PRow icon="id-card" label="Licence" value={user.licenceNumber} />
            <PRow icon="school" label="CPC Expiry" value={user.cpcExpiry} />
            <PRow icon="call" label="Phone" value={user.phone} />
            <PRow icon="mail" label="Email" value={user.email} /></>
          )}</Card>
        </Section>

        <Section title="Vehicle Details" icon="car-outline">
          <Card>{editing ? (
            <><FormInput label="Registration" value={veh.registration} onChangeText={t => setVeh({ ...veh, registration: t.toUpperCase() })} icon="car-outline" autoCapitalize="characters" />
            <FormInput label="Make" value={veh.make} onChangeText={t => setVeh({ ...veh, make: t })} />
            <FormInput label="Model" value={veh.model} onChangeText={t => setVeh({ ...veh, model: t })} />
            <FormInput label="MOT Expiry (YYYY-MM-DD)" value={veh.motExpiry} onChangeText={t => setVeh({ ...veh, motExpiry: t })} icon="calendar-outline" placeholder="2025-06-30" />
            <FormInput label="Insurance Expiry" value={veh.insuranceExpiry} onChangeText={t => setVeh({ ...veh, insuranceExpiry: t })} icon="calendar-outline" /></>
          ) : (
            <><PRow icon="car" label="Registration" value={veh.registration} />
            <PRow icon="construct" label="Make/Model" value={`${veh.make} ${veh.model}`.trim()} />
            <PRow icon="document" label="MOT Expiry" value={veh.motExpiry} />
            <PRow icon="shield" label="Insurance" value={veh.insuranceExpiry} /></>
          )}</Card>
        </Section>

        <Section title="Company" icon="business-outline">
          <Card>{editing ? (
            <><FormInput label="Company Name" value={user.company} onChangeText={t => setUser({ ...user, company: t })} icon="business-outline" />
            <FormInput label="Depot Location" value={user.depotLocation} onChangeText={t => setUser({ ...user, depotLocation: t })} icon="location-outline" /></>
          ) : (
            <><PRow icon="business" label="Company" value={user.company} /><PRow icon="location" label="Depot" value={user.depotLocation} /></>
          )}</Card>
        </Section>

        <Section title="Settings" icon="settings-outline">
          <Card>
            <View style={styles.settRow}>
              <View style={styles.settLeft}><Ionicons name="notifications" size={18} color={C.primary} /><Text style={styles.settLbl}>Push Notifications</Text></View>
              <Switch value={user.notificationsEnabled} onValueChange={v => { const u = { ...user, notificationsEnabled: v }; setUser(u); saveUser(u); }} trackColor={{ false: C.border, true: C.primary + '60' }} thumbColor={user.notificationsEnabled ? C.primary : C.textMut} />
            </View>
            <View style={[styles.div, { backgroundColor: C.border }]} />
            <View style={styles.settRow}>
              <View style={styles.settLeft}><Ionicons name="moon" size={18} color={C.purple} /><Text style={styles.settLbl}>Dark Mode</Text></View>
              <Switch value={user.darkMode} onValueChange={v => { const u = { ...user, darkMode: v }; setUser(u); saveUser(u); }} trackColor={{ false: C.border, true: C.purple + '60' }} thumbColor={user.darkMode ? C.purple : C.textMut} />
            </View>
          </Card>
        </Section>

        <Section title="Subscription" icon="diamond-outline">
          <Card onPress={() => nav.navigate('Subscription')}>
            <View style={styles.menuRow}>
              <View style={styles.settLeft}><Ionicons name="diamond" size={18} color={C.primary} /><Text style={styles.settLbl}>Manage Subscription</Text></View>
              <Ionicons name="chevron-forward" size={16} color={C.textMut} />
            </View>
          </Card>
        </Section>

        <Section title="Data & Privacy" icon="lock-closed-outline">
          <Card>
            {[{ icon: 'download' as const, label: 'Export All Data', c: C.info },
              { icon: 'cloud-upload' as const, label: 'Backup to Cloud', c: C.accent },
              { icon: 'shield-checkmark' as const, label: 'Privacy Policy', c: C.success },
            ].map((item, i) => (
              <React.Fragment key={item.label}>
                {i > 0 && <View style={[styles.div, { backgroundColor: C.border }]} />}
                <TouchableOpacity style={styles.menuRow}>
                  <View style={styles.settLeft}><Ionicons name={item.icon} size={18} color={item.c} /><Text style={styles.settLbl}>{item.label}</Text></View>
                  <Ionicons name="chevron-forward" size={16} color={C.textMut} />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </Card>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerTxt}>TruckPal v1.0</Text>
          <Text style={styles.footerTxt}>Offline-first \u2022 Your data stays on your device</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  screenTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, minHeight: 44 },
  editBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  content: { padding: 16 },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.primary + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  userName: { fontSize: 22, fontWeight: '700', color: C.text },
  userCo: { fontSize: 14, color: C.textSec, marginTop: 4 },
  section: { marginBottom: 20 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  secTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  settRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settLbl: { fontSize: 15, color: C.text },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  div: { height: 1 },
  footer: { alignItems: 'center', paddingVertical: 20, gap: 4 },
  footerTxt: { fontSize: 13, color: C.textMut },
});
