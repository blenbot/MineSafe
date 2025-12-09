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

const PPEChecklistScreen = ({ navigation }) => {
  const [ppeItems, setPpeItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
        setPpeItems(data.items || data || []);
        // Initialize checked state from server data
        const initialChecked = {};
        (data.items || data || []).forEach(item => {
          if (item.completed) {
            initialChecked[item.id] = true;
          }
        });
        setCheckedItems(initialChecked);
      } else {
        // Use default PPE items if API fails
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
    { 
      id: 1, 
      name: 'Safety Helmet', 
      icon: 'hard-hat', 
      description: 'Head protection with chin strap' 
    },
    { 
      id: 2, 
      name: 'Protective Gloves', 
      icon: 'hand-okay', 
      description: 'Cut and chemical resistant' 
    },
    { 
      id: 3, 
      name: 'Safety Shoes', 
      icon: 'shoe-formal', 
      description: 'Steel toe caps and non-slip' 
    },
    { 
      id: 4, 
      name: 'High Visibility Vest', 
      icon: 'tshirt-crew', 
      description: 'Reflective strips for visibility' 
    },
    { 
      id: 5, 
      name: 'Safety Goggles', 
      icon: 'safety-goggles', 
      description: 'Eye protection from debris' 
    },
    { 
      id: 6, 
      name: 'Dust Mask / Respirator', 
      icon: 'face-mask', 
      description: 'Protection from dust and fumes' 
    },
    { 
      id: 7, 
      name: 'Ear Protection', 
      icon: 'earbuds', 
      description: 'Noise reduction earmuffs' 
    },
    { 
      id: 8, 
      name: 'Face Shield', 
      icon: 'shield-account', 
      description: 'Full face protection' 
    },
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

  const handleSubmit = async () => {
    const progress = getProgress();
    if (progress < 100) {
      Alert.alert(
        'Incomplete Checklist',
        'Please verify all PPE items before submitting.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSubmitting(true);
    try {
      const token = await AuthService.getToken();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.APP.CHECKLISTS.PPE_COMPLETE}`,
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
          '✅ PPE Verified!',
          'All personal protective equipment has been confirmed.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error('Failed to submit PPE checklist');
      }
    } catch (error) {
      console.error('Error submitting PPE checklist:', error);
      Alert.alert(
        'Submission Error',
        'Could not submit PPE checklist. Please try again.',
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
        <Text style={styles.headerTitle}>PPE Checklist</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Section */}
      <View style={styles.progressContainer}>
        <View style={styles.progressCircleContainer}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
            <Text style={styles.progressLabel}>Complete</Text>
          </View>
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>PPE Verification</Text>
          <Text style={styles.progressSubtitle}>
            {Object.values(checkedItems).filter(Boolean).length} of {ppeItems.length} items verified
          </Text>
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
        {ppeItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.ppeItem,
              checkedItems[item.id] && styles.ppeItemChecked,
            ]}
            onPress={() => toggleCheckbox(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.ppeItemLeft}>
              <View
                style={[
                  styles.iconContainer,
                  checkedItems[item.id] && styles.iconContainerChecked,
                ]}
              >
                <Icon
                  name={item.icon || 'shield-check'}
                  size={28}
                  color={checkedItems[item.id] ? colors.white : colors.primary}
                />
              </View>
              <View style={styles.ppeTextContainer}>
                <Text
                  style={[
                    styles.ppeName,
                    checkedItems[item.id] && styles.ppeNameChecked,
                  ]}
                >
                  {item.name}
                </Text>
                {item.description && (
                  <Text style={styles.ppeDescription}>{item.description}</Text>
                )}
              </View>
            </View>
            <View
              style={[
                styles.checkbox,
                checkedItems[item.id] && styles.checkboxChecked,
              ]}
            >
              {checkedItems[item.id] && (
                <Icon name="check" size={18} color={colors.white} />
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
              <Icon name="shield-check" size={22} color={colors.white} />
              <Text style={styles.submitButtonText}>Confirm All PPE</Text>
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
  progressPercent: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
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

export default PPEChecklistScreen;
