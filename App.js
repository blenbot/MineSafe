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
import DashboardScreen from './src/screens/DashboardScreen';
import TouristIdScreen from './src/screens/TouristIdScreen';
import SOSScreen from './src/screens/SOSScreen';
import EmergencyAlertScreen from './src/screens/EmergencyScreen';
import BottomNavigation from './src/components/BottomNavigation';
import { commonStyles } from './src/styles/commonStyles';

const { TensorFlowModule, OpenSettings } = NativeModules;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [isFallDetectionActive, setIsFallDetectionActive] = useState(false);
  const [fallProbability, setFallProbability] = useState(0);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false); // ✅ NEW: Track model load state
  const [isModelLoading, setIsModelLoading] = useState(true); // ✅ NEW: Track loading status

  useEffect(() => {
    // Check permissions on mount
    checkPermissions();

    // Set up event emitter for fall detection
    if (TensorFlowModule) {
      const eventEmitter = new NativeEventEmitter(TensorFlowModule);
      
      const fallDetectionListener = eventEmitter.addListener(
        'onFallDetected',
        (event) => {
          console.log('🚨 FALL DETECTED EVENT:', event);
          setFallProbability(event.probability);
          setIsEmergencyActive(true);
        }
      );

      // ✅ Load the TensorFlow model on app start with state tracking
      setIsModelLoading(true);
      TensorFlowModule.loadFallDetectionModel()
        .then((result) => {
          console.log('✅ Model loaded:', result);
          setIsModelLoaded(true);
          setIsModelLoading(false);
        })
        .catch((error) => {
          console.error('❌ Model load error:', error);
          setIsModelLoaded(false);
          setIsModelLoading(false);
          Alert.alert(
            'Model Load Error',
            `Failed to load fall detection model: ${error.message}\n\nMake sure the model file is in android/app/src/main/assets/models/`
          );
        });

      return () => {
        fallDetectionListener.remove();
      };
    }
  }, []);

  // ✅ CLEAN PERMISSION CHECK - Only Location needed (sensors are always available!)
  const checkPermissions = async () => {
    if (Platform.OS !== 'android') {
      setPermissionsGranted(true);
      return;
    }

    try {
      // Only check location permission - motion sensors don't need permissions!
      const fineLocation = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (fineLocation) {
        console.log('✅ Location permission granted - Fall detection ready!');
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

  // ✅ REQUEST PERMISSIONS ONLY WHEN USER CLICKS
  const requestPermissions = async () => {
    if (Platform.OS !== 'android') {
      setPermissionsGranted(true);
      return;
    }

    try {
      console.log('📋 Requesting permissions...');

      // Request only Location permission - motion sensors are always available!
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
      ]);

      console.log('Permission results:', granted);

      // Check if location permission granted (sensors don't need permission!)
      const locationGranted = 
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

      if (locationGranted) {
        setPermissionsGranted(true);
        Alert.alert(
          '✅ Permissions Granted',
          '📍 Location permission granted\n' +
          '📊 Sensors are always available (no permission needed!)\n\n' +
          'Fall detection is ready to use!',
          [{ text: 'OK' }]
        );
      } else {
        setPermissionsGranted(false);

        Alert.alert(
          '⚠️ Location Permission Required',
          '📍 Location permission is needed to send GPS coordinates in emergency alerts.\n\n' +
          '📊 Motion sensors (accelerometer/gyroscope) are always available - no permission needed!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings }
          ]
        );
      }
    } catch (err) {
      console.error('❌ Permission request error:', err);
      Alert.alert('Error', `Failed to request permissions: ${err.message}`);
    }
  };

  // ✅ OPEN SETTINGS FUNCTION
  const openSettings = () => {
    if (OpenSettings && OpenSettings.openSettings) {
      console.log('📱 Opening app settings via native module...');
      OpenSettings.openSettings();
    } else {
      console.log('📱 Opening settings via Linking...');
      Linking.openSettings();
    }
  };

  // ✅ TOGGLE FALL DETECTION WITH MODEL CHECK
  const handleToggleFallDetection = async () => {
    if (!TensorFlowModule) {
      Alert.alert('Error', 'TensorFlow module not available');
      return;
    }

    // ✅ Check if model is loaded
    if (!isModelLoaded) {
      Alert.alert(
        '⚠️ Model Not Ready',
        'Fall detection model is still loading. Please wait...',
        [
          { text: 'OK' }
        ]
      );
      return;
    }

    // Check permissions before starting
    if (!permissionsGranted) {
      Alert.alert(
        '⚠️ Location Permission Required',
        'Fall detection needs:\n\n' +
        '📍 Location - To send your GPS coordinates in emergency alerts\n\n' +
        '📊 Motion sensors are always available - no permission needed!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: requestPermissions }
        ]
      );
      return;
    }

    // START or STOP fall detection
    if (!isFallDetectionActive) {
      // START
      TensorFlowModule.startFallDetection()
        .then(() => {
          console.log('✅ Fall detection started');
          setIsFallDetectionActive(true);
        })
        .catch((error) => {
          console.error('❌ Start error:', error);
          Alert.alert('Error', `Failed to start: ${error.message}`);
        });
    } else {
      // STOP
      TensorFlowModule.stopFallDetection()
        .then(() => {
          console.log('✅ Fall detection stopped');
          setIsFallDetectionActive(false);
          setFallProbability(0);
        })
        .catch((error) => {
          console.error('❌ Stop error:', error);
          Alert.alert('Error', `Failed to stop: ${error.message}`);
        });
    }
  };

  const handleNavigation = (screenId) => {
    if (screenId === 'dashboard') {
      setCurrentScreen('dashboard');
    } else if (screenId === 'sos') {
      setCurrentScreen('sos');
    } else {
      alert(`${screenId.toUpperCase()} - Coming soon!`);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen onNavigateToTouristId={() => setCurrentScreen('touristId')} />;
      case 'touristId':
        return <TouristIdScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'sos':
        return <SOSScreen onBack={() => setCurrentScreen('dashboard')} />;
      default:
        return <DashboardScreen onNavigateToTouristId={() => setCurrentScreen('touristId')} />;
    }
  };

  const handleCancelEmergency = () => {
    setIsEmergencyActive(false);
  };

  const handleConfirmEmergency = () => {
    setIsEmergencyActive(false);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="light-content" />

      {/* ✅ PERMISSION WARNING BANNER */}
      {!permissionsGranted && (
        <TouchableOpacity 
          style={styles.permissionBanner}
          onPress={requestPermissions}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.permissionTitle}>⚠️ Location Permission Required</Text>
            <Text style={styles.permissionSubtitle}>
              Tap to grant Location (sensors always available!)
            </Text>
          </View>
          <Text style={styles.permissionArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* ✅ MODEL LOADING BANNER */}
      {isModelLoading && (
        <View style={styles.modelLoadingBanner}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.modelLoadingText}>Loading fall detection model...</Text>
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
              🧠 CNN Active • 📊 50Hz Sampling
            </Text>
          )}
          {!isModelLoaded && !isModelLoading && (
            <Text style={styles.statusError}>
              ❌ Model failed to load
            </Text>
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

      {/* Main Content */}
      {renderScreen()}

      {/* Bottom Navigation */}
      <BottomNavigation
        activeScreen={currentScreen === 'touristId' || currentScreen === 'sos' ? 'dashboard' : currentScreen}
        onNavigate={handleNavigation}
      />

      {/* Emergency Alert Modal */}
      <Modal
        visible={isEmergencyActive}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCancelEmergency}
      >
        <EmergencyAlertScreen
          onCancel={handleCancelEmergency}
          onConfirmEmergency={handleConfirmEmergency}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  statusContainer: {
    flex: 1,
  },
  fallDetectionText: {
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
  // ✅ NEW STYLES
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
  statusError: {
    color: '#ff5722',
    fontSize: 10,
    fontWeight: '500',
  },
});
