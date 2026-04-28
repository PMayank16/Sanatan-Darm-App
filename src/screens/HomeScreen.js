import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme';
import ChatModal from '../components/ChatModal';

const { width } = Dimensions.get('window');

export default function HomeScreen({ onAction, user, navigation }) {
  const { t, i18n } = useTranslation();
  const [isChatVisible, setChatVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();

    // Constant rotation for Ask AI button border
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Floating animation for hero om circle
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getProfileInitial = () => {
    if (user?.displayName) return user.displayName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  const isEnglish = i18n.language === 'en';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient colors={['#FDFCFB', '#FFF5F5', '#FDFCFB']} style={StyleSheet.absoluteFill} />

      {/* Premium Maroon Header */}
      <View style={styles.navbar}>
        <LinearGradient
          colors={[COLORS.primary, '#500000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.navPattern} />
        <View style={styles.navContent}>
          <View>
            <Text style={styles.navGreeting}>{t('greeting')}</Text>
            <Text style={[styles.navTitle, isEnglish && { fontSize: 20 }]}>{t('appName')}</Text>
          </View>
          <View style={styles.navRight}>
            {user ? (
              <TouchableOpacity style={styles.profileCircle} onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.profileInitial}>{getProfileInitial()}</Text>
                <View style={styles.onlineDot} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.loginBtn} onPress={() => onAction('login')}>
                <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']} style={styles.loginBtnGrad}>
                  <Text style={styles.loginText}>{t('login')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Enhanced Hero Section */}
          <View style={styles.heroWrapper}>
            <LinearGradient
              colors={['#800000', COLORS.primary, '#4A0000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroPatternTopRight} />
              <View style={styles.heroPatternBottomLeft} />
              
              <View style={styles.heroContent}>
                <Animated.View style={[styles.omCircle, { transform: [{ translateY: floatAnim }] }]}>
                  <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.omGradient}>
                    <Text style={styles.omText}>ॐ</Text>
                  </LinearGradient>
                </Animated.View>
                <Text style={styles.heroTitle}>{t('appName')}</Text>
                <Text style={styles.heroSubtitle}>{t('tagline')}</Text>
              </View>
            </LinearGradient>
            {/* Glow behind hero */}
            <View style={styles.heroGlow} />
          </View>

          {/* Premium Banner */}
          {!user?.hasPaid && (
            <TouchableOpacity 
              style={styles.premiumBanner} 
              onPress={() => navigation.navigate('Payments')}
              activeOpacity={0.9}
            >
              <LinearGradient colors={['#FF9933', '#FF5E62']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.premiumGradient}>
                <View style={styles.premiumTextContainer}>
                  <Text style={styles.premiumTitle}>Unlock AI Wisdom ✨</Text>
                  <Text style={styles.premiumSub}>Get 51 AI Hits, Streak & more!</Text>
                </View>
                <View style={styles.premiumBtn}>
                  <Text style={styles.premiumBtnText}>UPGRADE</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Quick Access Grid (Glassmorphism) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('quickAccess')}</Text>
            <View style={styles.grid}>
              {[
                { id: 'japCounter', title: t('japCounter'), icon: '📿', grad: ['#FFEFEF', '#FFF9F9'] },
                { id: 'pujaVidhi', title: t('pujaVidhi'), icon: '🪔', grad: ['#F5F5FF', '#FAFAFF'] },
                { id: 'mantras', title: t('mantras'), icon: '🕉️', grad: ['#F5FFF5', '#FAFFFA'] },
                { id: 'panchang', title: t('panchang'), icon: '📅', grad: ['#FFF9F2', '#FFFCF9'] },
              ].map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.gridItemWrapper}
                  onPress={() => onAction(item.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient colors={item.grad} style={styles.gridItem}>
                    <View style={styles.iconCircle}>
                      <Text style={styles.gridIcon}>{item.icon}</Text>
                    </View>
                    <Text style={styles.gridLabel}>{item.title}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Book Pandit Ji Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spiritual Services</Text>
            <TouchableOpacity 
              style={styles.panditBanner} 
              onPress={() => navigation.navigate('BookPandit')}
              activeOpacity={0.9}
            >
              <LinearGradient colors={['#FFF2E5', '#FFF9F2']} style={styles.panditGradient}>
                <View style={styles.panditContent}>
                  <Text style={styles.panditTitle}>Book a Pandit Ji 📿</Text>
                  <Text style={styles.panditSub}>Find verified, experienced Pandits near you for Pujas, Homa, & Sanskar.</Text>
                  <View style={styles.locationBadge}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.locationText}>Detecting near your location...</Text>
                  </View>
                </View>
                <View style={styles.panditImageWrapper}>
                  <Text style={styles.panditEmoji}>🕉️</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Streak Summary Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sadhana Streak</Text>
            <TouchableOpacity 
              style={styles.streakWrapper} 
              onPress={() => navigation.navigate('Streak')}
              activeOpacity={0.9}
            >
              <LinearGradient colors={[COLORS.primary, '#600000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.streakGradient}>
                <View style={styles.streakMain}>
                  <View style={styles.streakIconWrapper}>
                    <Text style={styles.streakEmojiLarge}>🔥</Text>
                  </View>
                  <View style={styles.streakTextCol}>
                    <Text style={styles.streakValText}>0 Days</Text>
                    <Text style={styles.streakSubText}>Maintain your daily path</Text>
                  </View>
                </View>
                <View style={styles.streakChances}>
                  <Text style={styles.chancesText}>3 Chances Left</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Quote Section */}
          <View style={styles.quoteSection}>
            <Text style={styles.sectionTitle}>{t('todayQuote')}</Text>
            <View style={styles.quoteCard}>
              <Text style={styles.quoteIcon}>❝</Text>
              <Text style={styles.quoteText}>{t('quoteText')}</Text>
              <Text style={styles.quoteSource}>— {t('quoteSource')}</Text>
            </View>
          </View>
        </Animated.View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating AI Button with Glowing Animation */}
      <View style={styles.aiCircleWrapper}>
        <Animated.View style={[styles.aiLoadingBorder, { transform: [{ rotate: spin }] }]}>
          <LinearGradient
            colors={['#FF9966', 'transparent', '#FF5E62', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <TouchableOpacity 
          style={styles.aiCircle} 
          onPress={() => setChatVisible(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#800000', '#3A0000']}
            style={styles.aiGradient}
          >
            <Text style={styles.aiSparkle}>✨</Text>
            <Text style={styles.aiCircleText}>Ask AI</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Integrated Chat Popup */}
      <ChatModal 
        visible={isChatVisible} 
        onClose={() => setChatVisible(false)} 
        user={user}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFB' },
  navbar: { 
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 15, 
    paddingBottom: 25, 
    paddingHorizontal: 25, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    overflow: 'hidden', 
    elevation: 15, 
    shadowColor: COLORS.primary, 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 20, 
    zIndex: 100 
  },
  navPattern: { position: 'absolute', width: width, height: 200, opacity: 0.05, backgroundColor: '#FFF', borderRadius: 100, top: -100, right: -50 },
  navContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navGreeting: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  navTitle: { color: COLORS.secondary, fontSize: 24, fontWeight: '900', marginTop: 2, letterSpacing: 0.5 },
  navRight: { flexDirection: 'row', alignItems: 'center' },
  profileCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  profileInitial: { color: COLORS.secondary, fontSize: 18, fontWeight: '800' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: COLORS.primary },
  loginBtn: { borderRadius: 20, overflow: 'hidden' },
  loginBtnGrad: { paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 20 },
  loginText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  scrollContent: { paddingTop: 20 },
  heroWrapper: { marginHorizontal: 20, marginBottom: 25, position: 'relative' },
  heroGlow: { position: 'absolute', top: 10, left: 10, right: 10, bottom: -10, backgroundColor: COLORS.primary, opacity: 0.3, filter: 'blur(20px)', borderRadius: 40, zIndex: -1 },
  heroCard: { height: 240, borderRadius: 40, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
  heroPatternTopRight: { position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroPatternBottomLeft: { position: 'absolute', left: -50, bottom: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  omCircle: { width: 80, height: 80, borderRadius: 40, marginBottom: 15, elevation: 15, shadowColor: '#FFD700', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 15 },
  omGradient: { flex: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  omText: { fontSize: 45, color: '#800000', fontWeight: '900', marginTop: -5 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: COLORS.secondary, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600', letterSpacing: 3, marginTop: 8 },
  section: { paddingHorizontal: 25, marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primary, marginBottom: 15, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItemWrapper: { width: (width - 65) / 2, marginBottom: 15 },
  gridItem: { padding: 20, borderRadius: 30, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 5 },
  gridIcon: { fontSize: 28 },
  gridLabel: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  streakWrapper: { elevation: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, borderRadius: 30 },
  streakGradient: { padding: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 30 },
  streakMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  streakIconWrapper: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  streakEmojiLarge: { fontSize: 30 },
  streakTextCol: { flex: 1 },
  streakValText: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 2 },
  streakSubText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  streakChances: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  chancesText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  quoteSection: { paddingHorizontal: 25, marginBottom: 40 },
  quoteCard: { backgroundColor: '#FFF', padding: 30, borderRadius: 30, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, position: 'relative', overflow: 'hidden' },
  quoteIcon: { position: 'absolute', top: -10, left: 15, fontSize: 80, color: 'rgba(128,0,0,0.05)', fontWeight: '900' },
  quoteText: { fontSize: 17, color: '#444', fontStyle: 'italic', lineHeight: 28, fontWeight: '600', zIndex: 1 },
  quoteSource: { fontSize: 14, color: COLORS.primary, marginTop: 15, textAlign: 'right', fontWeight: '800', zIndex: 1 },
  aiCircleWrapper: { position: 'absolute', bottom: 95, right: 20, width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  aiLoadingBorder: { position: 'absolute', width: '100%', height: '100%', borderRadius: 45, overflow: 'hidden', padding: 3 },
  aiCircle: { width: 78, height: 78, borderRadius: 39, elevation: 15, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#FFA500' },
  aiGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  aiSparkle: { fontSize: 16, marginBottom: 2 },
  aiCircleText: { color: '#FFF', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  premiumBanner: { marginHorizontal: 20, marginBottom: 30, borderRadius: 25, overflow: 'hidden', elevation: 8, shadowColor: '#FF9933', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  premiumGradient: { padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  premiumTextContainer: { flex: 1 },
  premiumTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  premiumSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  premiumBtn: { backgroundColor: '#FFF', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 15, marginLeft: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  premiumBtnText: { color: '#FF5E62', fontSize: 13, fontWeight: '900' },
  panditBanner: { borderRadius: 30, overflow: 'hidden', elevation: 8, shadowColor: '#FF9933', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 15, borderWidth: 1, borderColor: '#FFE8CC' },
  panditGradient: { padding: 25, flexDirection: 'row', alignItems: 'center' },
  panditContent: { flex: 1, paddingRight: 15 },
  panditTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primary, marginBottom: 8 },
  panditSub: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 15, fontWeight: '500' },
  locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#FFE8CC', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
  locationIcon: { fontSize: 12, marginRight: 5 },
  locationText: { fontSize: 11, color: COLORS.accent, fontWeight: '700' },
  panditImageWrapper: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,153,51,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FF9933' },
  panditEmoji: { fontSize: 35 },
});
