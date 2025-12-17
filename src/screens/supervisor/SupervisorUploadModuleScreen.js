/**
 * SupervisorUploadModuleScreen.js
 * Screen for uploading new training module videos
 * 
 * BACKEND API REQUIREMENTS:
 * ============================================================================
 * 
 * 1. POST /api/supervisor/modules/upload
 *    - Description: Upload a new training module video
 *    - Headers: Authorization: Bearer <token>
 *    - Body: FormData { 
 *        video: File, 
 *        title: string, 
 *        description: string,
 *        trimStart?: number (seconds),
 *        trimEnd?: number (seconds)
 *      }
 *    - Response: { 
 *        success: boolean, 
 *        moduleId: string, 
 *        message: string,
 *        processingStatus: 'pending' | 'processing' | 'complete'
 *      }
 *    - STATUS: PLACEHOLDER - Can use existing /api/videos/upload endpoint
 *              but needs supervisor-specific modifications
 * 
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import colors from '../../utils/colors';
import { API_CONFIG } from '../../config/api';
import AuthService from '../../services/auth/AuthService';

const SupervisorUploadModuleScreen = ({ navigation }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [isUploading, setIsUploading] = useState(false);

  const handleSelectVideo = () => {
    Alert.alert(
      'Select Video',
      'Choose how you want to add a video',
      [
        {
          text: 'Record Video',
          onPress: () => launchCamera(
            {
              mediaType: 'video',
              videoQuality: 'high',
              durationLimit: 300, // 5 minutes max
            },
            handleVideoResponse
          ),
        },
        {
          text: 'Choose from Library',
          onPress: () => launchImageLibrary(
            {
              mediaType: 'video',
              videoQuality: 'high',
            },
            handleVideoResponse
          ),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleVideoResponse = (response) => {
    if (response.didCancel) {
      return;
    }
    if (response.errorCode) {
      Alert.alert('Error', response.errorMessage || 'Failed to select video');
      return;
    }
    if (response.assets && response.assets[0]) {
      setSelectedVideo(response.assets[0]);
      setTrimEnd(response.assets[0].duration || 100);
    }
  };

  /**
   * API CALL - Upload video to backend
   * Endpoint: POST /api/videos/upload (multipart/form-data)
   */
  const handleUpload = async () => {
    if (!selectedVideo) {
      Alert.alert('No Video', 'Please select a video to upload');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for the module');
      return;
    }

    try {
      setIsUploading(true);

      const token = await AuthService.getToken();
      const formData = new FormData();
      
      // Append video file
      formData.append('video', {
        uri: selectedVideo.uri,
        type: selectedVideo.type || 'video/mp4',
        name: selectedVideo.fileName || 'video.mp4',
      });
      
      // Append metadata
      formData.append('title', title.trim());
      formData.append('description', description.trim() || '');
      
      // Optional: Add tags
      formData.append('tags', JSON.stringify(['training', 'safety']));
      
      const url = `${API_CONFIG.BASE_URL}/api/videos/upload`;
      console.log('📤 Uploading video to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let it auto-set with boundary
        },
        body: formData,
      });
      
      const data = await response.json();
      console.log('📥 Upload response:', response.status, data);

      if (response.ok) {
        Alert.alert(
          'Upload Successful',
          'Your video module has been uploaded successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(data.message || data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading module:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload module. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={32} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Module</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Upload Card */}
        <TouchableOpacity
          style={styles.uploadCard}
          onPress={handleSelectVideo}
          activeOpacity={0.7}
          disabled={isUploading}
        >
          {selectedVideo ? (
            <View style={styles.videoPreviewContainer}>
              <Image
                source={{ uri: selectedVideo.uri }}
                style={styles.videoPreview}
                resizeMode="cover"
              />
              <View style={styles.videoOverlay}>
                <Icon name="play-circle" size={48} color={colors.white} />
              </View>
              <TouchableOpacity
                style={styles.changeVideoButton}
                onPress={handleSelectVideo}
              >
                <Icon name="swap-horizontal" size={20} color={colors.white} />
                <Text style={styles.changeVideoText}>Change Video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Icon name="file-video-outline" size={64} color={colors.text.light} />
              <Text style={styles.uploadText}>Tap to select or record video</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Title Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Module Title</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter module title..."
            placeholderTextColor={colors.text.light}
            value={title}
            onChangeText={setTitle}
            editable={!isUploading}
          />
        </View>

        {/* Description Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Description (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Enter module description..."
            placeholderTextColor={colors.text.light}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isUploading}
          />
        </View>

        {/* Trim Section (shown only when video is selected) */}
        {selectedVideo && (
          <View style={styles.trimSection}>
            <Text style={styles.sectionTitle}>Trim your video</Text>
            <View style={styles.trimCard}>
              <View style={styles.trimThumbnail}>
                <Image
                  source={{ uri: selectedVideo.uri }}
                  style={styles.trimImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack}>
                  <View 
                    style={[
                      styles.sliderActive,
                      { left: `${trimStart}%`, right: `${100 - trimEnd}%` }
                    ]} 
                  />
                </View>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>
                    {Math.floor((selectedVideo.duration || 0) * trimStart / 100)}s
                  </Text>
                  <Text style={styles.sliderLabel}>
                    {Math.floor((selectedVideo.duration || 0) * trimEnd / 100)}s
                  </Text>
                </View>
                <Text style={styles.trimNote}>
                  Note: Video trimming is handled server-side
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Upload Button */}
        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          activeOpacity={0.8}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={styles.uploadButtonText}>Uploading...</Text>
            </>
          ) : (
            <>
              <Icon name="cloud-upload" size={20} color={colors.white} />
              <Text style={styles.uploadButtonText}>Upload Module</Text>
            </>
          )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  uploadCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 300,
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  uploadText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.light,
    fontWeight: '500',
    textAlign: 'center',
  },
  videoPreviewContainer: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[200],
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeVideoButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  changeVideoText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text.primary,
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  trimSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  trimCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  trimThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.gray[200],
    marginRight: 16,
  },
  trimImage: {
    width: '100%',
    height: '100%',
  },
  sliderContainer: {
    flex: 1,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    position: 'relative',
    marginBottom: 8,
  },
  sliderActive: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  trimNote: {
    fontSize: 11,
    color: colors.text.light,
    marginTop: 8,
    fontStyle: 'italic',
  },
  uploadButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  uploadButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    marginLeft: 8,
  },
});

export default SupervisorUploadModuleScreen;
