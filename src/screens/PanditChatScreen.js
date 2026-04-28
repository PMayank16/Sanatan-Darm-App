import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  StatusBar,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { COLORS } from '../theme';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

export default function PanditChatScreen({ user, booking, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [partnerPhoto, setPartnerPhoto] = useState(null);
  const flatListRef = useRef(null);
  const soundRef = useRef(null);

  const isPandit = user?.uid === booking?.panditId;
  const chatPartnerName = isPandit ? (booking?.userName || 'Devotee') : (booking?.panditName || 'Pandit Ji');
  const partnerId = isPandit ? booking?.userId : booking?.panditId;

  // Fetch partner profile photo
  useEffect(() => {
    if (!partnerId) return;
    getDoc(doc(db, 'users', partnerId)).then(snap => {
      if (snap.exists()) setPartnerPhoto(snap.data().photoURL || null);
    });
  }, [partnerId]);

  // Listen to messages
  useEffect(() => {
    if (!booking?.id) return;

    const q = query(
      collection(db, `bookings/${booking.id}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    });

    return unsubscribe;
  }, [booking?.id]);

  // Mark incoming messages as read
  useEffect(() => {
    if (!messages.length || !booking?.id) return;
    messages.forEach(async (msg) => {
      if (msg.senderId !== user?.uid && msg.status !== 'read') {
        try {
          await updateDoc(doc(db, `bookings/${booking.id}/messages`, msg.id), { status: 'read' });
        } catch (e) {
          console.error('Read receipt error:', e);
        }
      }
    });
  }, [messages]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  // Reliable blob creation for Android (fetch doesn't work on file:// URIs on Android)
  const uriToBlob = (uri) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new Error('uriToBlob failed'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  };

  const uploadFile = async (uri, folder, mimeType) => {
    const blob = await uriToBlob(uri);
    const filename = `${folder}/${booking.id}_${Date.now()}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob, { contentType: mimeType });
    const url = await getDownloadURL(storageRef);
    blob.close?.(); // free memory if possible
    return url;
  };

  const sendMessage = async (extra = {}) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    await addDoc(collection(db, `bookings/${booking.id}/messages`), {
      senderId: user.uid,
      timestamp: serverTimestamp(),
      expiresAt: expiryDate,
      status: 'sent',
      type: 'text',
      ...extra,
    });
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage({ text });
  };

  const handleSendImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const url = await uploadFile(result.assets[0].uri, 'chat_images', 'image/jpeg');
      await sendMessage({ type: 'image', imageUrl: url, text: '📷 Image' });
    } catch (e) {
      Alert.alert('Upload Failed', 'Could not upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow microphone access.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
    } catch (e) {
      console.error('Recording start error:', e);
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    setUploading(true);
    try {
      const url = await uploadFile(uri, 'chat_audio', 'audio/m4a');
      await sendMessage({ type: 'audio', audioUrl: url, text: '🎤 Voice Message' });
    } catch (e) {
      Alert.alert('Upload Failed', 'Could not send voice message.');
    } finally {
      setUploading(false);
    }
  };

  const handlePlayAudio = async (audioUrl, msgId) => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (playingAudioId === msgId) {
      setPlayingAudioId(null);
      return;
    }
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      soundRef.current = sound;
      setPlayingAudioId(msgId);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.didJustFinish) setPlayingAudioId(null);
      });
    } catch (e) {
      console.error('Playback error:', e);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    let h = date.getHours();
    let m = date.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    m = m < 10 ? '0' + m : m;
    return `${h}:${m} ${ampm}`;
  };

  const renderMessage = ({ item }) => {
    const isMine = item.senderId === user?.uid;
    const isRead = item.status === 'read';

    return (
      <View style={[styles.msgWrapper, isMine ? styles.myMsgWrapper : styles.theirMsgWrapper]}>
        <View style={[styles.msgBubble, isMine ? styles.myMsgBubble : styles.theirMsgBubble]}>

          {item.type === 'image' && item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.msgImage}
              resizeMode="cover"
            />
          ) : item.type === 'audio' && item.audioUrl ? (
            <TouchableOpacity
              style={styles.audioBubble}
              onPress={() => handlePlayAudio(item.audioUrl, item.id)}
            >
              <Text style={styles.audioIcon}>
                {playingAudioId === item.id ? '⏸' : '▶'}
              </Text>
              <View style={styles.audioBar}>
                <View style={styles.audioBarFill} />
              </View>
              <Text style={[styles.audioLabel, isMine && { color: '#1B4332' }]}>Voice</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.msgText, isMine ? styles.myMsgText : styles.theirMsgText]}>
              {item.text}
            </Text>
          )}

          <View style={styles.timeRow}>
            <Text style={[styles.timeText, isMine ? styles.myTime : styles.theirTime]}>
              {formatTime(item.timestamp)}
            </Text>
            {isMine && (
              <Text style={[styles.tickText, isRead ? styles.tickRead : styles.tickSent]}>
                {isRead ? ' ✓✓' : ' ✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A0000" />

      {/* Header */}
      <LinearGradient colors={['#4A0000', COLORS.primary]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.avatarCircle}>
          {partnerPhoto ? (
            <Image source={{ uri: partnerPhoto }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarIcon}>{isPandit ? '👤' : '🕉️'}</Text>
          )}
        </View>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>{chatPartnerName}</Text>
          <Text style={styles.headerSub}>{isRecording ? '🔴 Recording...' : 'Active Now'}</Text>
        </View>
      </LinearGradient>

      {/* Chat background */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.chatBackground}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListHeaderComponent={
              <View style={styles.encryptionNotice}>
                <Text style={styles.encryptionText}>
                  🔒 Messages are encrypted & auto-delete after 30 days.
                </Text>
              </View>
            }
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputArea}>
          {/* Attachment */}
          <TouchableOpacity style={styles.iconBtn} onPress={handleSendImage} disabled={uploading}>
            <Text style={styles.iconBtnText}>{uploading ? '⏳' : '📎'}</Text>
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#888"
              value={inputText}
              onChangeText={setInputText}
              multiline
              returnKeyType="default"
            />
          </View>

          {/* Mic or Send */}
          {inputText.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendText}>
              <LinearGradient colors={['#00A884', '#008F6F']} style={styles.sendGradient}>
                <Text style={styles.sendIcon}>➤</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, isRecording && styles.recordingBtn]}
              onPressIn={handleStartRecording}
              onPressOut={handleStopRecording}
            >
              <LinearGradient
                colors={isRecording ? ['#FF3B30', '#CC0000'] : ['#800000', '#4A0000']}
                style={styles.sendGradient}
              >
                <Text style={styles.sendIcon}>🎤</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFEAE2' },

  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + 10,
    paddingBottom: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },
  backBtn: { padding: 5, marginRight: 5 },
  backArrow: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarIcon: { fontSize: 20 },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  chatBackground: { flex: 1, backgroundColor: '#EFEAE2' },
  chatContainer: { padding: 12, paddingBottom: 20 },

  encryptionNotice: {
    backgroundColor: '#FFEDD5',
    alignSelf: 'center',
    paddingHorizontal: 15, paddingVertical: 8,
    borderRadius: 10, marginBottom: 15, maxWidth: '90%',
  },
  encryptionText: { fontSize: 11, color: '#8A6D3B', textAlign: 'center', fontWeight: '500' },

  msgWrapper: { marginBottom: 6, flexDirection: 'row' },
  myMsgWrapper: { justifyContent: 'flex-end' },
  theirMsgWrapper: { justifyContent: 'flex-start' },

  msgBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 22,
    borderRadius: 16,
    elevation: 1,
    position: 'relative',
  },
  myMsgBubble: { backgroundColor: '#DCF8C6', borderTopRightRadius: 4 },
  theirMsgBubble: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 4 },

  msgText: { fontSize: 15, lineHeight: 21 },
  myMsgText: { color: '#1A1A1A' },
  theirMsgText: { color: '#1A1A1A' },

  msgImage: { width: width * 0.6, height: width * 0.5, borderRadius: 12, marginBottom: 4 },

  audioBubble: { flexDirection: 'row', alignItems: 'center', paddingRight: 10, paddingBottom: 4 },
  audioIcon: { fontSize: 22, marginRight: 8 },
  audioBar: { flex: 1, height: 4, backgroundColor: '#B0BEC5', borderRadius: 2, marginRight: 6 },
  audioBarFill: { width: '40%', height: '100%', backgroundColor: '#00A884', borderRadius: 2 },
  audioLabel: { fontSize: 11, color: '#555' },

  timeRow: {
    flexDirection: 'row', alignItems: 'center',
    position: 'absolute', right: 10, bottom: 5,
  },
  timeText: { fontSize: 10 },
  myTime: { color: 'rgba(0,0,0,0.45)' },
  theirTime: { color: 'rgba(0,0,0,0.4)' },
  tickText: { fontSize: 11, fontWeight: '700' },
  tickSent: { color: '#999' },
  tickRead: { color: '#FF3B30' },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#F0EDE8',
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },

  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 6, elevation: 1,
  },
  iconBtnText: { fontSize: 20 },

  inputWrapper: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    maxHeight: 110,
    elevation: 1,
    marginRight: 6,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15, color: '#222',
    maxHeight: 100,
    textAlignVertical: 'center',
  },

  sendBtn: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden', elevation: 2 },
  recordingBtn: { transform: [{ scale: 1.1 }] },
  sendGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
  sendIcon: { color: '#FFF', fontSize: 18 },
});
