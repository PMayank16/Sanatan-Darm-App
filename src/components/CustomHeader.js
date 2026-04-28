import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme';

export default function CustomHeader({ title, onBack, rightElement }) {
  return (
    <View style={styles.header}>
      <LinearGradient
        colors={[COLORS.primary, '#600000']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={['top']} style={styles.headerContent}>
        <View style={styles.left}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        
        <View style={styles.right}>
          {rightElement || <View style={{ width: 40 }} />}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: Platform.OS === 'ios' ? 115 : 95,
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 15 : 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  left: { width: 45 },
  right: { width: 45, alignItems: 'flex-end' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: COLORS.secondary,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.5,
  },
});
