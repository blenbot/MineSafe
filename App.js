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
  ActivityIndicator,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NetInfo from '@react-native-community/netinfo';

// Services
import AuthService from './src/services/auth/AuthService';
import EmergencyManager from './src/services/EmergencyManager';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SOSScreen from './src/screens/SOSScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';
import ReportHazardScreen from './src/screens/ReportHazardScreen';
import HazardDetailsScreen from './src/screens/HazardDetailsScreen';
import ReviewReportScreen from './src/screens/ReviewReportScreen';
import TrainingModuleScreen from './src/screens/TrainingModuleScreen';
import WorkerProfileScreen from './src/screens/WorkerProfileScreen';

import colors from './src/utils/colors';

const Stack = createNativeStackNavigator();
const { TensorFlowModule, ScreamDetectionModule, OfflineCommModule } = NativeModules;

export default function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Detection States
  const [isFallDetectionActive, setIsFallDetectionActive] = useState(false);
  const [isScreamDetectionActive, setIsScreamDetectionActive] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);

  // Emergency State
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyData, setEmergencyData] = useState(null);

  // Network State
  const [isOnline, setIsOnline] = useState(true);
  const [offlineCount, setOfflineCount] = useState(0);

  // Permissions
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check authentication
      await checkAuthentication();

      // Check permissions
      await checkPermissions();

      // Setup network listener
      setupNetworkListener();

      // Setup app state listener
      setupAppStateListener();

      // Load ML models if authenticated
      if (await AuthService.isAuthenticated()) {
        await loadModels();
        setupEventListeners();
      }

      // Check offline emergencies count
      const count = await EmergencyManager.getOfflineEmergenciesCount();
      setOfflineCount(count);
    } catch (error) {
      console.error('❌ App initialization error:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const checkAuthentication = async () => {
    try {
      const isAuth = await AuthService.isAuthenticated();
      if (isAuth) {
        const user = await AuthService.getUserData();
        setUserData(user);
        setIsAuthenticated(true);
        console.log('✅ User authenticated:', user.user_id);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setIsAuthenticated(false);
    }
  };

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(online);

      if (online) {
        console.log('✅ Back online - syncing data...');
        syncOfflineData();
      } else {
        console.log('⚠️ Offline mode active');
      }
    });

    return unsubscribe;
  };

  const syncOfflineData = async () => {
    try {
      const result = await EmergencyManager.syncOfflineEmergencies();
      if (result.synced > 0) {
        Alert.alert(
          '✅ Sync Complete',
          `Successfully synced ${result.synced} offline emergencies`,
          [{ text: 'OK' }]
        );
      }
      const count = await EmergencyManager.getOfflineEmergenciesCount();
      setOfflineCount(count);
    } catch (error) {
      console.error('❌ Sync error:', error);
    }
  };

  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        await checkPermissions();
        if (isOnline) {
          syncOfflineData();
        }
      }
    });
    return () => subscription.remove();
  };

  const loadModels = async () => {
    if (!TensorFlowModule) {
      console.warn('⚠️ TensorFlow module not available');
      return;
    }

    try {
      setIsModelLoading(true);
      await TensorFlowModule.loadFallDetectionModel();
      setIsModelLoaded(true);
      console.log('✅ Fall detection model loaded');
    } catch (error) {
      console.error('❌ Model load error:', error);
      setIsModelLoaded(false);
      Alert.alert(
        'Model Load Error',
        'Failed to load AI model. Fall detection may not work properly.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsModelLoading(false);
    }
  };

  const setupEventListeners = () => {
    const listeners = [];

    // Fall Detection
    if (TensorFlowModule) {
      const fallEmitter = new NativeEventEmitter(TensorFlowModule);
      const fallListener = fallEmitter.addListener('onFallDetected', async (event) => {
        console.log('🚨 FALL DETECTED!', event);
        await handleEmergency('CRITICAL', 'Fall detected by AI', event);
      });
      listeners.push(fallListener);
    }

    // Scream Detection
    if (ScreamDetectionModule) {
      const screamEmitter = new NativeEventEmitter(ScreamDetectionModule);
      const screamListener = screamEmitter.addListener('onScreamDetected', async (event) => {
        console.log('🚨 SCREAM DETECTED!', event);
        await handleEmergency('CRITICAL', 'Scream/distress sound detected', event);
      });
      listeners.push(screamListener);
    }

    // Mesh Data Received (from another miner)
    if (OfflineCommModule) {
      const meshEmitter = new NativeEventEmitter(OfflineCommModule);
      const meshListener = meshEmitter.addListener('onMeshDataReceived', async (data) => {
        console.log('📡 Mesh data received:', data);
        await forwardMeshDataToServer(data);
      });
      listeners.push(meshListener);
    }

    return () => {
      listeners.forEach((listener) => listener.remove());
    };
  };

  const handleEmergency = async (severity, issue, eventData = null) => {
    try {
      setEmergencyData({ severity, issue, eventData });
      setIsEmergencyActive(true);

      const result = await EmergencyManager.triggerEmergency(severity, issue);

      if (result.success) {
        Alert.alert(
          '🚨 Emergency Alert Sent',
          `Method: ${result.method.toUpperCase()}\nHelp is on the way!`,
          [{ text: 'OK' }]
        );
      } else if (result.method === 'stored') {
        Alert.alert(
          '⚠️ Emergency Stored',
          'No connection available. Emergency will be sent when online.',
          [{ text: 'OK' }]
        );
        setOfflineCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('❌ Emergency handling error:', error);
      Alert.alert('Error', 'Failed to send emergency alert. Please try manual SOS.');
    }
  };

  const forwardMeshDataToServer = async (meshData) => {
    try {
      if (!isOnline) {
        console.log('⚠️ Offline - cannot forward mesh data');
        return;
      }

      const token = await AuthService.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/emergencies/mesh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: meshData,
      });

      if (response.ok) {
        console.log('✅ Mesh data forwarded to server');
      }
    } catch (error) {
      console.error('❌ Forward mesh data error:', error);
    }
  };

  const checkPermissions = async () => {
    if (Platform.OS !== 'android') {
      setPermissionsGranted(true);
      return;
    }

    try {
      const results = await Promise.all([
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT),
      ]);

      const allGranted = results.every((result) => result);
      setPermissionsGranted(allGranted);
    } catch (error) {
      console.error('❌ Permission check error:', error);
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
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      ]);

      const allGranted = Object.values(granted).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );

      setPermissionsGranted(allGranted);

      if (allGranted) {
        Alert.alert('✅ Permissions Granted', 'All features are now available!');
      } else {
        Alert.alert(
          '⚠️ Some Permissions Missing',
          'Some features may not work properly without all permissions.'
        );
      }
    } catch (error) {
      console.error('❌ Permission request error:', error);
    }
  };

  const handleToggleFallDetection = async () => {
    if (!TensorFlowModule || !isModelLoaded || !userData) return;

    if (!permissionsGranted) {
      Alert.alert(
        '⚠️ Permissions Required',
        'Location permission is needed for emergency alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant', onPress: requestPermissions },
        ]
      );
      return;
    }

    try {
      if (!isFallDetectionActive) {
        await TensorFlowModule.startFallDetection();
        setIsFallDetectionActive(true);
        console.log('✅ Fall detection started');
      } else {
        await TensorFlowModule.stopFallDetection();
        setIsFallDetectionActive(false);
        console.log('🛑 Fall detection stopped');
      }
    } catch (error) {
      console.error('❌ Toggle fall detection error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const handleToggleScreamDetection = async () => {
    if (!ScreamDetectionModule || !userData) return;

    if (!permissionsGranted) {
      Alert.alert(
        '⚠️ Permissions Required',
        'Microphone permission is needed for scream detection.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant', onPress: requestPermissions },
        ]
      );
      return;
    }

    try {
      if (!isScreamDetectionActive) {
        await ScreamDetectionModule.startScreamDetection();
        setIsScreamDetectionActive(true);
        console.log('✅ Scream detection started');
      } else {
        await ScreamDetectionModule.stopScreamDetection();
        setIsScreamDetectionActive(false);
        console.log('🛑 Scream detection stopped');
      }
    } catch (error) {
      console.error('❌ Toggle scream detection error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          // Stop all detection
          if (isFallDetectionActive && TensorFlowModule) {
            await TensorFlowModule.stopFallDetection().catch(console.error);
          }
          if (isScreamDetectionActive && ScreamDetectionModule) {
            await ScreamDetectionModule.stopScreamDetection().catch(console.error);
          }

          // Logout
          await AuthService.logout();
          setIsAuthenticated(false);
          setUserData(null);
          setIsFallDetectionActive(false);
          setIsScreamDetectionActive(false);
        },
      },
    ]);
  };

  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Online/Offline Indicator */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              ⚠️ Offline Mode - Using BLE Mesh
              {offlineCount > 0 && ` • ${offlineCount} pending`}
            </Text>
          </View>
        )}

        {/* Permissions Banner */}
        {isAuthenticated && !permissionsGranted && (
          <TouchableOpacity style={styles.permissionBanner} onPress={requestPermissions}>
            <Text style={styles.permissionText}>
              ⚠️ Tap to grant permissions for full functionality
            </Text>
          </TouchableOpacity>
        )}

        {/* Model Loading */}
        {isAuthenticated && isModelLoading && (
          <View style={styles.modelLoadingBanner}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.modelLoadingText}>Loading AI model...</Text>
          </View>
        )}

        {/* Detection Controls */}
        {isAuthenticated && (
          <>
            <View style={styles.detectionBar}>
              <Text style={styles.detectionText}>
                {isFallDetectionActive ? '🟢 Fall: ON' : '⚪ Fall: OFF'}
              </Text>
              <TouchableOpacity
                style={[styles.toggleBtn, isFallDetectionActive && styles.toggleBtnActive]}
                onPress={handleToggleFallDetection}
                disabled={!isModelLoaded}
              >
                <Text style={styles.toggleBtnText}>
                  {isFallDetectionActive ? '⏹' : '▶'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detectionBar}>
              <Text style={styles.detectionText}>
                {isScreamDetectionActive ? '🟢 Scream: ON' : '⚪ Scream: OFF'}
              </Text>
              <TouchableOpacity
                style={[styles.toggleBtn, isScreamDetectionActive && styles.toggleBtnActive]}
                onPress={handleToggleScreamDetection}
              >
                <Text style={styles.toggleBtnText}>
                  {isScreamDetectionActive ? '⏹' : '▶'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Stack.Navigator
          initialRouteName={isAuthenticated ? 'Home' : 'Login'}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home">
            {(props) => <HomeScreen {...props} userData={userData} onLogout={handleLogout} />}
          </Stack.Screen>
          <Stack.Screen name="SOS" component={SOSScreen} />
          <Stack.Screen name="Chatbot" component={ChatbotScreen} />
          <Stack.Screen name="ReportHazard" component={ReportHazardScreen} />
          <Stack.Screen name="HazardDetails" component={HazardDetailsScreen} />
          <Stack.Screen name="ReviewReport" component={ReviewReportScreen} />
          <Stack.Screen name="TrainingModule" component={TrainingModuleScreen} />
          <Stack.Screen name="WorkerProfile">
            {(props) => (
              <WorkerProfileScreen {...props} userData={userData} onLogout={handleLogout} />
            )}
          </Stack.Screen>
        </Stack.Navigator>

        <Modal visible={isEmergencyActive} animationType="slide">
          <SOSScreen
            navigation={{ goBack: () => setIsEmergencyActive(false) }}
            route={{ params: { autoTriggered: true, ...emergencyData } }}
          />
        </Modal>
      </SafeAreaView>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  offlineBanner: { backgroundColor: '#ff9800', padding: 12 },
  offlineText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 13 },
  permissionBanner: { backgroundColor: '#f44336', padding: 12 },
  permissionText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 13 },
  modelLoadingBanner: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modelLoadingText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  detectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detectionText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  toggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#4caf50',
  },
  toggleBtnActive: { backgroundColor: '#ff5722' },
  toggleBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
