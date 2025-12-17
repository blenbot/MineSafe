import React, { useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import API_CONFIG, { buildUrl } from '../config/api';
import AuthService from '../services/auth/AuthService';
import colors from '../utils/colors';

const AddSupervisorScreen = ({ navigation }) => {
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyNumber, setEmergencyNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);

  const departments = ['Operations', 'Safety', 'Maintenance', 'Logistics', 'Engineering', 'Administration'];
  const roles = ['Shift Supervisor', 'Site Supervisor', 'Safety Supervisor', 'Operations Manager', 'Team Lead'];

  const validateForm = () => {
    if (!supervisorName.trim()) {
      Alert.alert('Error', 'Please enter supervisor name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter email address');
      return false;
    }
    if (!contactNumber.trim()) {
      Alert.alert('Error', 'Please enter contact number');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = await AuthService.getAuthToken();

      const supervisorData = {
        name: supervisorName.trim(),
        supervisor_id: supervisorId.trim() || undefined,
        email: email.trim().toLowerCase(),
        phone: contactNumber.trim(),
        password: password,
        department: department || undefined,
        role: role || 'Supervisor',
        emergency_contact_name: emergencyName.trim() || undefined,
        emergency_contact_phone: emergencyNumber.trim() || undefined,
      };

      // API ENDPOINT: POST /api/admin/supervisors
      // Creates a new supervisor
      // Request Body: { name, email, phone, password, supervisor_id?, department?, role?, emergency_contact_name?, emergency_contact_phone? }
      // Response: { success: true, supervisor_id: string, message: string }
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN.SUPERVISORS.CREATE}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supervisorData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Supervisor added successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to add supervisor');
      }
    } catch (error) {
      console.error('Error adding supervisor:', error);
      Alert.alert('Error', 'Failed to add supervisor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPicker = (options, selectedValue, onSelect, visible, setVisible, placeholder) => {
    if (!visible) return null;

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{placeholder}</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Icon name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerScroll}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pickerOption,
                  selectedValue === option && styles.pickerOptionSelected
                ]}
                onPress={() => {
                  onSelect(option);
                  setVisible(false);
                }}
              >
                <Text style={[
                  styles.pickerOptionText,
                  selectedValue === option && styles.pickerOptionTextSelected
                ]}>{option}</Text>
                {selectedValue === option && (
                  <Icon name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
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
          <Icon name="chevron-left" size={32} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Supervisor</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Scrollable Form */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Supervisor Name */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Supervisor Name *</Text>
            <TextInput
              placeholder="Enter full name"
              placeholderTextColor={colors.text.light}
              value={supervisorName}
              onChangeText={setSupervisorName}
              style={styles.input}
              editable={!loading}
            />
          </View>

          {/* Supervisor ID */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Supervisor ID</Text>
            <TextInput
              placeholder="Enter ID number (auto-generated if empty)"
              placeholderTextColor={colors.text.light}
              value={supervisorId}
              onChangeText={setSupervisorId}
              style={styles.input}
              editable={!loading}
            />
          </View>

          {/* Email Address */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              placeholder="Enter email"
              placeholderTextColor={colors.text.light}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Password */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              placeholder="Enter password for supervisor account"
              placeholderTextColor={colors.text.light}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
              editable={!loading}
            />
          </View>

          {/* Contact Number */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Contact Number *</Text>
            <TextInput
              placeholder="Enter phone number"
              placeholderTextColor={colors.text.light}
              value={contactNumber}
              onChangeText={setContactNumber}
              style={styles.input}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          {/* Department */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Department</Text>
            <TouchableOpacity 
              style={styles.selectWrapper}
              onPress={() => setShowDeptPicker(true)}
              disabled={loading}
            >
              <Text style={[
                styles.selectText,
                !department && styles.selectPlaceholder
              ]}>
                {department || 'Select department'}
              </Text>
              <Icon name="chevron-down" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Role */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Role</Text>
            <TouchableOpacity 
              style={styles.selectWrapper}
              onPress={() => setShowRolePicker(true)}
              disabled={loading}
            >
              <Text style={[
                styles.selectText,
                !role && styles.selectPlaceholder
              ]}>
                {role || 'Select role'}
              </Text>
              <Icon name="chevron-down" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Emergency Contact Name */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Emergency Contact Name</Text>
            <TextInput
              placeholder="Enter full name"
              placeholderTextColor={colors.text.light}
              value={emergencyName}
              onChangeText={setEmergencyName}
              style={styles.input}
              editable={!loading}
            />
          </View>

          {/* Emergency Contact Number */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Emergency Contact Number</Text>
            <TextInput
              placeholder="Enter phone number"
              placeholderTextColor={colors.text.light}
              value={emergencyNumber}
              onChangeText={setEmergencyNumber}
              style={styles.input}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Supervisor Details</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Pickers */}
      {renderPicker(departments, department, setDepartment, showDeptPicker, setShowDeptPicker, 'Select Department')}
      {renderPicker(roles, role, setRole, showRolePicker, setShowRolePicker, 'Select Role')}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  inputCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: colors.text.primary,
    padding: 0,
  },
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  selectPlaceholder: {
    color: colors.text.light,
    fontWeight: '400',
  },
  submitContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    padding: 18,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  pickerScroll: {
    paddingHorizontal: 20,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  pickerOptionSelected: {
    backgroundColor: colors.primaryFaded,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  pickerOptionText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  pickerOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default AddSupervisorScreen;
