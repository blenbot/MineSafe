/**
 * PPEChecklistScreen.js
 * PPE Checklist with AI Photo Verification
 * 
 * Features:
 * - Manual PPE checklist (yes/no)
 * - Photo capture for AI verification
 * - Sends data to supervisor via API
 * 
 * BACKEND: POST /api/ppestat
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AuthService from '../services/auth/AuthService';
import API_CONFIG from '../config/api';
import colors from '../utils/colors';
import { useTranslation } from '../i18n';

const PPEChecklistScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [ppeItems, setPpeItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Photo verification states
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDetectionResult, setAiDetectionResult] = useState(null);

  useEffect(() => {
    fetchPPEChecklist();
  }, []);

  const fetchPPEChecklist = async () => {
    try {
      const token = await AuthService.getToken();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.APP.CHECKLISTS.PPE}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPpeItems(data.items || data || getDefaultPPEItems());
        const initialChecked = {};
        (data.items || data || []).forEach(item => {
          if (item.completed) {
            initialChecked[item.id] = true;
          }
        });
        setCheckedItems(initialChecked);
      } else {
        setPpeItems(getDefaultPPEItems());
      }
    } catch (error) {
      console.error('Error fetching PPE checklist:', error);
      setPpeItems(getDefaultPPEItems());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPPEItems = () => [
    { id: 'safety_helmet', name: 'Safety Helmet', icon: 'hard-hat', description: 'Head protection with chin strap' },
    { id: 'protective_gloves', name: 'Protective Gloves', icon: 'hand-okay', description: 'Cut and chemical resistant' },
    { id: 'safety_shoes', name: 'Safety Shoes', icon: 'shoe-formal', description: 'Steel toe caps and non-slip' },
    { id: 'high_visibility_vest', name: 'High Visibility Vest', icon: 'tshirt-crew', description: 'Reflective strips for visibility' },
    { id: 'safety_goggles', name: 'Safety Goggles', icon: 'safety-goggles', description: 'Eye protection from debris' },
    { id: 'respirator', name: 'Dust Mask / Respirator', icon: 'face-mask', description: 'Protection from dust and fumes' },
    { id: 'ear_protection', name: 'Ear Protection', icon: 'earbuds', description: 'Noise reduction earmuffs' },
    { id: 'face_shield', name: 'Face Shield', icon: 'shield-account', description: 'Full face protection' },
    { id: 'safety_harness', name: 'Safety Harness', icon: 'human-handsup', description: 'Fall protection equipment' },
    { id: 'knee_pads', name: 'Knee Pads', icon: 'human-child', description: 'Knee protection for ground work' },
  ];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPPEChecklist();
    setRefreshing(false);
  }, []);

  const toggleCheckbox = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const getProgress = () => {
    const totalItems = ppeItems.length;
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    return totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;
  };

  // FIXED: OpenAI Vision API for PPE Detection
  const analyzeImageWithOpenAI = async (base64Image) => {
    try {
      const API_KEY = 'api key daldo';
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}` // FIXED: Added "Bearer " prefix
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this image and detect which Personal Protective Equipment (PPE) items the person is wearing.

You must check for ALL 10 safety items:
1. Safety Helmet (hard hat, construction helmet)
2. Safety Gloves (work gloves, protective gloves)
3. Safety Shoes (steel-toe boots, work boots)
4. Safety Vest (high-visibility vest, reflective jacket)
5. Safety Goggles (protective eyewear, safety glasses)
6. Face Mask (respirator, dust mask, surgical mask)
7. Ear Protection (earplugs, earmuffs, hearing protection)
8. Face Shield (protective face shield, transparent shield)
9. Safety Harness (fall protection equipment)
10. Knee Pads (knee protection)

IMPORTANT RULES:
- Only mark as "true" if you can CLEARLY see the item being worn
- If unsure or cannot see clearly, mark as "false"
- Be strict - err on the side of "false" if not 100% visible
- Check the ENTIRE person in the image

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "safety_helmet": true,
  "protective_gloves": false,
  "safety_shoes": true,
  "high_visibility_vest": false,
  "safety_goggles": false,
  "respirator": false,
  "ear_protection": false,
  "face_shield": false,
  "safety_harness": false,
  "knee_pads": false
}`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64Image
                  }
                }
              ]
            }
          ],
          max_tokens: 300,
          temperature: 0.1 // Low temperature for consistent results
        })
      });

      const responseText = await response.text();
      console.log('API Response:', responseText); // Debug logging

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          // Could not parse error
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid API response format');
      }

      const content = data.choices[0].message.content;
      console.log('AI Response:', content); // Debug logging
      
      // Extract JSON from response (handles markdown code blocks)
      let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        jsonMatch = content.match(/\{[\s\S]*\}/);
      }
      
      if (!jsonMatch) {
        throw new Error('Could not parse AI response. Response: ' + content);
      }
      
      const detectionData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      // Validate all required fields exist
      const requiredFields = [
        'safety_helmet', 'protective_gloves', 'safety_shoes', 
        'high_visibility_vest', 'safety_goggles', 'respirator',
        'ear_protection', 'face_shield', 'safety_harness', 'knee_pads'
      ];
      
      for (const field of requiredFields) {
        if (!(field in detectionData)) {
          detectionData[field] = false; // Default to false if missing
        }
      }
      
      // Return simple yes/no format
      return {
        safety_helmet: detectionData.safety_helmet ? "yes" : "no",
        protective_gloves: detectionData.protective_gloves ? "yes" : "no",
        safety_shoes: detectionData.safety_shoes ? "yes" : "no",
        high_visibility_vest: detectionData.high_visibility_vest ? "yes" : "no",
        safety_goggles: detectionData.safety_goggles ? "yes" : "no",
        respirator: detectionData.respirator ? "yes" : "no",
        ear_protection: detectionData.ear_protection ? "yes" : "no",
        face_shield: detectionData.face_shield ? "yes" : "no",
        safety_harness: detectionData.safety_harness ? "yes" : "no",
        knee_pads: detectionData.knee_pads ? "yes" : "no"
      };
      
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(error.message || 'Failed to analyze image');
    }
  };

  // Photo capture using react-native-image-picker
  const capturePhoto = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: true,
      saveToPhotos: false,
    };

    try {
      const result = await launchCamera(options);
      
      if (result.didCancel) {
        return;
      }
      
      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to capture photo');
        return;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedImage(asset.uri);
        
        // Analyze with AI
        if (asset.base64) {
          const base64Image = `data:image/jpeg;base64,${asset.base64}`;
          analyzeImage(base64Image);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const pickFromGallery = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: true,
    };

    try {
      const result = await launchImageLibrary(options);
      
      if (result.didCancel) {
        return;
      }
      
      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to pick image');
        return;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedImage(asset.uri);
        
        if (asset.base64) {
          const base64Image = `data:image/jpeg;base64,${asset.base64}`;
          analyzeImage(base64Image);
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  // Analyze image with OpenAI
  const analyzeImage = async (base64Image) => {
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeImageWithOpenAI(base64Image);
      setAiDetectionResult(result);
      
      const itemsFound = Object.values(result).filter(val => val === "yes").length;
      
      Alert.alert(
        'Analysis Complete!',
        `Found ${itemsFound} out of ${ppeItems.length} safety items.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      Alert.alert(
        'AI Verification Error',
        error.message || 'Failed to analyze image. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      setCapturedImage(null);
      setAiDetectionResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit all data to supervisor
  const handleSubmit = async () => {
    const progress = getProgress();
    
    if (progress === 0) {
      Alert.alert(
        'No Items Checked',
        'Please verify at least some PPE items before submitting.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSubmitting(true);
    
    try {
      const token = await AuthService.getToken();
      const userData = await AuthService.getUserData();

      // Prepare submission data with AI detection results (yes/no format)
      const submissionData = {
        miner_id: userData?.id || userData?.user_id,
        miner_name: userData?.name || userData?.full_name,
        timestamp: new Date().toISOString(),
        manual_checklist: checkedItems,
        checklist_items: ppeItems.map(item => ({
          id: item.id,
          name: item.name,
          checked: !!checkedItems[item.id],
        })),
        ai_verification: aiDetectionResult, // Contains yes/no values from OpenAI
        photo_captured: !!capturedImage,
        completion_percentage: progress,
        items_detected: aiDetectionResult 
          ? Object.values(aiDetectionResult).filter(val => val === "yes").length 
          : 0,
        total_items: ppeItems.length,
      };

      // Submit to /api/ppestat endpoint
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PPE_STAT.SUBMIT}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData),
        }
      );

      if (response.ok) {
        Alert.alert(
          '✅ PPE Data Submitted!',
          'Your PPE verification has been sent to the supervisor.',
          [{ 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }]
        );
      } else {
        throw new Error('Failed to submit PPE data');
      }
    } catch (error) {
      console.error('Error submitting PPE data:', error);
      Alert.alert(
        'Submission Error',
        'Could not submit PPE data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetPhoto = () => {
    setCapturedImage(null);
    setAiDetectionResult(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const progress = getProgress();
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const itemsDetected = aiDetectionResult 
    ? Object.values(aiDetectionResult).filter(val => val === "yes").length 
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('ppe.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Section */}
      <View style={styles.progressContainer}>
        <View style={styles.progressCircleContainer}>
          <View style={[
            styles.progressCircle,
            progress === 100 && styles.progressCircleComplete
          ]}>
            <Text style={[
              styles.progressPercent,
              progress === 100 && styles.progressPercentComplete
            ]}>{Math.round(progress)}%</Text>
            <Text style={styles.progressLabel}>Complete</Text>
          </View>
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>PPE Verification</Text>
          <Text style={styles.progressSubtitle}>
            {checkedCount} of {ppeItems.length} items verified
          </Text>
          {capturedImage && (
            <View style={styles.photoVerifiedBadge}>
              <Icon name="camera-check" size={14} color={colors.status.success} />
              <Text style={styles.photoVerifiedText}>Photo captured</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* PPE Items List */}
        {ppeItems.map((item) => {
          const isChecked = checkedItems[item.id];
          const aiDetected = aiDetectionResult?.[item.id] === "yes";
          const hasMismatch = aiDetectionResult && isChecked !== aiDetected;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.ppeItem,
                isChecked && styles.ppeItemChecked,
                hasMismatch && styles.ppeItemMismatch,
              ]}
              onPress={() => toggleCheckbox(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.ppeItemLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    isChecked && styles.iconContainerChecked,
                  ]}
                >
                  <Icon
                    name={item.icon || 'shield-check'}
                    size={28}
                    color={isChecked ? colors.white : colors.primary}
                  />
                </View>
                <View style={styles.ppeTextContainer}>
                  <Text
                    style={[
                      styles.ppeName,
                      isChecked && styles.ppeNameChecked,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.description && (
                    <Text style={styles.ppeDescription}>{item.description}</Text>
                  )}
                  {aiDetectionResult && (
                    <View style={[
                      styles.aiBadge,
                      aiDetected ? styles.aiBadgeYes : styles.aiBadgeNo
                    ]}>
                      <Text style={[
                        styles.aiBadgeText,
                        aiDetected ? styles.aiBadgeTextYes : styles.aiBadgeTextNo
                      ]}>
                        AI: {aiDetected ? '✓ Yes' : '✕ No'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View
                style={[
                  styles.checkbox,
                  isChecked && styles.checkboxChecked,
                ]}
              >
                {isChecked && (
                  <Icon name="check" size={18} color={colors.white} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Captured Image Preview */}
        {capturedImage && (
          <View style={styles.imagePreviewCard}>
            <Text style={styles.imagePreviewTitle}>Captured Photo</Text>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            {isAnalyzing && (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.analyzingText}>{t('ppe.analyzing')}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.retakeButton} onPress={resetPhoto}>
              <Icon name="camera-retake" size={18} color={colors.primary} />
              <Text style={styles.retakeButtonText}>{t('ppe.retakePhoto')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AI Detection Summary */}
        {aiDetectionResult && (
          <View style={styles.aiResultCard}>
            <View style={styles.aiResultHeader}>
              <Icon name="robot" size={24} color={colors.primary} />
              <Text style={styles.aiResultTitle}>AI Detection Result</Text>
            </View>
            <View style={styles.aiSummaryContent}>
              <View>
                <Text style={styles.aiSummaryCount}>{itemsDetected}/{ppeItems.length}</Text>
                <Text style={styles.aiSummaryLabel}>Items Detected</Text>
              </View>
              <View style={styles.aiPercentageCircle}>
                <Text style={styles.aiPercentageText}>
                  {Math.round((itemsDetected / ppeItems.length) * 100)}%
                </Text>
              </View>
            </View>
            {/* JSON Output */}
            <View style={styles.jsonCard}>
              <Text style={styles.jsonTitle}>Detection Output (Yes/No)</Text>
              <Text style={styles.jsonText}>
                {JSON.stringify(aiDetectionResult, null, 2)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        {/* Photo Capture Button */}
        <TouchableOpacity
          style={styles.photoButton}
          onPress={capturePhoto}
          activeOpacity={0.8}
        >
          <Icon name="camera" size={22} color={colors.white} />
          <Text style={styles.photoButtonText}>
            {capturedImage ? t('ppe.retakePhoto') : t('ppe.takePhoto')}
          </Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (submitting || checkedCount === 0) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={submitting || checkedCount === 0}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Icon name="shield-check" size={22} color={colors.white} />
              <Text style={styles.submitButtonText}>{t('ppe.submitPPE')}</Text>
            </>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  progressCircleContainer: {
    marginRight: 20,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondaryLight,
    borderWidth: 4,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleComplete: {
    backgroundColor: '#D1FAE5',
    borderColor: colors.status.success,
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressPercentComplete: {
    color: colors.status.success,
  },
  progressLabel: {
    fontSize: 10,
    color: colors.text.light,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  progressSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  photoVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  photoVerifiedText: {
    fontSize: 12,
    color: colors.status.success,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 200,
  },
  ppeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ppeItemChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.secondary,
  },
  ppeItemMismatch: {
    borderColor: colors.status.warning,
    backgroundColor: '#FFF7ED',
  },
  ppeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconContainerChecked: {
    backgroundColor: colors.primary,
  },
  ppeTextContainer: {
    flex: 1,
  },
  ppeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  ppeNameChecked: {
    color: colors.primary,
  },
  ppeDescription: {
    fontSize: 13,
    color: colors.text.light,
    marginTop: 2,
  },
  aiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  aiBadgeYes: {
    backgroundColor: '#D1FAE5',
  },
  aiBadgeNo: {
    backgroundColor: '#FEE2E2',
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  aiBadgeTextYes: {
    color: '#065F46',
  },
  aiBadgeTextNo: {
    color: '#991B1B',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  imagePreviewCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.gray[200],
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    top: 40,
    bottom: 50,
  },
  analyzingText: {
    color: colors.white,
    fontSize: 14,
    marginTop: 8,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  retakeButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  aiResultCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  aiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiResultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  aiSummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiSummaryCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
  },
  aiSummaryLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  aiPercentageCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiPercentageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  jsonCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
  },
  jsonTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  jsonText: {
    fontSize: 11,
    color: '#34D399',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  aiResultNote: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  aiResultSummary: {
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 8,
  },
  aiResultCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: 10,
  },
  photoButton: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: colors.text.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  submitButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray[400],
    shadowColor: colors.gray[400],
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
});

export default PPEChecklistScreen;
