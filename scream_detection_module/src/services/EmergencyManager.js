import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import API_CONFIG from '../config/api';
import AuthService from './auth/AuthService';

const { LocationModule, OfflineCommModule } = NativeModules;

class EmergencyManager {
  constructor() {
    this.emergencyCounter = 0;
    this.isInitialized = false;
    this.init();
  }

  async init() {
    if (this.isInitialized) return;
    await this.loadEmergencyCounter();
    this.isInitialized = true;
  }

  async loadEmergencyCounter() {
    try {
      const counter = await AsyncStorage.getItem('emergencyCounter');
      this.emergencyCounter = counter ? parseInt(counter) : 0;
      console.log('📊 Emergency counter loaded:', this.emergencyCounter);
    } catch (error) {
      console.error('❌ Error loading emergency counter:', error);
      this.emergencyCounter = 0;
    }
  }

  async getNextEmergencyID() {
    this.emergencyCounter++;
    try {
      await AsyncStorage.setItem('emergencyCounter', this.emergencyCounter.toString());
      console.log('🆔 New emergency ID:', this.emergencyCounter);
    } catch (error) {
      console.error('❌ Error saving emergency counter:', error);
    }
    return this.emergencyCounter;
  }

  async getCurrentLocation() {
    try {
      // Check location permissions
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (!granted) {
          console.warn('⚠️ Location permission not granted');
          return { latitude: 0.0, longitude: 0.0 };
        }
      }

      if (LocationModule) {
        const location = await LocationModule.getCurrentLocation();
        console.log('📍 Location:', location.latitude, location.longitude);
        return {
          latitude: location.latitude,
          longitude: location.longitude,
        };
      }

      return { latitude: 0.0, longitude: 0.0 };
    } catch (error) {
      console.error('❌ Location error:', error);
      return { latitude: 0.0, longitude: 0.0 };
    }
  }

  /**
   * Trigger emergency alert
   * @param {string} severity - 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
   * @param {string} issue - Description of the emergency
   * @param {string|null} mediaUri - Optional media file URI
   */
  async triggerEmergency(severity, issue, mediaUri = null) {
    try {
      console.log('🚨 Triggering emergency:', severity, issue);

      // Ensure initialization
      if (!this.isInitialized) {
        await this.init();
      }

      // Get user data
      const userData = await AuthService.getUserData();
      if (!userData) {
        throw new Error('User not logged in');
      }

      // Get location
      const location = await this.getCurrentLocation();

      // Get emergency ID
      const emergencyID = await this.getNextEmergencyID();

      // Create emergency payload (matching Go backend struct)
      const emergency = {
        user_id: userData.user_id,
        emergency_id: emergencyID,
        severity: severity.toUpperCase(),
        latitude: location.latitude,
        longitude: location.longitude,
        issue: issue,
        incident_time: new Date().toISOString(),
        media_status: mediaUri ? 'PENDING_UPLOAD' : 'NOT_APPLICABLE',
      };

      console.log('📦 Emergency payload:', emergency);

      // Check internet connectivity
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected && netInfo.isInternetReachable !== false;

      if (isOnline) {
        return await this.sendEmergencyOnline(emergency, mediaUri);
      } else {
        return await this.sendEmergencyOffline(emergency);
      }
    } catch (error) {
      console.error('❌ Emergency trigger error:', error);
      throw error;
    }
  }

  /**
   * Send emergency via internet
   */
  async sendEmergencyOnline(emergency, mediaUri) {
    try {
      console.log('🌐 Sending emergency online...');
      const token = await AuthService.getToken();

      // Upload media if present
      if (mediaUri) {
        const mediaUrl = await this.uploadMedia(mediaUri, token);
        if (mediaUrl) {
          emergency.media_url = mediaUrl;
          emergency.media_status = 'SYNCED';
        } else {
          emergency.media_status = 'UPLOAD_FAILED';
        }
      }

      // Send emergency to server
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMERGENCY.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(emergency),
        timeout: API_CONFIG.TIMEOUT,
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Emergency sent online successfully');
        return {
          success: true,
          method: 'online',
          data: data,
        };
      } else {
        throw new Error(data.message || 'Server rejected emergency');
      }
    } catch (error) {
      console.error('❌ Online send failed:', error);
      // Fallback to offline transmission
      return await this.sendEmergencyOffline(emergency);
    }
  }

  /**
   * Send emergency via offline methods (ESP32 LoRa or BLE Mesh)
   */
  async sendEmergencyOffline(emergency) {
    try {
      console.log('📡 Sending emergency offline...');

      // Remove media fields for offline transmission
      const offlinePayload = { ...emergency };
      delete offlinePayload.media_url;
      offlinePayload.media_status = 'NOT_APPLICABLE';

      // Try ESP32/LoRa first
      const esp32Success = await this.tryESP32(offlinePayload);
      if (esp32Success) {
        console.log('✅ Emergency sent via ESP32/LoRa');
        await this.storeOfflineEmergency(offlinePayload, 'esp32');
        return {
          success: true,
          method: 'esp32',
        };
      }

      // Fall back to BLE Mesh
      console.log('📡 Using BLE Mesh...');
      const meshSuccess = await this.tryBLEMesh(offlinePayload);
      if (meshSuccess) {
        console.log('✅ Emergency broadcasted via BLE Mesh');
        await this.storeOfflineEmergency(offlinePayload, 'mesh');
        return {
          success: true,
          method: 'mesh',
        };
      }

      // Store for later sync
      await this.storeOfflineEmergency(offlinePayload, 'stored');
      return {
        success: false,
        method: 'stored',
        message: 'Emergency stored for later sync',
      };
    } catch (error) {
      console.error('❌ Offline send error:', error);
      await this.storeOfflineEmergency(emergency, 'stored');
      return {
        success: false,
        method: 'stored',
        error: error.message,
      };
    }
  }

  /**
   * Try sending via ESP32 (with LoRa if available)
   */
  async tryESP32(payload) {
    try {
      // TODO: Implement ESP32 communication via native module
      // For now, returning false to fall back to BLE Mesh
      // You'll need to implement this based on your ESP32 setup
      return false;
    } catch (error) {
      console.error('❌ ESP32 communication error:', error);
      return false;
    }
  }

  /**
   * Try sending via BLE Mesh
   */
  async tryBLEMesh(payload) {
    try {
      if (!OfflineCommModule) {
        console.warn('⚠️ BLE Mesh module not available');
        return false;
      }

      const userData = await AuthService.getUserData();
      if (!userData) return false;

      // Start mesh network
      await OfflineCommModule.startMesh(userData.user_id);

      // Broadcast emergency
      await OfflineCommModule.broadcastEmergency(JSON.stringify(payload));

      return true;
    } catch (error) {
      console.error('❌ BLE Mesh error:', error);
      return false;
    }
  }

  /**
   * Upload media file to server
   */
  async uploadMedia(mediaUri, authToken) {
    try {
      console.log('📤 Uploading media:', mediaUri);

      const formData = new FormData();
      const filename = mediaUri.split('/').pop();
      const fileType = filename.includes('.mp4') ? 'video/mp4' : 'image/jpeg';

      formData.append('file', {
        uri: mediaUri,
        type: fileType,
        name: filename || `emergency_${Date.now()}.${fileType.split('/')[1]}`,
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD.MEDIA}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
        timeout: 60000, // 60 seconds for media upload
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Media uploaded:', data.url);
        return data.url;
      }

      console.error('❌ Media upload failed:', response.status);
      return null;
    } catch (error) {
      console.error('❌ Media upload error:', error);
      return null;
    }
  }

  /**
   * Store emergency for later sync
   */
  async storeOfflineEmergency(emergency, method) {
    try {
      const stored = await AsyncStorage.getItem('offlineEmergencies');
      const emergencies = stored ? JSON.parse(stored) : [];
      
      emergencies.push({
        ...emergency,
        offline_method: method,
        stored_at: new Date().toISOString(),
      });

      await AsyncStorage.setItem('offlineEmergencies', JSON.stringify(emergencies));
      console.log('💾 Emergency stored for later sync');
    } catch (error) {
      console.error('❌ Store offline emergency error:', error);
    }
  }

  /**
   * Sync offline emergencies when back online
   */
  async syncOfflineEmergencies() {
    try {
      const stored = await AsyncStorage.getItem('offlineEmergencies');
      if (!stored) return { synced: 0, failed: 0 };

      const emergencies = JSON.parse(stored);
      if (emergencies.length === 0) return { synced: 0, failed: 0 };

      console.log(`🔄 Syncing ${emergencies.length} offline emergencies...`);

      const token = await AuthService.getToken();
      const synced = [];
      const failed = [];

      for (const emergency of emergencies) {
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMERGENCY.CREATE}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(emergency),
            timeout: API_CONFIG.TIMEOUT,
          });

          if (response.ok) {
            synced.push(emergency);
            console.log('✅ Synced emergency ID:', emergency.emergency_id);
          } else {
            failed.push(emergency);
          }
        } catch (error) {
          console.error('❌ Sync error for emergency:', emergency.emergency_id, error);
          failed.push(emergency);
        }
      }

      // Keep only failed emergencies
      await AsyncStorage.setItem('offlineEmergencies', JSON.stringify(failed));

      console.log(`✅ Sync complete: ${synced.length} synced, ${failed.length} failed`);
      return { synced: synced.length, failed: failed.length };
    } catch (error) {
      console.error('❌ Sync offline emergencies error:', error);
      return { synced: 0, failed: 0, error: error.message };
    }
  }

  /**
   * Get offline emergencies count
   */
  async getOfflineEmergenciesCount() {
    try {
      const stored = await AsyncStorage.getItem('offlineEmergencies');
      if (!stored) return 0;
      const emergencies = JSON.parse(stored);
      return emergencies.length;
    } catch (error) {
      console.error('❌ Get offline count error:', error);
      return 0;
    }
  }
}

export default new EmergencyManager();
