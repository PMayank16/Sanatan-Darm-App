import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { COLORS } from '../theme';

const { width } = Dimensions.get('window');

export default function PanditLoginScreen({ onBack, onNavigateToSignup, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Animations
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Verify if this user is actually a pandit
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists() && docSnap.data().role === 'pandit') {
        onLoginSuccess();
      } else {
        auth.signOut();
        Alert.alert("Access Denied", "This account is not registered as a Pandit. Please use the Devotee login.");
      }
    } catch (error) {
      Alert.alert('Login Failed', "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const orb1TranslateY = floatAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const orb2TranslateX = floatAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient colors={['#3A2000', '#1A0A00', '#000000']} style={StyleSheet.absoluteFill} />
      
      <Animated.View style={[styles.orb1, { transform: [{ translateY: orb1TranslateY }] }]} />
      <Animated.View style={[styles.orb2, { transform: [{ translateX: orb2TranslateX }] }]} />
      <View style={styles.noiseOverlay} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Animated.ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={{ opacity: fadeAnim }}>
          
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>📿</Text>
            </View>
            <Text style={styles.welcomeText}>Pandit Login</Text>
            <Text style={styles.subText}>Welcome back, Acharya Ji</Text>
          </View>

          <View style={styles.glassCard}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput 
                  style={styles.input} 
                  placeholderTextColor="rgba(255,255,255,0.3)" 
                  value={email} 
                  onChangeText={setEmail} 
                  autoCapitalize="none" 
                  keyboardType="email-address" 
                  placeholder="name@example.com" 
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput 
                  style={styles.input} 
                  placeholderTextColor="rgba(255,255,255,0.3)" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                  placeholder="Enter Password" 
                />
              </View>
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.9}>
              <LinearGradient colors={['#FFD700', '#FF8C00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginGradient}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.loginText}>Secure Login</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have a Pandit profile? </Text>
            <TouchableOpacity onPress={onNavigateToSignup} activeOpacity={0.7}>
              <Text style={styles.signupText}>Register Now</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb1: { position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: '#FFD700', opacity: 0.1, filter: 'blur(40px)' },
  orb2: { position: 'absolute', bottom: -100, left: -50, width: 400, height: 400, borderRadius: 200, backgroundColor: '#FF8C00', opacity: 0.1, filter: 'blur(50px)' },
  noiseOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.02)' },
  scrollContent: { flexGrow: 1, padding: 25, paddingTop: 60, justifyContent: 'center' },
  backBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 20 },
  backText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,215,0,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderWidth: 2, borderColor: '#FFD700' },
  icon: { fontSize: 35 },
  welcomeText: { fontSize: 28, fontWeight: '900', color: '#FFD700', letterSpacing: 1 },
  subText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8, fontWeight: '600' },
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 30, padding: 25, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.2)' },
  inputWrapper: { marginBottom: 15 },
  inputLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700', marginBottom: 6, marginLeft: 5 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', height: 55, borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  inputIcon: { fontSize: 16, marginRight: 10, opacity: 0.8 },
  input: { flex: 1, color: '#FFF', fontSize: 15, height: '100%' },
  loginBtn: { height: 55, borderRadius: 15, overflow: 'hidden', elevation: 8, marginTop: 15 },
  loginGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loginText: { color: '#4A2500', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  signupText: { color: '#FFD700', fontSize: 14, fontWeight: '900' },
});
