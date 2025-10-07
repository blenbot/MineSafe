// src/screens/SOSScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { commonStyles } from '../styles/commonStyles';
import COLORS from '../constants/colors';

const SOSScreen = ({ onBack }) => {
  const [locationSharing, setLocationSharing] = useState(true);
  const [geoFencing, setGeoFencing] = useState(false);
  const [inactivitySensing, setInactivitySensing] = useState(true);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const blinkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Blinking animation for siren effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // For the blinking effect, we'll use opacity
  const blinkOpacity = blinkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1]
  });

  const handleSOSPress = () => {
    alert('🚨 EMERGENCY SOS ACTIVATED!\n\nSending alert to emergency contacts...');
  };

  const handleAmbulancePress = () => {
    alert('📞 Calling Ambulance: 112');
  };

  const handlePolicePress = () => {
    alert('📞 Calling Police: 112');
  };

  return (
    <ScrollView style={commonStyles.scrollView}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={commonStyles.backButton} onPress={onBack}>
            <Icon name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerIcons}>
            <Icon name="shield-checkmark" size={24} color={COLORS.white} />
            <Icon name="notifications" size={24} color={COLORS.white} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>SOS</Text>
        <Text style={styles.subtitle}>
          We are always here in case of emergencies!{'\n'}Tap to initiate emergency protocol!
        </Text>

        {/* SOS Button with Animation */}
        <TouchableOpacity 
          style={styles.sosButton}
          onPress={handleSOSPress}
          activeOpacity={0.8}
        >
          {/* Outer ring that blinks */}
          <Animated.View 
            style={[
              styles.sosButtonOuter,
              {
                opacity: blinkOpacity,
              }
            ]}
          />
          
          {/* Inner circle that pulses */}
          <Animated.View 
            style={[
              styles.sosButtonInner,
              {
                transform: [{ scale: pulseAnim }],
              }
            ]}
          >
            <Icon name="radio-button-on" size={50} color={COLORS.white} />
          </Animated.View>
        </TouchableOpacity>

        {/* Feature Cards */}
        <View style={styles.featureCards}>
          {/* Location Sharing */}
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Icon name="location" size={30} color={COLORS.danger} />
            </View>
            <Text style={styles.featureTitle}>Location{'\n'}Sharing</Text>
            <TouchableOpacity
              style={[styles.toggle, locationSharing && styles.toggleActive]}
              onPress={() => setLocationSharing(!locationSharing)}
            >
              <View style={[styles.toggleCircle, locationSharing && styles.toggleCircleActive]} />
            </TouchableOpacity>
          </View>

          {/* Geo-Fencing */}
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Icon name="pin" size={30} color={COLORS.white} />
            </View>
            <Text style={styles.featureTitle}>Geo-{'\n'}fencing</Text>
            <TouchableOpacity
              style={[styles.toggle, geoFencing && styles.toggleActive]}
              onPress={() => setGeoFencing(!geoFencing)}
            >
              <View style={[styles.toggleCircle, geoFencing && styles.toggleCircleActive]} />
            </TouchableOpacity>
          </View>

          {/* Inactivity Sensing */}
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Icon name="chatbox-ellipses" size={30} color={COLORS.danger} />
            </View>
            <Text style={styles.featureTitle}>Inactivity{'\n'}Sensing</Text>
            <TouchableOpacity
              style={[styles.toggle, inactivitySensing && styles.toggleActive]}
              onPress={() => setInactivitySensing(!inactivitySensing)}
            >
              <View style={[styles.toggleCircle, inactivitySensing && styles.toggleCircleActive]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.emergencyButtons}>
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={handleAmbulancePress}
            activeOpacity={0.7}
          >
            <Icon name="medical" size={20} color={COLORS.danger} />
            <Text style={styles.emergencyText}>Ambulance: 112</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={handlePolicePress}
            activeOpacity={0.7}
          >
            <Icon name="shield" size={20} color={COLORS.danger} />
            <Text style={styles.emergencyText}>Police: 112</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            In case of emergency press the power button 5 times to send an alert!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryCard,
    padding: 20,
    paddingBottom: 80,
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  title: {
    fontSize: 36,
    color: COLORS.white,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  sosButton: {
    alignItems: 'center',
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButtonOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButtonInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  featureCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 10,
  },
  featureCard: {
    flex: 1,
    backgroundColor: COLORS.secondaryCard,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'space-between',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 16,
  },
  toggle: {
    width: 50,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#555',
    padding: 3,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  emergencyButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  emergencyButton: {
    flex: 1,
    backgroundColor: COLORS.secondaryCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  emergencyText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.secondaryCard,
    borderRadius: 12,
    padding: 20,
  },
  infoText: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SOSScreen;