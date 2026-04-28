import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { auth, db } from '../config/firebase';
import { COLORS } from '../theme';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

export default function SignupScreen({ onBack, onNavigateToLogin, onSignupSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Animations
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const clientId = '977544139377-j3sd4fbao9s8lgobj4u44b295jgj6ipj.apps.googleusercontent.com';

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: clientId,
    webClientId: clientId,
    androidClientId: clientId,
    iosClientId: clientId,
  });

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

    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const user = userCredential.user;
          const userRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userRef);
          
          if (!docSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              name: user.displayName || 'Spiritual Seeker',
              email: user.email,
              mobile: '',
              role: 'user',
              planId: 'free',
              aiHitsLeft: 0,
              hasPaid: false,
              createdAt: new Date().toISOString(),
            });
          }
          onSignupSuccess();
        })
        .catch(error => Alert.alert('Google Signup Failed', error.message))
        .finally(() => setLoading(false));
    }
  }, [response]);

  const handleGoogleSignup = () => {
    promptAsync();
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !mobile) {
      Alert.alert('Error', 'Please fill in all fields including Mobile Number');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        mobile,
        role: 'user',
        planId: 'free',
        aiHitsLeft: 0,
        hasPaid: false,
        createdAt: new Date().toISOString(),
      });

      onSignupSuccess();
    } catch (error) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const orb1TranslateY = floatAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const orb2TranslateX = floatAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Dynamic Deep Background */}
      <LinearGradient colors={['#2A0000', COLORS.primary, '#1A0000']} style={StyleSheet.absoluteFill} />
      
      {/* Animated Floating Orbs */}
      <Animated.View style={[styles.orb1, { transform: [{ translateY: orb1TranslateY }] }]} />
      <Animated.View style={[styles.orb2, { transform: [{ translateX: orb2TranslateX }] }]} />
      <View style={styles.noiseOverlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim }}
        >
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.omCircle}>
              <LinearGradient colors={['#FFD700', '#FF8C00']} style={styles.omGradient}>
                <Text style={styles.omText}>ॐ</Text>
              </LinearGradient>
            </View>
            <Text style={styles.welcomeText}>खाता बनाएं</Text>
            <Text style={styles.subText}>Join the Eternal Path of Wisdom</Text>
          </View>

          {/* Glassmorphism Form Container */}
          <View style={styles.glassCard}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>📱</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.signupBtn} 
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#FF9933', '#FF5E62']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signupGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.signupText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <LinearGradient colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <LinearGradient colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.googleBtn} 
              onPress={handleGoogleSignup}
              disabled={!request || loading}
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
              <Text style={styles.loginText}>Sign In</Text>
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
  orb1: { position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: '#FF5E62', opacity: 0.15, filter: 'blur(40px)' },
  orb2: { position: 'absolute', bottom: -100, left: -50, width: 400, height: 400, borderRadius: 200, backgroundColor: '#FF9933', opacity: 0.1, filter: 'blur(50px)' },
  noiseOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.02)' },
  scrollContent: { flexGrow: 1, padding: 30, paddingTop: 60 },
  backBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 20 },
  backText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  omCircle: { width: 80, height: 80, borderRadius: 40, marginBottom: 15, elevation: 15, shadowColor: '#FFD700', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 15 },
  omGradient: { flex: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
  omText: { fontSize: 40, color: '#4A0000', fontWeight: '900', marginTop: -5 },
  welcomeText: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 5 },
  subText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 8, fontWeight: '600', letterSpacing: 1 },
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 30, padding: 25, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  inputWrapper: { marginBottom: 15 },
  inputLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700', marginBottom: 6, marginLeft: 5 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', height: 55, borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  inputIcon: { fontSize: 18, marginRight: 10, opacity: 0.8 },
  input: { flex: 1, color: '#FFF', fontSize: 15, height: '100%' },
  signupBtn: { height: 55, borderRadius: 15, overflow: 'hidden', elevation: 8, shadowColor: '#FF5E62', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10, marginTop: 10 },
  signupGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  signupText: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { color: 'rgba(255,255,255,0.6)', marginHorizontal: 15, fontSize: 13, fontWeight: 'bold' },
  googleBtn: { height: 55, borderRadius: 15, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5 },
  googleIcon: { width: 22, height: 22, marginRight: 12 },
  googleBtnText: { color: '#444', fontSize: 15, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  loginText: { color: '#FFD700', fontSize: 14, fontWeight: '900' },
});
