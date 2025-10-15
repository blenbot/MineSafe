import React, { useState, useEffect, useRef } from 'react';
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

const { TensorFlowModule, ScreamDetectionModule, OpenSettings } = NativeModules;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [isFallDetectionActive, setIsFallDetectionActive] = useState(false);
  const [fallProbability, setFallProbability] = useState(0);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  
  // Scream Detection State
  const [isScreamDetectionActive, setIsScreamDetectionActive] = useState(false);
  const [lastScreamDetection, setLastScreamDetection] = useState(null);
  const [screamCount, setScreamCount] = useState(0);
  
  const screamTimerRef = useRef(null);

  useEffect(() => {
    checkPermissions();

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

      let screamDetectionListener = null;
      if (ScreamDetectionModule) {
        const screamEventEmitter = new NativeEventEmitter(ScreamDetectionModule);
        screamDetectionListener = screamEventEmitter.addListener(
          'onScreamDetected',
          (event) => {
            console.log('🚨 SCREAM EVENT:', event);
            setLastScreamDetection(event);
            
            // Smart detection: Only trigger emergency after multiple high-confidence detections
            if (event.isScream && event.confidence > 0.7) {
              setScreamCount(prev => {
                const newCount = prev + 1;
                console.log(`📊 Scream count: ${newCount}`);
                
                // Trigger emergency after 2 consecutive screams
                if (newCount >= 2) {
                  console.log('🚨 EMERGENCY TRIGGERED!');
                  setIsEmergencyActive(true);
                  return 0; // Reset count
                }
                return newCount;
              });
              
              // Clear previous timer
              if (screamTimerRef.current) {
                clearTimeout(screamTimerRef.current);
              }
              
              // Reset count after 3 seconds of no screams
              screamTimerRef.current = setTimeout(() => {
                console.log('⏱️ Scream count reset');
                setScreamCount(0);
              }, 3000);
            }
          }
        );
      }

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
            `Failed to load fall detection model: ${error.message}`
          );
        });

      return () => {
        fallDetectionListener.remove();
        if (screamDetectionListener) {
          screamDetectionListener.remove();
        }
        if (screamTimerRef.current) {
          clearTimeout(screamTimerRef.current);
        }
      };
    }
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS !== 'android') {
      setPermissionsGranted(true);
      return;
    }

    try {
      const fineLocation = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      
      const audio = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      if (fineLocation && audio) {
        console.log('✅ All permissions granted');
        setPermissionsGranted(true);
      } else {
        console.log('⚠️ Permissions missing');
        setPermissionsGranted(false);
      }
    } catch (err) {
      console.error('Permission check error:', err);
      setPermissionsGranted(false);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') {
      setPermissionsGranted(true);
      return;
    }

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      const locationGranted = 
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      
      const audioGranted = 
        granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;

      if (locationGranted && audioGranted) {
        setPermissionsGranted(true);
        Alert.alert(
          '✅ Permissions Granted',
          'All detection features are ready!',
          [{ text: 'OK' }]
        );
      } else {
        setPermissionsGranted(false);
        Alert.alert(
          '⚠️ Permissions Required',
          'Location and Audio permissions needed',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings }
          ]
        );
      }
    } catch (err) {
      console.error('Permission request error:', err);
      Alert.alert('Error', `Failed to request permissions: ${err.message}`);
    }
  };

  const openSettings = () => {
    if (OpenSettings && OpenSettings.openSettings) {
      OpenSettings.openSettings();
    } else {
      Linking.openSettings();
    }
  };

  const handleToggleFallDetection = async () => {
    if (!TensorFlowModule) {
      Alert.alert('Error', 'TensorFlow module not available');
      return;
    }

    if (!isModelLoaded) {
      Alert.alert('⚠️ Model Not Ready', 'Fall detection model is still loading');
      return;
    }

    if (!permissionsGranted) {
      Alert.alert(
        '⚠️ Permission Required',
        'Location permission needed for emergency alerts',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: requestPermissions }
        ]
      );
      return;
    }

    if (!isFallDetectionActive) {
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

  const handleToggleScreamDetection = async () => {
    if (!ScreamDetectionModule) {
      Alert.alert('Error', 'Scream detection module not available');
      return;
    }

    if (!permissionsGranted) {
      Alert.alert(
        '⚠️ Permissions Required',
        'Microphone and Location permissions needed',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: requestPermissions }
        ]
      );
      return;
    }

    if (!isScreamDetectionActive) {
      ScreamDetectionModule.startDetection()
        .then((result) => {
          console.log('✅ Scream detection started:', result);
          setIsScreamDetectionActive(true);
        })
        .catch((error) => {
          console.error('❌ Start error:', error);
          Alert.alert('Error', `Failed to start: ${error.message}`);
        });
    } else {
      ScreamDetectionModule.stopDetection()
        .then((result) => {
          console.log('✅ Scream detection stopped:', result);
          setIsScreamDetectionActive(false);
          setLastScreamDetection(null);
          setScreamCount(0);
          if (screamTimerRef.current) {
            clearTimeout(screamTimerRef.current);
          }
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
    setScreamCount(0);
  };

  const handleConfirmEmergency = () => {
    setIsEmergencyActive(false);
    setScreamCount(0);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="light-content" />

      {!permissionsGranted && (
        <TouchableOpacity 
          style={styles.permissionBanner}
          onPress={requestPermissions}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.permissionTitle}>⚠️ Permissions Required</Text>
            <Text style={styles.permissionSubtitle}>
              Tap to grant Location & Audio access
            </Text>
          </View>
          <Text style={styles.permissionArrow}>→</Text>
        </TouchableOpacity>
      )}

      {isModelLoading && (
        <View style={styles.modelLoadingBanner}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.modelLoadingText}>Loading fall detection model...</Text>
        </View>
      )}

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

      <View style={styles.screamDetectionBar}>
        <View style={styles.statusContainer}>
          <Text style={styles.screamDetectionText}>
            {isScreamDetectionActive ? '🟢 Scream Detection: ON' : '⚪ Scream Detection: OFF'}
          </Text>
          {isScreamDetectionActive && (
            <Text style={styles.statusSubtext}>
              🎤 22.05kHz Audio • 🧠 MFCC+TFLite
            </Text>
          )}
          {lastScreamDetection && (
            <Text style={[
              styles.statusSubtext,
              lastScreamDetection.isScream ? styles.dangerText : styles.safeText
            ]}>
              {lastScreamDetection.isScream ? '⚠️ SCREAM' : '✅ Safe'} • 
              {(lastScreamDetection.confidence * 100).toFixed(1)}%
              {screamCount > 0 && ` • Count: ${screamCount}/2`}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={[
            styles.toggleButton,
            isScreamDetectionActive ? styles.toggleButtonActive : styles.toggleButtonInactive,
            !permissionsGranted && styles.toggleButtonDisabled
          ]}
          onPress={handleToggleScreamDetection}
          disabled={!permissionsGranted}
        >
          <Text style={styles.toggleButtonText}>
            {isScreamDetectionActive ? '⏹ STOP' : '▶ START'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderScreen()}

      <BottomNavigation
        activeScreen={currentScreen === 'touristId' || currentScreen === 'sos' ? 'dashboard' : currentScreen}
        onNavigate={handleNavigation}
      />

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
  dangerText: {
    color: '#ff5722',
  },
  safeText: {
    color: '#4caf50',
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