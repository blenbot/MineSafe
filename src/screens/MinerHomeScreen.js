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
   * Fetch recommended video based on user tags
   * Backend endpoint: GET /api/videos/recommended?tags=PPE,safety
   * Fallback: GET /api/modules/star
   */
  const fetchStarVideo = async () => {
    try {
      setVideoLoading(true);
      
      // Get authentication token
      const token = await AuthService.getToken();
      
      if (!token) {
        console.error('❌ No auth token found');
        Alert.alert(
          'Authentication Error',
          'Please log in again.',
          [{ text: 'OK', onPress: () => navigation.replace('Login') }]
        );
        return;
      }
      
      console.log('✅ Token retrieved successfully');
      
      // Get user tags for recommendations
      const savedTags = await AsyncStorage.getItem('userTags');
      const tags = savedTags ? JSON.parse(savedTags) : [];
      const tagsQuery = tags.length > 0 ? `?tags=${tags.join(',')}` : '';
      
      console.log('📋 User tags:', tags);
      
      // Verify API_CONFIG is properly defined
      if (!API_CONFIG?.BASE_URL) {
        console.error('❌ API_CONFIG.BASE_URL is not defined');
        Alert.alert('Configuration Error', 'API configuration is missing. Please check your config file.');
        return;
      }
      
      if (!API_CONFIG?.ENDPOINTS?.VIDEOS?.RECOMMENDED || !API_CONFIG?.ENDPOINTS?.MODULES?.STAR) {
        console.error('❌ API endpoints are not properly configured');
        Alert.alert('Configuration Error', 'API endpoints are not configured properly.');
        return;
      }
      
      // Construct full URL for recommended videos
      const recommendedUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIDEOS.RECOMMENDED}${tagsQuery}`;
      console.log('🔗 Fetching recommended video from:', recommendedUrl);
      
      // Try recommended endpoint first
      let response = await fetch(recommendedUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Recommended endpoint response status:', response.status);
      
      // Fallback to star video endpoint if recommended fails
      if (!response.ok) {
        const starUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MODULES.STAR}`;
        console.log('⚠️ Recommended endpoint failed, falling back to:', starUrl);
        
        response = await fetch(starUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📡 Star endpoint response status:', response.status);
      }
      
      // Process successful response
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Video data received:', data);
        
        // Map video_url to url if needed
        if (data.video_url && !data.url) {
          data.url = data.video_url;
        }
        
        setStarVideo(data);
      } else {
        // Log detailed error information
        const errorText = await response.text();
        console.error('❌ API Error - Status:', response.status);
        console.error('❌ API Error - Response:', errorText);
        
        // Handle specific error codes
        if (response.status === 401) {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please log in again.',
            [{ text: 'OK', onPress: () => navigation.replace('Login') }]
          );
        } else if (response.status === 404) {
          console.warn('⚠️ No videos available from backend');
          // Don't show alert, just continue without video
        } else if (response.status >= 500) {
          Alert.alert(
            'Server Error',
            'The server is experiencing issues. Please try again later.',
            [{ text: 'OK' }]
          );
        }
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
              <View style={styles.videoPlaceholder}>
                {/* PLACEHOLDER: Video thumbnail or player component */}
                {/* Required: react-native-video package for video playback */}
                {/* Backend Endpoint: GET /api/modules/star - returns featured video */}
                <View style={styles.playButton}>
                  <Icon name="play" size={40} color={colors.white} />
                </View>
                {starVideo?.title && (
                  <View style={styles.videoOverlay}>
                    <Text style={styles.videoTitle} numberOfLines={2}>
                      {starVideo.title}
                    </Text>
                    {starVideo?.description && (
                      <Text style={styles.videoDescription} numberOfLines={1}>
                        {starVideo.description}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.videoPlaceholder}>
                <Icon name="video-off" size={60} color={colors.gray[400]} />
                <Text style={styles.noVideoText}>No video available</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={fetchStarVideo}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

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
    marginHorizontal: 0,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#D8D8E8',
    height: height * 0.42,
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D8D8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  videoDescription: {
    fontSize: 12,
    color: colors.white,
    marginTop: 4,
    opacity: 0.9,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
  noVideoText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
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
});

export default MinerHomeScreen;