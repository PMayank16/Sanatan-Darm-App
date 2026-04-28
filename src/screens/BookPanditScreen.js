import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Image,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { COLORS } from '../theme';
import CustomHeader from '../components/CustomHeader';

const { width } = Dimensions.get('window');

const MOCK_PANDITS = [
  { id: '1', name: 'Pt. Rameshwar Shastri', distance: '1.2 km', rating: 4.9, reviews: 124, specialties: ['Vedic Puja', 'Vastu', 'Marriage'], exp: '15+ Years', price: '₹1100+', image: '👨‍🏫' },
  { id: '2', name: 'Acharya Dev Vrat', distance: '2.5 km', rating: 4.8, reviews: 89, specialties: ['Griha Pravesh', 'Navgraha Shanti'], exp: '10+ Years', price: '₹2100+', image: '🕉️' },
  { id: '3', name: 'Pt. Vishnu Sharma', distance: '3.8 km', rating: 4.7, reviews: 56, specialties: ['Satyanarayan Katha', 'Havan'], exp: '8+ Years', price: '₹501+', image: '🪔' },
  { id: '4', name: 'Shastri Narmadeshwar', distance: '5.1 km', rating: 4.9, reviews: 201, specialties: ['Rudrabhishek', 'Mahamrityunjay'], exp: '20+ Years', price: '₹3100+', image: '🔱' },
];

