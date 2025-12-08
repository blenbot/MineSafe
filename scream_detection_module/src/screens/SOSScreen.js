// src/screens/SOSScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../utils/colors';

const SOSScreen = ({ navigation }) => {
  const [countdown, setCountdown] = useState(180);
  const [alertSent, setAlertSent] = useState(false);

  useEffect(() => {
    if (countdown > 0 && !alertSent) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !alertSent) {
      setAlertSent(true);
    }
  }, [countdown, alertSent]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>SOS</Text>
        
        <View style={styles.countdownCircle}>
          <Text style={styles.countdownNumber}>{countdown}</Text>
        </View>

        <Text style={styles.instruction}>Press & Hold to Send Alert</Text>
        <Text style={styles.subtext}>Your location will be shared automatically.</Text>

        {alertSent && (
          <View style={styles.sentContainer}>
            <Text style={styles.sentText}>✓ Alert Sent!</Text>
            <Text style={styles.sentSubtext}>Help is on the way</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 60,
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.status.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: colors.status.danger,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  countdownNumber: {
    fontSize: 80,
    fontWeight: '700',
    color: colors.white,
  },
  instruction: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  sentContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  sentText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.status.success,
    marginBottom: 8,
  },
  sentSubtext: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  footer: {
    padding: 20,
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SOSScreen;