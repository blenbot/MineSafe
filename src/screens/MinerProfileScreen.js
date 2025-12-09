/**
 * MinerProfileScreen.js
 * User profile screen for miners
 * 
 * Features:
 * - Display user profile information from backend
 * - Edit profile functionality
 * - Logout
 * - Profile picture (placeholder for image picker)
 * - Video upload with optional quiz
 * - User tags management for personalized recommendations
 * 
 * BACKEND REQUIREMENTS:
 * - GET /api/app/profile - Get user profile data (includes user tags)
 * - PUT /api/app/profile - Update user profile
 * - POST /api/app/profile/picture - Upload profile picture
 * - POST /api/videos/upload - Upload video module
 *   Request: { mp4: file, title: string, tags: string[], quiz?: { questions: [] } }
 * - PUT /api/user/tags - Update user tags for recommendations
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/auth/AuthService';
import API_CONFIG from '../config/api';
import colors from '../utils/colors';
import { useTranslation } from '../i18n';

const MinerProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userTags, setUserTags] = useState([]);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    tags: [],
    hasQuiz: false,
  });
  const [newTag, setNewTag] = useState('');
  
  // Available tags for selection
  const AVAILABLE_TAGS = [
    'PPE', 'safety', 'helmet', 'emergency', 'evacuation', 
    'first-aid', 'hazard', 'HEMI', 'underground', 'training',
    'equipment', 'machinery', 'electrical', 'ventilation', 'dust'
  ];
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadUserData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await AuthService.getUserData();
      setUserData(user);
      // Load user tags from profile or AsyncStorage
      const savedTags = user?.tags || await AsyncStorage.getItem('userTags');
      if (savedTags) {
        setUserTags(typeof savedTags === 'string' ? JSON.parse(savedTags) : savedTags);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user tags for personalized recommendations
   * Backend endpoint: PUT /api/user/tags
   */
  const handleUpdateTags = async () => {
    try {
      const token = await AuthService.getToken();
      
      // Save locally first
      await AsyncStorage.setItem('userTags', JSON.stringify(userTags));
      
      // Sync with backend - PUT /api/user/tags
      await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_TAGS.UPDATE}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tags: userTags }),
      });
      
      setShowTagsModal(false);
      Alert.alert('Success', 'Your interests have been updated!');
    } catch (error) {
      console.error('Error updating tags:', error);
      setShowTagsModal(false);
    }
  };

  const toggleTag = (tag) => {
    if (userTags.includes(tag)) {
      setUserTags(userTags.filter(t => t !== tag));
    } else {
      setUserTags([...userTags, tag]);
    }
  };

  /**
   * Handle video upload
   * Backend endpoint: POST /api/videos/upload
   * Request format: FormData with { mp4: file, title: string, tags: string[], quiz?: object }
   */
  const handleVideoUpload = async () => {
    if (!uploadData.title.trim()) {
      Alert.alert('Error', 'Please enter a video title');
      return;
    }

    // PLACEHOLDER: Video file selection
    // Required: react-native-document-picker or react-native-image-picker
    Alert.alert(
      'Select Video',
      'Choose a video to upload',
      [
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            // PLACEHOLDER: This would use document picker/image picker
            // const result = await DocumentPicker.pick({ type: ['video/mp4'] });
            // Then upload to backend
            console.log('Video picker - Requires react-native-document-picker');
            
            // Simulate upload
            try {
              const token = await AuthService.getToken();
              
              /*
               * Backend endpoint: POST /api/videos/upload
               * Request format (FormData):
               * {
               *   mp4: <video file>,
               *   title: "Video Title",
               *   tags: ["PPE", "safety"],
               *   quiz: { // Optional
               *     questions: [
               *       { question: "Q1?", options: ["A", "B", "C", "D"], correct: 0 }
               *     ]
               *   }
               * }
               */
              const formData = new FormData();
              // formData.append('mp4', { uri: result.uri, type: 'video/mp4', name: 'video.mp4' });
              formData.append('title', uploadData.title);
              formData.append('tags', JSON.stringify(uploadData.tags));
              if (uploadData.hasQuiz) {
                formData.append('quiz', JSON.stringify({ questions: [] })); // Would be populated from quiz creator
              }
              
              // Backend endpoint: POST /api/videos/upload
              await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIDEOS.UPLOAD}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data',
                },
                body: formData,
              });
              
              Alert.alert('Success', 'Video upload initiated! (Placeholder)');
              setShowUploadModal(false);
              setUploadData({ title: '', tags: [], hasQuiz: false });
            } catch (error) {
              console.error('Error uploading video:', error);
              Alert.alert('Error', 'Failed to upload video');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleChangeProfilePicture = () => {
    // PLACEHOLDER: Profile picture upload
    // Required: react-native-image-picker
    // Backend endpoint: POST /api/app/profile/picture
    Alert.alert(
      'Change Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => console.log('Camera - Requires react-native-image-picker') },
        { text: 'Choose from Gallery', onPress: () => console.log('Gallery - Requires react-native-image-picker') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleEditProfile = () => {
    // PLACEHOLDER: Navigate to edit profile screen
    // TODO: Create EditProfileScreen with form fields
    Alert.alert(
      'Edit Profile',
      'This feature is coming soon! You\'ll be able to update your profile information.',
      [{ text: 'OK' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            // Reset navigation to Login
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Profile detail items
  const profileDetails = [
    {
      icon: 'email-outline',
      label: 'Email',
      value: userData?.email || 'Not provided',
    },
    {
      icon: 'phone-outline',
      label: 'Phone Number',
      value: userData?.phone || 'Not provided',
    },
    {
      icon: 'account-tie-outline',
      label: 'Supervisor Name',
      value: userData?.supervisor_name || 'Not assigned',
    },
    {
      icon: 'map-marker-outline',
      label: 'Allocated Mine Site',
      value: userData?.mining_site || 'Not assigned',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Miner Profile</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Profile Image Section */}
          <View style={styles.profileImageSection}>
            <TouchableOpacity 
              style={styles.profileImageContainer}
              onPress={handleChangeProfilePicture}
              activeOpacity={0.8}
            >
              {/* PLACEHOLDER: Profile Image */}
              {/* Required: react-native-image-picker for camera/gallery access */}
              {/* Backend: POST /api/app/profile/picture for upload */}
              <View style={styles.profileImagePlaceholder}>
                <Icon name="account" size={60} color={colors.primary} />
              </View>
              
              {/* Edit Badge */}
              <View style={styles.editBadge}>
                <Icon name="pencil" size={14} color={colors.white} />
              </View>
            </TouchableOpacity>

            <Text style={styles.userName}>{userData?.name || 'Miner'}</Text>
            <Text style={styles.userRole}>{userData?.role || 'MINER'}</Text>
          </View>

          {/* Profile Details Cards */}
          <View style={styles.detailsContainer}>
            {profileDetails.map((detail, index) => (
              <View key={index} style={styles.detailCard}>
                <View style={styles.detailIconContainer}>
                  <Icon name={detail.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>{detail.label}</Text>
                  <Text style={styles.detailValue}>{detail.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
              activeOpacity={0.8}
            >
              <Icon name="account-edit-outline" size={22} color={colors.white} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Icon name="logout" size={22} color={colors.primary} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Settings Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            {/* Upload Video - NEW */}
            <TouchableOpacity 
              style={styles.settingsItem}
              onPress={() => setShowUploadModal(true)}
            >
              <View style={[styles.settingsIconContainer, { backgroundColor: colors.secondaryLight }]}>
                <Icon name="video-plus" size={22} color={colors.primary} />
              </View>
              <Text style={styles.settingsItemText}>Upload Video Module</Text>
              <Icon name="chevron-right" size={22} color={colors.gray[400]} />
            </TouchableOpacity>

            {/* My Interests/Tags - NEW */}
            <TouchableOpacity 
              style={styles.settingsItem}
              onPress={() => setShowTagsModal(true)}
            >
              <View style={[styles.settingsIconContainer, { backgroundColor: colors.secondaryLight }]}>
                <Icon name="tag-multiple" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingsItemText}>My Interests</Text>
                {userTags.length > 0 && (
                  <Text style={styles.settingsItemSubtext}>
                    {userTags.slice(0, 3).join(', ')}{userTags.length > 3 ? ` +${userTags.length - 3} more` : ''}
                  </Text>
                )}
              </View>
              <Icon name="chevron-right" size={22} color={colors.gray[400]} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingsItem}
              onPress={() => navigation.navigate('LanguageSelect')}
            >
              <View style={styles.settingsIconContainer}>
                <Icon name="translate" size={22} color={colors.primary} />
              </View>
              <Text style={styles.settingsItemText}>Language</Text>
              <Icon name="chevron-right" size={22} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIconContainer}>
                <Icon name="bell-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.settingsItemText}>Notifications</Text>
              <Icon name="chevron-right" size={22} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIconContainer}>
                <Icon name="shield-check-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.settingsItemText}>Privacy & Security</Text>
              <Icon name="chevron-right" size={22} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIconContainer}>
                <Icon name="help-circle-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.settingsItemText}>Help & Support</Text>
              <Icon name="chevron-right" size={22} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>

          {/* App Version */}
          <Text style={styles.versionText}>MineSafe v1.0.0</Text>
        </Animated.View>
      </ScrollView>

      {/* Tags Modal */}
      <Modal
        visible={showTagsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTagsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Interests</Text>
              <TouchableOpacity onPress={() => setShowTagsModal(false)}>
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Select topics you're interested in. Videos will be recommended based on your interests.
            </Text>
            
            <View style={styles.tagsGrid}>
              {AVAILABLE_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    userTags.includes(tag) && styles.tagChipSelected
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[
                    styles.tagChipText,
                    userTags.includes(tag) && styles.tagChipTextSelected
                  ]}>
                    #{tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleUpdateTags}
            >
              <Text style={styles.modalButtonText}>Save Interests</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Video Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Video</Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Share safety knowledge with other miners
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Video Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter video title..."
                placeholderTextColor={colors.gray[400]}
                value={uploadData.title}
                onChangeText={(text) => setUploadData({ ...uploadData, title: text })}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tags</Text>
              <View style={styles.tagsGrid}>
                {AVAILABLE_TAGS.slice(0, 8).map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagChip,
                      uploadData.tags.includes(tag) && styles.tagChipSelected
                    ]}
                    onPress={() => {
                      const newTags = uploadData.tags.includes(tag)
                        ? uploadData.tags.filter(t => t !== tag)
                        : [...uploadData.tags, tag];
                      setUploadData({ ...uploadData, tags: newTags });
                    }}
                  >
                    <Text style={[
                      styles.tagChipText,
                      uploadData.tags.includes(tag) && styles.tagChipTextSelected
                    ]}>
                      #{tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setUploadData({ ...uploadData, hasQuiz: !uploadData.hasQuiz })}
            >
              <Icon 
                name={uploadData.hasQuiz ? "checkbox-marked" : "checkbox-blank-outline"} 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.checkboxText}>Add optional quiz to video</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleVideoUpload}
            >
              <Icon name="cloud-upload" size={22} color={colors.white} />
              <Text style={styles.modalButtonText}>Select & Upload Video</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('MinerHome')}
        >
          <Icon name="home-outline" size={24} color={colors.gray[400]} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('VideoModule')}
        >
          <Icon name="play-circle-outline" size={24} color={colors.gray[400]} />
          <Text style={styles.navText}>Video</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('TrainingList')}
        >
          <Icon name="school-outline" size={24} color={colors.gray[400]} />
          <Text style={styles.navText}>Training</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="account" size={24} color={colors.primary} />
          <Text style={styles.navTextActive}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: colors.white,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.secondaryDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 28,
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  editButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: 10,
  },
  logoutButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingsItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  settingsItemSubtext: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  versionText: {
    fontSize: 13,
    color: colors.text.light,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 20,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.secondaryLight,
    borderWidth: 1.5,
    borderColor: colors.secondaryDark,
  },
  tagChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagChipText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  tagChipTextSelected: {
    color: colors.white,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 27,
    gap: 10,
    marginTop: 10,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.secondaryDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.white,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  checkboxText: {
    fontSize: 15,
    color: colors.text.primary,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    marginTop: -2,
  },
  navText: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 4,
  },
  navTextActive: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default MinerProfileScreen;
