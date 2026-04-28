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
  Platform,
  Modal,
  FlatList,
  Linking,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, onSnapshot, collection, query, where, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import { COLORS } from '../theme';
import CustomHeader from '../components/CustomHeader';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ onAction }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingsModalVisible, setBookingsModalVisible] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [uploadingPic, setUploadingPic] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
      setLoading(false);
    });

    // Fetch Bookings
    const q = query(collection(db, 'bookings'), where('userId', '==', user.uid));
    const unsubscribeBookings = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => b.timestamp - a.timestamp);
      setBookings(data);
    });

    return () => {
      unsubscribe();
      unsubscribeBookings();
    };
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: () => auth.signOut(), style: "destructive" }
      ]
    );
  };

  const getInitial = () => {
    if (user?.displayName) return user.displayName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

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
      // XMLHttpRequest is required for file:// URIs on Android
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

  const handleReview = async (panditId, bookingId) => {
    // A real implementation would use a Modal with 5 stars.
    // For this demonstration, we'll prompt a 5-star rating Alert.
    Alert.alert(
      "Rate Pandit Ji",
      "Would you like to give a 5-Star rating for this service?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Submit 5 Stars", 
          onPress: async () => {
            try {
              const panditRef = doc(db, 'users', panditId);
              const panditSnap = await getDoc(panditRef);
              if (panditSnap.exists()) {
                const data = panditSnap.data();
                const currentRating = parseFloat(data.rating || 5.0);
                const currentReviews = parseInt(data.reviews || 0);
                
                // Calculate new rating (simplified)
                const newReviews = currentReviews + 1;
                const newRating = ((currentRating * currentReviews) + 5) / newReviews;

                await updateDoc(panditRef, {
                  rating: newRating.toFixed(1),
                  reviews: newReviews
                });
                
                Alert.alert("Success", "Thank you for your feedback!");
              }
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Could not submit review.");
            }
          } 
        }
      ]
    );
  };

  const renderBooking = ({ item }) => {
    const isApproved = item.status === 'approved';
    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.panditName}>{item.panditName}</Text>
          <View style={[styles.statusBadge, isApproved && styles.badgeApproved, item.status === 'rejected' && styles.badgeRejected]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{new Date(item.timestamp).toLocaleString()}</Text>
        
        {isApproved ? (
          <View style={styles.contactBox}>
            <Text style={styles.contactLabel}>Pandit Ji's Number:</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.panditMobile}`)}>
              <Text style={styles.contactNumber}>📞 {item.panditMobile}</Text>
            </TouchableOpacity>
            
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.chatBtn, { flex: 1, marginRight: 5 }]}
                onPress={() => onAction('panditChat', item)}
              >
                <Text style={styles.chatBtnText}>💬 Chat</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.chatBtn, { flex: 1, marginLeft: 5, backgroundColor: '#4CAF50' }]}
                onPress={() => handleReview(item.panditId, item.id)}
              >
                <Text style={styles.chatBtnText}>⭐ Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.hiddenText}>Number hidden until approved</Text>
        )}
      </View>
    );
  };

  if (!user) {
    return (
      <View style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" />
        <LinearGradient colors={['#FDFCFB', '#FFF5F5']} style={StyleSheet.absoluteFill} />
        <View style={styles.emptyCircleWrapper}>
          <LinearGradient colors={['#FFEFEF', '#F5F5F5']} style={styles.emptyCircle}>
            <Text style={{ fontSize: 50 }}>👤</Text>
          </LinearGradient>
        </View>
        <Text style={styles.loginTitle}>नमस्ते!</Text>
        <Text style={styles.loginSub}>Please login to view your spiritual profile and manage your subscriptions.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => onAction('login')} activeOpacity={0.8}>
          <LinearGradient colors={[COLORS.primary, '#800000']} style={styles.loginBtnGrad}>
            <Text style={styles.loginBtnText}>Login to Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#FDFCFB', '#FFF9F9', '#FDFCFB']} style={StyleSheet.absoluteFill} />
      
      <CustomHeader title="My Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Premium Profile Card */}
        <View style={styles.profileCardWrapper}>
          <LinearGradient colors={['#800000', COLORS.primary, '#4A0000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileGradient}>
            <View style={styles.cardPattern} />
            <View style={styles.cardPatternBottom} />
            
            <View style={styles.profileHeader}>
              <TouchableOpacity style={styles.avatarContainer} onPress={handleChangeProfilePic} activeOpacity={0.8}>
                <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.avatarRing}>
                  <View style={styles.avatarCircle}>
                    {userData?.photoURL ? (
                      <Image source={{ uri: userData.photoURL }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{getInitial()}</Text>
                    )}
                    {uploadingPic && (
                      <View style={styles.avatarOverlay}>
                        <ActivityIndicator color="#FFF" />
                      </View>
                    )}
                  </View>
                </LinearGradient>
                <View style={styles.cameraIcon}>
                  <Text style={{ fontSize: 14 }}>📷</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>{user.displayName || 'Spiritual Seeker'}</Text>
                <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>
                    {userData?.planId === 'free' ? 'FREE PLAN' : `${userData?.planId?.toUpperCase()} MEMBER`}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.cardDivider} />
            
            <View style={styles.memberSince}>
              <Text style={styles.memberText}>Member since {new Date(user.metadata.creationTime).getFullYear() || '2024'}</Text>
              <Text style={styles.omWatermark}>ॐ</Text>
            </View>
          </LinearGradient>
          <View style={styles.profileGlow} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <LinearGradient colors={['#FFF0F0', '#FFF']} style={styles.statIconWrap}>
              <Text style={styles.statIcon}>✨</Text>
            </LinearGradient>
            <Text style={styles.statNum}>{userData?.aiHitsLeft || 0}</Text>
            <Text style={styles.statLabel}>AI Hits Left</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <LinearGradient colors={['#FFF5E6', '#FFF']} style={styles.statIconWrap}>
              <Text style={styles.statIcon}>🔥</Text>
            </LinearGradient>
            <Text style={styles.statNum}>{userData?.streak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Menu Items */}
        <Text style={styles.sectionHeader}>Settings & Preferences</Text>
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => onAction('payments')} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: '#FFF0E6' }]}>
              <Text style={{ fontSize: 20 }}>💎</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Upgrade Plan</Text>
              <Text style={styles.menuSubText}>Get unlimited AI hits</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setBookingsModalVisible(true)} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: '#F5FFF5' }]}>
              <Text style={{ fontSize: 20 }}>📅</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Pandit Bookings</Text>
              <Text style={styles.menuSubText}>Track your puja requests</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: '#F5F5FF' }]}>
              <Text style={{ fontSize: 20 }}>⚙️</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>App Settings</Text>
              <Text style={styles.menuSubText}>Language, Notifications</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: '#FFF0F0' }]}>
              <Text style={{ fontSize: 20 }}>🚪</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, { color: '#D32F2F' }]}>Logout</Text>
              <Text style={[styles.menuSubText, { color: '#E57373' }]}>Sign out of your account</Text>
            </View>
            <Text style={[styles.menuArrow, { color: '#D32F2F' }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Sanatan Dharma v1.0.0</Text>
          <Text style={styles.madeInText}>Made with ❤️ in India</Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bookings Modal */}
      <Modal visible={bookingsModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>My Pandit Bookings</Text>
            <TouchableOpacity onPress={() => setBookingsModalVisible(false)}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          {bookings.length === 0 ? (
            <View style={styles.emptyBookings}>
              <Text style={styles.emptyText}>You have not booked any Pandits yet.</Text>
            </View>
          ) : (
            <FlatList
              data={bookings}
              keyExtractor={item => item.id}
              renderItem={renderBooking}
              contentContainerStyle={{ padding: 20 }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFB' },
  scrollContent: { padding: 25, paddingTop: 10 },
  
  /* Logged out state */
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyCircleWrapper: { elevation: 15, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, marginBottom: 30, borderRadius: 60 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },
  loginTitle: { fontSize: 32, fontWeight: '900', color: COLORS.primary, marginBottom: 10 },
  loginSub: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 26, marginBottom: 40, paddingHorizontal: 20 },
  loginBtn: { width: '100%', borderRadius: 30, overflow: 'hidden', elevation: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
  loginBtnGrad: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

  /* Premium Profile Card */
  profileCardWrapper: { marginBottom: 30, position: 'relative' },
  profileGlow: { position: 'absolute', top: 15, left: 15, right: 15, bottom: -15, backgroundColor: COLORS.primary, opacity: 0.3, filter: 'blur(20px)', borderRadius: 30, zIndex: -1 },
  profileGradient: { padding: 30, borderRadius: 30, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
  cardPattern: { position: 'absolute', right: -50, top: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
  cardPatternBottom: { position: 'absolute', left: -40, bottom: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.03)' },
  
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { marginRight: 20, position: 'relative' },
  avatarRing: { width: 86, height: 86, borderRadius: 43, padding: 3, alignItems: 'center', justifyContent: 'center' },
  avatarCircle: { width: '100%', height: '100%', borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#4A0000', overflow: 'hidden' },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 40 },
  avatarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderRadius: 40 },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', elevation: 3, borderWidth: 1, borderColor: '#EEE' },
  
  userInfo: { flex: 1 },
  userName: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 4 },
  userEmail: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 12, fontWeight: '500' },
  planBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  planBadgeText: { color: '#FFD700', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 25 },
  memberSince: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  omWatermark: { color: 'rgba(255,255,255,0.1)', fontSize: 40, fontWeight: '900', position: 'absolute', right: 0, bottom: -15 },

  /* Stats Row */
  statsRow: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 25, padding: 25, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 15, marginBottom: 35, borderWidth: 1, borderColor: '#F0F0F0' },
  statItem: { flex: 1, alignItems: 'center' },
  statIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  statIcon: { fontSize: 20 },
  statNum: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4, fontWeight: '600' },
  divider: { width: 1, height: '80%', backgroundColor: '#EEE', alignSelf: 'center' },

  /* Menu Items */
  sectionHeader: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginBottom: 15, paddingHorizontal: 10 },
  menuSection: { backgroundColor: '#FFF', borderRadius: 25, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1, borderColor: '#F0F0F0' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  menuIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  menuTextContainer: { flex: 1, marginLeft: 15 },
  menuText: { fontSize: 16, fontWeight: '800', color: '#333', marginBottom: 3 },
  menuSubText: { fontSize: 12, color: '#888', fontWeight: '500' },
  menuArrow: { color: '#CCC', fontSize: 26, fontWeight: '400', paddingLeft: 10 },
  logoutItem: { borderBottomWidth: 0, backgroundColor: '#FFFAFA' },

  footer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  versionText: { fontSize: 13, color: '#AAA', fontWeight: '600', letterSpacing: 1 },
  madeInText: { fontSize: 12, color: '#BBB', marginTop: 8, fontWeight: '500' },

  // Modal specific styles
  modalContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  closeModalText: { fontSize: 16, color: COLORS.accent, fontWeight: 'bold' },
  emptyBookings: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#888' },
  
  // Booking Card
  bookingCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, marginBottom: 15, elevation: 3 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  panditName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusBadge: { backgroundColor: '#FFF000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeApproved: { backgroundColor: '#E8F5E9' },
  badgeRejected: { backgroundColor: '#FFEBEE' },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#333' },
  dateText: { fontSize: 12, color: '#888', marginBottom: 15 },
  contactBox: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#EEE' },
  contactLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
  contactNumber: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 },
  hiddenText: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  chatBtn: { backgroundColor: COLORS.accent, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  chatBtnText: { color: '#FFF', fontWeight: 'bold' },
});
