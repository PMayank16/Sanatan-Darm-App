import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLORS } from '../theme';
import CustomHeader from '../components/CustomHeader';

const { width } = Dimensions.get('window');

// Mock AI Data Generator
const getAiContent = (pujaId, lang) => {
  const contents = {
    ganesh: {
      en: {
        importance: "Ganesh Puja is performed to remove obstacles and seek blessings for new beginnings.",
        samagri: ["Ganesh Idol", "Durva Grass", "Modak", "Red Flowers", "Incense Sticks", "Diyas"],
        vidhi: [
          "1. Deep Prajwalan: Light the diya and incense.",
          "2. Sankalp: Take a pledge for the puja.",
          "3. Avahanam: Invite Lord Ganesha.",
          "4. Abhishek: Bathe the idol with water and milk.",
          "5. Shodashopachara: Offer flowers, vastra, and naivedya.",
          "6. Aarti: Perform the final aarti and seek forgiveness."
        ]
      },
      hi: {
        importance: "गणेश पूजा बाधाओं को दूर करने और नई शुरुआत के लिए आशीर्वाद प्राप्त करने के लिए की जाती है।",
        samagri: ["गणेश मूर्ति", "दूर्वा घास", "मोदक", "लाल फूल", "धूपबत्ती", "दीया"],
        vidhi: [
          "1. दीप प्रज्वलन: दीया और धूप जलाएं।",
          "2. संकल्प: पूजा का संकल्प लें।",
          "3. आवाहन: भगवान गणेश को आमंत्रित करें।",
          "4. अभिषेक: मूर्ति को जल और दूध से स्नान कराएं।",
          "5. षोडशोपचार: फूल, वस्त्र और नैवेद्य अर्पित करें।",
          "6. आरती: अंत में आरती करें और क्षमा याचना करें।"
        ]
      }
    },
    // Default fallback
    default: {
      en: {
        importance: "This puja is highly significant in Sanatan Dharma for peace and prosperity.",
        samagri: ["Flowers", "Fruits", "Incense", "Diya", "Holy Water"],
        vidhi: ["Step 1: Preparation", "Step 2: Invocation", "Step 3: Offering", "Step 4: Aarti"]
      },
      hi: {
        importance: "यह पूजा सुख-शांति और समृद्धि के लिए सनातन धर्म में अत्यंत महत्वपूर्ण है।",
        samagri: ["फूल", "फल", "धूप", "दीया", "गंगाजल"],
        vidhi: ["चरण 1: तैयारी", "चरण 2: आवाहन", "चरण 3: अर्पण", "चरण 4: आरती"]
      }
    }
  };

  return contents[pujaId] ? contents[pujaId][lang] : contents.default[lang];
};

export default function PujaDetailScreen({ puja, onBack, user }) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [typewriterText, setTypewriterText] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isEnglish = i18n.language === 'en';
  const currentLang = i18n.language === 'en' ? 'en' : 'hi';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pujaRef = doc(db, 'ai_pujas', `${puja.id}_${currentLang}`);
        const pujaSnap = await getDoc(pujaRef);

        if (pujaSnap.exists()) {
          setContent(pujaSnap.data());
          setLoading(false);
          Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        } else {
          // Check for user login
          if (!user) {
            setLoading(false);
            Alert.alert("Login Required", "Please login to see AI-generated Vidhi.");
            onBack();
            return;
          }

          // Simulate AI Generation
          setTimeout(async () => {
            const generated = getAiContent(puja.id, currentLang);
            
            // Store in Firestore for all users
            await setDoc(pujaRef, generated);
            
            setContent(generated);
            setLoading(false);
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
            Alert.alert("AI Generated", `Vidhi generated and saved for all seekers! (Free Access)`);
          }, 2000);
        }
      } catch (error) {
        console.error("Error fetching puja data:", error);
        setLoading(false);
        onBack();
      }
    };

    fetchData();
  }, [puja]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>
          {isEnglish ? `AI generating ${puja.name} Vidhi...` : `AI ${puja.nameHi} विधि तैयार कर रहा है...`}
        </Text>
        <Text style={styles.loadingSub}>Please wait, gathering scriptures and rituals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CustomHeader title={isEnglish ? puja.name : puja.nameHi} onBack={onBack} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Importance Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{isEnglish ? "Importance" : "महत्व"}</Text>
            <View style={styles.card}>
              <Text style={styles.cardText}>{content.importance}</Text>
            </View>
          </View>

          {/* Samagri Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{isEnglish ? "Samagri (Materials)" : "पूजन सामग्री"}</Text>
            <View style={styles.card}>
              <View style={styles.tagContainer}>
                {content.samagri.map((item, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>✨ {item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Vidhi Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{isEnglish ? "Vidhi (Procedure)" : "पूजन विधि"}</Text>
            <View style={styles.vidhiCard}>
              {content.vidhi.map((step, idx) => (
                <View key={idx} style={styles.vidhiStep}>
                  <Text style={styles.vidhiText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ask AI Button */}
          <TouchableOpacity style={styles.askAiBtn}>
            <LinearGradient colors={['#FF9966', '#FF5E62']} style={styles.aiBtnGradient}>
              <Text style={styles.aiBtnText}>✨ {isEnglish ? "Ask AI for more knowledge" : "अधिक जानकारी के लिए AI से पूछें"}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 50 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  loadingText: { marginTop: 20, fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  loadingSub: { marginTop: 10, fontSize: 12, color: '#666' },
  header: { height: 110, justifyContent: 'flex-end', paddingBottom: 15 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  headerTitle: { color: COLORS.secondary, fontSize: 20, fontWeight: '900' },
  scrollContent: { padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: COLORS.accent, paddingLeft: 10 },
  card: { backgroundColor: '#FFF', padding: 18, borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardText: { fontSize: 15, color: '#444', lineHeight: 24 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: '#FFF9F2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#FFE8CC' },
  tagText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  vidhiCard: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  vidhiStep: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  vidhiText: { fontSize: 15, color: '#333', lineHeight: 24 },
  askAiBtn: { marginTop: 10, borderRadius: 20, overflow: 'hidden', elevation: 10 },
  aiBtnGradient: { paddingVertical: 18, alignItems: 'center' },
  aiBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
