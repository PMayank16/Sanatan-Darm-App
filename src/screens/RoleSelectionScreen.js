import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme';

const { width } = Dimensions.get('window');

export default function RoleSelectionScreen({ onSelectRole }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient colors={['#2A0000', COLORS.primary, '#1A0000']} style={StyleSheet.absoluteFill} />
      <View style={styles.noiseOverlay} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Sanatan</Text>
          <Text style={styles.subtitle}>Choose your spiritual path</Text>
        </View>

        <TouchableOpacity 
          style={styles.cardWrapper} 
          onPress={() => onSelectRole('user')}
          activeOpacity={0.9}
        >
          <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>🙏</Text>
            </View>
            <View style={styles.textCol}>
              <Text style={styles.cardTitle}>Spiritual Seeker</Text>
              <Text style={styles.cardSub}>I am a Devotee looking for Pujas, Mantras, and spiritual guidance.</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.cardWrapper, { marginTop: 20 }]} 
          onPress={() => onSelectRole('pandit')}
          activeOpacity={0.9}
        >
          <LinearGradient colors={['rgba(255,215,0,0.15)', 'rgba(255,140,0,0.05)']} style={[styles.card, { borderColor: 'rgba(255,215,0,0.3)' }]}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,215,0,0.2)' }]}>
              <Text style={styles.icon}>📿</Text>
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.cardTitle, { color: '#FFD700' }]}>Vedic Pandit</Text>
              <Text style={styles.cardSub}>I am a verified Pandit offering Puja services to devotees.</Text>
            </View>
            <Text style={[styles.arrow, { color: '#FFD700' }]}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  noiseOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  content: { flex: 1, padding: 25, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 50 },
  title: { fontSize: 32, fontWeight: '900', color: '#FFF', marginBottom: 10, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 1 },
  cardWrapper: { borderRadius: 25, overflow: 'hidden', elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 25 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 20 },
  icon: { fontSize: 30 },
  textCol: { flex: 1, paddingRight: 10 },
  cardTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', marginBottom: 5 },
  cardSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20, fontWeight: '500' },
  arrow: { fontSize: 24, color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' },
});
