import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Vibration,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { COLORS } from '../theme';

const { width, height } = Dimensions.get('window');

export default function JapCounterScreen({ onBack }) {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);
  const [malaCount, setMalaCount] = useState(0);
  
  // Save Session State
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [mantraName, setMantraName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const beadAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous subtle glowing pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 2500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2500, useNativeDriver: true })
      ])
    ).start();

    // Slow rotation for background aura
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleIncrement = () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(50);
    } else {
      Vibration.vibrate(80);
    }
    
    const newCount = count + 1;
    
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    if (newCount >= 108) {
      setCount(0);
      setMalaCount(prev => prev + 1);
      Vibration.vibrate(500);
      Alert.alert('Mala Complete! 📿', 'You have successfully completed one full mala (108 Japs).');
    } else {
      setCount(newCount);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Counter",
      "Are you sure you want to reset your current progress?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          onPress: () => {
            setCount(0);
            setMalaCount(0);
          }, 
          style: "destructive" 
        }
      ]
    );
  };

  const handleSaveSession = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "Please login to save your session to the Daily Log.");
      return;
    }
    
    const totalJaps = malaCount * 108 + count;
    if (totalJaps === 0) {
      Alert.alert("Empty Session", "Please chant before saving.");
      return;
    }

    if (!mantraName.trim()) {
      Alert.alert("Input Needed", "Please enter the Mantra Name.");
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, 'user_streaks', user.uid);
      const docSnap = await getDoc(userRef);
      
      const now = new Date().getTime();
      const newLog = {
        id: now.toString(),
        timestamp: now,
        type: malaCount > 0 ? 'Mala' : 'Jap',
        name: mantraName.trim(),
        count: totalJaps,
      };

      if (docSnap.exists()) {
        const data = docSnap.data();
        let updatedLogs = data.dailyLogs ? [newLog, ...data.dailyLogs] : [newLog];
        let updatedTotals = data.lifetimeTotals || { japCount: 0, malas: 0, walks: 0, other: 0 };
        
        updatedTotals.japCount += totalJaps;
        updatedTotals.malas += malaCount;

        let newStreak = data.currentStreak || 0;
        if (newStreak === 0) newStreak = 1;
        else {
          const lastUpdateDate = new Date(data.lastUpdate).toDateString();
          if (lastUpdateDate !== new Date().toDateString()) newStreak += 1;
        }

        await updateDoc(userRef, {
          currentStreak: newStreak,
          lastUpdate: now,
          dailyLogs: updatedLogs,
          lifetimeTotals: updatedTotals,
        });
      } else {
        await setDoc(userRef, {
          currentStreak: 1,
          lastUpdate: now,
          lifetimeTotals: { japCount: totalJaps, malas: malaCount, walks: 0, other: 0 },
          dailyLogs: [newLog],
        });
      }

      setSaveModalVisible(false);
      setCount(0);
      setMalaCount(0);
      setMantraName('');
      Alert.alert("Session Saved!", "Your Jaap has been added to the Daily Log.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save session.");
    } finally {
      setIsSaving(false);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Meditative Deep Background */}
      <LinearGradient colors={['#1A0505', '#0A0000']} style={StyleSheet.absoluteFill} />

      {/* Decorative Aura */}
      <Animated.View style={[styles.bgAura, { transform: [{ rotate: spin }] }]}>
        <LinearGradient colors={['rgba(255,153,51,0.05)', 'transparent']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <View style={styles.backBtnCircle}>
            <Text style={styles.backText}>←</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('japCounter') || 'Jaap Counter'}</Text>
        <View style={styles.headerRightRow}>
          <TouchableOpacity onPress={() => setSaveModalVisible(true)} style={styles.saveBtnTop} activeOpacity={0.7}>
            <Text style={styles.saveBtnTextTop}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        
        {/* Floating Stats Glassmorphism Box */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>MALA COUNT</Text>
            <Text style={styles.statValue}>{malaCount}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL JAAP</Text>
            <Text style={styles.statValue}>{malaCount * 108 + count}</Text>
          </View>
        </View>

        {/* Giant Glowing Counter Button */}
        <View style={styles.counterCircleContainer}>
          <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.glowRingInner, { transform: [{ scale: pulseAnim }] }]} />
          
          <Animated.View style={[styles.mainButton, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity activeOpacity={1} style={styles.touchArea} onPress={handleIncrement}>
              <LinearGradient colors={['#FF5E62', '#FF9933']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonGradient}>
                <View style={styles.innerCircle}>
                  <Text style={styles.omWatermark}>ॐ</Text>
                  <Text style={styles.countText}>{count}</Text>
                  <Text style={styles.ofTotal}>/ 108</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Text style={styles.instruction}>Tap the divine circle to count</Text>

        {/* Premium Mala Bead Track */}
        <View style={styles.beadContainer}>
          <Text style={styles.beadHint}>Spiritual Progress (12 beads / step)</Text>
          <View style={styles.beadTrack}>
            {[...Array(12)].map((_, i) => {
              const isActive = i < (count % 12);
              return (
                <View key={i} style={styles.beadWrapper}>
                  <LinearGradient 
                    colors={isActive ? ['#FFD700', '#FFA500'] : ['#333', '#111']} 
                    style={[styles.bead, isActive && styles.activeBead]} 
                  />
                  {isActive && <View style={styles.beadGlow} />}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Save Session Modal */}
      <Modal visible={saveModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save to Daily Log</Text>
            
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>Total Japs: <Text style={{color: COLORS.primary, fontWeight: '900'}}>{malaCount * 108 + count}</Text></Text>
              <Text style={styles.summaryText}>Malas Completed: <Text style={{color: COLORS.primary, fontWeight: '900'}}>{malaCount}</Text></Text>
            </View>

            <Text style={styles.inputLabel}>Mantra Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Om Namah Shivay"
              placeholderTextColor="#999"
              value={mantraName}
              onChangeText={setMantraName}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSaveModalVisible(false)} disabled={isSaving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSession} disabled={isSaving}>
                <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save Session'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0000' },
  bgAura: { position: 'absolute', top: -height*0.2, left: -width*0.5, width: width*2, height: width*2, borderRadius: width, opacity: 0.5 },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 15, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25, zIndex: 10 },
  backBtn: { width: 45, height: 45 },
  backBtnCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  backText: { fontSize: 24, color: '#FFF', fontWeight: 'bold', marginTop: -2 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  resetBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  resetText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  
  content: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: height * 0.04 },
  
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 20, paddingHorizontal: 40, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#FF9933', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  statBox: { alignItems: 'center', minWidth: 80 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '800', letterSpacing: 1.5, marginBottom: 5 },
  statValue: { fontSize: 32, fontWeight: '900', color: '#FFD700' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 30 },
  
  counterCircleContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative', height: width * 0.85, width: width * 0.85 },
  glowRing: { position: 'absolute', width: width * 0.85, height: width * 0.85, borderRadius: (width * 0.85) / 2, backgroundColor: 'rgba(255, 153, 51, 0.15)', filter: 'blur(30px)' },
  glowRingInner: { position: 'absolute', width: width * 0.7, height: width * 0.7, borderRadius: (width * 0.7) / 2, backgroundColor: 'rgba(255, 94, 98, 0.25)', filter: 'blur(20px)' },
  mainButton: { width: width * 0.65, height: width * 0.65, borderRadius: (width * 0.65) / 2, elevation: 30, shadowColor: '#FF5E62', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.6, shadowRadius: 30, backgroundColor: '#000' },
  touchArea: { flex: 1, borderRadius: (width * 0.65) / 2, overflow: 'hidden' },
  buttonGradient: { flex: 1, padding: 4 },
  innerCircle: { flex: 1, borderRadius: 200, backgroundColor: '#1A0000', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,153,51,0.5)', position: 'relative' },
  omWatermark: { position: 'absolute', fontSize: 120, color: 'rgba(255,255,255,0.03)', fontWeight: '900' },
  countText: { fontSize: 90, fontWeight: '900', color: '#FFF', textShadowColor: '#FF9933', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  ofTotal: { fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: '800', marginTop: -5, letterSpacing: 2 },
  instruction: { fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: 1, marginTop: -20 },
  
  beadContainer: { width: '85%', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 25, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  beadHint: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 20, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  beadTrack: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 12 },
  beadWrapper: { position: 'relative', width: 20, height: 20 },
  bead: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeBead: { borderColor: '#FFD700', shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 10 },
  beadGlow: { position: 'absolute', top: -5, left: -5, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255, 215, 0, 0.3)', zIndex: -1, filter: 'blur(5px)' },

  headerRightRow: { flexDirection: 'row', alignItems: 'center' },
  saveBtnTop: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, backgroundColor: '#FFD700', marginRight: 10 },
  saveBtnTextTop: { color: '#000', fontSize: 13, fontWeight: '900' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 25, padding: 25, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primary, marginBottom: 15, textAlign: 'center' },
  summaryBox: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 15, marginBottom: 20 },
  summaryText: { fontSize: 15, color: '#333', fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 25, fontSize: 15, color: '#333' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { flex: 1, backgroundColor: '#F0F0F0', padding: 15, borderRadius: 15, alignItems: 'center', marginRight: 10 },
  cancelText: { color: '#555', fontWeight: 'bold', fontSize: 15 },
  saveBtn: { flex: 1, backgroundColor: COLORS.accent, padding: 15, borderRadius: 15, alignItems: 'center' },
  saveText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
