import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLORS } from '../theme';

const { width } = Dimensions.get('window');

const PLANS = [
  {
    id: 'free',
    name: 'Trial Path',
    price: 'Free',
    duration: '3 Hours',
    benefits: ['Daily Jap Counter', 'Basic Mantras', 'No AI Access'],
    aiHits: 0,
    bgColors: ['#FFFFFF', '#F0F0F0'],
    textColor: '#333',
    borderColor: '#E0E0E0',
    isPopular: false,
    icon: '🌱',
  },
  {
    id: '1month',
    name: 'Sadhak',
    price: '₹11',
    oldPrice: '₹101',
    duration: '1 Month',
    benefits: ['20 AI Power Hits', 'AI Puja Vidhi', 'Daily Streak Tracking', 'Ad-Free Experience'],
    aiHits: 20,
    bgColors: ['#800000', COLORS.primary],
    textColor: '#FFF',
    borderColor: '#A00000',
    isPopular: true,
    icon: '📿',
  },
  {
    id: '3month',
    name: 'Yogi Premium',
    price: '₹21',
    oldPrice: '₹301',
    duration: '3 Months',
    benefits: ['51 AI Power Hits', 'Priority AI Processing', 'Lifetime Streak Protection', 'Exclusive Mantras'],
    aiHits: 51,
    bgColors: ['#FFD700', '#FF8C00'],
    textColor: '#500000',
    borderColor: '#FFF',
    isPopular: false,
    icon: '👑',
  }
];

export default function PaymentsScreen({ user, onBack }) {
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserPlan();
    }
  }, [user]);

  const fetchUserPlan = async () => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      setCurrentPlan(userSnap.data().planId);
    }
  };

  const handleSubscribe = async (plan) => {
    if (!user) {
      Alert.alert("Login Required", "Please login to subscribe to a plan and track your progress.");
      return;
    }

    Alert.alert(
      "Confirm Selection",
      `Choose the ${plan.name} path?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Proceed", 
          onPress: async () => {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              planId: plan.id,
              aiHitsLeft: 999, // Making it free/unlimited for now
              hasPaid: true,
              planExpiry: new Date().getTime() + (999 * 24 * 60 * 60 * 1000)
            });
            Alert.alert("Welcome!", `You are now on the ${plan.name} path. Enjoy full AI access!`);
            fetchUserPlan();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1A0000', '#3A0000', '#1A0000']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium Access</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Unlock Divine AI Wisdom</Text>
          <Text style={styles.heroSub}>Elevate your spiritual journey with personalized Vedic AI guidance.</Text>
        </View>

        {/* Free Access Note */}
        <View style={styles.offerBanner}>
          <LinearGradient colors={['rgba(255,215,0,0.1)', 'rgba(255,140,0,0.1)']} style={StyleSheet.absoluteFill} />
          <Text style={styles.offerEmoji}>✨</Text>
          <View style={styles.offerTextCol}>
            <Text style={styles.offerTitle}>Limited Time Blessing</Text>
            <Text style={styles.offerSub}>All premium features are currently FREE for all devotees.</Text>
          </View>
        </View>

        {PLANS.map((plan) => {
          const isGold = plan.id === '3month';
          const isActive = currentPlan === plan.id;
          
          return (
            <TouchableOpacity 
              key={plan.id} 
              style={[
                styles.planCardWrapper, 
                isActive && styles.activeCardWrapper,
                isGold && styles.goldCardWrapper
              ]}
              onPress={() => handleSubscribe(plan)}
              activeOpacity={0.95}
            >
              <LinearGradient 
                colors={plan.bgColors} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                style={[styles.planGradient, { borderColor: plan.borderColor }]}
              >
                {plan.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>RECOMMENDED</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.planIcon}>{plan.icon}</Text>
                  </View>
                  <View style={styles.planTitleCol}>
                    <Text style={[styles.planName, { color: plan.textColor }]}>{plan.name}</Text>
                    <Text style={[styles.planDuration, { color: plan.textColor }]}>{plan.duration}</Text>
                  </View>
                  <View style={styles.priceSection}>
                    {plan.oldPrice && <Text style={[styles.oldPrice, { color: plan.textColor }]}>{plan.oldPrice}</Text>}
                    <Text style={[styles.priceText, { color: plan.textColor }]}>{plan.price}</Text>
                  </View>
                </View>
                
                <View style={[styles.divider, { backgroundColor: isGold ? 'rgba(80,0,0,0.1)' : 'rgba(255,255,255,0.2)' }]} />
                
                <View style={styles.benefitsList}>
                  {plan.benefits.map((benefit, i) => (
                    <View key={i} style={styles.benefitItem}>
                      <View style={[styles.checkCircle, { backgroundColor: isGold ? 'rgba(80,0,0,0.1)' : 'rgba(255,255,255,0.2)' }]}>
                        <Text style={[styles.checkIcon, { color: plan.textColor }]}>✓</Text>
                      </View>
                      <Text style={[styles.benefitText, { color: plan.textColor }]}>{benefit}</Text>
                    </View>
                  ))}
                </View>

                <View style={[
                  styles.subscribeBtn, 
                  { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : (isGold ? '#500000' : '#FFF') }
                ]}>
                  <Text style={[
                    styles.subscribeText, 
                    { color: isActive ? plan.textColor : (isGold ? '#FFF' : COLORS.primary) }
                  ]}>
                    {isActive ? 'Current Active Plan' : 'Select Plan'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25, zIndex: 10 },
  backBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  backText: { fontSize: 24, color: '#FFF', fontWeight: 'bold', marginTop: -2 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  scrollContent: { padding: 20 },
  heroSection: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#FFD700', textAlign: 'center', marginBottom: 10, textShadowColor: 'rgba(255,215,0,0.3)', textShadowOffset: { width: 0, height: 5 }, textShadowRadius: 15 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  offerBanner: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', overflow: 'hidden' },
  offerEmoji: { fontSize: 35, marginRight: 15 },
  offerTextCol: { flex: 1 },
  offerTitle: { fontSize: 16, fontWeight: '900', color: '#FFD700', marginBottom: 4 },
  offerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', lineHeight: 18 },
  planCardWrapper: { borderRadius: 35, marginBottom: 25, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20 },
  goldCardWrapper: { shadowColor: '#FFD700', shadowOpacity: 0.3, shadowRadius: 30 },
  activeCardWrapper: { transform: [{ scale: 1.02 }], borderWidth: 2, borderColor: '#4CAF50' },
  planGradient: { padding: 30, borderRadius: 35, borderWidth: 1 },
  popularBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5 },
  popularText: { fontSize: 10, fontWeight: '900', color: COLORS.primary, letterSpacing: 1 },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  planIcon: { fontSize: 24 },
  planTitleCol: { flex: 1 },
  planName: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  planDuration: { fontSize: 12, opacity: 0.8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  priceSection: { alignItems: 'flex-end' },
  oldPrice: { textDecorationLine: 'line-through', fontSize: 14, marginBottom: -2, opacity: 0.6, fontWeight: '700' },
  priceText: { fontSize: 36, fontWeight: '900' },
  divider: { height: 1, marginVertical: 20 },
  benefitsList: { marginBottom: 30 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  checkIcon: { fontSize: 12, fontWeight: '900' },
  benefitText: { fontSize: 14, fontWeight: '700', opacity: 0.9 },
  subscribeBtn: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10 },
  subscribeText: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
