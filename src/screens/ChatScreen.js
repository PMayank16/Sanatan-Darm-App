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
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme';
import { db } from '../config/firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');
const GROQ_API_KEY = ''; // REMOVED FOR SECURITY. Use process.env.GROQ_API_KEY or similar.

const getSystemPrompt = (userName = 'भक्त') => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('hi-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return `आप एक श्रेष्ठ ब्राह्मण और सनातन धर्म के सहायक हैं। आपका नाम 'पंडित जी' है।
आज की तारीख है: ${dateStr}।
आप जिस उपयोगकर्ता से बात कर रहे हैं उनका नाम ${userName} है। हमेशा उनसे बहुत सम्मान से बात करें।

2026 की महत्वपूर्ण एकादशी तिथियां:
- जनवरी: षटतिला (14 Jan), भौमी (29 Jan)
- फरवरी: विजया (13 Feb), आमलकी (27 Feb)
- मार्च: पापमोचिनी (14 Mar), कामदा (29 Mar)
- अप्रैल: वरूथिनी (13 Apr), मोहिनी (27 Apr)
- मई: अपरा (13 May), पद्मिनी (27 May)
- जून: परमा (11 Jun), शयन (25 Jun)
- जुलाई: कामिका (10 Jul), कामदा (25 Jul)
- अगस्त: अजा (9 Aug), पुत्रदा (23 Aug)
- सितम्बर: इंदिरा (7 Sep), परिवर्तिनी (22 Sep)
- अक्टूबर: पापांकुशा (6 Oct), रमा (21 Oct)
- नवम्बर: देवुत्थान (19 Nov), उत्पन्ना (5 Nov)
- दिसम्बर: मोक्षदा (18 Dec), सफला (3 Dec)

निर्देश:
- हमेशा 'नमस्ते ${userName}' या 'जय श्री राम ${userName}' से उत्तर शुरू करें।
- यदि कोई 'हनुमान चालीसा' मांगे, तो उसे पूरा पाठ (दोहा और चौपाई) दें, केवल मंत्र नहीं। 
- धार्मिक ग्रंथों या मंत्रों का अर्थ केवल तभी बताएं जब उपयोगकर्ता विशेष रूप से पूछे।
- उत्तर बिल्कुल छोटे, सटीक और संक्षिप्त (concise) रखें।`;
};

export default function ChatScreen({ onBack, user }) {
  const { t } = useTranslation();
  const userName = user?.displayName || user?.email?.split('@')[0] || 'भक्त';
  const [messages, setMessages] = useState([
    { id: 1, text: `नमस्ते ${userName}! मैं पंडित जी हूँ। मैं सनातन धर्म के बारे में आपकी कैसे सहायता कर सकता हूँ? जय श्री राम!`, isUser: false },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = async () => {
    try {
      const q = query(
        collection(db, 'users', user.uid, 'chats'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const history = [];
      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() });
      });
      if (history.length > 0) {
        setMessages(history.reverse());
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const saveMessage = async (text, isUser) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'chats'), {
        text,
        isUser,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { id: Date.now(), text: input, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    saveMessage(input, true);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: getSystemPrompt(userName) },
            ...messages.map(m => ({
              role: m.isUser ? 'user' : 'assistant',
              content: m.text
            })),
            { role: 'user', content: input }
          ],
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiText = response.data.choices[0].message.content;
      setMessages(prev => [...prev, { id: Date.now() + 1, text: aiText, isUser: false }]);
      saveMessage(aiText, false);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: 'तकनीकी समस्या, कृपया पुनः प्रयास करें।', isUser: false }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.primary, '#4A0000']} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>पंडित जी (Sanatan AI)</Text>
          <Text style={styles.headerStatus}>● Online</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatArea}
      >
        <ScrollView
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.scrollContent}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageContainer,
                msg.isUser ? styles.userMsgContainer : styles.aiMsgContainer
              ]}
            >
              <View style={[styles.bubble, msg.isUser ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.msgText, msg.isUser ? styles.userMsgText : styles.aiMsgText]}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.aiMsgContainer}>
              <View style={[styles.bubble, styles.aiBubble, { paddingVertical: 15 }]}>
                <ActivityIndicator color={COLORS.primary} size="small" />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Pandit Ji se poochein..."
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <LinearGradient colors={['#800000', '#4A0000']} style={styles.sendGradient}>
              <Text style={styles.sendIcon}>➤</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  backBtn: {
    marginRight: 15,
  },
  backBtnText: {
    fontSize: 28,
    color: COLORS.secondary,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  headerStatus: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '700',
  },
  chatArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
  },
  userMsgContainer: {
    alignSelf: 'flex-end',
  },
  aiMsgContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: 14,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMsgText: {
    color: COLORS.secondary,
    fontWeight: '500',
  },
  aiMsgText: {
    color: '#222',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 10,
    color: '#000',
    maxHeight: 100,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  sendGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 18,
    color: COLORS.secondary,
    marginLeft: 3,
  },
});
