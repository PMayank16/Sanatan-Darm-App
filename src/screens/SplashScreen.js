import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { COLORS } from '../theme';

const { width } = Dimensions.get('window');

const LANGUAGES = [
  { text: 'सनातन धर्म', sub: 'हिंदी' },
  { text: 'Sanatan Dharma', sub: 'English' },
  { text: 'सनातन धर्म', sub: 'मराठी' },
  { text: 'ਸਨਾਤਨ ਧਰਮ', sub: 'ਪੰਜਾਬੀ' },
];

export default function SplashScreen({ onFinish }) {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let currentIndex = 0;

    const cycle = () => {
      if (currentIndex >= LANGUAGES.length - 1) {
        setTimeout(onFinish, 800);
        return;
      }
      // Fade out + scale down
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.85, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        currentIndex += 1;
        setIndex(currentIndex);
        // Fade in + scale up
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
        ]).start(() => {
          setTimeout(cycle, 600);
        });
      });
    };

    const timer = setTimeout(cycle, 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Background decorative circles */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      {/* Om Symbol */}
      <Text style={styles.omBackground}>ॐ</Text>

      {/* Animated Language Text */}
      <Animated.View style={[styles.textWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.mainText}>{LANGUAGES[index].text}</Text>
        <View style={styles.subDivider} />
        <Text style={styles.subText}>{LANGUAGES[index].sub}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    overflow: 'hidden',
  },
  circleTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  omBackground: {
    position: 'absolute',
    fontSize: 300,
    color: 'rgba(255,255,255,0.04)',
    fontWeight: '700',
  },
  textWrap: {
    alignItems: 'center',
  },
  mainText: {
    fontSize: 50,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subDivider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    marginVertical: 14,
  },
  subText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 5,
  },
});
