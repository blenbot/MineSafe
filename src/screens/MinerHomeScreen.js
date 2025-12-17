import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/auth/AuthService';
import API_CONFIG from '../config/api';
import colors from '../utils/colors';
import { useTranslation } from '../i18n';

const { width, height } = Dimensions.get('window');

const MinerHomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starVideo, setStarVideo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [userTags, setUserTags] = useState([]);
  
  // Video submission modal state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoLink, setVideoLink] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadUserData();
    loadUserTags();
    fetchStarVideo();
    
    // Entry animation
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
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load user tags for personalized recommendations
   * Tags are used to fetch recommended videos
   */
  const loadUserTags = async () => {
    try {
      // First try from user profile
      const user = await AuthService.getUserData();
      if (user?.tags) {
        setUserTags(user.tags);
        return;
      }
      
      // Fallback to AsyncStorage
      const savedTags = await AsyncStorage.getItem('userTags');
      if (savedTags) {
        setUserTags(JSON.parse(savedTags));
      }
    } catch (error) {
      console.error('Error loading user tags:', error);
    }
  };

  /**
   * Fetch recommended video - gets first playable video from feed
   * Uses /api/videos/feed endpoint and picks first valid video
   */
  const fetchStarVideo = async () => {
    try {
      setVideoLoading(true);
      
      const token = await AuthService.getToken();
      
      if (!token) {
        console.error('❌ No auth token found');
        return;
      }
      
      // Fetch from video feed and get first playable video
      const feedUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIDEOS.FEED}?page=1&limit=10`;
      console.log('🔗 Fetching videos from feed:', feedUrl);
      
      const response = await fetch(feedUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const videos = data.videos || [];
        
        // Find first video that is NOT Pre-Shift Check and has a valid URL
        const validVideo = videos.find(video => {
          const title = (video.title || '').toLowerCase();
          const hasUrl = video.video_url || video.url;
          // Skip any video with "pre" and "shift" in title
          return hasUrl && !title.includes('pre-shift') && !title.includes('pre_shift') && !title.includes('preshift');
        });
        
        if (validVideo) {
          // Map video_url to url if needed
          const mappedVideo = {
            ...validVideo,
            url: validVideo.video_url || validVideo.url,
            tags: validVideo.tags || ['safety'],
            duration: validVideo.duration || '2:30',
          };
          console.log('✅ Found video:', mappedVideo.title);
          setStarVideo(mappedVideo);
        } else {
          console.warn('⚠️ No valid videos found in feed');
        }
      } else {
        console.error('❌ Failed to fetch video feed:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching star video:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      
      // Handle network errors
      if (error.message === 'Network request failed') {
        Alert.alert(
          'Network Error',
          'Could not connect to server. Please check:\n\n' +
          '1. Your internet connection\n' +
          '2. Backend server is running\n' +
          '3. API URL is correct in config\n\n' +
          `Current API URL: ${API_CONFIG?.BASE_URL || 'Not configured'}`,
          [
            { text: 'Retry', onPress: () => fetchStarVideo() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        console.error('❌ Unexpected error:', error);
      }
    } finally {
      setVideoLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadUserData(), loadUserTags(), fetchStarVideo()]);
    setRefreshing(false);
  }, []);

  // Handle video link submission
  const handleSubmitVideoLink = async () => {
    if (!videoTitle.trim()) {
      Alert.alert('Error', 'Please enter a video title');
      return;
    }
    if (!videoLink.trim()) {
      Alert.alert('Error', 'Please enter a video URL');
      return;
    }
    
    // Basic URL validation
    if (!videoLink.startsWith('http://') && !videoLink.startsWith('https://')) {
      Alert.alert('Error', 'Please enter a valid URL starting with http:// or https://');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AuthService.getToken();
      
      const submitData = {
        title: videoTitle.trim(),
        video_url: videoLink.trim(),
        description: videoDescription.trim() || '',
      };

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIDEOS.SUBMIT_LINK}`;
      console.log('📤 Submitting video link:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      console.log('📥 Response:', response.status, result);

      if (response.ok) {
        Alert.alert(
          'Success!',
          'Your video has been submitted for review. A supervisor will approve it soon.',
          [{ text: 'OK' }]
        );
        // Reset form and close modal
        setVideoTitle('');
        setVideoLink('');
        setVideoDescription('');
        setShowVideoModal(false);
      } else {
        throw new Error(result.message || result.error || 'Failed to submit video');
      }
    } catch (error) {
      console.error('Error submitting video:', error);
      Alert.alert('Error', error.message || 'Failed to submit video. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreStartChecklist = () => {
    navigation.navigate('PreStartChecklist');
  };

  const handlePPEChecklist = () => {
    navigation.navigate('PPEChecklist');
  };

  const handleAskDamodar = () => {
    navigation.navigate('DamodarChat');
  };

  const handleReportEmergency = () => {
    navigation.navigate('SOS');
  };

  const handleVideoPress = () => {
    if (starVideo) {
      navigation.navigate('VideoModule', { video: starVideo });
    } else {
      navigation.navigate('VideoModule');
    }
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
            navigation.replace('Login');
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header - Positioned lower with proper spacing */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{t('home.welcomeBack')}</Text>
              <Text style={styles.userName}>{userData?.name || t('common.miner')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={() => navigation.navigate('MinerProfile')}
            >
              <View style={styles.profileCircle}>
                <Icon name="account" size={28} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Top Cards Row */}
          <View style={styles.topCardsRow}>
            {/* Pre-Start Checklist Card */}
            <TouchableOpacity
              style={styles.topCard}
              onPress={handlePreStartChecklist}
              activeOpacity={0.8}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.secondaryLight }]}>
                <Icon name="clipboard-check-outline" size={28} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>{t('home.preStartChecklist')}</Text>
            </TouchableOpacity>

            {/* PPE Checklist Card */}
            <TouchableOpacity
              style={styles.topCard}
              onPress={handlePPEChecklist}
              activeOpacity={0.8}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.secondaryLight }]}>
                <Icon name="shield-account" size={28} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>{t('home.ppeChecklist')}</Text>
            </TouchableOpacity>
          </View>

          {/* Ask Damodar Button - Light Orange Background */}
          <TouchableOpacity
            style={styles.damodarButton}
            onPress={handleAskDamodar}
            activeOpacity={0.8}
          >
            <View style={styles.listButtonLeft}>
              <View style={styles.damodarIconCircle}>
                <Icon name="robot" size={22} color={colors.primary} />
              </View>
              <Text style={styles.damodarButtonText}>{t('home.askDamodar')}</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.primary} />
          </TouchableOpacity>

          {/* Report Emergency Button */}
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleReportEmergency}
            activeOpacity={0.8}
          >
            <View style={styles.listButtonLeft}>
              <View style={styles.emergencyIconCircle}>
                <Icon name="alert-circle" size={22} color={colors.status.danger} />
              </View>
              <Text style={styles.emergencyButtonText}>{t('home.reportEmergency')}</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.status.danger} />
          </TouchableOpacity>

          {/* Featured Video Section - Full Width */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {userTags.length > 0 ? t('home.recommendedForYou') : t('home.todaysSafetyVideo')}
              </Text>
              {userTags.length > 0 && (
                <Text style={styles.sectionSubtitle}>
                  {t('home.basedOnInterests', { interests: userTags.slice(0, 2).join(', ') })}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('VideoModule')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Video Container - Full Width */}
          <TouchableOpacity
            style={styles.videoContainer}
            onPress={handleVideoPress}
            activeOpacity={0.9}
          >
            {videoLoading ? (
              <View style={styles.videoPlaceholder}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading video...</Text>
              </View>
            ) : starVideo ? (
              <View style={styles.videoContent}>
                {/* Video Background Gradient */}
                <View style={styles.videoGradientBg}>
                  <Icon name="play-circle" size={80} color="rgba(255,255,255,0.3)" />
                </View>
                
                {/* Play Button */}
                <View style={styles.playButton}>
                  <Icon name="play" size={40} color={colors.white} />
                </View>
                
                {/* Video Info Overlay */}
                <View style={styles.videoOverlay}>
                  <View style={styles.videoTagsRow}>
                    {starVideo?.tags?.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.videoTag}>
                        <Text style={styles.videoTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {starVideo.title || 'Safety Training Video'}
                  </Text>
                  {starVideo?.description && (
                    <Text style={styles.videoDescription} numberOfLines={1}>
                      {starVideo.description}
                    </Text>
                  )}
                  <View style={styles.videoMeta}>
                    <Icon name="clock-outline" size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.videoMetaText}>
                      {starVideo.duration || 'Watch now'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.noVideoContainer}>
                <View style={styles.noVideoIconCircle}>
                  <Icon name="video-outline" size={40} color={colors.gray[400]} />
                </View>
                <Text style={styles.noVideoTitle}>No Videos Yet</Text>
                <Text style={styles.noVideoText}>
                  Check back later for safety training videos
                </Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={fetchStarVideo}
                >
                  <Icon name="refresh" size={18} color={colors.white} />
                  <Text style={styles.retryButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Floating Action Button - Submit Video */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowVideoModal(true)}
        activeOpacity={0.8}
      >
        <Icon name="plus" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Video Submission Modal */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVideoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Video Link</Text>
              <TouchableOpacity onPress={() => setShowVideoModal(false)}>
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Share a safety training video for review by supervisors
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Video Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., PPE Safety Guidelines"
                placeholderTextColor={colors.gray[400]}
                value={videoTitle}
                onChangeText={setVideoTitle}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Video URL *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor={colors.gray[400]}
                value={videoLink}
                onChangeText={setVideoLink}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Brief description of the video content..."
                placeholderTextColor={colors.gray[400]}
                value={videoDescription}
                onChangeText={setVideoDescription}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitVideoLink}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Icon name="upload" size={20} color={colors.white} />
                  <Text style={styles.submitButtonText}>Submit for Review</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="home" size={24} color={colors.primary} />
          <Text style={styles.navTextActive}>Home</Text>
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

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('MinerProfile')}
        >
          <Icon name="account-outline" size={24} color={colors.gray[400]} />
          <Text style={styles.navText}>Profile</Text>
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
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  profileButton: {
    marginTop: 4,
  },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  topCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 16,
  },
  topCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  damodarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondaryLight,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.secondaryDark,
  },
  damodarIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  damodarButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 14,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5F5',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  emergencyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE6E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.status.danger,
    marginLeft: 14,
  },
  listButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  videoContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    height: height * 0.28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContent: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoGradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    opacity: 0.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  videoTagsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 6,
  },
  videoTag: {
    backgroundColor: 'rgba(255, 107, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  videoTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  noVideoContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    padding: 20,
  },
  noVideoIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noVideoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  noVideoText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
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
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 100,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MinerHomeScreen;