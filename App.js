import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, BackHandler } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase';
import './src/i18n';
import SplashScreen from './src/screens/SplashScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import HomeScreen from './src/screens/HomeScreen';
import JapCounterScreen from './src/screens/JapCounterScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import PanchangScreen from './src/screens/PanchangScreen';
import ChatScreen from './src/screens/ChatScreen';
import CustomAlert from './src/components/CustomAlert';
import MainTabs from './src/navigation/MainTabs';
import PujaVidhiScreen from './src/screens/PujaVidhiScreen';
import PujaDetailScreen from './src/screens/PujaDetailScreen';
import MantraScreen from './src/screens/MantraScreen';
import MantraDetailScreen from './src/screens/MantraDetailScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import PanditSignupScreen from './src/screens/PanditSignupScreen';
import PanditLoginScreen from './src/screens/PanditLoginScreen';
import PanditHomeScreen from './src/screens/PanditHomeScreen';
import PanditChatScreen from './src/screens/PanditChatScreen';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './src/config/firebase';

export default function App() {
  const [appState, setAppState] = useState('splash');
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);
  const [selectedPuja, setSelectedPuja] = useState(null);
  const [selectedMantra, setSelectedMantra] = useState(null);
  const [activeChatBooking, setActiveChatBooking] = useState(null);

  const appStateRef = useRef(appState);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  useEffect(() => {
    const backAction = () => {
      if (appState === 'home') {
        Alert.alert("Exit App", "Are you sure you want to exit?", [
          { text: "Cancel", style: "cancel" },
          { text: "YES", onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      } else {
        if (appState === 'pujaDetail') setAppState('pujaVidhi');
        else if (appState === 'mantraDetail') setAppState('mantras');
        else if (appState === 'signup') setAppState('login');
        else if (appState !== 'splash' && appState !== 'language') setAppState('home');
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => backHandler.remove();
  }, [appState]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      setUser(usr);
      if (usr) {
        try {
          const docSnap = await getDoc(doc(db, 'users', usr.uid));
          if (docSnap.exists() && docSnap.data().role === 'pandit') {
            if (appStateRef.current !== 'splash') setAppState('panditHome');
          } else {
            if (appStateRef.current !== 'splash') setAppState('home');
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          if (appStateRef.current !== 'splash') setAppState('home');
        }
      } else {
        // If user logged out or no user is found, force back to roleSelection
        if (appStateRef.current !== 'splash') setAppState('roleSelection');
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleAction = (actionId) => {
    if (actionId === 'japCounter') {
      setAppState('counter');
    } else if (actionId === 'panchang') {
      setAppState('panchang');
    } else if (actionId === 'pujaVidhi') {
      setAppState('pujaVidhi');
    } else if (actionId === 'mantras') {
      setAppState('mantras');
    } else if (actionId === 'chat') {
      setAppState('chat');
    } else if (actionId === 'login') {
      setAppState('login');
    } else if (actionId === 'payments') {
      setAppState('payments');
    } else if (actionId === 'profile') {
      setAppState('home');
    } else if (actionId === 'panditChat') {
      setAppState('panditChat');
    }
  };

  const handlePujaSelect = (puja) => {
    setSelectedPuja(puja);
    setAppState('pujaDetail');
  };

  const handleMantraSelect = (mantra) => {
    setSelectedMantra(mantra);
    setAppState('mantraDetail');
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        {appState === 'splash' && (
          <SplashScreen onFinish={() => {
            const goToNext = async () => {
              if (user) {
                try {
                  const docSnap = await getDoc(doc(db, 'users', user.uid));
                  if (docSnap.exists() && docSnap.data().role === 'pandit') {
                    setAppState('panditHome');
                  } else {
                    setAppState('home');
                  }
                } catch(e) {
                  setAppState('home');
                }
              } else {
                setAppState('roleSelection');
              }
            };
            if (isAuthReady) {
              goToNext();
            } else {
              const checkAuth = setInterval(() => {
                if (auth.currentUser !== undefined) { // Firebase auth state resolved
                  clearInterval(checkAuth);
                  goToNext();
                }
              }, 100);
            }
          }} />
        )}
        {appState === 'roleSelection' && (
          <RoleSelectionScreen onSelectRole={(role) => {
            if (role === 'pandit') {
              setAppState('panditLogin');
            } else {
              setAppState('language');
            }
          }} />
        )}
        {appState === 'panditLogin' && (
          <PanditLoginScreen 
            onBack={() => setAppState('roleSelection')}
            onNavigateToSignup={() => setAppState('panditSignup')}
            onLoginSuccess={() => setAppState('panditHome')}
          />
        )}
        {appState === 'panditSignup' && (
          <PanditSignupScreen 
            onBack={() => setAppState('panditLogin')}
            onSignupSuccess={() => setAppState('panditHome')}
          />
        )}
        {appState === 'panditHome' && (
          <PanditHomeScreen 
            user={user}
            onSignOut={() => setShowSignoutConfirm(true)}
            onNavigateToChat={(booking) => {
              setActiveChatBooking(booking);
              setAppState('panditChat');
            }}
          />
        )}
        {appState === 'panditChat' && (
          <PanditChatScreen 
            user={user}
            booking={activeChatBooking}
            onBack={() => {
              // If user is pandit, go to panditHome, else go to home(profile)
              if (activeChatBooking.panditId === user.uid) {
                setAppState('panditHome');
              } else {
                setAppState('home');
              }
            }} 
          />
        )}
        {appState === 'language' && (
          <LanguageSelectionScreen onSelect={() => setAppState('login')} />
        )}
        {appState === 'home' && (
          <MainTabs 
            user={user} 
            onAction={(action, data) => {
              if (action === 'panditChat' && data) {
                setActiveChatBooking(data);
                setAppState('panditChat');
              } else {
                handleAction(action);
              }
            }} 
          />
        )}
        {appState === 'counter' && (
          <JapCounterScreen onBack={() => setAppState('home')} />
        )}
        {appState === 'panchang' && (
          <PanchangScreen onBack={() => setAppState('home')} />
        )}
        {appState === 'pujaVidhi' && (
          <PujaVidhiScreen 
            onBack={() => setAppState('home')} 
            onSelectPuja={handlePujaSelect}
            user={user}
          />
        )}
        {appState === 'pujaDetail' && (
          <PujaDetailScreen 
            puja={selectedPuja} 
            onBack={() => setAppState('pujaVidhi')} 
            user={user}
          />
        )}
        {appState === 'mantras' && (
          <MantraScreen 
            onBack={() => setAppState('home')} 
            user={user} 
            onSelectMantra={handleMantraSelect}
          />
        )}
        {appState === 'mantraDetail' && (
          <MantraDetailScreen 
            mantra={selectedMantra} 
            onBack={() => setAppState('mantras')} 
          />
        )}
        {appState === 'chat' && (
          <ChatScreen onBack={() => setAppState('home')} user={user} />
        )}
        {appState === 'login' && (
          <LoginScreen 
            onBack={() => setAppState('home')} 
            onSignup={() => setAppState('signup')}
            onLoginSuccess={() => setAppState('home')}
          />
        )}
        {appState === 'signup' && (
          <SignupScreen 
            onBack={() => setAppState('login')} 
            onNavigateToLogin={() => setAppState('login')}
            onSignupSuccess={() => setAppState('home')}
          />
        )}
        {appState === 'payments' && (
          <PaymentsScreen 
            user={user} 
            onBack={() => setAppState('home')} 
          />
        )}

        {/* Custom Welcome Alert */}
        <CustomAlert
          visible={showWelcome}
          title="नमस्ते"
          message={`${welcomeName}, सनातन धर्म में आपका स्वागत है!`}
          onClose={() => setShowWelcome(false)}
        />

        {/* Sign Out Confirmation */}
        <CustomAlert
          visible={showSignoutConfirm}
          title="लॉग आउट"
          message="क्या आप वाकई लॉग आउट करना चाहते हैं?"
          buttonText="हाँ, लॉग आउट करें"
          onClose={() => {
            setShowSignoutConfirm(false);
            auth.signOut();
          }}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
