import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme';

const { width } = Dimensions.get('window');

// Helper to get realistic looking panchang data for any date
const getPanchangForDate = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = days[date.getDay()];
  const dateString = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  
  // Deterministic "mock" data based on date
  const seed = date.getDate() + date.getMonth();
  const tithis = ['Shukla Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima', 'Krishna Pratipada'];
  const nakshatras = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];

  return {
    dayName,
    dateString,
    tithi: tithis[seed % tithis.length],
    nakshatra: nakshatras[seed % nakshatras.length],
    yoga: seed % 2 === 0 ? 'Harshana' : 'Siddha',
    karana: seed % 3 === 0 ? 'Vishti' : 'Bav',
    sunrise: '05:' + (40 + (seed % 20)) + ' AM',
    sunset: '06:' + (30 + (seed % 30)) + ' PM',
    rahukaal: '04:30 PM - 06:00 PM',
    abhijit: '11:54 AM - 12:45 PM',
  };
};

export default function PanchangScreen({ onBack }) {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const data = getPanchangForDate(currentDate);

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <LinearGradient
        colors={['#1a2a6c', '#b21f1f', '#fdbb2d']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('panchang')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Date Selector */}
          <View style={styles.dateSelector}>
            <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateNavBtn}>
              <Text style={styles.dateNavText}>‹</Text>
            </TouchableOpacity>
            
            <View style={styles.dateHeader}>
              <Text style={styles.dayText}>{data.dayName}</Text>
              <Text style={styles.dateText}>{data.dateString}</Text>
            </View>

            <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateNavBtn}>
              <Text style={styles.dateNavText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.shakaBox}>
            <Text style={styles.shakaText}>Vikram Samvat 2083 • Shaka 1948</Text>
          </View>

          {/* Sun/Moon Grid */}
          <View style={styles.timingGrid}>
            <View style={styles.timingCard}>
              <Text style={styles.timingIcon}>☀️</Text>
              <Text style={styles.timingTime}>{data.sunrise}</Text>
              <Text style={styles.timingLabel}>Sunrise</Text>
            </View>
            <View style={styles.timingCard}>
              <Text style={styles.timingIcon}>🌙</Text>
              <Text style={styles.timingTime}>{data.sunset}</Text>
              <Text style={styles.timingLabel}>Sunset</Text>
            </View>
          </View>

          {/* Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Panchang Details</Text>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tithi (तिथि)</Text>
              <Text style={styles.detailValue}>{data.tithi}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Nakshatra (नक्षत्र)</Text>
              <Text style={styles.detailValue}>{data.nakshatra}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Yoga (योग)</Text>
              <Text style={styles.detailValue}>{data.yoga}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Karana (करण)</Text>
              <Text style={styles.detailValue}>{data.karana}</Text>
            </View>
          </View>

          {/* Muhurat Section */}
          <View style={styles.muhuratSection}>
            <Text style={styles.sectionTitleWhite}>Auspicious Timings</Text>
            
            <View style={[styles.muhuratItem, styles.auspicious]}>
              <View>
                <Text style={styles.muhuratName}>Abhijit Muhurat</Text>
                <Text style={styles.muhuratTime}>{data.abhijit}</Text>
              </View>
              <Text style={styles.muhuratStatus}>Auspicious</Text>
            </View>

            <Text style={styles.sectionTitleWhite}>Inauspicious Timings</Text>
            <View style={[styles.muhuratItem, styles.inauspicious]}>
              <View>
                <Text style={styles.muhuratName}>Rahu Kaal</Text>
                <Text style={styles.muhuratTime}>{data.rahukaal}</Text>
              </View>
              <Text style={styles.muhuratStatus}>Avoid</Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 30,
    color: '#FFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  dateNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavText: {
    fontSize: 30,
    color: '#FFF',
    marginTop: -5,
  },
  dateHeader: {
    alignItems: 'center',
  },
  dayText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  dateText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 4,
  },
  shakaBox: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
    marginBottom: 25,
  },
  shakaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
  },
  timingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  timingCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timingIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  timingTime: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
  timingLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 25,
    marginBottom: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 20,
  },
  sectionTitleWhite: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 15,
    marginTop: 10,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    color: '#000',
    fontWeight: '800',
  },
  muhuratSection: {
    marginBottom: 20,
  },
  muhuratItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  auspicious: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  inauspicious: {
    borderLeftWidth: 5,
    borderLeftColor: '#F44336',
  },
  muhuratName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  muhuratTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
  },
  muhuratStatus: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
});
