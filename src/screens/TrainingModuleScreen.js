// src/screens/TrainingModuleScreen.js

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

const TrainingModuleScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Training Module</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Module Header */}
        <View style={styles.moduleHeader}>
          <Text style={styles.moduleTitle}>PPE Awareness</Text>
          
          <View style={styles.videoContainer}>
            <Image 
              source={{ uri: 'https://placeholder.com/300x200' }}
              style={styles.videoThumbnail}
            />
            <TouchableOpacity style={styles.playButton}>
              <Icon name="play" size={40} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Module Progress</Text>
            <Text style={styles.progressValue}>60%</Text>
          </View>
          <Text style={styles.lessonsCompleted}>3 of 5 lessons completed</Text>
        </View>

        {/* Lesson Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lesson Overview</Text>
          <Text style={styles.overviewText}>
            This module covers the importance of Personal Protective Equipment (PPE) in mining environments. Learn about different types of PPE, proper usage, and maintenance.
          </Text>

          <View style={styles.topicList}>
            <View style={styles.topicItem}>
              <View style={styles.topicDot} />
              <Text style={styles.topicText}>Types of PPE</Text>
            </View>
            <View style={styles.topicItem}>
              <View style={styles.topicDot} />
              <Text style={styles.topicText}>Proper Usage</Text>
            </View>
            <View style={styles.topicItem}>
              <View style={styles.topicDot} />
              <Text style={styles.topicText}>Maintenance</Text>
            </View>
          </View>
        </View>

        {/* Certificate */}
        <View style={styles.certificateCard}>
          <Icon name="medal" size={40} color={colors.badge.gold} />
          <View style={styles.certificateInfo}>
            <Text style={styles.certificateTitle}>PPE Certified</Text>
            <Text style={styles.certificateText}>You've completed the quiz.</Text>
          </View>
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
        </View>

        {/* Quiz Card */}
        <View style={styles.quizCard}>
          <Image 
            source={{ uri: 'https://placeholder.com/300x150' }}
            style={styles.quizImage}
          />
          <View style={styles.quizOverlay}>
            <Text style={styles.quizTitle}>Take 3-question quiz</Text>
            <Text style={styles.quizSubtitle}>Test your knowledge</Text>
            <TouchableOpacity style={styles.startQuizButton}>
              <Text style={styles.startQuizButtonText}>Start Quiz</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mark as Completed */}
        <TouchableOpacity style={styles.completeButton}>
          <Text style={styles.completeButtonText}>Mark as Completed</Text>
        </TouchableOpacity>
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
    backgroundColor: '#2C2416',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  moduleHeader: {
    backgroundColor: '#2C2416',
    padding: 20,
    paddingBottom: 30,
  },
  moduleTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 20,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[400],
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  lessonsCompleted: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    backgroundColor: colors.white,
    padding: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  topicList: {
    gap: 12,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  topicText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  certificateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  certificateInfo: {
    flex: 1,
  },
  certificateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  certificateText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  viewButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.secondaryLight,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  quizCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    position: 'relative',
  },
  quizImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[400],
  },
  quizOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  quizSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  startQuizButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startQuizButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TrainingModuleScreen;