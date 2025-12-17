/**
 * SupervisorProfileScreen.js
 * Supervisor profile information screen
 * 
 * BACKEND API REQUIREMENTS:
 * ============================================================================
 * 
 * 1. GET /api/supervisor/profile OR /api/app/profile
 *    - Description: Get supervisor profile information
 *    - Headers: Authorization: Bearer <token>
 *    - Response: { 
 *        id, 
 *        name, 
 *        email, 
 *        supervisorId,
 *        phone,
 *        department,
 *        profilePicture?,
 *        createdAt
 *      }
 *    - STATUS: AVAILABLE - Uses /api/app/profile endpoint
 * 
 * 2. PUT /api/supervisor/profile OR /api/app/profile
 *    - Description: Update supervisor profile
 *    - Headers: Authorization: Bearer <token>
 *    - Body: { name?, phone?, department? }
 *    - Response: { success: boolean, profile: {...}, message: string }
 *    - STATUS: AVAILABLE - Uses /api/app/profile endpoint
 * 
 * 3. POST /auth/logout
 *    - Description: Logout user
 *    - Headers: Authorization: Bearer <token>
 *    - Response: { success: boolean, message: string }
 *    - STATUS: AVAILABLE
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../utils/colors';
import { API_CONFIG } from '../../config/api';
import AuthService from '../../services/auth/AuthService';
import { useTranslation } from '../../i18n';

const SupervisorProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  /**
   * API CALL - Uses /api/app/profile endpoint
   */
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      const token = await AuthService.getToken();
      const userData = await AuthService.getUserData();

      // Try to get profile from API
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/app/profile`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProfile({
            name: data.name || userData?.name || 'Supervisor',
            email: data.email || userData?.email || 'supervisor@minecorp.com',
            supervisorId: data.supervisorId || data.id || userData?.id || 'S-00000',
            phone: data.phone || userData?.phone || 'Not set',
            department: data.department || 'Mining Operations',
            profilePicture: data.profilePicture || null,
          });
          return;
        }
      } catch (apiError) {
        console.log('API not available, using cached data');
      }

      // Fall back to cached user data
      setProfile({
        name: userData?.name || 'Supervisor Name',
        email: userData?.email || 'supervisor@minecorp.com',
        supervisorId: userData?.id || 'S-12345',
        phone: userData?.phone || '+1 (555) 123-4567',
        department: userData?.department || 'Mining Operations',
        profilePicture: null,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Set default profile
      setProfile({
        name: 'Supervisor',
        email: 'supervisor@minecorp.com',
        supervisorId: 'S-00000',
        phone: 'Not available',
        department: 'Mining Operations',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * API CALL - Uses AuthService logout
   */
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await AuthService.logout();
              
              // Navigate to login screen and reset navigation
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen (to be implemented)
    Alert.alert('Edit Profile', 'Profile editing will be available soon.');
  };

  const profileItems = [
    {
      icon: 'account',
      label: 'Name',
      value: profile?.name,
    },
    {
      icon: 'email',
      label: 'Email',
      value: profile?.email,
    },
    {
      icon: 'badge-account-horizontal',
      label: 'Supervisor ID',
      value: profile?.supervisorId,
    },
    {
      icon: 'phone',
      label: 'Mobile Number',
      value: profile?.phone,
    },
    {
      icon: 'office-building',
      label: 'Department',
      value: profile?.department,
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerPlaceholder} />
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleEditProfile}>
          <Icon name="pencil" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Icon name="account" size={64} color={colors.text.light} />
          </View>
          <Text style={styles.avatarName}>{profile?.name}</Text>
          <View style={styles.roleBadge}>
            <Icon name="shield-account" size={14} color={colors.primary} />
            <Text style={styles.roleText}>Supervisor</Text>
          </View>
        </View>

        {/* Profile Info Cards */}
        <View style={styles.infoCards}>
          {profileItems.map((item, index) => (
            <View key={index} style={styles.infoCard}>
              <View style={styles.cardIconContainer}>
                <Icon name={item.icon} size={22} color={colors.text.secondary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>{item.label}</Text>
                <Text style={styles.cardValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => navigation.navigate('LanguageSelect')}
          >
            <View style={styles.settingsItemLeft}>
              <Icon name="translate" size={22} color={colors.text.secondary} />
              <Text style={styles.settingsItemText}>{t('profile.language')}</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.text.light} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Icon name="bell-outline" size={22} color={colors.text.secondary} />
              <Text style={styles.settingsItemText}>{t('profile.notifications')}</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.text.light} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          activeOpacity={0.8}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Icon name="logout" size={20} color={colors.white} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>MineSafe v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerPlaceholder: {
    width: 22,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryFaded,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  infoCards: {
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.text.light,
    fontWeight: '500',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  settingsItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  logoutButton: {
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
  logoutButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  logoutButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.text.light,
    marginTop: 24,
  },
});

export default SupervisorProfileScreen;