export default function BookPanditScreen({ navigation, route, onAction }) {
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [pandits, setPandits] = useState([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for the location loader
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    const fetchPandits = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'pandit'));
        const querySnapshot = await getDocs(q);
        const fetchedPandits = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPandits(fetchedPandits);
      } catch (error) {
        console.error("Error fetching pandits:", error);
      }
    };

    fetchPandits();

    // Mock location detection delay
    const timer = setTimeout(() => {
      setLoadingLoc(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleBook = async (pandit) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Login Required", "Please login to book a Pandit.");
      return;
    }

    Alert.alert(
      "Book Appointment",
      `Would you like to book ${pandit.name} for a Puja?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm Request", 
          onPress: async () => {
            try {
              // Get current user details for the booking
              // Assuming user document is available, or we just send UID and fetch later.
              // We'll just send what we have.
              await addDoc(collection(db, 'bookings'), {
                userId: currentUser.uid,
                userName: currentUser.displayName || 'Devotee',
                userMobile: 'User Mobile Hidden', // Ideally fetch user doc to get mobile
                panditId: pandit.uid || pandit.id,
                panditName: pandit.name,
                panditMobile: pandit.mobile || '',
                status: 'pending',
                timestamp: new Date().getTime(),
              });
              Alert.alert("Success", "Your request has been sent to the Pandit Ji. You can check the status in your Profile.");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Could not send booking request.");
            }
          } 
        }
      ]
    );
  };

  const handleChat = async (pandit) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Login Required", "Please login to chat with a Pandit.");
      return;
    }

    try {
      // Check if there is an existing booking/inquiry
      const q = query(
        collection(db, 'bookings'), 
        where('userId', '==', currentUser.uid),
        where('panditId', '==', pandit.uid || pandit.id)
      );
      const snapshot = await getDocs(q);
      
      let chatBooking = null;

      if (!snapshot.empty) {
        // Use the first existing booking
        chatBooking = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      } else {
        // Create an inquiry
        const newDocRef = await addDoc(collection(db, 'bookings'), {
          userId: currentUser.uid,
          userName: currentUser.displayName || 'Devotee',
          userMobile: 'User Mobile Hidden',
          panditId: pandit.uid || pandit.id,
          panditName: pandit.name,
          panditMobile: pandit.mobile || '',
          status: 'inquiry',
          timestamp: new Date().getTime(),
        });
        chatBooking = {
          id: newDocRef.id,
          userId: currentUser.uid,
          userName: currentUser.displayName || 'Devotee',
          panditId: pandit.uid || pandit.id,
          panditName: pandit.name,
          status: 'inquiry',
        };
      }

      // Navigate to Chat
      if (onAction) {
        onAction('panditChat', chatBooking);
      }
    } catch (error) {
      console.error("Error initiating chat:", error);
      Alert.alert("Error", "Could not start chat.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CustomHeader title="Find Pandit Ji" onBack={() => navigation.goBack()} />

      {loadingLoc ? (
        <View style={styles.loaderContainer}>
          <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.mapPin}>
            <Text style={styles.pinIcon}>📍</Text>
          </View>
          <Text style={styles.loaderTitle}>Detecting Location</Text>
          <Text style={styles.loaderSub}>Finding the best Pandits near you...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.locationHeader}>
            <Text style={styles.locLabel}>Your Location</Text>
            <View style={styles.locRow}>
              <Text style={styles.locIcon}>📍</Text>
              <Text style={styles.locValue}>Connaught Place, New Delhi</Text>
              <TouchableOpacity>
                <Text style={styles.changeLoc}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.resultsText}>{pandits.length} Verified Pandits Found</Text>

          {pandits.length === 0 && (
            <Text style={{textAlign: 'center', marginTop: 20, color: '#888'}}>No Pandits available in your area yet.</Text>
          )}

          {pandits.map((pandit) => (
            <View key={pandit.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.imageBox}>
                  <Text style={styles.imageEmoji}>🕉️</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.name}>{pandit.name}</Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.star}>⭐</Text>
                    <Text style={styles.ratingVal}>{pandit.rating || '5.0'}</Text>
                    <Text style={styles.reviews}>({pandit.reviews || 0} reviews)</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.distance}>{pandit.location || 'Nearby'}</Text>
                  </View>
                  <Text style={styles.expText}>Experience: {pandit.exp}</Text>
                </View>
              </View>
              
              <View style={styles.specialtiesRow}>
                {(pandit.specialties || ['Vedic Puja']).map((spec, i) => (
                  <View key={i} style={styles.specBadge}>
                    <Text style={styles.specText}>{spec}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.priceLabel}>Starting from</Text>
                  <Text style={styles.priceVal}>{pandit.price}</Text>
                </View>
                <View style={styles.btnRow}>
                  <TouchableOpacity 
                    style={styles.chatBtn}
                    onPress={() => handleChat(pandit)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chatBtnText}>💬 Chat</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.bookBtn}
                    onPress={() => handleBook(pandit)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={['#FF9933', '#FF5E62']} style={styles.bookBtnGrad}>
                      <Text style={styles.bookBtnText}>Book Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          
          <View style={{ height: 50 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFB' },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pulseCircle: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,153,51,0.2)' },
  mapPin: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', elevation: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#FF9933', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, marginBottom: 25 },
  pinIcon: { fontSize: 40 },
  loaderTitle: { fontSize: 22, fontWeight: '900', color: COLORS.primary, marginBottom: 8 },
  loaderSub: { fontSize: 14, color: '#666', fontWeight: '500' },
  scrollContent: { padding: 20 },
  locationHeader: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  locLabel: { fontSize: 12, color: '#999', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  locIcon: { fontSize: 18, marginRight: 8 },
  locValue: { flex: 1, fontSize: 16, fontWeight: '800', color: '#333' },
  changeLoc: { color: COLORS.accent, fontWeight: '800', fontSize: 14 },
  resultsText: { fontSize: 15, fontWeight: '800', color: '#666', marginBottom: 15, marginLeft: 5 },
  card: { backgroundColor: '#FFF', borderRadius: 25, padding: 20, marginBottom: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  cardTop: { flexDirection: 'row', marginBottom: 15 },
  imageBox: { width: 70, height: 70, borderRadius: 20, backgroundColor: '#FFF5E5', alignItems: 'center', justifyContent: 'center', marginRight: 15, borderWidth: 1, borderColor: '#FFE8CC' },
  imageEmoji: { fontSize: 40 },
  infoCol: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '900', color: COLORS.primary, marginBottom: 5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  star: { fontSize: 12, marginRight: 4 },
  ratingVal: { fontSize: 13, fontWeight: '800', color: '#333', marginRight: 4 },
  reviews: { fontSize: 12, color: '#888', marginRight: 6 },
  dot: { fontSize: 12, color: '#CCC', marginRight: 6 },
  distance: { fontSize: 12, fontWeight: '800', color: COLORS.accent },
  expText: { fontSize: 12, color: '#666', fontWeight: '600' },
  specialtiesRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  specBadge: { backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#EEE' },
  specText: { fontSize: 11, color: '#555', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 15 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 11, color: '#999', fontWeight: '600', marginBottom: 2 },
  priceVal: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  btnRow: { flexDirection: 'row', gap: 10 },
  chatBtn: { borderRadius: 15, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#DDD', marginRight: 10 },
  chatBtnText: { color: '#333', fontSize: 14, fontWeight: '800' },
  bookBtn: { borderRadius: 15, overflow: 'hidden', elevation: 5, shadowColor: '#FF5E62', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
  bookBtnGrad: { paddingHorizontal: 20, paddingVertical: 12 },
  bookBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});
