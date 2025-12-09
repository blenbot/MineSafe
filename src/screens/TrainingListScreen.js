/**
 * TrainingListScreen.js
 * Shows list of available training quizzes fetched from API
 * 
 * API: GET /api/training/quizzes - Returns all quizzes with completion status
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthService from '../services/auth/AuthService';
import API_CONFIG from '../config/api';
import colors from '../utils/colors';

const TrainingListScreen = ({ navigation, route }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // If coming from video module with specific quiz, navigate directly
  useEffect(() => {
    if (route?.params?.videoTitle) {
      // Direct navigation to quiz from video module
      navigation.replace('TrainingQuiz', {
        videoTitle: route.params.videoTitle,
        tags: route.params.tags,
      });
    } else {
      fetchQuizzes();
    }
  }, [route?.params?.videoTitle]);

  /**
   * Fetch quizzes from API
   * GET /api/training/quizzes
   * Response: [{ id, title, video_name, num_questions, completed, score, tags }]
   */
  const fetchQuizzes = async () => {
    try {
      setError(null);
      const token = await AuthService.getToken();
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRAINING.QUIZ_LIST}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Handle both array response and object with quizzes property
        const quizList = Array.isArray(data) ? data : (data.quizzes || []);
        setQuizzes(quizList);
      } else {
        setError('Failed to load quizzes');
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchQuizzes();
  }, []);

  const handleQuizPress = (quiz) => {
    navigation.navigate('TrainingQuiz', {
      videoTitle: quiz.video_name || quiz.title,
      quizId: quiz.id,
      tags: quiz.tags,
    });
  };

  const renderQuizItem = ({ item, index }) => {
    const isCompleted = item.completed || false;
    const score = item.score || 0;
    const totalQuestions = item.num_questions || 0;
    
    return (
      <TouchableOpacity
        style={styles.quizCard}
        onPress={() => handleQuizPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.quizIconContainer}>
          <View style={[
            styles.quizIcon,
            isCompleted && styles.quizIconCompleted
          ]}>
            <Icon 
              name={isCompleted ? "check-circle" : "school"} 
              size={28} 
              color={isCompleted ? colors.status.success : colors.primary} 
            />
          </View>
          <Text style={styles.quizNumber}>#{index + 1}</Text>
        </View>

        <View style={styles.quizInfo}>
          <Text style={styles.quizTitle} numberOfLines={2}>
            {item.title || item.video_name || 'Untitled Quiz'}
          </Text>
          
          {item.video_name && item.title !== item.video_name && (
            <Text style={styles.quizVideoName} numberOfLines={1}>
              Video: {item.video_name}
            </Text>
          )}
          
          <View style={styles.quizMeta}>
            <View style={styles.metaItem}>
              <Icon name="help-circle-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.metaText}>{totalQuestions} Questions</Text>
            </View>
            
            {isCompleted && (
              <View style={styles.metaItem}>
                <Icon name="trophy" size={16} color={colors.status.warning} />
                <Text style={styles.metaText}>Score: {score}%</Text>
              </View>
            )}
          </View>

          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag, idx) => (
                <View key={idx} style={styles.tagBadge}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.quizAction}>
          <Icon 
            name="chevron-right" 
            size={24} 
            color={colors.gray[400]} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="school-outline" size={80} color={colors.gray[300]} />
      <Text style={styles.emptyTitle}>No Quizzes Available</Text>
      <Text style={styles.emptyText}>
        Check back later for new training quizzes
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={fetchQuizzes}
      >
        <Icon name="refresh" size={20} color={colors.white} />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="alert-circle-outline" size={80} color={colors.status.danger} />
      <Text style={styles.emptyTitle}>Error Loading Quizzes</Text>
      <Text style={styles.emptyText}>{error}</Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={fetchQuizzes}
      >
        <Icon name="refresh" size={20} color={colors.white} />
        <Text style={styles.refreshButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Training Quizzes</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading quizzes...</Text>
        </View>
      ) : error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={quizzes}
          renderItem={renderQuizItem}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={[
            styles.listContainer,
            quizzes.length === 0 && styles.listContainerEmpty
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
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

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('VideoModule')}
        >
          <Icon name="play-circle-outline" size={24} color={colors.gray[400]} />
          <Text style={styles.navText}>Video</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="school" size={24} color={colors.primary} />
          <Text style={styles.navTextActive}>Training</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  listContainerEmpty: {
    flex: 1,
  },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quizIconContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  quizIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight || '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizIconCompleted: {
    backgroundColor: '#E8F5E9',
  },
  quizNumber: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  quizVideoName: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  quizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    backgroundColor: colors.primaryLight || '#FFF3E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '500',
  },
  quizAction: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
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

export default TrainingListScreen;
