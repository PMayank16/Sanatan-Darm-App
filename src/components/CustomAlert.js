import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme';

const { width } = Dimensions.get('window');

export default function CustomAlert({ visible, title, message, onClose, buttonText = 'OK' }) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient
            colors={[COLORS.primary, '#5A0000']}
            style={styles.header}
          >
            <Text style={styles.omText}>ॐ</Text>
          </LinearGradient>

          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <TouchableOpacity style={styles.button} onPress={onClose}>
              <LinearGradient
                colors={['#800000', '#5A0000']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>{buttonText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: width * 0.85,
    backgroundColor: COLORS.secondary,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  omText: {
    fontSize: 50,
    color: COLORS.secondary,
  },
  content: {
    padding: 25,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.accent,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  button: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
