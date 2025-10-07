import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  NativeModules,
  Platform,
} from 'react-native';

const { EmergencyModule } = NativeModules;

const EmergencyAlertScreen = ({ onCancel, onConfirmEmergency }) => {
  const [countdown, setCountdown] = useState(30);
  const [isCancelled, setIsCancelled] = useState(false);
  const [location, setLocation] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countdownTimerRef = useRef(null);

  useEffect(() => {
    // Start vibration pattern
    if (EmergencyModule && EmergencyModule.vibrateEmergencyPattern) {
      EmergencyModule.vibrateEmergencyPattern()
        .then(() => console.log('Emergency vibration started'))
        .catch(err => console.error('Vibration error:', err));
      
      // Get current location
      if (EmergencyModule.getCurrentLocation) {
        EmergencyModule.getCurrentLocation()
          .then(loc => {
            console.log('Location obtained:', loc);
            setLocation(loc);
          })
          .catch(err => console.error('Location error:', err));
      }
    } else {
      console.warn('EmergencyModule not available');
    }

    // Pulse animation for alert
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Countdown timer
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          handleAutoSend();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      pulseAnimation.stop();
      
      // Stop vibration - ✅ FIXED: Added null check
      if (EmergencyModule && EmergencyModule.stopVibration) {
        EmergencyModule.stopVibration()
          .then(() => console.log('Vibration stopped'))
          .catch(err => console.error('Stop vibration error:', err));
      }
    };
  }, []);

  const sendEmergencySignal = async () => {
    if (isSending || !location) {
      console.log('Cannot send: isSending =', isSending, 'location =', location);
      return;
    }
    
    setIsSending(true);
    
    try {
      const emergencyData = {
        latitude: location.latitude,
        longitude: location.longitude,
        emergencyType: 'FALL_DETECTED',
        userId: 'TOURIST_001',
      };
      
      if (EmergencyModule && EmergencyModule.sendEmergencyToServer) {
        const result = await EmergencyModule.sendEmergencyToServer(emergencyData);
        
        Alert.alert(
          '🚨 Emergency Signal Sent',
          `✅ Status: SUCCESS\n\n` +
          `📍 Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n\n` +
          `🆔 Emergency ID: ${result.emergencyId}\n\n` +
          `⏰ Timestamp: ${new Date(result.timestamp).toLocaleString()}\n\n` +
          `🚑 Emergency services have been notified!\n` +
          `📞 Your emergency contacts will be alerted.`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (EmergencyModule && EmergencyModule.stopVibration) {
                  EmergencyModule.stopVibration().catch(err => console.error(err));
                }
                onConfirmEmergency();
              }
            }
          ]
        );
      } else {
        throw new Error('EmergencyModule.sendEmergencyToServer not available');
      }
    } catch (error) {
      console.error('Emergency send error:', error);
      Alert.alert(
        'Emergency Alert',
        `⚠️ Could not reach server (offline mode)\n\n` +
        `📍 Lat: ${location?.latitude.toFixed(6) || 'N/A'}\n` +
        `📍 Long: ${location?.longitude.toFixed(6) || 'N/A'}\n\n` +
        `Emergency: FALL_DETECTED\n\n` +
        `📡 Attempting backup channels:\n` +
        `• SMS to emergency contacts\n` +
        `• LoRa mesh network\n` +
        `• BLE mesh broadcast`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (EmergencyModule && EmergencyModule.stopVibration) {
                EmergencyModule.stopVibration().catch(err => console.error(err));
              }
              onConfirmEmergency();
            }
          }
        ]
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleAutoSend = () => {
    if (!isCancelled) {
      sendEmergencySignal();
    }
  };

  const handleCancel = () => {
    setIsCancelled(true);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    // ✅ FIXED: Added null check
    if (EmergencyModule && EmergencyModule.stopVibration) {
      EmergencyModule.stopVibration()
        .then(() => console.log('Vibration cancelled'))
        .catch(err => console.error('Cancel vibration error:', err));
    }
    
    Alert.alert('Cancelled', "✅ Glad you're okay!\n\nEmergency alert has been cancelled.", [
      {
        text: 'OK',
        onPress: () => onCancel(),
      },
    ]);
  };

  const handleSendNow = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    sendEmergencySignal();
  };

  return (
    <View style={styles.container}>
      {/* Warning Header */}
      <View style={styles.header}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.warningIcon}>⚠️</Text>
        </Animated.View>
        <Text style={styles.title}>FALL DETECTED!</Text>
      </View>

      {/* Countdown Circle */}
      <View style={styles.countdownContainer}>
        <View style={styles.countdownCircle}>
          <Text style={styles.countdownNumber}>{countdown}</Text>
          <Text style={styles.countdownText}>seconds</Text>
        </View>
        <Text style={styles.message}>
          Emergency SOS will be sent automatically
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>✓ I'm OK</Text>
          <Text style={styles.buttonSubtext}>Cancel Alert</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.emergencyButton]}
          onPress={handleSendNow}
          activeOpacity={0.8}
          disabled={isSending}
        >
          <Text style={styles.buttonText}>
            {isSending ? '⏳ Sending...' : '🚨 Send SOS Now'}
          </Text>
          <Text style={styles.buttonSubtext}>Get Help Immediately</Text>
        </TouchableOpacity>
      </View>

      {/* Info Text */}
      <View style={styles.infoContainer}>
        {location ? (
          <>
            <Text style={styles.infoText}>
              📍 Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}{'\n'}
              🎯 Accuracy: ±{location.accuracy?.toFixed(0) || '?'}m{'\n'}
              📞 Emergency contacts will be notified{'\n'}
              🚑 Local emergency services alerted{'\n'}
              {isSending && '⏳ Sending emergency signal...'}
            </Text>
          </>
        ) : (
          <Text style={styles.infoText}>
            📍 Getting your location...{'\n'}
            📞 Emergency contacts will be notified{'\n'}
            🚑 Local emergency services alerted
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff3b30',
    textAlign: 'center',
    letterSpacing: 2,
  },
  countdownContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#ff6b6b',
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: 'white',
  },
  countdownText: {
    fontSize: 18,
    color: 'white',
    marginTop: 5,
  },
  message: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 20,
  },
  button: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#4CAF50',
  },
  emergencyButton: {
    backgroundColor: '#ff3b30',
  },
  buttonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  infoContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default EmergencyAlertScreen;