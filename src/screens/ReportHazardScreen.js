/**
 * ReportHazardScreen.js
 * Report hazards to the server
 * 
 * BACKEND REQUIREMENTS:
 * - POST /api/hazards/report - Submit hazard report
 *   Body: { hazardType, description, location, severity, images }
 *   Response: { success, reportId, message }
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
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';
import { API_BASE_URL } from '../config/api';
import AuthService from '../services/auth/AuthService';

const ReportHazardScreen = ({ navigation }) => {
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Hazard, 2: Details

  // Hazard types data
  const hazardTypes = [
    {
      id: 1,
      title: 'Slip/Trip',
      icon: 'slip-hazard',
      color: '#FFA726',
    },
    {
      id: 2,
      title: 'Equipment Failure',
      icon: 'tools',
      color: '#EF5350',
    },
    {
      id: 3,
      title: 'Gas Leak',
      icon: 'gas-cylinder',
      color: '#AB47BC',
    },
    {
      id: 4,
      title: 'Electrical Fault',
      icon: 'flash-alert',
      color: '#FFEE58',
    },
    {
      id: 5,
      title: 'Roof Fall',
      icon: 'home-alert',
      color: '#8D6E63',
    },
    {
      id: 6,
      title: 'Other',
      icon: 'alert-circle',
      color: '#78909C',
    },
  ];

  const severityLevels = [
    { id: 1, label: 'Low', color: '#4CAF50', icon: 'alert-circle-outline' },
    { id: 2, label: 'Medium', color: '#FF9800', icon: 'alert' },
    { id: 3, label: 'High', color: '#F44336', icon: 'alert-octagon' },
    { id: 4, label: 'Critical', color: '#B71C1C', icon: 'skull-crossbones' },
  ];

  const handleHazardSelect = (hazard) => {
    setSelectedHazard(hazard);
  };

  const handleNext = () => {
    if (selectedHazard) {
      setStep(2);
    } else {
      Alert.alert('Selection Required', 'Please select a hazard type to continue');
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!selectedHazard) {
      Alert.alert('Error', 'Please select a hazard type');
      return;
    }
    if (!severity) {
      Alert.alert('Error', 'Please select severity level');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AuthService.getToken();
      const userData = await AuthService.getUserData();

      const reportData = {
        hazardType: selectedHazard.title,
        hazardId: selectedHazard.id,
        description: description.trim(),
        location: location.trim() || 'Not specified',
        severity: severityLevels.find(s => s.id === severity)?.label || 'Unknown',
        severityLevel: severity,
        reportedBy: userData?.id || 'unknown',
        reportedAt: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/api/hazards/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reportData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Alert.alert(
          'Report Submitted',
          `Your hazard report has been submitted successfully.\n\nReport ID: ${result.reportId || 'N/A'}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('MinerHome'),
            },
          ]
        );
      } else {
        throw new Error(result.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting hazard report:', error);
      Alert.alert(
        'Submission Failed',
        'Unable to submit hazard report. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.sectionTitle}>Select Hazard Type</Text>
      
      {/* Hazard Cards Grid */}
      <View style={styles.hazardGrid}>
        {hazardTypes.map((hazard) => (
          <TouchableOpacity
            key={hazard.id}
            style={[
              styles.hazardCard,
              selectedHazard?.id === hazard.id && styles.hazardCardSelected
            ]}
            onPress={() => handleHazardSelect(hazard)}
            activeOpacity={0.7}
          >
            <View style={[styles.hazardIconContainer, { backgroundColor: hazard.color + '20' }]}>
              <Icon name={hazard.icon} size={36} color={hazard.color} />
            </View>
            
            <Text style={[
              styles.hazardTitle,
              selectedHazard?.id === hazard.id && styles.hazardTitleSelected
            ]}>
              {hazard.title}
            </Text>

            {/* Selection Indicator */}
            {selectedHazard?.id === hazard.id && (
              <View style={styles.selectionIndicator}>
                <Icon name="check" size={16} color={colors.white} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Button */}
      <TouchableOpacity 
        style={[
          styles.nextButton,
          !selectedHazard && styles.nextButtonDisabled
        ]}
        onPress={handleNext}
        disabled={!selectedHazard}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>Next</Text>
        <Icon name="arrow-right" size={24} color={colors.white} />
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      {/* Selected Hazard Display */}
      <View style={styles.selectedHazardBanner}>
        <View style={[styles.selectedHazardIcon, { backgroundColor: selectedHazard.color + '20' }]}>
          <Icon name={selectedHazard.icon} size={28} color={selectedHazard.color} />
        </View>
        <View style={styles.selectedHazardInfo}>
          <Text style={styles.selectedHazardLabel}>Reporting</Text>
          <Text style={styles.selectedHazardTitle}>{selectedHazard.title}</Text>
        </View>
        <TouchableOpacity onPress={() => setStep(1)}>
          <Icon name="pencil" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Severity Selection */}
      <Text style={styles.sectionTitle}>Severity Level</Text>
      <View style={styles.severityContainer}>
        {severityLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.severityButton,
              severity === level.id && { backgroundColor: level.color + '20', borderColor: level.color }
            ]}
            onPress={() => setSeverity(level.id)}
          >
            <Icon 
              name={level.icon} 
              size={24} 
              color={severity === level.id ? level.color : colors.gray[400]} 
            />
            <Text style={[
              styles.severityLabel,
              severity === level.id && { color: level.color, fontWeight: '600' }
            ]}>
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Location Input */}
      <Text style={styles.sectionTitle}>Location (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Tunnel B, Section 4"
        placeholderTextColor={colors.gray[400]}
        value={location}
        onChangeText={setLocation}
      />

      {/* Description Input */}
      <Text style={styles.sectionTitle}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe the hazard in detail..."
        placeholderTextColor={colors.gray[400]}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Submit Button */}
      <TouchableOpacity 
        style={[
          styles.submitButton,
          (!severity || !description.trim()) && styles.nextButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={!severity || !description.trim() || isSubmitting}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <>
            <Icon name="send" size={20} color={colors.white} />
            <Text style={styles.submitButtonText}>Submit Report</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report a Hazard</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressStep, styles.progressStepActive]}>
          <Text style={styles.progressStepText}>1</Text>
        </View>
        <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
        <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]}>
          <Text style={[styles.progressStepText, step < 2 && { color: colors.gray[400] }]}>2</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? renderStep1() : renderStep2()}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('MinerHome')}
        >
          <Icon name="home" size={24} color={colors.gray[400]} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('VideoModule')}
        >
          <Icon name="play-circle" size={24} color={colors.gray[400]} />
          <Text style={styles.navText}>Video</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('TrainingList')}
        >
          <Icon name="school" size={24} color={colors.gray[400]} />
          <Text style={styles.navText}>Training</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
        >
          <Icon name="alert-circle" size={24} color={colors.primary} />
          <Text style={styles.navTextActive}>Report</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('MinerProfile')}
        >
          <Icon name="account" size={24} color={colors.gray[400]} />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.white,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  progressStepText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressLine: {
    width: 60,
    height: 3,
    backgroundColor: colors.gray[200],
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  hazardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  hazardCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  hazardCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF5E6',
  },
  hazardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  hazardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  hazardTitleSelected: {
    color: colors.primary,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonDisabled: {
    backgroundColor: colors.gray[300],
    shadowOpacity: 0.1,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  selectedHazardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  selectedHazardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedHazardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedHazardLabel: {
    fontSize: 12,
    color: colors.gray[500],
  },
  selectedHazardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  severityButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  severityLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.success,
    borderRadius: 28,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
    shadowColor: colors.status.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 10,
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

export default ReportHazardScreen;