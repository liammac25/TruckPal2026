import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert, Animated, Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { getSubscription, saveSubscription } from '../lib/storage';
import type { UserSubscription } from '../lib/types';

const ANNUAL_PRICE = 59.99;
const MONTHLY_PRICE = 7.99;
const ANNUAL_MONTHLY = +(ANNUAL_PRICE / 12).toFixed(2);     // 5.00
const ANNUAL_SAVING = +((MONTHLY_PRICE * 12) - ANNUAL_PRICE).toFixed(2); // 35.89

const FEATURES = [
  { icon: 'navigate-outline' as const,       text: 'Automatic Motion & Driving Tracking' },
  { icon: 'cloud-done-outline' as const,     text: 'Unlimited Document & Infringement Storage' },
  { icon: 'timer-outline' as const,          text: 'Real-Time Tachograph & Break Timers' },
  { icon: 'bar-chart-outline' as const,      text: 'Detailed Weekly Progress Analytics' },
  { icon: 'camera-outline' as const,         text: 'Receipt & Defect Photo Capture' },
  { icon: 'clipboard-outline' as const,      text: 'Unlimited Walkaround Checks' },
];

export default function SubscriptionScreen() {
  const nav = useNavigation<any>();
  const [sub, setSub] = useState<UserSubscription>({
    planId: '', status: 'none', startDate: null, endDate: null, autoRenew: false,
  });
  const [selected, setSelected] = useState<'annual' | 'monthly'>('annual');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const s = await getSubscription();
      setSub(s);
    })();
    // Subtle pulse on the CTA
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleStartTrial = async () => {
    const planId = selected === 'annual' ? 'pro_yearly' : 'pro_monthly';
    const price = selected === 'annual' ? `£${ANNUAL_PRICE}/year` : `£${MONTHLY_PRICE}/month`;

    Alert.alert(
      'Start Your Free Trial',
      `You\u2019ll get full access to every feature for 7 days \u2014 completely free.\n\nAfter the trial: ${price}\nCancel anytime before the trial ends \u2014 you won\u2019t be charged.\n\nPayment processing will be available in a future update. For now, Pro features are unlocked for preview.`,
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Start Free Trial',
          onPress: async () => {
            const s: UserSubscription = {
              planId, status: 'active',
              startDate: new Date().toISOString(), endDate: null, autoRenew: true,
            };
            await saveSubscription(s);
            setSub(s);
            Alert.alert('\u2705 Trial Activated!', 'Your 7-day free trial is active. Enjoy full access to every feature!');
          },
        },
      ]
    );
  };

  const isActive = sub.status === 'active';
  const isPro = isActive && sub.planId !== 'free' && sub.planId !== '';

  return (
    <SafeAreaView style={$.safe}>
      {/* Header */}
      <View style={$.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={$.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        {isPro && (
          <View style={$.activeChip}>
            <View style={$.activeDot} />
            <Text style={$.activeTxt}>Pro Active</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => nav.goBack()} style={$.closeBtn}>
          <Ionicons name="close" size={22} color={C.textSec} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={$.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ═══════════════════════════════════════
            1. HERO BANNER
            ═══════════════════════════════════════ */}
        <View style={$.hero}>
          <View style={$.heroGlow1} />
          <View style={$.heroGlow2} />

          {/* Trial badge */}
          <View style={$.trialBadge}>
            <Ionicons name="gift" size={13} color="#FFF" />
            <Text style={$.trialBadgeTxt}>7-DAY FREE TRIAL INCLUDED</Text>
          </View>

          {/* Headline */}
          <Text style={$.heroTitle}>Unlock Full Access</Text>
          <Text style={$.heroSub}>
            Try all premium features free for 7 days.{'\n'}Cancel anytime.
          </Text>
        </View>

        {/* ═══════════════════════════════════════
            2. FEATURE CHECKLIST
            ═══════════════════════════════════════ */}
        <View style={$.featSection}>
          <Text style={$.featHeading}>Everything you get</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={$.featRow}>
              <View style={$.featCheck}>
                <Ionicons name="checkmark" size={16} color={C.accent} />
              </View>
              <Text style={$.featTxt}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* ═══════════════════════════════════════
            3. PRICING RADIO CARDS
            ═══════════════════════════════════════ */}
        <View style={$.pricingSection}>
          {/* Annual card */}
          <TouchableOpacity
            style={[$.planCard, selected === 'annual' && $.planCardSelected]}
            onPress={() => setSelected('annual')}
            activeOpacity={0.8}
          >
            {/* Save badge */}
            <View style={$.saveBadge}>
              <Text style={$.saveBadgeTxt}>SAVE OVER 35%</Text>
            </View>

            {/* Radio dot */}
            <View style={[$.radio, selected === 'annual' && $.radioSelected]}>
              {selected === 'annual' && <View style={$.radioInner} />}
            </View>

            <View style={$.planInfo}>
              <Text style={[$.planName, selected === 'annual' && $.planNameSelected]}>Annual Plan</Text>
              <View style={$.priceRow}>
                <Text style={[$.planPrice, selected === 'annual' && $.planPriceSelected]}>
                £{ANNUAL_PRICE}
                </Text>
                <Text style={$.planPer}> / year</Text>
              </View>
              <Text style={$.planBreakdown}>
                7 days free, then £{ANNUAL_MONTHLY}/mo billed annually
              </Text>
            </View>
          </TouchableOpacity>

          {/* Monthly card */}
          <TouchableOpacity
            style={[$.planCard, selected === 'monthly' && $.planCardSelected]}
            onPress={() => setSelected('monthly')}
            activeOpacity={0.8}
          >
            <View style={[$.radio, selected === 'monthly' && $.radioSelected]}>
              {selected === 'monthly' && <View style={$.radioInner} />}
            </View>

            <View style={$.planInfo}>
              <Text style={[$.planName, selected === 'monthly' && $.planNameSelected]}>Monthly Plan</Text>
              <View style={$.priceRow}>
                <Text style={[$.planPrice, selected === 'monthly' && $.planPriceSelected]}>
                £{MONTHLY_PRICE}
                </Text>
                <Text style={$.planPer}> / month</Text>
              </View>
              <Text style={$.planBreakdown}>
                7 days free, then £{MONTHLY_PRICE}/mo
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════
            4. ACTION BUTTON & FOOTER
            ═══════════════════════════════════════ */}
        <View style={$.ctaSection}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
            <TouchableOpacity style={$.ctaBtn} onPress={handleStartTrial} activeOpacity={0.85}>
              <Ionicons name="rocket-outline" size={20} color="#FFF" />
              <Text style={$.ctaBtnTxt}>Start 7-Day Free Trial</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={$.ctaHint}>
            {selected === 'annual'
              ? `No charge for 7 days \u2022 Then £${ANNUAL_PRICE}/year`
              : `No charge for 7 days \u2022 Then £${MONTHLY_PRICE}/month`}
          </Text>
        </View>

        {/* Active status */}
        {isActive && (
          <View style={$.statusBar}>
            <Ionicons name="checkmark-circle" size={18} color={C.success} />
            <Text style={$.statusTxt}>
              {isPro ? 'Pro plan active \u2014 full access' : 'Free plan active'}
            </Text>
            {isPro && (
              <TouchableOpacity
                onPress={() => Alert.alert('Cancel', 'Cancellation will be available when payment processing is integrated.')}
              >
                <Text style={$.cancelLink}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Legal footer */}
        <View style={$.footer}>
          <View style={$.footerRow}>
            <View style={$.footerItem}>
              <Ionicons name="ban-outline" size={14} color={C.textMut} />
              <Text style={$.footerItemTxt}>No commitment</Text>
            </View>
            <View style={$.footerDot} />
            <View style={$.footerItem}>
              <Ionicons name="lock-closed-outline" size={14} color={C.textMut} />
              <Text style={$.footerItemTxt}>Secure checkout</Text>
            </View>
          </View>
          <Text style={$.legalTxt}>
            Payment will be charged to your app store account after the free trial ends.
            Subscription auto-renews unless cancelled at least 24 hours before the end of the current period.
            Manage or cancel anytime in your device settings.
          </Text>
          <View style={$.legalLinks}>
            <TouchableOpacity><Text style={$.legalLink}>Terms of Service</Text></TouchableOpacity>
            <Text style={$.legalSep}>\u2022</Text>
            <TouchableOpacity><Text style={$.legalLink}>Privacy Policy</Text></TouchableOpacity>
            <Text style={$.legalSep}>\u2022</Text>
            <TouchableOpacity><Text style={$.legalLink}>Restore Purchase</Text></TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const $ = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  closeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-end' },
  activeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.success + '15', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
  },
  activeDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.success },
  activeTxt: { fontSize: 12, fontWeight: '700', color: C.success },

  scroll: { paddingBottom: 20 },

  /* 1. Hero */
  hero: {
    alignItems: 'center', paddingTop: 8, paddingBottom: 32,
    paddingHorizontal: 24, position: 'relative', overflow: 'hidden',
  },
  heroGlow1: {
    position: 'absolute', top: -60, left: -40,
    width: 180, height: 180, borderRadius: 90, backgroundColor: C.primary + '0C',
  },
  heroGlow2: {
    position: 'absolute', bottom: -40, right: -50,
    width: 160, height: 160, borderRadius: 80, backgroundColor: C.accent + '08',
  },
  trialBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 22, marginBottom: 20,
  },
  trialBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 1.4 },
  heroTitle: {
    fontSize: 32, fontWeight: '800', color: C.text,
    textAlign: 'center', marginBottom: 10, letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 16, color: C.textSec, textAlign: 'center', lineHeight: 24,
  },

  /* 2. Features */
  featSection: { paddingHorizontal: 20, marginBottom: 28 },
  featHeading: {
    fontSize: 15, fontWeight: '700', color: C.textSec,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14,
  },
  featRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 10,
  },
  featCheck: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.accent + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  featTxt: { fontSize: 15, color: C.text, fontWeight: '500', flex: 1 },

  /* 3. Pricing */
  pricingSection: { paddingHorizontal: 16, marginBottom: 24, gap: 12 },
  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.border,
    padding: 18, position: 'relative', overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: C.primary, backgroundColor: C.primary + '08',
  },
  saveBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: C.accent, paddingHorizontal: 10, paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  saveBadgeTxt: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  radio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioSelected: { borderColor: C.primary },
  radioInner: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary,
  },
  planInfo: { flex: 1 },
  planName: { fontSize: 17, fontWeight: '700', color: C.textSec, marginBottom: 4 },
  planNameSelected: { color: C.text },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  planPrice: { fontSize: 24, fontWeight: '800', color: C.textSec },
  planPriceSelected: { color: C.primary },
  planPer: { fontSize: 14, color: C.textMut, fontWeight: '500' },
  planBreakdown: { fontSize: 13, color: C.textMut, marginTop: 4 },

  /* 4. CTA */
  ctaSection: { paddingHorizontal: 16, alignItems: 'center', marginBottom: 20 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: C.primary,
    paddingVertical: 20, borderRadius: 16,
    width: '100%', minHeight: 60,
  },
  ctaBtnTxt: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  ctaHint: {
    fontSize: 13, color: C.textMut, marginTop: 10, textAlign: 'center',
  },

  /* Status */
  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 16,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, backgroundColor: C.success + '0C',
    borderWidth: 1, borderColor: C.success + '20',
  },
  statusTxt: { flex: 1, fontSize: 13, fontWeight: '600', color: C.success },
  cancelLink: { fontSize: 13, fontWeight: '600', color: C.danger },

  /* Footer */
  footer: { paddingHorizontal: 20, alignItems: 'center' },
  footerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 12,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerItemTxt: { fontSize: 12, color: C.textMut, fontWeight: '500' },
  footerDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.border },
  legalTxt: {
    fontSize: 11, color: C.textMut, textAlign: 'center', lineHeight: 17,
    marginBottom: 12,
  },
  legalLinks: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legalLink: { fontSize: 12, color: C.textSec, fontWeight: '500', textDecorationLine: 'underline' },
  legalSep: { fontSize: 10, color: C.border },
});
