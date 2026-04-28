import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme';
import CustomHeader from '../components/CustomHeader';

const { width } = Dimensions.get('window');

export default function MantraDetailScreen({ mantra, onBack }) {
  const onShare = async () => {
    try {
      await Share.share({
        message: `${mantra.name}\n\n${mantra.text}\n\nShared via Sanatan Dharma App`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Deep Mystical Background */}
      <LinearGradient colors={['#1A0000', '#3A0000', '#1A0000']} style={StyleSheet.absoluteFill} />

      <CustomHeader title="Sacred Text" onBack={onBack} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.mantraCard}>
          <LinearGradient
            colors={['#FFFBF5', '#FFF2E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Decorative Corner Patterns */}
            <View style={[styles.cornerPattern, { top: 10, left: 10 }]} />
            <View style={[styles.cornerPattern, { top: 10, right: 10 }]} />
            <View style={[styles.cornerPattern, { bottom: 10, left: 10 }]} />
            <View style={[styles.cornerPattern, { bottom: 10, right: 10 }]} />

            <View style={styles.iconCircle}>
              <Text style={styles.mantraIcon}>{mantra.icon || '🕉️'}</Text>
            </View>
            
            <Text style={styles.mantraTitle}>{mantra.name}</Text>
            
            <View style={styles.dividerBox}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerDiamond}>◆</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <Text style={styles.mantraText}>{mantra.text}</Text>
            
            <View style={styles.dividerBox}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerDiamond}>◆</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={onShare} activeOpacity={0.8}>
                <LinearGradient colors={[COLORS.primary, '#800000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnGrad}>
                  <Text style={styles.actionText}>Share with Devotees</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <LinearGradient colors={['rgba(255,215,0,0.1)', 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={styles.infoIconBox}>
            <Text style={styles.infoIcon}>✨</Text>
          </View>
          <View style={styles.infoTextCol}>
            <Text style={styles.infoTitle}>Spiritual Essence</Text>
            <Text style={styles.infoText}>
              Chanting this sacred text with devotion brings mental peace, spiritual growth, and divine protection. Regular recitation is highly recommended.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  mantraCard: { 
    borderRadius: 30, 
    overflow: 'hidden', 
    elevation: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 20,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  cardGradient: { padding: 35, alignItems: 'center', position: 'relative' },
  cornerPattern: { position: 'absolute', width: 20, height: 20, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#FF9933', opacity: 0.5 },
  iconCircle: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: '#FFF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#FF9933',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE8CC'
  },
  mantraIcon: { fontSize: 35 },
  mantraTitle: { fontSize: 28, fontWeight: '900', color: COLORS.primary, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  dividerBox: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  dividerLine: { width: 80, height: 1, backgroundColor: COLORS.accent, opacity: 0.5 },
  dividerDiamond: { color: COLORS.accent, marginHorizontal: 15, fontSize: 10 },
  mantraText: { 
    fontSize: 20, 
    color: '#4A0000', 
    lineHeight: 36, 
    textAlign: 'center', 
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'serif',
  },
  actionRow: { marginTop: 10, width: '100%' },
  actionBtn: { borderRadius: 20, overflow: 'hidden', elevation: 5, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  actionBtnGrad: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  infoBox: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    padding: 25, 
    borderRadius: 25, 
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden'
  },
  infoIconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,215,0,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  infoIcon: { fontSize: 24 },
  infoTextCol: { flex: 1 },
  infoTitle: { fontSize: 18, fontWeight: '900', color: '#FFD700', marginBottom: 8 },
  infoText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22, fontWeight: '500' },
});
