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

const MinersListScreen = ({ navigation }) => {
  const [miners, setMiners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMiners();
  }, []);

  const fetchMiners = async () => {
    try {
      const token = await AuthService.getAuthToken();
      
      // API ENDPOINT: GET /api/admin/miners
      // Returns: Array of miner objects { miner_id, name, email, phone, zone, role, status }
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN.MINERS.LIST}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMiners(data.miners || data || []);
      } else {
        // Fallback demo data if API not available
        setMiners([
          { miner_id: '1138', name: 'Aarav Patel', email: 'aarav@mine.com', status: 'active' },
          { miner_id: '2460', name: 'Sofia Rossi', email: 'sofia@mine.com', status: 'active' },
          { miner_id: '3579', name: "Liam O'Connell", email: 'liam@mine.com', status: 'active' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching miners:', error);
      // Fallback demo data
      setMiners([
        { miner_id: '1138', name: 'Aarav Patel', email: 'aarav@mine.com', status: 'active' },
        { miner_id: '2460', name: 'Sofia Rossi', email: 'sofia@mine.com', status: 'active' },
        { miner_id: '3579', name: "Liam O'Connell", email: 'liam@mine.com', status: 'active' },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMiners();
  };

  const handleDeleteMiner = (miner) => {
    Alert.alert(
      'Delete Miner',
      `Are you sure you want to delete ${miner.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AuthService.getAuthToken();
              
              // API ENDPOINT: DELETE /api/admin/miners/:id
              // Deletes a miner by ID
              const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.ADMIN.MINERS.DELETE, { id: miner.miner_id }), {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                Alert.alert('Success', 'Miner deleted successfully');
                fetchMiners();
              } else {
                Alert.alert('Error', 'Failed to delete miner');
              }
            } catch (error) {
              console.error('Error deleting miner:', error);
              Alert.alert('Error', 'Failed to delete miner');
            }
          },
        },
      ]
    );
  };

  const handleEditMiner = (miner) => {
    navigation.navigate('EditMiner', { miner });
  };

  const showMinerOptions = (miner) => {
    Alert.alert(
      miner.name,
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => handleEditMiner(miner) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteMiner(miner) },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading miners...</Text>
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
        <Text style={styles.headerTitle}>Miners</Text>
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
        {/* Add New Miner Button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddMiner')}
        >
          <Icon name="plus" size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Add New Miner</Text>
        </TouchableOpacity>

        {/* Miner Cards */}
        <View style={styles.minersList}>
          {miners.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="account-off" size={64} color={colors.text.light} />
              <Text style={styles.emptyText}>No miners found</Text>
              <Text style={styles.emptySubtext}>Add a new miner to get started</Text>
            </View>
          ) : (
            miners.map((miner) => (
              <View key={miner.miner_id} style={styles.minerCard}>
                <View style={styles.avatarCircle}>
                  <Icon name="account" size={28} color={colors.text.light} />
                </View>
                <View style={styles.minerInfo}>
                  <Text style={styles.minerName}>{miner.name}</Text>
                  <Text style={styles.minerId}>ID: {miner.miner_id}</Text>
                  {miner.email && (
                    <Text style={styles.minerEmail}>{miner.email}</Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.menuButton}
                  onPress={() => showMinerOptions(miner)}
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
  minersList: {
    gap: 16,
  },
  minerCard: {
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
  minerInfo: {
    flex: 1,
  },
  minerName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  minerId: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  minerEmail: {
    fontSize: 12,
    color: colors.text.light,
    marginTop: 2,
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

export default MinersListScreen;
