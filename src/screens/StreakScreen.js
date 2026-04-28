import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLORS } from '../theme';

const { width } = Dimensions.get('window');

const ACTIVITY_TYPES = ['Jap', 'Mala', 'Walking', 'Reading', 'Other'];

export default function StreakScreen({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Timer state
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [warningLevel, setWarningLevel] = useState(0); // 0=none, 1=3h warning, 2=2h warning, 3=broken

  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [logType, setLogType] = useState('Jap');
  const [logName, setLogName] = useState('');
  const [logCount, setLogCount] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'user_streaks', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        // Ensure new schema properties exist
        if (!d.lifetimeTotals) d.lifetimeTotals = { japCount: 0, malas: 0, walks: 0, other: 0 };
        if (!d.dailyLogs) d.dailyLogs = [];
        setData(d);
      } else {
        const initial = {
          currentStreak: 0,
          lastUpdate: 0,
          lifetimeTotals: { japCount: 0, malas: 0, walks: 0, other: 0 },
          dailyLogs: [],
        };
        setDoc(userRef, initial);
        setData(initial);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Timer logic
  useEffect(() => {
    if (!data) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      
      if (data.currentStreak === 0 || data.lastUpdate === 0) {
        setTimeLeftStr('Log an activity to start your streak!');
        setWarningLevel(0);
        return;
      }

      // 24 hours in ms
      const deadline = data.lastUpdate + (24 * 60 * 60 * 1000);
      const diff = deadline - now;

      if (diff <= 0) {
        // Streak Broken!
        setTimeLeftStr('Streak broken! Log to restart.');
        setWarningLevel(3);
        
        // Auto-reset in DB if it hasn't been reset yet
        if (data.currentStreak > 0) {
          const userRef = doc(db, 'user_streaks', user.uid);
          updateDoc(userRef, { currentStreak: 0, lastUpdate: 0 });
        }
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeftStr(`${h}h ${m}m ${s}s left to maintain`);

        if (h < 2) setWarningLevel(2);
        else if (h < 3) setWarningLevel(1);
        else setWarningLevel(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data]);

  const maintainStreak = async (newLogs, newTotals) => {
    const userRef = doc(db, 'user_streaks', user.uid);
    const now = new Date().getTime();
    
    let newStreak = data.currentStreak;
    // If streak is 0 or broken, restart it to 1.
    if (data.currentStreak === 0) {
      newStreak = 1;
    } else {
      // It's maintained, so we increment if we are in a new calendar day OR just keep extending the 24h window.
      // Standard Snapchat logic: you must send one snap every 24h. The streak count goes up by 1 per day.
      // To ensure it only goes up by 1 per day, we can check calendar day of lastUpdate.
      const lastUpdateDate = new Date(data.lastUpdate).toDateString();
      const todayDate = new Date().toDateString();
      
      if (lastUpdateDate !== todayDate) {
        newStreak += 1;
      }
    }

    await updateDoc(userRef, {
      currentStreak: newStreak,
      lastUpdate: now,
      dailyLogs: newLogs,
      lifetimeTotals: newTotals,
    });
  };

  const handleSaveLog = () => {
    if (!logName.trim() || !logCount.trim()) {
      Alert.alert("Error", "Please fill in all details.");
      return;
    }
    
    const countNum = parseInt(logCount);
    if (isNaN(countNum) || countNum <= 0) {
      Alert.alert("Error", "Count must be a valid number.");
      return;
    }

    const newLog = {
      id: editingLogId || new Date().getTime().toString(),
      timestamp: new Date().getTime(),
      type: logType,
      name: logName.trim(),
      count: countNum,
    };

    let updatedLogs = [...data.dailyLogs];
    let updatedTotals = { ...data.lifetimeTotals };

    if (editingLogId) {
      // We are editing. Subtract old count, add new count
      const oldLogIndex = updatedLogs.findIndex(l => l.id === editingLogId);
      if (oldLogIndex > -1) {
        const oldLog = updatedLogs[oldLogIndex];
        // Adjust totals
        if (oldLog.type === 'Jap') updatedTotals.japCount -= oldLog.count;
        else if (oldLog.type === 'Mala') updatedTotals.malas -= oldLog.count;
        else if (oldLog.type === 'Walking') updatedTotals.walks -= oldLog.count;
        else updatedTotals.other -= oldLog.count;

        updatedLogs[oldLogIndex] = newLog;
      }
    } else {
      // Adding new
      updatedLogs.unshift(newLog); // add to top
    }

    // Add new count to totals
    if (newLog.type === 'Jap') updatedTotals.japCount += countNum;
    else if (newLog.type === 'Mala') updatedTotals.malas += countNum;
    else if (newLog.type === 'Walking') updatedTotals.walks += countNum;
    else updatedTotals.other += countNum;

    maintainStreak(updatedLogs, updatedTotals);
    setModalVisible(false);
    resetModal();
  };

  const handleDeleteLog = (logId) => {
    Alert.alert("Delete Activity", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive",
        onPress: () => {
          const logToDelete = data.dailyLogs.find(l => l.id === logId);
          if (!logToDelete) return;

          let updatedLogs = data.dailyLogs.filter(l => l.id !== logId);
          let updatedTotals = { ...data.lifetimeTotals };

          if (logToDelete.type === 'Jap') updatedTotals.japCount -= logToDelete.count;
          else if (logToDelete.type === 'Mala') updatedTotals.malas -= logToDelete.count;
          else if (logToDelete.type === 'Walking') updatedTotals.walks -= logToDelete.count;
          else updatedTotals.other -= logToDelete.count;

          const userRef = doc(db, 'user_streaks', user.uid);
          updateDoc(userRef, {
            dailyLogs: updatedLogs,
            lifetimeTotals: updatedTotals,
          });
        }
      }
    ]);
  };

  const openEditModal = (log) => {
    setEditingLogId(log.id);
    setLogType(log.type);
    setLogName(log.name);
    setLogCount(log.count.toString());
    setModalVisible(true);
  };

  const resetModal = () => {
    setEditingLogId(null);
    setLogType('Jap');
    setLogName('');
    setLogCount('');
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!user) return <View style={styles.center}><Text style={styles.loginText}>Please login to track your streak.</Text></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={[COLORS.primary, '#4A0000']} style={styles.header}>
        <SafeAreaView style={styles.headerContent}>
          <Text style={styles.headerTitle}>Sadhana Status</Text>
          <View style={[styles.streakCircle, warningLevel === 3 && {borderColor: '#666'}]}>
            <Text style={styles.streakEmoji}>{warningLevel === 3 ? '❄️' : '🔥'}</Text>
            <Text style={styles.streakNumber}>{data.currentStreak}</Text>
          </View>
          
          <View style={[
            styles.timerBadge, 
            warningLevel === 1 && {backgroundColor: '#FF9933'},
            warningLevel === 2 && {backgroundColor: '#FF3333'},
            warningLevel === 3 && {backgroundColor: '#555'}
          ]}>
            <Text style={styles.timerText}>{timeLeftStr}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Warnings */}
        {warningLevel === 1 && (
          <View style={[styles.warningCard, {borderColor: '#FF9933', backgroundColor: '#FFF5E6'}]}>
            <Text style={[styles.warningText, {color: '#CC7A00'}]}>⚠️ 3 Hours Left! Please log an activity soon.</Text>
          </View>
        )}
        {warningLevel === 2 && (
          <View style={[styles.warningCard, {borderColor: '#FF3333', backgroundColor: '#FFE6E6'}]}>
            <Text style={[styles.warningText, {color: '#CC0000'}]}>🚨 CRITICAL: Under 2 Hours! Your streak will break!</Text>
          </View>
        )}

        {/* Lifetime Totals Grid */}
        <Text style={styles.sectionTitle}>Lifetime Dedication</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{data.lifetimeTotals.japCount}</Text>
            <Text style={styles.statLab}>Japs</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{data.lifetimeTotals.malas}</Text>
            <Text style={styles.statLab}>Malas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{data.lifetimeTotals.walks}</Text>
            <Text style={styles.statLab}>Walks</Text>
          </View>
        </View>

        {/* Activity Table */}
        <View style={styles.logHeaderRow}>
          <Text style={styles.sectionTitle}>Activity Log</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { resetModal(); setModalVisible(true); }}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {data.dailyLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No activities logged yet.</Text>
            <Text style={styles.emptySub}>Add an activity to start your 24h streak!</Text>
          </View>
        ) : (
          <View style={styles.table}>
            {data.dailyLogs.map((log) => (
              <View key={log.id} style={styles.tableRow}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowType}>{log.type} • <Text style={styles.rowName}>{log.name}</Text></Text>
                  <Text style={styles.rowCount}>Count: {log.count}</Text>
                  <Text style={styles.rowTime}>{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity onPress={() => openEditModal(log)} style={styles.actionBtn}>
                    <Text style={styles.actionEmoji}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteLog(log.id)} style={styles.actionBtn}>
                    <Text style={styles.actionEmoji}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingLogId ? 'Edit Activity' : 'Log Activity'}</Text>
            
            <Text style={styles.inputLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{maxHeight: 50, marginBottom: 15}}>
              {ACTIVITY_TYPES.map(type => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.typePill, logType === type && styles.typePillActive]}
                  onPress={() => setLogType(type)}
                >
                  <Text style={[styles.typeText, logType === type && styles.typeTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Name / Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Om Namah Shivay, Morning Walk"
              value={logName}
              onChangeText={setLogName}
            />

            <Text style={styles.inputLabel}>Count / Value</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 108"
              keyboardType="numeric"
              value={logCount}
              onChangeText={setLogCount}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveLog}>
                <Text style={styles.saveText}>Save Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loginText: { fontSize: 16, color: COLORS.primary, fontWeight: 'bold' },
  header: { height: 260, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 10 },
  headerContent: { alignItems: 'center', paddingTop: 20 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  streakCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 3, borderColor: '#FFD700', alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  streakEmoji: { fontSize: 35 },
  streakNumber: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  timerBadge: { marginTop: 15, backgroundColor: '#4CAF50', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, elevation: 5 },
  timerText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  scrollContent: { padding: 20 },
  warningCard: { padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1 },
  warningText: { fontWeight: '900', textAlign: 'center', fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary, marginBottom: 15 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statBox: { backgroundColor: '#FFF', width: (width - 60) / 3, padding: 15, borderRadius: 15, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  statVal: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  statLab: { fontSize: 11, color: '#666', marginTop: 4, fontWeight: 'bold' },
  logHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 15, paddingVertical: 6, borderRadius: 12 },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  emptyState: { alignItems: 'center', marginTop: 20, padding: 20, backgroundColor: '#F5F5F5', borderRadius: 15 },
  emptyText: { fontSize: 15, fontWeight: 'bold', color: '#555' },
  emptySub: { fontSize: 12, color: '#888', marginTop: 5 },
  table: { backgroundColor: '#FFF', borderRadius: 15, elevation: 3, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', alignItems: 'center' },
  rowInfo: { flex: 1 },
  rowType: { fontSize: 12, color: COLORS.accent, fontWeight: '900', textTransform: 'uppercase' },
  rowName: { fontSize: 15, color: COLORS.primary, fontWeight: 'bold', textTransform: 'none' },
  rowCount: { fontSize: 14, color: '#333', marginTop: 4, fontWeight: '600' },
  rowTime: { fontSize: 11, color: '#999', marginTop: 4 },
  rowActions: { flexDirection: 'row' },
  actionBtn: { padding: 8, marginLeft: 5, backgroundColor: '#F9F9F9', borderRadius: 8 },
  actionEmoji: { fontSize: 16 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 25, padding: 25, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primary, marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 8, marginLeft: 4 },
  typePill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, backgroundColor: '#F0F0F0', marginRight: 10 },
  typePillActive: { backgroundColor: COLORS.primary },
  typeText: { fontSize: 13, fontWeight: 'bold', color: '#666' },
  typeTextActive: { color: '#FFF' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 20, fontSize: 15, color: '#333' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#F0F0F0', padding: 15, borderRadius: 15, alignItems: 'center', marginRight: 10 },
  cancelText: { color: '#555', fontWeight: 'bold', fontSize: 15 },
  saveBtn: { flex: 1, backgroundColor: COLORS.accent, padding: 15, borderRadius: 15, alignItems: 'center' },
  saveText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
