/**
 * VideoModuleScreen.js
 * TikTok/Reels style video feed for safety training
 * 
 * Features:
 * - Vertical swipeable video feed (like TikTok/Reels)
 * - Like/Dislike buttons with response tracking
 * - Damodar icon to ask questions about current video
 * - Tag-based video recommendations
 * - Video progress indicator
 * 
 * BACKEND REQUIREMENTS:
 * - GET /api/videos/feed - Get paginated video feed
 *   Query params: ?page=1&limit=10&tags=HEMI,safety
 *   Response: { videos: [{id, title, url, thumbnail, tags, likes, duration}], hasMore }
 * 
 * - POST /api/videos/:id/like - Like a video
 * - POST /api/videos/:id/dislike - Dislike a video
 * - GET /api/videos/recommendations - Get personalized recommendations based on tags
 * 
 * VIDEO PLAYER:
 * - Required: react-native-video for actual video playback
 * - Currently using placeholder with play button
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthService from '../services/auth/AuthService';
import API_CONFIG from '../config/api';
import colors from '../utils/colors';

const { width, height } = Dimensions.get('window');
const VIDEO_HEIGHT = height - 160; // Account for header and bottom nav

const VideoModuleScreen = ({ navigation }) => {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userTags, setUserTags] = useState(['safety', 'PPE']); // User's preferred tags
  const [likedVideos, setLikedVideos] = useState(new Set());
  const [dislikedVideos, setDislikedVideos] = useState(new Set());
  
  const flatListRef = useRef(null);
  const currentVideoRef = useRef(null);

  // Animation refs for like/dislike buttons
  const likeScale = useRef(new Animated.Value(1)).current;
  const dislikeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchVideos();
  }, []);

  /**
   * Fetch videos from backend
   * Videos are ranked based on user's tags for personalized recommendations
   * Backend response: { videos: [{id, title, video_url, thumbnail, tags, likes, dislikes, duration, author}], has_more: bool, total: int }
   */
  const fetchVideos = async (page = 1) => {
    try {
      setLoading(true);
      const token = await AuthService.getToken();
      
      // Backend endpoint: GET /api/videos/feed?page=1&limit=10&tags=safety,PPE
      const tagsQuery = userTags.join(',');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIDEOS.FEED}?page=${page}&limit=10&tags=${tagsQuery}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Map backend field names to frontend expected names
        const mappedVideos = (data.videos || []).map(video => ({
          ...video,
          url: video.video_url || video.url,
          likes: video.likes || 0,
          dislikes: video.dislikes || 0,
          tags: video.tags || [],
          author: video.author || 'Safety Team',
          duration: video.duration || '0:00',
        }));
        
        if (page === 1) {
          setVideos(mappedVideos);
        } else {
          setVideos(prev => [...prev, ...mappedVideos]);
        }
        setHasMore(data.has_more ?? data.hasMore ?? false);
      } else {
        if (page === 1) {
          setVideos([]);
        }
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      if (page === 1) {
        setVideos([]);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle like action
   * Sends request to backend and updates local state
   */
  const handleLike = async (videoId) => {
    // Animate button
    Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likeScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Toggle like state
    const newLikedVideos = new Set(likedVideos);
    const newDislikedVideos = new Set(dislikedVideos);
    
    if (newLikedVideos.has(videoId)) {
      newLikedVideos.delete(videoId);
    } else {
      newLikedVideos.add(videoId);
      newDislikedVideos.delete(videoId); // Remove dislike if exists
    }
    
    setLikedVideos(newLikedVideos);
    setDislikedVideos(newDislikedVideos);

    // Update video likes count locally
    setVideos(prev => prev.map(v => {
      if (v.id === videoId) {
        const wasLiked = likedVideos.has(videoId);
        const wasDisliked = dislikedVideos.has(videoId);
        return {
          ...v,
          likes: wasLiked ? v.likes - 1 : v.likes + 1,
          dislikes: wasDisliked ? v.dislikes - 1 : v.dislikes,
        };
      }
      return v;
    }));

    // Backend endpoint: POST /api/videos/:id/like
    try {
      const token = await AuthService.getToken();
      const endpoint = API_CONFIG.ENDPOINTS.VIDEOS.LIKE.replace(':id', videoId);
      await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  /**
   * Handle dislike action
   */
  const handleDislike = async (videoId) => {
    // Animate button
    Animated.sequence([
      Animated.timing(dislikeScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(dislikeScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Toggle dislike state
    const newDislikedVideos = new Set(dislikedVideos);
    const newLikedVideos = new Set(likedVideos);
    
    if (newDislikedVideos.has(videoId)) {
      newDislikedVideos.delete(videoId);
    } else {
      newDislikedVideos.add(videoId);
      newLikedVideos.delete(videoId); // Remove like if exists
    }
    
    setDislikedVideos(newDislikedVideos);
    setLikedVideos(newLikedVideos);

    // Update video dislikes count locally
    setVideos(prev => prev.map(v => {
      if (v.id === videoId) {
        const wasDisliked = dislikedVideos.has(videoId);
        const wasLiked = likedVideos.has(videoId);
        return {
          ...v,
          dislikes: wasDisliked ? v.dislikes - 1 : v.dislikes + 1,
          likes: wasLiked ? v.likes - 1 : v.likes,
        };
      }
      return v;
    }));

    // Backend endpoint: POST /api/videos/:id/dislike
    try {
      const token = await AuthService.getToken();
      const endpoint = API_CONFIG.ENDPOINTS.VIDEOS.DISLIKE.replace(':id', videoId);
      await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error disliking video:', error);
    }
  };

  /**
   * Navigate to Damodar chat with video context
   * Allows user to ask questions about the current video
   */
  const handleAskDamodar = (video) => {
    navigation.navigate('DamodarChat', {
      videoContext: {
        id: video.id,
        title: video.title,
        description: video.description,
        tags: video.tags,
      },
    });
  };

  /**
   * Handle quiz navigation - Navigate to quiz for this video
   * Passes videoTitle so TrainingQuizScreen can fetch quiz by title
   */
  const handleQuiz = (video) => {
    navigation.navigate('TrainingQuiz', {
      videoTitle: video.title, // Pass video title for quiz lookup
      tags: video.tags,
    });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const loadMoreVideos = () => {
    if (!loading && hasMore) {
      const nextPage = Math.ceil(videos.length / 10) + 1;
      fetchVideos(nextPage);
    }
  };

  const renderVideoItem = ({ item, index }) => {
    const isLiked = likedVideos.has(item.id);
    const isDisliked = dislikedVideos.has(item.id);
    const isCurrentVideo = index === currentIndex;
    const isLastVideo = index === videos.length - 1;

    return (
      <View style={styles.videoItemContainer}>
        {/* Video Player Area */}
        <View style={styles.videoPlayer}>
          <View style={styles.videoPlaceholder}>
            {/* Play button */}
            <TouchableOpacity style={styles.playButtonLarge}>
              <Icon name="play" size={48} color={colors.white} />
            </TouchableOpacity>

            {/* Duration badge */}
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{item.duration}</Text>
            </View>
          </View>
        </View>

        {/* Right side: Action Buttons - positioned absolutely on the right */}
        <View style={styles.actionButtonsContainer}>
          {/* Like Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Icon 
                name={isLiked ? "thumb-up" : "thumb-up-outline"} 
                size={28} 
                color={isLiked ? colors.primary : colors.white} 
              />
            </Animated.View>
            <Text style={[styles.actionCount, isLiked && styles.actionCountActive]}>
              {item.likes}
            </Text>
          </TouchableOpacity>

          {/* Dislike Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDislike(item.id)}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: dislikeScale }] }}>
              <Icon 
                name={isDisliked ? "thumb-down" : "thumb-down-outline"} 
                size={28} 
                color={isDisliked ? colors.status.danger : colors.white} 
              />
            </Animated.View>
            <Text style={[styles.actionCount, isDisliked && styles.actionCountDislike]}>
              {item.dislikes}
            </Text>
          </TouchableOpacity>

          {/* Ask Damodar Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleAskDamodar(item)}
            activeOpacity={0.7}
          >
            <View style={styles.damodarButton}>
              <Icon name="robot" size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Ask</Text>
          </TouchableOpacity>

          {/* Quiz Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleQuiz(item)}
            activeOpacity={0.7}
          >
            <View style={styles.quizButton}>
              <Icon name="trophy" size={22} color={colors.white} />
            </View>
            <Text style={styles.actionLabel}>Quiz</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom: Video Info - text only */}
        <View style={styles.videoInfoBottom}>
          <Text style={styles.videoAuthor}>@{item.author}</Text>
          <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
          
          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag, idx) => (
                <View key={idx} style={styles.tagBadge}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Swipe indicator */}
          {!isLastVideo && (
            <View style={styles.swipeIndicator}>
              <Icon name="chevron-up" size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.swipeText}>Swipe for more</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Empty state when no videos
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="video-off-outline" size={80} color={colors.gray[600]} />
      <Text style={styles.emptyTitle}>No Videos Available</Text>
      <Text style={styles.emptyText}>Check back later for new safety training videos</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => fetchVideos(1)}
      >
        <Icon name="refresh" size={20} color={colors.white} />
        <Text style={styles.retryButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Safety Videos</Text>
        
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => fetchVideos(1)}
        >
          <Icon name="refresh" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading && videos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : videos.length === 0 ? (
        /* Empty State */
        renderEmptyState()
      ) : (
        /* Video Feed */
        <FlatList
          ref={flatListRef}
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id?.toString()}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={VIDEO_HEIGHT}
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={loadMoreVideos}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && videos.length > 0 && (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )
          }
        />
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('MinerHome')}
        >
          <Icon name="home-outline" size={24} color={colors.gray[400]} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="play-circle" size={24} color={colors.primary} />
          <Text style={styles.navTextActive}>Video</Text>
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
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  searchButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoItemContainer: {
    width: width,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionCount: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  actionCountActive: {
    color: colors.primary,
  },
  actionCountDislike: {
    color: colors.status.danger,
  },
  actionLabel: {
    color: colors.white,
    fontSize: 10,
    marginTop: 2,
  },
  damodarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  quizButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  videoInfoBottom: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 70,
  },
  videoAuthor: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  videoTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  swipeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  swipeText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.white,
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: colors.gray[400],
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingFooter: {
    height: VIDEO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
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

export default VideoModuleScreen;
