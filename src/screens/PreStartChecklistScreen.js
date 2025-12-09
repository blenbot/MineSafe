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
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthService from '../services/auth/AuthService';
import API_CONFIG from '../config/api';
import colors from '../utils/colors';

const PreStartChecklistScreen = ({ navigation }) => {
  const [checklistItems, setChecklistItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchChecklist();
  }, []);

  const fetchChecklist = async () => {
    try {
      const token = await AuthService.getToken();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.APP.CHECKLISTS.PRE_START}`,
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
        setChecklistItems(data.items || data || []);
        // Initialize checked state from server data
        const initialChecked = {};
        (data.items || data || []).forEach(item => {
          if (item.completed) {
            initialChecked[item.id] = true;
          }
        });
        setCheckedItems(initialChecked);
      } else {
        // Use default checklist items if API fails
        setChecklistItems(getDefaultChecklistItems());
      }
    } catch (error) {
      console.error('Error fetching checklist:', error);
      setChecklistItems(getDefaultChecklistItems());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultChecklistItems = () => [
    { id: 1, name: 'Check Vehicle Condition', icon: 'car-cog', description: 'Inspect tires, lights, brakes' },
    { id: 2, name: 'Verify Emergency Equipment', icon: 'fire-extinguisher', description: 'Fire extinguisher, first aid kit' },
    { id: 3, name: 'Test Communication Devices', icon: 'radio-handheld', description: 'Radio, phone charged' },
    { id: 4, name: 'Review Work Area', icon: 'map-marker-radius', description: 'Check for hazards' },
    { id: 5, name: 'Confirm Safety Briefing', icon: 'clipboard-text', description: 'Attended daily briefing' },
    { id: 6, name: 'Check Weather Conditions', icon: 'weather-partly-cloudy', description: 'Suitable for work' },
    { id: 7, name: 'Verify Equipment Working', icon: 'tools', description: 'All tools functional' },
    { id: 8, name: 'Report Any Issues', icon: 'alert-circle-outline', description: 'Notify supervisor of concerns' },
  ];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChecklist();
    setRefreshing(false);
  }, []);

  const toggleCheckbox = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const getProgress = () => {
    const totalItems = checklistItems.length;
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    return totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;
  };

  const handleSubmit = async () => {
    const progress = getProgress();
    if (progress < 100) {
      Alert.alert(
        'Incomplete Checklist',
        'Please complete all items before submitting.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSubmitting(true);
    try {
      const token = await AuthService.getToken();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.APP.CHECKLISTS.PRE_START_COMPLETE}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            completed_items: Object.keys(checkedItems).filter(key => checkedItems[key]),
            completed_at: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        Alert.alert(
          '✅ Success!',
          'Pre-Start Checklist completed successfully.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error('Failed to submit checklist');
      }
    } catch (error) {
      console.error('Error submitting checklist:', error);
      Alert.alert(
        'Submission Error',
        'Could not submit checklist. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const progress = getProgress();

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
        <Text style={styles.headerTitle}>Pre-Start Checklist</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: `${progress}%` },
            ]}
          />
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
        {checklistItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={styles.checklistItem}
            onPress={() => toggleCheckbox(item.id)}
            activeOpacity={0.7}
          >
            <TouchableOpacity
              style={[
                styles.checkbox,
                checkedItems[item.id] && styles.checkboxChecked,
              ]}
              onPress={() => toggleCheckbox(item.id)}
            >
              {checkedItems[item.id] && (
                <Icon name="check" size={16} color={colors.white} />
              )}
            </TouchableOpacity>
            <View style={styles.itemIconContainer}>
              <Icon
                name={item.icon || 'checkbox-marked-circle-outline'}
                size={28}
                color={checkedItems[item.id] ? colors.primary : colors.gray[400]}
              />
            </View>
            <View style={styles.itemTextContainer}>
              <Text
                style={[
                  styles.itemName,
                  checkedItems[item.id] && styles.itemNameChecked,
                ]}
              >
                {item.name}
              </Text>
              {item.description && (
                <Text style={styles.itemDescription}>{item.description}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            progress < 100 && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Icon name="check-circle" size={22} color={colors.white} />
              <Text style={styles.submitButtonText}>Submit Checklist</Text>
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
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemIconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  itemNameChecked: {
    color: colors.primary,
  },
  itemDescription: {
    fontSize: 13,
    color: colors.text.light,
    marginTop: 2,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
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
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray[400],
    shadowColor: colors.gray[400],
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
  },
});

export default PreStartChecklistScreen;
