/**
 * i18n/index.js
 * Translation infrastructure using react-native-localize
 * 
 * Usage:
 * import { t, setLanguage, getCurrentLanguage, useTranslation } from '../i18n';
 * 
 * // In functional component (recommended):
 * const { t, currentLanguage, setLanguage } = useTranslation();
 * <Text>{t('home.welcome')}</Text>
 * 
 * // Or use t() directly (won't re-render on language change):
 * <Text>{t('home.welcome')}</Text>
 * 
 * // Change language:
 * setLanguage('hi');
 * 
 * SETUP REQUIRED:
 * npm install react-native-localize
 * 
 * For iOS: cd ios && pod install
 * For Android: No additional setup needed
 */

import React, { useState, useEffect, useCallback } from 'react';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './translations/en';
import hi from './translations/hi';
import bn from './translations/bn';
import te from './translations/te';
import ta from './translations/ta';
import mr from './translations/mr';

// Available translations
const translations = {
  en, // English
  hi, // Hindi
  bn, // Bengali
  te, // Telugu
  ta, // Tamil
  mr, // Marathi
};

// Supported languages with display names
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
];

// Current language state
let currentLanguage = 'en';
let languageListeners = [];

/**
 * Initialize i18n
 * Loads saved language or detects from device
 */
export const initI18n = async () => {
  try {
    // Try to load saved language preference
    const savedLanguage = await AsyncStorage.getItem('appLanguage');
    
    if (savedLanguage && translations[savedLanguage]) {
      currentLanguage = savedLanguage;
    } else {
      // Detect device language
      const locales = RNLocalize.getLocales();
      if (locales.length > 0) {
        const deviceLanguage = locales[0].languageCode;
        if (translations[deviceLanguage]) {
          currentLanguage = deviceLanguage;
        }
      }
    }
    
    return currentLanguage;
  } catch (error) {
    console.error('Error initializing i18n:', error);
    return 'en';
  }
};

/**
 * Get translation for a key
 * Supports nested keys like 'home.welcome'
 * 
 * @param {string} key - Translation key
 * @param {object} params - Optional parameters for interpolation
 * @returns {string} - Translated string
 */
export const t = (key, params = {}) => {
  const keys = key.split('.');
  let translation = translations[currentLanguage];
  
  // Navigate to nested key
  for (const k of keys) {
    if (translation && translation[k]) {
      translation = translation[k];
    } else {
      // Fallback to English
      translation = translations['en'];
      for (const fallbackKey of keys) {
        if (translation && translation[fallbackKey]) {
          translation = translation[fallbackKey];
        } else {
          return key; // Return key if translation not found
        }
      }
      break;
    }
  }
  
  // If translation is not a string, return the key
  if (typeof translation !== 'string') {
    return key;
  }
  
  // Interpolate parameters
  // e.g., t('greeting', { name: 'John' }) with "Hello, {{name}}" => "Hello, John"
  let result = translation;
  Object.keys(params).forEach((param) => {
    result = result.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
  });
  
  return result;
};

/**
 * Set the current language
 * 
 * @param {string} languageCode - Language code (en, hi, bn, etc.)
 */
export const setLanguage = async (languageCode) => {
  if (translations[languageCode]) {
    currentLanguage = languageCode;
    
    // Save preference
    try {
      await AsyncStorage.setItem('appLanguage', languageCode);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
    
    // Notify listeners
    languageListeners.forEach(listener => listener(languageCode));
    
    return true;
  }
  return false;
};

/**
 * Get current language code
 */
export const getCurrentLanguage = () => currentLanguage;

/**
 * Get current language info
 */
export const getCurrentLanguageInfo = () => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
};

/**
 * Add a language change listener
 * Useful for forcing re-renders when language changes
 * 
 * @param {function} listener - Callback function
 * @returns {function} - Unsubscribe function
 */
export const addLanguageListener = (listener) => {
  languageListeners.push(listener);
  return () => {
    languageListeners = languageListeners.filter(l => l !== listener);
  };
};

/**
 * React hook for using translations
 * Re-renders component when language changes
 * 
 * Usage:
 * const { t, currentLanguage, setLanguage } = useTranslation();
 */
export const useTranslation = () => {
  const [, setForceUpdate] = useState(0);
  
  useEffect(() => {
    const unsubscribe = addLanguageListener(() => {
      setForceUpdate(n => n + 1);
    });
    return unsubscribe;
  }, []);
  
  // Return a memoized translate function that uses current language
  const translate = useCallback((key, params = {}) => {
    return t(key, params);
  }, []);
  
  return { 
    t: translate, 
    currentLanguage: getCurrentLanguage(), 
    setLanguage,
    getCurrentLanguageInfo,
    SUPPORTED_LANGUAGES,
  };
};

// Export default
export default {
  t,
  setLanguage,
  getCurrentLanguage,
  getCurrentLanguageInfo,
  initI18n,
  addLanguageListener,
  useTranslation,
  SUPPORTED_LANGUAGES,
};
