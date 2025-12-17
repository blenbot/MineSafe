/**
 * SupervisorModulesScreen.js
 * Screen for supervisor to manage training modules/videos
 * 
 * BACKEND API REQUIREMENTS:
 * ============================================================================
 * 
 * 1. GET /api/supervisor/modules/pending
 *    - Description: Get list of modules pending review
 *    - Headers: Authorization: Bearer <token>
 *    - Response: { 
 *        modules: [{ 
 *          id, title, thumbnailUrl, uploadedBy, uploadedAt, status 
 *        }] 
 *      }
 *    - STATUS: PLACEHOLDER - Endpoint not implemented
 * 
 * 2. POST /api/supervisor/modules/review/:id
 *    - Description: Approve or reject a module
 *    - Headers: Authorization: Bearer <token>
 *    - Body: { action: 'approve' | 'reject', feedback?: string }
 *    - Response: { success: boolean, message: string }
 *    - STATUS: PLACEHOLDER - Endpoint not implemented
 * 
 * 3. GET /api/supervisor/modules/uploaded
 *    - Description: Get modules uploaded by this supervisor
 *    - Headers: Authorization: Bearer <token>
 *    - Response: { modules: [{ id, title, thumbnailUrl, status, views }] }
 *    - STATUS: PLACEHOLDER - Endpoint not implemented
 * 
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../utils/colors';
import { API_CONFIG, buildUrl } from '../../config/api';
import AuthService from '../../services/auth/AuthService';

const SupervisorModulesScreen = ({ navigation }) => {
  const [pendingModules, setPendingModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingModules();
  }, []);

  /**
   * API CALL - Fetch pending modules from backend
   * Endpoint: GET /api/supervisor/modules/pending
   */
  const fetchPendingModules = async () => {
    try {
      setIsLoading(true);
      
      const token = await AuthService.getToken();
      const url = `${API_CONFIG.BASE_URL}/api/supervisor/modules/pending`;
      console.log('📤 Fetching pending modules:', url);
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📥 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Pending modules:', data);
        // Handle different response formats
        const modules = data.modules || data.pending_modules || data || [];
        setPendingModules(Array.isArray(modules) ? modules : []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        // If no pending modules, just set empty array
        setPendingModules([]);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      setPendingModules([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPendingModules();
  }, []);

  /**
   * API CALL - Approve or reject a module
   * Endpoint: POST /api/supervisor/modules/review/{id}
   */
  const handleModuleAction = async (moduleId, action) => {
    try {
      setActionLoading(moduleId);
      
      const token = await AuthService.getToken();
      const url = `${API_CONFIG.BASE_URL}/api/supervisor/modules/review/${moduleId}`;
      console.log('📤 Reviewing module:', url, action);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: action, // 'approve' or 'reject'
          status: action === 'approve' ? 'approved' : 'rejected',
        }),
      });
      
      const data = await response.json();
      console.log('📥 Review response:', response.status, data);
      
      if (response.ok) {
        // Remove module from list after action
        setPendingModules(prev => prev.filter(m => m.id !== moduleId));
        
        Alert.alert(
          'Success',
          action === 'approve' 
            ? 'Module approved successfully!' 
            : 'Module rejected.'
        );
      } else {
        throw new Error(data.message || data.error || 'Failed to perform action');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      Alert.alert('Error', error.message || 'Failed to perform action. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewModule = (module) => {
    // Navigate to video module screen to preview
    navigation.navigate('VideoModule', { 
      moduleId: module.id,
      title: module.title,
      isPreview: true,
    });
  };

  const handleUploadModule = () => {
    navigation.navigate('SupervisorUploadModule');
  };

  const renderModuleCard = (module, index) => (
    <View key={module.id} style={styles.moduleCard}>
      <Text style={styles.moduleNumber}>
        {String(index + 1).padStart(2, '0')}
      </Text>
      <Image
        source={{ uri: module.thumbnailUrl }}
        style={styles.moduleThumbnail}
        resizeMode="cover"
      />
      <View style={styles.moduleInfo}>
        <Text style={styles.moduleTitle} numberOfLines={1}>
          {module.title}
        </Text>
        <Text style={styles.moduleUploader}>
          By: {module.uploadedBy}
        </Text>
      </View>
      <View style={styles.moduleActions}>
        {actionLoading === module.id ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleViewModule(module)}
            >
              <Icon name="eye-outline" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleModuleAction(module.id, 'approve')}
            >
              <Icon name="check" size={20} color={colors.status.success} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleModuleAction(module.id, 'reject')}
            >
              <Icon name="close" size={20} color={colors.status.danger} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerPlaceholder} />
        <Text style={styles.headerTitle}>Modules</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Upload Zone */}
        <TouchableOpacity 
          style={styles.uploadZone}
          onPress={handleUploadModule}
          activeOpacity={0.7}
        >
          <View style={styles.uploadIconContainer}>
            <Icon name="cloud-upload" size={48} color={colors.text.light} />
          </View>
          <Text style={styles.uploadTitle}>Upload a video</Text>
          <Text style={styles.uploadSubtitle}>
            Your uploaded video will appear here
          </Text>
        </TouchableOpacity>

        {/* Upload Button */}
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={handleUploadModule}
          activeOpacity={0.8}
        >
          <Icon name="upload" size={20} color={colors.white} />
          <Text style={styles.uploadButtonText}>Upload Module Video</Text>
        </TouchableOpacity>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Submitted Modules for Review</Text>

        {/* Modules List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading modules...</Text>
          </View>
        ) : pendingModules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="video-off" size={48} color={colors.text.light} />
            <Text style={styles.emptyText}>No pending modules for review</Text>
          </View>
        ) : (
          <View style={styles.modulesList}>
            {pendingModules.map((module, index) => renderModuleCard(module, index))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  uploadZone: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray[300],
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadIconContainer: {
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: colors.text.light,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 20,
  },
  modulesList: {
    gap: 16,
  },
  moduleCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  moduleNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[300],
    marginRight: 12,
    minWidth: 36,
  },
  moduleThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 10,
    backgroundColor: colors.gray[200],
    marginRight: 16,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  moduleUploader: {
    fontSize: 12,
    color: colors.text.light,
  },
  moduleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: colors.status.successLight,
  },
  rejectButton: {
    backgroundColor: colors.status.dangerLight,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: colors.white,
    borderRadius: 16,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export default SupervisorModulesScreen;
