import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../utils/colors';
import { setLanguage, getCurrentLanguage, SUPPORTED_LANGUAGES } from '../i18n';

// Languages with their native names
const LANGUAGES = [
  { id: 'en', name: 'English', nativeName: 'English', icon: '🌐' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिंदी', icon: '🌐' },
  { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்', icon: '🌐' },
  { id: 'bn', name: 'Bengali', nativeName: 'বাংলা', icon: '🌐' },
  { id: 'te', name: 'Telugu', nativeName: 'తెలుగు', icon: '🌐' },
  { id: 'mr', name: 'Marathi', nativeName: 'मराठी', icon: '🌐' },
];

const LanguageSelectScreen = ({ navigation, route }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [saving, setSaving] = useState(false);
  const scaleAnims = useRef(LANGUAGES.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    // Load current language
    const currentLang = getCurrentLanguage();
    setSelectedLanguage(currentLang);
  }, []);

  const handleLanguageSelect = (languageId, index) => {
    // Animate the selected card
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSelectedLanguage(languageId);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Use the i18n setLanguage function
      await setLanguage(selectedLanguage);
      console.log('✅ Language saved:', selectedLanguage);
      
      if (route?.params?.fromSettings) {
        navigation.goBack();
      } else {
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Error saving language:', error);
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={styles.headerTitle}>Select Language</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Grid */}
        <View style={styles.languageGrid}>
          {LANGUAGES.map((language, index) => (
            <Animated.View
              key={language.id}
              style={[
                styles.languageCardWrapper,
                { transform: [{ scale: scaleAnims[index] }] },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.languageCard,
                  selectedLanguage === language.id && styles.languageCardSelected,
                ]}
                onPress={() => handleLanguageSelect(language.id, index)}
                activeOpacity={0.7}
              >
                <View style={styles.languageIconContainer}>
                  <Icon 
                    name="web" 
                    size={36} 
                    color={selectedLanguage === language.id ? colors.primary : colors.text.primary} 
                  />
                </View>
                <Text
                  style={[
                    styles.languageNativeName,
                    selectedLanguage === language.id && styles.languageNameSelected,
                  ]}
                >
                  {language.nativeName}
                </Text>
                {selectedLanguage === language.id && (
                  <View style={styles.checkmarkContainer}>
                    <Icon name="check-circle" size={20} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Save Changes Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveChanges}
          activeOpacity={0.8}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="home" size={24} color={colors.primary} />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Icon name="school-outline" size={24} color={colors.gray[400]} />
          <Text style={styles.navText}>Training</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Icon name="file-document-outline" size={24} color={colors.gray[400]} />
          <Text style={styles.navText}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Icon name="chat-outline" size={24} color={colors.gray[400]} />
          <Text style={styles.navText}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 180,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  languageCardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  languageCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gray[200],
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  languageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.secondary,
  },
  languageIconContainer: {
    marginBottom: 12,
  },
  languageNativeName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  languageNameSelected: {
    color: colors.primary,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    paddingVertical: 16,
  },
  saveButton: {
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
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
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

export default LanguageSelectScreen;
