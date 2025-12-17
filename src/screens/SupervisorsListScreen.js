import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import API_CONFIG, { buildUrl } from '../config/api';
import AuthService from '../services/auth/AuthService';
import colors from '../utils/colors';

const SupervisorsListScreen = ({ navigation }) => {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      const token = await AuthService.getAuthToken();
      
      // API ENDPOINT: GET /api/admin/supervisors
      // Returns: Array of supervisor objects { supervisor_id, name, email, phone, department, role, status }
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN.SUPERVISORS.LIST}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSupervisors(data.supervisors || data || []);
      } else {
        // Fallback demo data if API not available
        setSupervisors([
          { supervisor_id: '789123', name: 'John Appleseed', email: 'john@mine.com', department: 'Operations' },
          { supervisor_id: '456789', name: 'Jane Doe', email: 'jane@mine.com', department: 'Safety' },
          { supervisor_id: '123456', name: 'Peter Jones', email: 'peter@mine.com', department: 'Maintenance' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      // Fallback demo data
      setSupervisors([
        { supervisor_id: '789123', name: 'John Appleseed', email: 'john@mine.com', department: 'Operations' },
        { supervisor_id: '456789', name: 'Jane Doe', email: 'jane@mine.com', department: 'Safety' },
        { supervisor_id: '123456', name: 'Peter Jones', email: 'peter@mine.com', department: 'Maintenance' },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSupervisors();
  };

  const handleDeleteSupervisor = (supervisor) => {
    Alert.alert(
      'Delete Supervisor',
      `Are you sure you want to delete ${supervisor.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AuthService.getAuthToken();
              
              // API ENDPOINT: DELETE /api/admin/supervisors/:id
              // Deletes a supervisor by ID
              const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.ADMIN.SUPERVISORS.DELETE, { id: supervisor.supervisor_id }), {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                Alert.alert('Success', 'Supervisor deleted successfully');
                fetchSupervisors();
              } else {
                Alert.alert('Error', 'Failed to delete supervisor');
              }
            } catch (error) {
              console.error('Error deleting supervisor:', error);
              Alert.alert('Error', 'Failed to delete supervisor');
            }
          },
        },
      ]
    );
  };

  const handleEditSupervisor = (supervisor) => {
    navigation.navigate('EditSupervisor', { supervisor });
  };

  const showSupervisorOptions = (supervisor) => {
    Alert.alert(
      supervisor.name,
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => handleEditSupervisor(supervisor) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteSupervisor(supervisor) },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading supervisors...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Supervisors</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Scrollable Content */}
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
        {/* Add Supervisor Button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddSupervisor')}
        >
          <Icon name="plus" size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Add Supervisor</Text>
        </TouchableOpacity>

        {/* Supervisor Cards */}
        <View style={styles.supervisorsList}>
          {supervisors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="shield-off" size={64} color={colors.text.light} />
              <Text style={styles.emptyText}>No supervisors found</Text>
              <Text style={styles.emptySubtext}>Add a new supervisor to get started</Text>
            </View>
          ) : (
            supervisors.map((supervisor) => (
              <View key={supervisor.supervisor_id} style={styles.supervisorCard}>
                <View style={styles.avatarCircle}>
                  <Icon name="shield-account" size={28} color={colors.text.light} />
                </View>
                <View style={styles.supervisorInfo}>
                  <Text style={styles.supervisorName}>{supervisor.name}</Text>
                  <Text style={styles.supervisorId}>ID: {supervisor.supervisor_id}</Text>
                  {supervisor.department && (
                    <Text style={styles.supervisorDept}>{supervisor.department}</Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.menuButton}
                  onPress={() => showSupervisorOptions(supervisor)}
                >
                  <Icon name="dots-vertical" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 50,
    padding: 18,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    marginLeft: 8,
  },
  supervisorsList: {
    gap: 16,
  },
  supervisorCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  supervisorInfo: {
    flex: 1,
  },
  supervisorName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  supervisorId: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  supervisorDept: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.light,
    marginTop: 8,
  },
});

export default SupervisorsListScreen;
