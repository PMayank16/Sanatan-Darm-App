import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme';
import { db } from '../config/firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');
const GROQ_API_KEY = ''; // REMOVED FOR SECURITY. Use process.env.GROQ_API_KEY or similar.

const getSystemPrompt = (userName = 'भक्त', lang = 'hi') => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('hi-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  let languageName = lang === 'en' ? 'English' : lang === 'mr' ? 'Marathi' : 'Hindi';
  
  const appFeatures = `
    APP FEATURES KNOWLEDGE:
    1. Jap Counter (📿): Digital mala to count chants. Reach 108 for one full Mala.
    2. Puja Vidhi (🪔): Step-by-step procedures for pujas (Ganesh, Lakshmi, etc.) with Samagri.
    3. Mantras (🕉️): Sacred collection. Users can generate custom ones with AI.
    4. Panchang (📅): Daily Hindu calendar (Tithi, Nakshatra, Muhurat).
    5. Sadhana Streak (🔥): Daily tracking. Update every 24-28h to maintain. 3 lifelines provided.
    6. Payments: Plans like 'Sadhak' or 'Yogi'. Currently FREE for all users.
  `;

  return `आप एक श्रेष्ठ ब्राह्मण और सनातन धर्म के सहायक हैं। आपका नाम 'पंडित जी' है। 
आज की तारीख: ${dateStr}।
निर्देश:
- हमेशा 'नमस्ते ${userName}' या 'जय श्री राम ${userName}' से उत्तर शुरू करें।
- यदि कोई 'हनुमान चालीसा' मांगे, तो उसे पूरा पाठ (दोहा और चौपाई) दें, केवल मंत्र नहीं। 
- धार्मिक ग्रंथों या मंत्रों का अर्थ केवल तभी बताएं जब उपयोगकर्ता विशेष रूप से पूछे।
- उत्तर बिल्कुल छोटे, सटीक और संक्षिप्त (concise) रखें।
${appFeatures}
यदि कोई पूछे 'पूजा कैसे करें' तो उन्हें 'Puja Vidhi' सेक्शन देखने को कहें।`;
};

export default function ChatModal({ visible, onClose, user }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const userName = user?.displayName || user?.email?.split('@')[0] || 'भक्त';
  
  const getInitialMessage = () => {
    if (currentLang === 'en') return `Namaste ${userName}! I am Pandit Ji. How can I help you?`;
    if (currentLang === 'mr') return `नमस्ते ${userName}! मी पंडित जी आहे. मी कशी मदत करू शकतो?`;
    return `नमस्ते ${userName}! मैं पंडित जी हूँ। मैं आपकी कैसे सहायता कर सकता हूँ?`;
  };

  const [messages, setMessages] = useState([{ id: 1, text: getInitialMessage(), isUser: false }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scrollViewRef = useRef();

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 12, useNativeDriver: true }).start();
      if (user) loadChatHistory();
    } else {
      Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible]);

  const loadChatHistory = async () => {
    try {
      const q = query(collection(db, 'users', user.uid, 'chats'), orderBy('createdAt', 'desc'), limit(15));
      const querySnapshot = await getDocs(q);
      const history = [];
      querySnapshot.forEach((doc) => history.push({ id: doc.id, ...doc.data() }));
      if (history.length > 0) setMessages(history.reverse());
    } catch (error) { console.error(error); }
  };

  const saveMessage = async (text, isUser) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'chats'), { text, isUser, createdAt: serverTimestamp() });
    } catch (error) { console.error(error); }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { id: Date.now(), text: input, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    saveMessage(input, true);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: getSystemPrompt(userName, currentLang) }, ...messages.map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.text })), { role: 'user', content: input }],
        temperature: 0.7,
      }, { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } });

      const aiText = response.data.choices[0].message.content;
      setMessages(prev => [...prev, { id: Date.now() + 1, text: aiText, isUser: false }]);
      saveMessage(aiText, false);
    } catch (error) { setMessages(prev => [...prev, { id: Date.now() + 1, text: 'Error, try again.', isUser: false }]); }
    finally { setLoading(false); }
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          {/* STICKY HEADER */}
          <LinearGradient colors={[COLORS.primary, '#4A0000']} style={styles.modalHeader}>
            <View style={styles.headerLine} />
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.modalTitle}>पंडित जी (Sanatan AI)</Text>
                <Text style={styles.onlineStatus}>● Online</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* CHAT AREA & INPUT WITH KEYBOARD AVOIDING */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <ScrollView 
              ref={scrollViewRef} 
              onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })} 
              style={styles.chatArea}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg) => (
                <View key={msg.id} style={[styles.msgWrapper, msg.isUser ? styles.userMsgWrapper : styles.aiMsgWrapper]}>
                  <View style={[styles.bubble, msg.isUser ? styles.userBubble : styles.aiBubble]}>
                    <Text style={[styles.msgText, msg.isUser ? styles.userText : styles.aiText]}>{msg.text}</Text>
                  </View>
                </View>
              ))}
              {loading && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 10 }} />}
            </ScrollView>

            {/* STICKY INPUT AT BOTTOM */}
            <View style={styles.inputRow}>
              <TextInput 
                style={styles.input} 
                value={input} 
                onChangeText={setInput} 
                placeholder={currentLang === 'en' ? "Ask..." : currentLang === 'mr' ? "विचारा..." : "पूछें..."} 
                placeholderTextColor="#999" 
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                <LinearGradient colors={['#800000', '#4A0000']} style={styles.sendGradient}>
                  <Text style={styles.sendIcon}>➤</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  modalContent: { 
    width: width,
    height: height * 0.85, 
    backgroundColor: '#FDFCFB', 
    borderTopLeftRadius: 35, 
    borderTopRightRadius: 35, 
    overflow: 'hidden',
  },
  modalHeader: { 
    paddingTop: 12,
    paddingBottom: 20, 
    alignItems: 'center', 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  headerLine: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 25, alignItems: 'center' },
  modalTitle: { color: COLORS.secondary, fontSize: 18, fontWeight: '900' },
  onlineStatus: { color: '#4CAF50', fontSize: 10, fontWeight: '700' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: COLORS.secondary, fontSize: 14, fontWeight: 'bold' },
  chatArea: { flex: 1, paddingHorizontal: 20, paddingTop: 15 },
  msgWrapper: { marginBottom: 12, maxWidth: '85%' },
  userMsgWrapper: { alignSelf: 'flex-end' },
  aiMsgWrapper: { alignSelf: 'flex-start' },
  bubble: { padding: 12, borderRadius: 20, elevation: 1 },
  userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 2 },
  aiBubble: { backgroundColor: '#FFF', borderBottomLeftRadius: 2 },
  msgText: { fontSize: 15, lineHeight: 22 },
  userText: { color: COLORS.secondary },
  aiText: { color: '#333' },
  inputRow: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, // STICKY BOTTOM PADDING
    backgroundColor: '#FFF', 
    borderTopWidth: 1, 
    borderTopColor: '#F0F0F0', 
    alignItems: 'center' 
  },
  input: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 12, marginRight: 10, fontSize: 15, color: '#000', borderWidth: 1, borderColor: '#EEE' },
  sendBtn: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', elevation: 3 },
  sendGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#FFF', fontSize: 20, marginLeft: 3 },
});
