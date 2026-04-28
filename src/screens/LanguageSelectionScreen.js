import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme';

const { width } = Dimensions.get('window');

export default function LanguageSelectionScreen({ onSelect }) {
  const { i18n } = useTranslation();
  
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim1, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim2, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const languages = [
    { code: 'hi', label: 'हिन्दी', sub: 'Hindi', icon: '🕉️', gradient: ['#FF9933', '#FF5E62'] },
    { code: 'en', label: 'English', sub: 'English', icon: '🌐', gradient: ['#4A00E0', '#8E2DE2'] },
    { code: 'mr', label: 'मराठी', sub: 'Marathi', icon: '🚩', gradient: ['#FFD700', '#FF8C00'] },
  ];

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    onSelect();
  };

  const orb1TranslateY = floatAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const orb2TranslateX = floatAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Deep Space Background */}
      <LinearGradient colors={['#1A0000', COLORS.primary, '#000000']} style={StyleSheet.absoluteFill} />
      
      {/* Floating Magic Orbs */}
      <Animated.View style={[styles.orb1, { transform: [{ translateY: orb1TranslateY }] }]} />
      <Animated.View style={[styles.orb2, { transform: [{ translateX: orb2TranslateX }] }]} />
      <View style={styles.noiseOverlay} />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        {/* Glowing Om Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.omCircleGlow} />
          <LinearGradient colors={['#FFD700', '#FF8C00']} style={styles.omCircle}>
            <Text style={styles.omText}>ॐ</Text>
          </LinearGradient>
          <Text style={styles.title}>Spiritual Language</Text>
          <Text style={styles.subtitle}>Choose your medium of devotion</Text>
        </View>

        {/* Premium Glass Card */}
        <View style={styles.glassCard}>
          {languages.map((lang, index) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langItem, index === languages.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => handleSelect(lang.code)}
              activeOpacity={0.7}
            >
              <View style={styles.langLeft}>
                <LinearGradient colors={lang.gradient} style={styles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.langIcon}>{lang.icon}</Text>
                </LinearGradient>
                <View>
                  <Text style={styles.langLabel}>{lang.label}</Text>
                  <Text style={styles.langSub}>{lang.sub}</Text>
                </View>
              </View>
              <View style={styles.arrowCircle}>
                <Text style={styles.arrow}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footerText}>Sanatan Dharma • Eternal Truth</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orb1: { position: 'absolute', top: '10%', right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: '#FFD700', opacity: 0.15, filter: 'blur(40px)' },
  orb2: { position: 'absolute', bottom: '10%', left: -50, width: 400, height: 400, borderRadius: 200, backgroundColor: '#FF8C00', opacity: 0.1, filter: 'blur(50px)' },
  noiseOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.02)' },
  content: { width: width * 0.85, alignItems: 'center' },
  
  logoContainer: { alignItems: 'center', marginBottom: 40, position: 'relative' },
  omCircleGlow: { position: 'absolute', top: 0, width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFD700', opacity: 0.4, filter: 'blur(15px)' },
  omCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#FFF', elevation: 15, shadowColor: '#FFD700', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 15 },
  omText: { fontSize: 45, color: '#4A0000', fontWeight: '900', marginTop: -5 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 8, letterSpacing: 1 },
  
  glassCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 30, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  langItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  langLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  langIcon: { fontSize: 22 },
  langLabel: { fontSize: 20, fontWeight: '900', color: '#FFF', marginBottom: 2 },
  langSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  arrowCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },
  
  footerText: { marginTop: 40, color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
});
