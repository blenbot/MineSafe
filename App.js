import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  Modal,
  NativeModules,
  NativeEventEmitter,
  Alert,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import all screens
import SplashScreen from './src/screens/SplashScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import SOSScreen from './src/screens/SOSScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';
import ReportHazardScreen from './src/screens/ReportHazardScreen';
import HazardDetailsScreen from './src/screens/HazardDetailsScreen';
import TrainingModuleScreen from './src/screens/TrainingModuleScreen';
import WorkerProfileScreen from './src/screens/WorkerProfileScreen';

const Stack = createNativeStackNavigator();
const { TensorFlowModule, OpenSettings } = NativeModules;

export default function App() {
  // Emergency & Fall Detection States
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [isFallDetectionActive, setIsFallDetectionActive] = useState(false);
  const [isScreamDetectionActive, setIsScreamDetectionActive] = useState(false); // ✅ NEW STATE
  const [fallProbability, setFallProbability] = useState(0);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);

  useEffect(() => {
    // Check permissions on mount
    checkPermissions();

    // Set up fall detection
    if (TensorFlowModule) {
      const eventEmitter = new NativeEventEmitter(TensorFlowModule);
      
      // Listen for fall detection events
      const fallDetectionListener = eventEmitter.addListener(
        'onFallDetected',
        (event) => {
          console.log('🚨 FALL DETECTED!', event);
          setFallProbability(event.probability);
          setIsEmergencyActive(true); // Trigger SOS modal
        }
      );

      // Load TensorFlow model
      setIsModelLoading(true);
      TensorFlowModule.loadFallDetectionModel()
        .then((result) => {
          console.log('✅ Fall detection model loaded:', result);
          setIsModelLoaded(true);
          setIsModelLoading(false);
        })
        .catch((error) => {
          console.error('❌ Model load error:', error);
          setIsModelLoaded(false);
          setIsModelLoading(false);
          Alert.alert(
            'Model Load Error',
            `Failed to load fall detection model.\n\nError: ${error.message}\n\nPlease ensure model file is in:\nandroid/app/src/main/assets/models/`,
            [{ text: 'OK' }]
          );
        });

      return () => {
        fallDetectionListener.remove();
        if (isFallDetectionActive) {
          TensorFlowModule.stopFallDetection()
            .catch(err => console.error('Cleanup error:', err));
        }
      };
    }
  }, []);

  // Check permissions
  const checkPermissions = async () => {
    if (Platform.OS !== 'android') {
      setPermissionsGranted(true);
      return;
    }

    try {
      const fineLocation = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (fineLocation) {
        console.log('✅ Location permission granted');
        setPermissionsGranted(true);
      } else {
        console.log('⚠️ Location permission missing');
        setPermissionsGranted(false);
      }
    } catch (err) {
      console.error('Permission check error:', err);
      setPermissionsGranted(false);
    }
  };

  // Request permissions
  const requestPermissions = async () => {
    if (Platform.OS !== 'android') {
      setPermissionsGranted(true);
      return;
    }

    try {
      console.log('📋 Requesting permissions...');

      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
      ]);

      const locationGranted = 
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 
        PermissionsAndroid.RESULTS.GRANTED;

      if (locationGranted) {
        setPermissionsGranted(true);
        Alert.alert(
          '✅ Permissions Granted',
          '📍 Location access granted\n📊 Sensors ready\n\nFall detection is ready!',
          [{ text: 'OK' }]
        );
      } else {
        setPermissionsGranted(false);
        Alert.alert(
          '⚠️ Permission Required',
          '📍 Location permission is needed for emergency GPS coordinates.\n\n📊 Motion sensors are always available.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                if (OpenSettings?.openSettings) {
                  OpenSettings.openSettings();
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
      }
    } catch (err) {
      console.error('❌ Permission error:', err);
      Alert.alert('Error', `Failed to request permissions: ${err.message}`);
    }
  };

  // Toggle fall detection
  const handleToggleFallDetection = async () => {
    if (!TensorFlowModule) {
      Alert.alert('Error', 'Fall detection module not available');
      return;
    }

    // Check if model is loaded
    if (!isModelLoaded) {
      Alert.alert(
        '⚠️ Model Not Ready',
        'Fall detection model is still loading. Please wait...',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check permissions
    if (!permissionsGranted) {
      Alert.alert(
        '⚠️ Permission Required',
        'Fall detection needs location permission for emergency alerts.\n\nWould you like to grant permission now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: requestPermissions }
        ]
      );
      return;
    }

    // Toggle state
    if (!isFallDetectionActive) {
      // START
      TensorFlowModule.startFallDetection()
        .then(() => {
          setIsFallDetectionActive(true);
          console.log('✅ Fall detection started');
          Alert.alert(
            '✅ Fall Detection Active',
            '🤖 AI is now monitoring your movements\n\n' +
            '📊 50Hz sensor sampling\n' +
            '🧠 TensorFlow Lite ML model\n' +
            '⚡ Real-time fall detection\n\n' +
            'If a fall is detected, emergency alert will trigger.',
            [{ text: 'Got it!' }]
          );
        })
        .catch((error) => {
          console.error('❌ Start error:', error);
          Alert.alert(
            'Cannot Start',
            `Failed to start fall detection.\n\nError: ${error.message}`,
            [{ text: 'OK' }]
          );
        });
    } else {
      // STOP
      TensorFlowModule.stopFallDetection()
        .then(() => {
          setIsFallDetectionActive(false);
          setFallProbability(0);
          console.log('🛑 Fall detection stopped');
          Alert.alert('🛑 Stopped', 'Fall detection has been disabled.');
        })
        .catch((error) => {
          console.error('❌ Stop error:', error);
          setIsFallDetectionActive(false);
        });
    }
  };

  // ✅ NEW FUNCTION: Toggle scream detection
  const handleToggleScreamDetection = () => {
    if (!isScreamDetectionActive) {
      // START scream detection
      setIsScreamDetectionActive(true);
      console.log('🎤 Scream detection started');
      Alert.alert(
        '✅ Scream Detection Active',
        '🎤 Microphone is now monitoring for screams\n\n' +
        '🔊 Audio analysis enabled\n' +
        '🚨 Emergency alert on scream detection\n\n' +
        'If a scream is detected, emergency alert will trigger.',
        [{ text: 'Got it!' }]
      );
    } else {
      // STOP scream detection
      setIsScreamDetectionActive(false);
      console.log('🛑 Scream detection stopped');
      Alert.alert('🛑 Stopped', 'Scream detection has been disabled.');
    }
  };

  const handleCancelEmergency = () => {
    setIsEmergencyActive(false);
    setFallProbability(0);
  };

  return (
    <NavigationContainer>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Permission Warning Banner */}
        {!permissionsGranted && (
          <TouchableOpacity 
            style={styles.permissionBanner}
            onPress={requestPermissions}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.permissionTitle}>⚠️ Location Permission Required</Text>
              <Text style={styles.permissionSubtitle}>
                Tap to grant permission for emergency alerts
              </Text>
            </View>
            <Text style={styles.permissionArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Model Loading Banner */}
        {isModelLoading && (
          <View style={styles.modelLoadingBanner}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.modelLoadingText}>Loading AI model...</Text>
          </View>
        )}

        {/* Fall Detection Toggle Bar */}
        <View style={styles.fallDetectionBar}>
          <View style={styles.statusContainer}>
            <Text style={styles.fallDetectionText}>
              {isFallDetectionActive ? '🟢 Fall Detection: ON' : '⚪ Fall Detection: OFF'}
            </Text>
            {isFallDetectionActive && (
              <Text style={styles.statusSubtext}>
                🧠 AI Active • 📊 50Hz Monitoring
              </Text>
            )}
            {!isModelLoaded && !isModelLoading && (
              <Text style={styles.statusError}>❌ Model failed to load</Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={[
              styles.toggleButton,
              isFallDetectionActive ? styles.toggleButtonActive : styles.toggleButtonInactive,
              (!permissionsGranted || !isModelLoaded) && styles.toggleButtonDisabled
            ]}
            onPress={handleToggleFallDetection}
            disabled={!isModelLoaded || isModelLoading}
          >
            <Text style={styles.toggleButtonText}>
              {isFallDetectionActive ? '⏹ STOP' : '▶ START'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ✅ NEW: Scream Detection Toggle Bar */}
        <View style={styles.screamDetectionBar}>
          <View style={styles.statusContainer}>
            <Text style={styles.screamDetectionText}>
              {isScreamDetectionActive ? '🟢 Scream Detection: ON' : '⚪ Scream Detection: OFF'}
            </Text>
            {isScreamDetectionActive && (
              <Text style={styles.statusSubtext}>
                🎤 Microphone Active • 🔊 Audio Monitoring
              </Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={[
              styles.toggleButton,
              isScreamDetectionActive ? styles.toggleButtonActive : styles.toggleButtonInactive,
            ]}
            onPress={handleToggleScreamDetection}
          >
            <Text style={styles.toggleButtonText}>
              {isScreamDetectionActive ? '⏹ STOP' : '▶ START'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Stack */}
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#121212' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="SOS" component={SOSScreen} />
          <Stack.Screen name="Chatbot" component={ChatbotScreen} />
          <Stack.Screen name="ReportHazard" component={ReportHazardScreen} />
          <Stack.Screen name="HazardDetails" component={HazardDetailsScreen} />
          <Stack.Screen name="TrainingModule" component={TrainingModuleScreen} />
          <Stack.Screen name="WorkerProfile" component={WorkerProfileScreen} />
        </Stack.Navigator>

        {/* Emergency Alert Modal - Triggered by Fall Detection */}
        <Modal
          visible={isEmergencyActive}
          animationType="slide"
          transparent={false}
          onRequestClose={handleCancelEmergency}
        >
          <SOSScreen 
            navigation={{ 
              goBack: handleCancelEmergency,
              replace: (screen) => {
                setIsEmergencyActive(false);
              }
            }}
            route={{
              params: {
                fallDetected: true,
                fallProbability: fallProbability,
                autoTriggered: true,
              }
            }}
          />
        </Modal>
      </SafeAreaView>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  permissionBanner: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  permissionSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    marginTop: 2,
  },
  permissionArrow: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modelLoadingBanner: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modelLoadingText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  fallDetectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  // ✅ NEW: Scream Detection Bar Styles
  screamDetectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statusContainer: {
    flex: 1,
  },
  fallDetectionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  // ✅ NEW: Scream Detection Text Style
  screamDetectionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusSubtext: {
    color: '#999',
    fontSize: 10,
    fontWeight: '500',
  },
  statusError: {
    color: '#ff5722',
    fontSize: 10,
    fontWeight: '500',
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#ff5722',
  },
  toggleButtonInactive: {
    backgroundColor: '#4caf50',
  },
  toggleButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleButtonDisabled: {
    opacity: 0.5,
  },
});