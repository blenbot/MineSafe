/**
 * TrainingQuizScreen.js
 * Interactive quiz screen with mascot reactions
 * 
 * Features:
 * - Multiple choice questions
 * - Animated mascot reactions (hooray, ow-ow, awesome)
 * - Progress tracking
 * - Sound effects (placeholder)
 * - Audio question playback (placeholder)
 * 
 * BACKEND REQUIREMENTS:
 * - GET /api/training/quiz/:moduleId - Get quiz questions
 * - POST /api/training/quiz/submit - Submit quiz answers
 *   Request: { quiz_id, answers: [{question_id, answer_index}], user_id }
 *   Response: { score, total, passed, badge_earned? }
 * 
 * MASCOT GIF PLACEHOLDERS:
 * - assets/mascot/hooray.gif - Correct answer celebration
 * - assets/mascot/ow-ow.gif - Wrong answer reaction
 * - assets/mascot/awesome.gif - Quiz completion celebration
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
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthService from '../services/auth/AuthService';
import API_CONFIG from '../config/api';
import colors from '../utils/colors';

const { width, height } = Dimensions.get('window');

// Sample quiz data - Will be fetched from backend
const SAMPLE_QUIZ_DATA = [
  {
    id: 1,
    question: 'What is the first step you should take when assessing an accident scene in the mine?',
    options: [
      'Secure the area and ensure safety',
      'Take photographs immediately',
      'Interview witnesses',
      'Call management first'
    ],
    correctAnswer: 0,
    tip: 'Remember to follow DGMS guidelines while assessing accidents.'
  },
  {
    id: 2,
    question: 'How often should you inspect your PPE equipment?',
    options: [
      'Once a month',
      'Before every shift',
      'Once a week',
      'When it looks damaged'
    ],
    correctAnswer: 1,
    tip: 'Regular PPE inspection ensures your safety at all times.'
  },
  {
    id: 3,
    question: 'What is the maximum permissible noise level in mining areas?',
    options: [
      '85 dB',
      '90 dB',
      '95 dB',
      '100 dB'
    ],
    correctAnswer: 1,
    tip: 'Noise levels above 90 dB require mandatory ear protection.'
  },
  {
    id: 4,
    question: 'In case of a fire emergency underground, which direction should you move?',
    options: [
      'Towards the fire to assess',
      'Against the air current',
      'With the air current',
      'Stay in place'
    ],
    correctAnswer: 1,
    tip: 'Moving against air current keeps you away from smoke and toxic gases.'
  },
  {
    id: 5,
    question: 'What is the primary purpose of a refuge chamber?',
    options: [
      'Storage of equipment',
      'Emergency shelter during incidents',
      'Break room for miners',
      'Tool maintenance area'
    ],
    correctAnswer: 1,
    tip: 'Refuge chambers are designed for emergency situations underground.'
  }
];

// Mascot reaction types
const MASCOT_REACTIONS = {
  IDLE: 'idle',
  HOORAY: 'hooray',      // Correct answer
  OW_OW: 'ow_ow',        // Wrong answer
  AWESOME: 'awesome',    // Quiz complete
};

const TrainingQuizScreen = ({ navigation, route }) => {
  // Now uses videoTitle instead of moduleId for quiz lookup
  const videoTitle = route?.params?.videoTitle;
  const moduleId = route?.params?.moduleId; // Legacy support
  
  const [quizData, setQuizData] = useState(SAMPLE_QUIZ_DATA);
  const [quizTitle, setQuizTitle] = useState('');
  const [videoName, setVideoName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [mascotReaction, setMascotReaction] = useState(MASCOT_REACTIONS.IDLE);
  const [showReaction, setShowReaction] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const mascotScale = useRef(new Animated.Value(1)).current;
  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: ((currentQuestion + 1) / quizData.length) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentQuestion]);

  useEffect(() => {
    // Fetch quiz from backend if videoTitle or moduleId provided
    if (videoTitle || moduleId) {
      fetchQuizData();
    }
  }, [videoTitle, moduleId]);

  /**
   * Fetch quiz from backend
   * Primary: GET /api/training/quiz?title={videoTitle}
   * Response format: { title, num_questions, video_name, questions: [{question, options, correct, tags}] }
   */
  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const token = await AuthService.getToken();
      
      // Use videoTitle for query param (primary), fallback to moduleId for legacy
      const queryParam = videoTitle 
        ? `?title=${encodeURIComponent(videoTitle)}`
        : `?moduleId=${moduleId}`;
      
      // Backend endpoint: GET /api/training/quiz?title={videoTitle}
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRAINING.QUIZ_BY_TITLE}${queryParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        /*
         * Expected response format:
         * {
         *   title: "PPE Inspection Quiz",
         *   num_questions: 5,
         *   video_name: "PPE Inspection: How to Check Your Safety Helmet",
         *   questions: [
         *     {
         *       question: "What is the first step?",
         *       options: ["Option A", "Option B", "Option C", "Option D"],
         *       correct: 0,  // Index of correct answer
         *       tags: ["PPE", "safety"]
         *     },
         *     ...
         *   ]
         * }
         */
        setQuizTitle(data.title || 'Safety Quiz');
        setVideoName(data.video_name || videoTitle || '');
        
        // Transform backend format to component format
        const transformedQuestions = (data.questions || []).map((q, idx) => ({
          id: idx + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correct, // correct is the index
          tags: q.tags || [],
          tip: q.tip || 'Stay safe and follow guidelines!',
        }));
        
        if (transformedQuestions.length > 0) {
          setQuizData(transformedQuestions);
        }
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      // Use sample data as fallback
    } finally {
      setLoading(false);
    }
  };

  const showMascotReaction = (reaction) => {
    setMascotReaction(reaction);
    setShowReaction(true);
    
    // Animate mascot appearance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(mascotOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(mascotScale, {
          toValue: 1.1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(mascotScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide after 1.5 seconds
    setTimeout(() => {
      Animated.timing(mascotOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowReaction(false);
      });
    }, 1500);
  };

  const handleOptionSelect = (optionIndex) => {
    if (selectedOption !== null) return;

    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === quizData[currentQuestion].correctAnswer;

    if (isCorrect) {
      setCorrectAnswers(correctAnswers + 1);
      showMascotReaction(MASCOT_REACTIONS.HOORAY);
      // PLACEHOLDER: Play success sound
      // require('react-native-sound-player').playSoundFile('correct', 'mp3');
    } else {
      showMascotReaction(MASCOT_REACTIONS.OW_OW);
      // PLACEHOLDER: Play wrong sound
      // require('react-native-sound-player').playSoundFile('wrong', 'mp3');
    }

    // Move to next question after delay
    setTimeout(() => {
      if (currentQuestion < quizData.length - 1) {
        moveToNextQuestion();
      } else {
        showMascotReaction(MASCOT_REACTIONS.AWESOME);
        setTimeout(() => {
          setShowResult(true);
          submitQuizResults();
        }, 1500);
      }
    }, 2000);
  };

  const moveToNextQuestion = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const submitQuizResults = async () => {
    try {
      const token = await AuthService.getToken();
      const userData = await AuthService.getUserData();
      
      // PLACEHOLDER API CALL
      // Backend endpoint: POST /api/training/quiz/submit
      await fetch(`${API_CONFIG.BASE_URL}/api/training/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          quiz_id: moduleId || 'sample',
          user_id: userData?.user_id,
          score: correctAnswers,
          total: quizData.length,
          completed_at: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const handlePlayAudio = () => {
    // PLACEHOLDER: Audio playback for question
    // Required: react-native-sound or expo-av
    // This would read the question aloud for accessibility
    console.log('Play audio - Requires react-native-sound or expo-av');
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setCorrectAnswers(0);
    setShowResult(false);
    setMascotReaction(MASCOT_REACTIONS.IDLE);
  };

  const getOptionStyle = (optionIndex) => {
    if (selectedOption === null) return styles.optionButton;
    
    const correctAnswer = quizData[currentQuestion].correctAnswer;
    
    if (optionIndex === correctAnswer) {
      return [styles.optionButton, styles.correctOption];
    }
    if (optionIndex === selectedOption && optionIndex !== correctAnswer) {
      return [styles.optionButton, styles.wrongOption];
    }
    return [styles.optionButton, styles.disabledOption];
  };

  const getMascotEmoji = () => {
    switch (mascotReaction) {
      case MASCOT_REACTIONS.HOORAY:
        return '🎉';
      case MASCOT_REACTIONS.OW_OW:
        return '😰';
      case MASCOT_REACTIONS.AWESOME:
        return '🏆';
      default:
        return '👷';
    }
  };

  const getMascotMessage = () => {
    switch (mascotReaction) {
      case MASCOT_REACTIONS.HOORAY:
        return 'Hooray! Great job! 🎉';
      case MASCOT_REACTIONS.OW_OW:
        return 'Ow-ow! Try again next time!';
      case MASCOT_REACTIONS.AWESOME:
        return 'Awesome! Quiz Complete! 🏆';
      default:
        return '';
    }
  };

  // Result Screen
  if (showResult) {
    const percentage = Math.round((correctAnswers / quizData.length) * 100);
    const passed = percentage >= 60;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        
        <View style={styles.resultContainer}>
          {/* PLACEHOLDER: Mascot celebration GIF */}
          {/* <Image source={require('../assets/mascot/awesome.gif')} style={styles.mascotGif} /> */}
          <View style={styles.resultMascot}>
            <Text style={styles.resultMascotEmoji}>🏆</Text>
          </View>

          <Text style={styles.resultTitle}>
            {passed ? 'Congratulations! 🎉' : 'Keep Learning! 📚'}
          </Text>
          
          <Text style={styles.resultScore}>
            Your Score: {correctAnswers} / {quizData.length}
          </Text>
          
          <View style={styles.percentageCircle}>
            <Text style={[styles.resultPercentage, !passed && styles.resultPercentageFailed]}>
              {percentage}%
            </Text>
          </View>
          
          <Text style={styles.resultMessage}>
            {passed 
              ? 'You have passed the safety training quiz!' 
              : 'Don\'t worry! Review the material and try again.'
            }
          </Text>
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={restartQuiz}
            activeOpacity={0.8}
          >
            <Icon name="restart" size={22} color={colors.white} />
            <Text style={styles.primaryButtonText}>Restart Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="home-outline" size={22} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progress = ((currentQuestion + 1) / quizData.length) * 100;

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
        <Text style={styles.headerTitle}>Training Quiz</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {currentQuestion + 1} of {quizData.length}
          </Text>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                })}
              ]} 
            />
          </View>
          <Text style={styles.scoreText}>
            Score: {correctAnswers}/{currentQuestion + (selectedOption !== null ? 1 : 0)}
          </Text>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Damodar's Tip Card */}
          <View style={styles.tipCard}>
            <View style={styles.tipContent}>
              {/* PLACEHOLDER: Damodar mascot image */}
              {/* <Image source={require('../assets/damodar-avatar.png')} style={styles.damodarImage} /> */}
              <View style={styles.damodarPlaceholder}>
                <Icon name="account-hard-hat" size={36} color={colors.primary} />
              </View>

              <View style={styles.tipTextContainer}>
                <Text style={styles.tipTitle}>Damodar's Tips</Text>
                <Text style={styles.tipDescription}>
                  {quizData[currentQuestion].tip}
                </Text>
              </View>
            </View>
          </View>

          {/* Question Section */}
          <View style={styles.questionSection}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionLabel}>Question</Text>
              {/* Audio Button - Accessibility Feature */}
              <TouchableOpacity 
                style={styles.audioButton}
                onPress={handlePlayAudio}
              >
                <Icon name="volume-high" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.questionText}>
              {quizData[currentQuestion].question}
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {quizData[currentQuestion].options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={getOptionStyle(index)}
                onPress={() => handleOptionSelect(index)}
                disabled={selectedOption !== null}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.optionIndicator,
                  selectedOption !== null && index === quizData[currentQuestion].correctAnswer && styles.optionIndicatorCorrect,
                  selectedOption === index && index !== quizData[currentQuestion].correctAnswer && styles.optionIndicatorWrong,
                ]}>
                  <Text style={styles.optionLetter}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={[
                  styles.optionText,
                  selectedOption !== null && index === quizData[currentQuestion].correctAnswer && styles.optionTextCorrect,
                  selectedOption === index && index !== quizData[currentQuestion].correctAnswer && styles.optionTextWrong,
                ]}>
                  {option}
                </Text>
                {selectedOption !== null && index === quizData[currentQuestion].correctAnswer && (
                  <Icon name="check-circle" size={24} color={colors.status.success} />
                )}
                {selectedOption === index && index !== quizData[currentQuestion].correctAnswer && (
                  <Icon name="close-circle" size={24} color={colors.status.danger} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Mascot Reaction Overlay */}
      {showReaction && (
        <Animated.View 
          style={[
            styles.mascotOverlay,
            {
              opacity: mascotOpacity,
              transform: [{ scale: mascotScale }],
            }
          ]}
        >
          {/* PLACEHOLDER: GIF Images for mascot reactions */}
          {/* 
            REQUIRED ASSETS:
            - assets/mascot/hooray.gif - Celebration for correct answer
            - assets/mascot/ow-ow.gif - Sympathy for wrong answer  
            - assets/mascot/awesome.gif - Big celebration for quiz completion
            
            Example usage with actual GIFs:
            <Image 
              source={
                mascotReaction === MASCOT_REACTIONS.HOORAY 
                  ? require('../assets/mascot/hooray.gif')
                  : mascotReaction === MASCOT_REACTIONS.OW_OW
                  ? require('../assets/mascot/ow-ow.gif')
                  : require('../assets/mascot/awesome.gif')
              } 
              style={styles.mascotGif}
            />
          */}
          <View style={[
            styles.mascotReactionBubble,
            mascotReaction === MASCOT_REACTIONS.HOORAY && styles.mascotBubbleSuccess,
            mascotReaction === MASCOT_REACTIONS.OW_OW && styles.mascotBubbleError,
            mascotReaction === MASCOT_REACTIONS.AWESOME && styles.mascotBubbleAwesome,
          ]}>
            <Text style={styles.mascotEmoji}>{getMascotEmoji()}</Text>
            <Text style={styles.mascotMessage}>{getMascotMessage()}</Text>
          </View>
        </Animated.View>
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

        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => navigation.navigate('TrainingList')}
        >
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 8,
    fontWeight: '600',
  },
  tipCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  damodarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  questionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionLabel: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    lineHeight: 26,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  correctOption: {
    borderColor: colors.status.success,
    backgroundColor: colors.status.successLight,
  },
  wrongOption: {
    borderColor: colors.status.danger,
    backgroundColor: colors.status.dangerLight,
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionIndicatorCorrect: {
    backgroundColor: colors.status.success,
  },
  optionIndicatorWrong: {
    backgroundColor: colors.status.danger,
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 22,
  },
  optionTextCorrect: {
    color: colors.status.success,
    fontWeight: '600',
  },
  optionTextWrong: {
    color: colors.status.danger,
  },
  // Mascot Overlay
  mascotOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  mascotReactionBubble: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  mascotBubbleSuccess: {
    borderWidth: 3,
    borderColor: colors.status.success,
  },
  mascotBubbleError: {
    borderWidth: 3,
    borderColor: colors.status.danger,
  },
  mascotBubbleAwesome: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  mascotEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  mascotMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  // Result Screen
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  resultMascot: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resultMascotEmoji: {
    fontSize: 64,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  resultScore: {
    fontSize: 18,
    color: colors.text.secondary,
    marginBottom: 24,
  },
  percentageCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.secondaryLight,
    borderWidth: 6,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resultPercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  resultPercentageFailed: {
    color: colors.status.danger,
  },
  resultMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 28,
    marginBottom: 16,
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: 10,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
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

export default TrainingQuizScreen;
