import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  StatusBar,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthService from '../services/auth/AuthService';
import colors from '../utils/colors';
import { useTranslation } from '../i18n';

const { width, height } = Dimensions.get('window');

const ROLES = [
  { id: 'MINER', label: 'Miner', icon: 'pickaxe', description: 'Mine worker' },
  { id: 'OPERATOR', label: 'Operator', icon: 'cog', description: 'Equipment operator' },
  { id: 'SUPERVISOR', label: 'Supervisor', icon: 'account-tie', description: 'Site supervisor' },
];

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('MINER');
  const [showPassword, setShowPassword] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Animations
  const dropdownHeight = useRef(new Animated.Value(0)).current;
  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    checkExistingSession();
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const checkExistingSession = async () => {
    try {
      const isAuth = await AuthService.isAuthenticated();
      if (isAuth) {
        const user = await AuthService.getUserData();
        console.log('✅ Existing session found:', user?.user_id);
        navigateToHome(user?.role);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setChecking(false);
    }
  };

  const navigateToHome = (role) => {
    switch (role) {
      case 'MINER':
        navigation.replace('MinerHome');
        break;
      case 'OPERATOR':
        navigation.replace('OperatorHome');
        break;
      case 'SUPERVISOR':
        navigation.replace('SupervisorHome');
        break;
      default:
        navigation.replace('Home');
    }
  };

  const toggleDropdown = () => {
    const toValue = isDropdownOpen ? 0 : ROLES.length * 60;
    Animated.parallel([
      Animated.timing(dropdownHeight, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: isDropdownOpen ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectRole = (roleId) => {
    setSelectedRole(roleId);
    toggleDropdown();
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const result = await AuthService.login(email, password, selectedRole);

      if (result.success) {
        console.log('✅ Login successful:', result.user.user_id);
        Alert.alert(
          '✅ Welcome!',
          `Logged in as ${result.user.name}\nRole: ${selectedRole}${result.user.supervisor_name ? `\nSupervisor: ${result.user.supervisor_name}` : ''}`,
          [
            {
              text: 'Continue',
              onPress: () => navigateToHome(selectedRole),
            },
          ]
        );
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Connection Error', 'Could not connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Please contact your supervisor to reset your password.');
  };

  const getSelectedRoleData = () => {
    return ROLES.find(r => r.id === selectedRole) || ROLES[0];
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Profile Image Placeholder */}
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImageWrapper}>
                {/* PLACEHOLDER: Add miner illustration image here */}
                {/* Required: A circular image of a miner with helmet, approx 180x180px */}
                {/* <Image source={require('../assets/images/miner-avatar.png')} style={styles.profileImage} /> */}
                <View style={styles.placeholderImage}>
                  <Icon name="account-hard-hat" size={80} color={colors.primary} />
                </View>
              </View>
            </View>

            {/* Login Form Card */}
            <View style={styles.formCard}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Icon name="email-outline" size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your email address"
                    placeholderTextColor={colors.text.light}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Icon name="lock-outline" size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.text.light}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Icon
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={colors.text.light}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Role Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Role</Text>
                <TouchableOpacity
                  style={[styles.dropdownButton, isDropdownOpen && styles.dropdownButtonOpen]}
                  onPress={toggleDropdown}
                  activeOpacity={0.8}
                >
                  <View style={styles.dropdownButtonContent}>
                    <View style={styles.inputIconContainer}>
                      <Icon name={getSelectedRoleData().icon} size={22} color={colors.primary} />
                    </View>
                    <Text style={styles.dropdownButtonText}>{getSelectedRoleData().label}</Text>
                  </View>
                  <Animated.View style={{ transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }}>
                    <Icon name="chevron-down" size={24} color={colors.text.secondary} />
                  </Animated.View>
                </TouchableOpacity>

                {/* Dropdown Menu */}
                <Animated.View 
                  style={[
                    styles.dropdownMenu,
                    {
                      height: dropdownHeight,
                      opacity: dropdownOpacity,
                    },
                  ]}
                >
                  {ROLES.map((role, index) => (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.dropdownItem,
                        selectedRole === role.id && styles.dropdownItemSelected,
                        index === ROLES.length - 1 && styles.dropdownItemLast,
                      ]}
                      onPress={() => selectRole(role.id)}
                      activeOpacity={0.7}
                    >
                      <Icon 
                        name={role.icon} 
                        size={20} 
                        color={selectedRole === role.id ? colors.primary : colors.text.secondary} 
                      />
                      <View style={styles.dropdownItemTextContainer}>
                        <Text style={[
                          styles.dropdownItemText,
                          selectedRole === role.id && styles.dropdownItemTextSelected,
                        ]}>
                          {role.label}
                        </Text>
                        <Text style={styles.dropdownItemDescription}>{role.description}</Text>
                      </View>
                      {selectedRole === role.id && (
                        <Icon name="check" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Info Text */}
            <Text style={styles.infoText}>
              Only authorized personnel can access training and safety modules.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: 24,
  },
  profileImageWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    borderRadius: 14,
    overflow: 'hidden',
  },
  inputIconContainer: {
    width: 50,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
  },
  textInput: {
    flex: 1,
    height: 54,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text.primary,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    height: 54,
    justifyContent: 'center',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondaryLight,
    borderRadius: 14,
    overflow: 'hidden',
    paddingRight: 16,
  },
  dropdownButtonOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 16,
    fontWeight: '500',
  },
  dropdownMenu: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.secondaryLight,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemSelected: {
    backgroundColor: colors.secondary,
  },
  dropdownItemTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  dropdownItemText: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  dropdownItemDescription: {
    fontSize: 12,
    color: colors.text.light,
    marginTop: 2,
  },
  loginButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotPasswordText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    color: colors.text.light,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});

export default LoginScreen;
