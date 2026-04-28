import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../config/firebase';
import { COLORS } from '../theme';
import * as ImagePicker from 'expo-image-picker';

export default function PanditHomeScreen({ user, onNavigateToChat, onSignOut }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panditData, setPanditData] = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'bookings'),
      where('panditId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => b.timestamp - a.timestamp);
      setBookings(data);
      setLoading(false);
    });

    // Listen to own pandit profile
    const profileUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setPanditData(docSnap.data());
    });

    return () => { unsubscribe(); profileUnsub(); };
  }, [user]);

  const handleChangeProfilePic = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    setUploadingPic(true);
    try {
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error('Blob creation failed'));
        xhr.responseType = 'blob';
        xhr.open('GET', result.assets[0].uri, true);
        xhr.send(null);
      });
      const storageRef = ref(storage, `profile_pics/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
      const downloadUrl = await getDownloadURL(storageRef);
      blob.close?.();
      await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadUrl });
      Alert.alert('Success', 'Profile picture updated!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not update profile picture. Check Firebase Storage rules.');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${newStatus} this booking?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes", 
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'bookings', bookingId), { status: newStatus });
            } catch (error) {
              Alert.alert("Error", "Could not update booking status.");
            }
          }
        }
      ]
    );
  };

  const openDialer = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const renderBooking = ({ item }) => {
    const isPending = item.status === 'pending';
    const isApproved = item.status === 'approved';
    const isInquiry = item.status === 'inquiry';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.devoteeName}>{item.userName}</Text>
          <View style={[styles.statusBadge, isApproved && styles.badgeApproved, item.status === 'rejected' && styles.badgeRejected, isInquiry && styles.badgeInquiry]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.dateText}>{new Date(item.timestamp).toLocaleString()}</Text>

        {(isApproved || isInquiry) ? (
          <View style={styles.contactBox}>
            <Text style={styles.contactLabel}>Devotee Number:</Text>
            <TouchableOpacity onPress={() => openDialer(item.userMobile)}>
              <Text style={styles.contactNumber}>📞 {item.userMobile}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.hiddenText}>Number hidden until approved</Text>
        )}

        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF3333' }]} onPress={() => handleStatusChange(item.id, 'rejected')}>
              <Text style={styles.actionBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]} onPress={() => handleStatusChange(item.id, 'approved')}>
              <Text style={styles.actionBtnText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}

        {isInquiry && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#4CAF50' }]} onPress={() => handleStatusChange(item.id, 'approved')}>
              <Text style={styles.actionBtnText}>Approve Inquiry to Booking</Text>
            </TouchableOpacity>
          </View>
        )}

        {(isApproved || isInquiry) && (
          <TouchableOpacity 
            style={styles.chatBtn} 
            onPress={() => onNavigateToChat(item)}
          >
            <Text style={styles.chatBtnText}>💬 Chat with Devotee</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={['#3A2000', '#1A0A00']} style={styles.header}>
        <TouchableOpacity onPress={handleChangeProfilePic} style={styles.panditAvatar}>
          {panditData?.photoURL ? (
            <Image source={{ uri: panditData.photoURL }} style={styles.panditAvatarImg} />
          ) : (
            <Text style={{ fontSize: 24 }}>🕉️</Text>
          )}
          <View style={styles.cameraBadge}>
            <Text style={{ fontSize: 10 }}>📷</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{panditData?.name || 'Pandit Dashboard'}</Text>
          <Text style={{ color: 'rgba(255,215,0,0.7)', fontSize: 12 }}>{panditData?.location || ''}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onSignOut}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </LinearGradient>

      {bookings.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No booking requests yet.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBooking}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  panditAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', position: 'relative', borderWidth: 2, borderColor: '#FFD700', overflow: 'visible' },
  panditAvatarImg: { width: 52, height: 52, borderRadius: 26 },
  cameraBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFD700' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  logoutText: { color: '#FFF', fontWeight: 'bold' },
  emptyText: { fontSize: 16, color: '#666', fontWeight: '600' },
  listContainer: { padding: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  devoteeName: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  statusBadge: { backgroundColor: '#FFF000', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeApproved: { backgroundColor: '#E8F5E9' },
  badgeRejected: { backgroundColor: '#FFEBEE' },
  badgeInquiry: { backgroundColor: '#E3F2FD' },
  statusText: { fontSize: 10, fontWeight: '900', color: '#333' },
  dateText: { fontSize: 12, color: '#888', marginBottom: 15 },
  contactBox: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  contactLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
  contactNumber: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1 },
  hiddenText: { fontSize: 13, color: '#999', fontStyle: 'italic', marginBottom: 15 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 0.48, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  chatBtn: { backgroundColor: COLORS.accent, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  chatBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
