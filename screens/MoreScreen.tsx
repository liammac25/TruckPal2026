import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { getSubscription } from '../lib/storage';
import Card from '../components/Card';
import type { UserSubscription } from '../lib/types';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  color: string;
  route: string;
  params?: any;
}

const SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Compliance & Records',
    items: [
      { icon: 'clipboard', label: 'Walkaround Checks', subtitle: 'Daily vehicle inspections', color: '#0891B2', route: 'MoreWalkaround' },
      { icon: 'speedometer', label: 'Tacho Records', subtitle: 'Tachograph notes & history', color: C.orange, route: 'MoreTacho' },
      { icon: 'warning', label: 'Infringements', subtitle: 'Record & manage infringements', color: C.danger, route: 'MoreInfringements' },
    ],
  },
  {
    title: 'On the Road',
    items: [
      { icon: 'location', label: 'Parking & Stops', subtitle: 'Truck stops, fuel & services', color: C.purple, route: 'MoreParking' },
      { icon: 'play-circle', label: 'Driving Activity', subtitle: 'Start/stop driving timer', color: C.primary, route: 'DrivingActivity' },
    ],
  },
  {
    title: 'Money & Admin',
    items: [
      { icon: 'wallet', label: 'Expenses', subtitle: 'Fuel, meals, tolls & receipts', color: C.accent, route: 'MoreExpenses' },
      { icon: 'diamond', label: 'Subscription', subtitle: 'Manage your plan', color: C.pink, route: 'Subscription' },
    ],
  },
];

export default function MoreScreen() {
  const nav = useNavigation<any>();
  const [sub, setSub] = useState<UserSubscription | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      (async () => { setSub(await getSubscription()); })();
    }, [])
  );

  const isPro = sub?.status === 'active' && sub.planId !== 'free' && sub.planId !== '';

  return (
    <SafeAreaView style={$.safe}>
      <View style={$.headerBar}>
        <Text style={$.screenTitle}>More</Text>
      </View>
      <ScrollView contentContainerStyle={$.content} showsVerticalScrollIndicator={false}>

        {/* Trial promo — only shown when not on a Pro plan */}
        {!isPro && (
          <TouchableOpacity style={$.promoCard} onPress={() => nav.navigate('Subscription')} activeOpacity={0.75}>
            <View style={$.promoLeft}>
              <View style={$.promoBadge}>
                <Ionicons name="gift" size={12} color="#FFF" />
                <Text style={$.promoBadgeTxt}>7-DAY FREE TRIAL</Text>
              </View>
              <Text style={$.promoTitle}>Unlock Full Access</Text>
              <Text style={$.promoSub}>Try every Pro feature free{'\n'}No payment required to start</Text>
            </View>
            <View style={$.promoRight}>
              <View style={$.promoArrow}>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {SECTIONS.map((section) => (
          <View key={section.title} style={$.section}>
            <Text style={$.sectionTitle}>{section.title}</Text>
            <Card style={{ padding: 0 }}>
              {section.items.map((item, idx) => (
                <View key={item.route}>
                  {idx > 0 && <View style={$.divider} />}
                  <TouchableOpacity
                    style={$.menuItem}
                    onPress={() => nav.navigate(item.route, item.params || {})}
                    activeOpacity={0.6}
                  >
                    <View style={[$.menuIcon, { backgroundColor: item.color + '18' }]}>
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <View style={$.menuText}>
                      <Text style={$.menuLabel}>{item.label}</Text>
                      <Text style={$.menuSub}>{item.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={C.textMut} />
                  </TouchableOpacity>
                </View>
              ))}
            </Card>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const $ = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  screenTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  content: { padding: 16 },

  // Trial promo card
  promoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.primary, borderRadius: 18,
    padding: 18, marginBottom: 22, overflow: 'hidden',
  },
  promoLeft: { flex: 1 },
  promoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  promoBadgeTxt: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.8 },
  promoTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  promoSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 19 },
  promoRight: { marginLeft: 12 },
  promoArrow: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: C.textSec,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 10, paddingLeft: 4,
  },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    minHeight: 64,
  },
  menuIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 16, fontWeight: '600', color: C.text },
  menuSub: { fontSize: 13, color: C.textSec, marginTop: 2 },
});
