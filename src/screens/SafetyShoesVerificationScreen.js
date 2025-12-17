/**
 * SafetyShoesVerificationScreen.js
 * PPE verification screen for safety shoes
 * 
 * Features:
 * - Take photo of safety shoes
 * - Upload from gallery
 * - Photo guidelines display
 * - Image preview before submission
 * 
 * BACKEND REQUIREMENTS:
 * - POST /api/ppe/verify - Submit PPE image for verification
 *   Request: FormData with image file
 *   Response: { verified: boolean, message: string, issues?: string[] }
 * 
 * REQUIRED PACKAGES:
 * - react-native-image-picker: For camera and gallery access
 *   Install: npm install react-native-image-picker
 *   iOS: Add camera and photo library permissions to Info.plist
 *   Android: Add camera and storage permissions to AndroidManifest.xml
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthService from '../services/auth/AuthService';
import API_CONFIG from '../config/api';
import colors from '../utils/colors';

const SafetyShoesVerificationScreen = ({ navigation, route }) => {
  const ppeType = route?.params?.ppeType || 'Safety Shoes';
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  /**
   * Open camera to take photo
   * PLACEHOLDER: Requires react-native-image-picker
   */
  const handleClickPicture = () => {
    // PLACEHOLDER: Camera functionality
    // Required package: react-native-image-picker
    // 
    // import { launchCamera } from 'react-native-image-picker';
    // 
    // const options = {
    //   mediaType: 'photo',
    //   quality: 1,
    //   saveToPhotos: true,
    //   cameraType: 'back',
    // };
    // 
    // launchCamera(options, (response) => {
    //   if (response.didCancel) {
    //     console.log('User cancelled camera');
    //   } else if (response.errorCode) {
    //     console.log('Camera Error: ', response.errorMessage);
    //     Alert.alert('Error', 'Failed to open camera');
    //   } else {
    //     const imageUri = response.assets[0].uri;
    //     setSelectedImage(imageUri);
    //   }
    // });

    Alert.alert(
      'Camera',
      'Camera functionality requires react-native-image-picker package.\n\nInstall: npm install react-native-image-picker',
      [{ text: 'OK' }]
    );

    // For demo purposes, set a placeholder
    setSelectedImage('placeholder');
  };

  /**
   * Open gallery to select photo
   * PLACEHOLDER: Requires react-native-image-picker
   */
  const handleUploadPicture = () => {
    // PLACEHOLDER: Gallery functionality
    // Required package: react-native-image-picker
    //
    // import { launchImageLibrary } from 'react-native-image-picker';
    //
    // const options = {
    //   mediaType: 'photo',
    //   quality: 1,
    // };
    //
    // launchImageLibrary(options, (response) => {
    //   if (response.didCancel) {
    //     console.log('User cancelled image picker');
    //   } else if (response.errorCode) {
    //     console.log('ImagePicker Error: ', response.errorMessage);
    //     Alert.alert('Error', 'Failed to pick image');
    //   } else {
    //     const imageUri = response.assets[0].uri;
    //     setSelectedImage(imageUri);
    //   }
    // });

    Alert.alert(
      'Upload',
      'Gallery functionality requires react-native-image-picker package.\n\nInstall: npm install react-native-image-picker',
      [{ text: 'OK' }]
    );

    // For demo purposes, set a placeholder
    setSelectedImage('placeholder');
  };

  /**
   * Submit image for verification
   */
  const handleSubmitVerification = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please take or upload a photo first');
      return;
    }

    setUploading(true);

    try {
      const token = await AuthService.getToken();
      const userData = await AuthService.getUserData();

      // PLACEHOLDER API CALL
      // Backend endpoint: POST /api/ppe/verify
      // 
      // const formData = new FormData();
      // formData.append('image', {
      //   uri: selectedImage,
      //   type: 'image/jpeg',
      //   name: 'ppe_verification.jpg',
      // });
      // formData.append('ppe_type', ppeType);
      // formData.append('user_id', userData?.user_id);
      //
      // const response = await fetch(`${API_CONFIG.BASE_URL}/api/ppe/verify`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'multipart/form-data',
      //   },
      //   body: formData,
      // });

      // Simulate API response for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setVerificationResult({
        verified: true,
        message: 'Safety shoes verified successfully!',
        timestamp: new Date().toISOString(),
      });

      Alert.alert(
        'Verification Complete',
        'Your safety shoes have been verified successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Failed to verify PPE. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Clear selected image
   */
  const handleClearImage = () => {
    setSelectedImage(null);
    setVerificationResult(null);
  };

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
        <Text style={styles.headerTitle}>{ppeType} Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Guideline Card */}
        <View style={styles.guidelineCard}>
          <View style={styles.guidelineHeader}>
            <Icon name="information" size={24} color={colors.primary} />
            <Text style={styles.guidelineTitle}>Photo Guidelines</Text>
          </View>
          <Text style={styles.guidelineText}>
            Please ensure the PPE item is clearly visible in the photo for accurate verification.
          </Text>

          {/* Guidelines List */}
          <View style={styles.guidelinesList}>
            <View style={styles.guidelineItem}>
              <Icon name="check-circle" size={18} color={colors.status.success} />
              <Text style={styles.guidelineItemText}>Good lighting</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Icon name="check-circle" size={18} color={colors.status.success} />
              <Text style={styles.guidelineItemText}>Clear focus on the item</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Icon name="check-circle" size={18} color={colors.status.success} />
              <Text style={styles.guidelineItemText}>Full item visible in frame</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Icon name="check-circle" size={18} color={colors.status.success} />
              <Text style={styles.guidelineItemText}>No obstructions</Text>
            </View>
          </View>

          {/* Example Image Placeholder */}
          <View style={styles.exampleImageContainer}>
            {/* PLACEHOLDER: Example image for reference */}
            {/* <Image source={require('../assets/ppe-example.png')} style={styles.exampleImage} /> */}
            <View style={styles.examplePlaceholder}>
              <Icon name="shoe-formal" size={60} color={colors.primary} />
              <Text style={styles.exampleText}>Example: Safety Shoes</Text>
            </View>
          </View>
        </View>

        {/* Selected Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreviewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Selected Image</Text>
              <TouchableOpacity onPress={handleClearImage}>
                <Icon name="close-circle" size={24} color={colors.text.light} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.imagePreview}>
              {selectedImage === 'placeholder' ? (
                <View style={styles.placeholderPreview}>
                  <Icon name="image" size={48} color={colors.primary} />
                  <Text style={styles.placeholderPreviewText}>Image Selected</Text>
                </View>
              ) : (
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmitVerification}
              disabled={uploading}
              activeOpacity={0.8}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Icon name="check-circle" size={22} color={colors.white} />
                  <Text style={styles.submitButtonText}>Submit for Verification</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        {!selectedImage && (
          <View style={styles.actionsContainer}>
            {/* Click Picture Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleClickPicture}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconCircle}>
                <Icon name="camera" size={28} color={colors.primary} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionButtonText}>Click Picture</Text>
                <Text style={styles.actionButtonSubtext}>Use camera to take photo</Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.gray[400]} />
            </TouchableOpacity>

            {/* Upload Picture Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleUploadPicture}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconCircle}>
                <Icon name="image-plus" size={28} color={colors.primary} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionButtonText}>Upload Picture</Text>
                <Text style={styles.actionButtonSubtext}>Choose from gallery</Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <View style={[
            styles.resultCard,
            verificationResult.verified ? styles.resultCardSuccess : styles.resultCardError
          ]}>
            <Icon 
              name={verificationResult.verified ? "check-circle" : "alert-circle"} 
              size={48} 
              color={verificationResult.verified ? colors.status.success : colors.status.danger} 
            />
            <Text style={styles.resultTitle}>
              {verificationResult.verified ? 'Verified!' : 'Verification Failed'}
            </Text>
            <Text style={styles.resultMessage}>{verificationResult.message}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => navigation.navigate('MinerHome')}
        >
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
    fontSize: 18,
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
    padding: 20,
    paddingBottom: 100,
  },
  guidelineCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  guidelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  guidelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  guidelineText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  guidelinesList: {
    marginBottom: 20,
    gap: 10,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guidelineItemText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  exampleImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  examplePlaceholder: {
    backgroundColor: colors.secondaryLight,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  exampleText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  actionButtonSubtext: {
    fontSize: 13,
    color: colors.text.light,
  },
  imagePreviewCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  imagePreview: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  placeholderPreview: {
    backgroundColor: colors.secondaryLight,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  placeholderPreviewText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 12,
    fontWeight: '500',
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  submitButton: {
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
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
  },
  resultCardSuccess: {
    borderColor: colors.status.success,
    backgroundColor: colors.status.successLight,
  },
  resultCardError: {
    borderColor: colors.status.danger,
    backgroundColor: colors.status.dangerLight,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
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

export default SafetyShoesVerificationScreen;
