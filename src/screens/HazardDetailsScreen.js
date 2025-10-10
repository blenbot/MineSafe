// src/screens/HazardDetailsScreen.js

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

const HazardDetailsScreen = ({ navigation, route }) => {
  const [note, setNote] = useState('');
  const [images, setImages] = useState([1, 2, 3]);
  const [isRecording, setIsRecording] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Image Gallery */}
        <View style={styles.imageGrid}>
          {images.map((img, index) => (
            <View key={index} style={styles.imageCard}>
              <Image 
                source={{ uri: 'https://placeholder.com/150' }}
                style={styles.image}
              />
            </View>
          ))}
          <TouchableOpacity style={styles.addImageCard}>
            <Icon name="plus" size={32} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addPhotoCard}>
            <Icon name="camera" size={32} color={colors.gray[400]} />
            <Text style={styles.addPhotoText}>Add Photo/Video</Text>
          </TouchableOpacity>
        </View>

        {/* Audio Recording */}
        <View style={styles.audioSection}>
          <TouchableOpacity 
            style={styles.micButton}
            onPress={() => setIsRecording(!isRecording)}
          >
            <Icon name="microphone" size={32} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.audioText}>Tap to record audio</Text>
          <View style={styles.audioWave}>
            <View style={styles.audioProgress} />
          </View>
        </View>

        {/* Location */}
        <View style={styles.locationSection}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationTitle}>Location</Text>
            <Text style={styles.locationValue}>Zone 3, Sector B</Text>
          </View>
          <Text style={styles.gpsText}>GPS: 25.1234° S, 130.5678° E</Text>
          
          <View style={styles.dropdown}>
            <Text style={styles.dropdownText}>Zone 3, Sector B</Text>
            <Icon name="chevron-down" size={24} color={colors.text.primary} />
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteSection}>
          <Text style={styles.noteLabel}>Add Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Describe the hazard..."
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={() => navigation.navigate('ReviewReport')}
        >
          <Text style={styles.submitButtonText}>Continue</Text>
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  imageCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[200],
  },
  addImageCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 10,
    color: colors.gray[400],
    marginTop: 4,
    textAlign: 'center',
  },
  audioSection: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  audioText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  audioWave: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  audioProgress: {
    width: '0%',
    height: '100%',
    backgroundColor: colors.primary,
  },
  locationSection: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  gpsText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
  },
  dropdownText: {
    fontSize: 15,
    color: colors.text.primary,
  },
  noteSection: {
    marginBottom: 24,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  noteInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.text.primary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HazardDetailsScreen;