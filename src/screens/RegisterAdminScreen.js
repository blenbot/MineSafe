import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import API_CONFIG from '../config/api';
import colors from '../utils/colors';

const { height } = Dimensions.get('window');

const RegisterAdminScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mineName, setMineName] = useState('');
  const [mineLocation, setMineLocation] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
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

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (!mineName.trim()) {
      Alert.alert('Error', 'Please enter the mine name');
      return false;
    }
    if (!adminCode.trim()) {
      Alert.alert('Error', 'Please enter the admin authorization code');
      return false;
    }
    if (adminCode.trim() !== '8888') {
      Alert.alert('Error', 'Invalid authorization code');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const adminData = {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password,
        mine_name: mineName.trim(),
        mine_location: mineLocation.trim() || undefined,
        admin_code: adminCode.trim(),
        role: 'ADMIN',
      };

      // API ENDPOINT: POST /api/auth/register-admin
      // Registers a new admin user
      // Request Body: { name, email, phone, password, mine_name, mine_location?, admin_code }
      // Response: { success: true, admin_id: string, message: string }
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER_ADMIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          'Registration Successful',
          'Your admin account has been created. You can now login with your credentials.',
          [
            {
              text: 'Go to Login',
              onPress: () => navigation.replace('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Registration Failed', data.message || 'Failed to register admin. Please check your details and try again.');
      }
    } catch (error) {
      console.error('Error registering admin:', error);
      Alert.alert('Error', 'Failed to register. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
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
          <Icon name="chevron-left" size={32} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Registration</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            {/* Icon Section */}
            <View style={styles.iconSection}>
              <View style={styles.iconContainer}>
                <Icon name="shield-account" size={60} color={colors.primary} />
              </View>
              <Text style={styles.iconSubtext}>Create your admin account</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Icon name="account-outline" size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.text.light}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
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

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Icon name="phone-outline" size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your phone number"
                    placeholderTextColor={colors.text.light}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password *</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Icon name="lock-outline" size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder="Create a password"
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

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password *</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Icon name="lock-check-outline" size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder="Confirm your password"
                    placeholderTextColor={colors.text.light}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Icon
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={colors.text.light}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mine Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mine Name *</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Icon name="pickaxe" size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter the mine name"
                    placeholderTextColor={colors.text.light}
                    value={mineName}
                    onChangeText={setMineName}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Mine Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mine Location</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Icon name="map-marker-outline" size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter mine location (optional)"
                    placeholderTextColor={colors.text.light}
                    value={mineLocation}
                    onChangeText={setMineLocation}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Admin Authorization Code */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Authorization Code *</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Icon name="key-outline" size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter authorization code"
                    placeholderTextColor={colors.text.light}
                    value={adminCode}
                    onChangeText={setAdminCode}
                    keyboardType="numeric"
                    maxLength={4}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Admin Account</Text>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backToLoginText}>Already have an account? Login</Text>
              </TouchableOpacity>
            </View>

            {/* Info Text */}
            <Text style={styles.infoText}>
              Admin accounts have full access to manage miners and supervisors.
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
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
  iconSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iconSubtext: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
    fontWeight: '500',
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
  inputHint: {
    fontSize: 12,
    color: colors.text.light,
    marginTop: 8,
    fontStyle: 'italic',
  },
  registerButton: {
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
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  backToLoginButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  backToLoginText: {
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

export default RegisterAdminScreen;
