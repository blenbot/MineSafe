/**
 * SupervisorManageMinersScreen.js
 * Screen for viewing and managing miners under this supervisor
 * 
 * BACKEND API REQUIREMENTS:
 * ============================================================================
 * 
 * 1. GET /api/supervisor/miners
 *    - Description: Get all miners assigned to this supervisor
 *    - Headers: Authorization: Bearer <token>
 *    - Response: { 
 *        miners: [{ 
 *          id, name, minerId, phone, zone, status, profilePicture 
 *        }] 
 *      }
 *    - STATUS: PLACEHOLDER - Can use /api/miners but needs supervisor filter
 * 
 * 2. POST /api/supervisor/miners
 *    - Description: Add a new miner under this supervisor
 *    - Headers: Authorization: Bearer <token>
 *    - Body: { name, email, phone, zoneId }
 *    - Response: { success: boolean, miner: {...}, message: string }
 *    - STATUS: PLACEHOLDER - Endpoint exists as /api/miners POST
 * 
 * 3. PUT /api/supervisor/miners/:id
 *    - Description: Update miner information
 *    - Headers: Authorization: Bearer <token>
 *    - Body: { name?, phone?, zoneId?, status? }
 *    - Response: { success: boolean, miner: {...}, message: string }
 *    - STATUS: PLACEHOLDER - Endpoint exists as /api/miners/:id PUT
 * 
 * 4. DELETE /api/supervisor/miners/:id
 *    - Description: Remove a miner from this supervisor's team
 *    - Headers: Authorization: Bearer <token>
 *    - Response: { success: boolean, message: string }
 *    - STATUS: PLACEHOLDER - Endpoint exists as /api/miners/:id DELETE
 * 
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../utils/colors';
import { API_CONFIG } from '../../config/api';
import AuthService from '../../services/auth/AuthService';

const SupervisorManageMinersScreen = ({ navigation }) => {
  const [miners, setMiners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(null);

  useEffect(() => {
    fetchMiners();
  }, []);

  /**
   * PLACEHOLDER API CALL
   * Endpoint: GET /api/supervisor/miners or /api/miners
   */
  const fetchMiners = async () => {
    try {
      setIsLoading(true);

      // TODO: Replace with actual API call
      // const token = await AuthService.getToken();
      // const response = await fetch(`${API_CONFIG.BASE_URL}/api/miners`, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setMiners(data.miners);

      // Mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMiners([
        { id: '12345', name: 'John Doe', status: 'active', zone: 'Sector A' },
        { id: '67890', name: 'Jane Smith', status: 'active', zone: 'Sector B' },
        { id: '13579', name: 'Carlos Garcia', status: 'inactive', zone: 'Sector A' },
        { id: '24680', name: 'Aisha Khan', status: 'active', zone: 'Sector C' },
      ]);
    } catch (error) {
      console.error('Error fetching miners:', error);
      Alert.alert('Error', 'Failed to load miners. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchMiners();
  }, []);

  const handleAddMiner = () => {
    navigation.navigate('SupervisorAddMiner');
  };

  const handleMenuPress = (minerId) => {
    setMenuVisible(menuVisible === minerId ? null : minerId);
  };

  const handleViewMiner = (miner) => {
    setMenuVisible(null);
    // Navigate to miner details/profile view
    navigation.navigate('MinerProfile', { minerId: miner.id, minerData: miner });
  };

  const handleEditMiner = (miner) => {
    setMenuVisible(null);
    navigation.navigate('SupervisorEditMiner', { miner });
  };

  /**
   * PLACEHOLDER API CALL
   * Endpoint: DELETE /api/supervisor/miners/:id
   */
  const handleDeleteMiner = (miner) => {
    setMenuVisible(null);
    Alert.alert(
      'Remove Miner',
      `Are you sure you want to remove ${miner.name} from your team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Replace with actual API call
              // const token = await AuthService.getToken();
              // await fetch(`${API_CONFIG.BASE_URL}/api/miners/${miner.id}`, {
              //   method: 'DELETE',
              //   headers: { 'Authorization': `Bearer ${token}` }
              // });
              
              // Mock remove
              setMiners(prev => prev.filter(m => m.id !== miner.id));
              Alert.alert('Success', 'Miner removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove miner');
            }
          },
        },
      ]
    );
  };

  const renderMinerCard = (miner) => (
    <View key={miner.id} style={styles.minerCard}>
      <View style={styles.avatarCircle}>
        <Icon name="account" size={28} color={colors.text.light} />
      </View>
      <View style={styles.minerInfo}>
        <Text style={styles.minerName}>{miner.name}</Text>
        <Text style={styles.minerId}>ID: {miner.id}</Text>
        <View style={styles.minerMeta}>
          <View style={[
            styles.statusBadge,
            miner.status === 'active' ? styles.statusActive : styles.statusInactive
          ]}>
            <Text style={[
              styles.statusText,
              miner.status === 'active' ? styles.statusTextActive : styles.statusTextInactive
            ]}>
              {miner.status === 'active' ? 'Active' : 'Inactive'}
            </Text>
          </View>
          {miner.zone && (
            <Text style={styles.zoneText}>{miner.zone}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => handleMenuPress(miner.id)}
      >
        <Icon name="dots-vertical" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      
      {/* Dropdown Menu */}
      {menuVisible === miner.id && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleViewMiner(miner)}
          >
            <Icon name="eye" size={18} color={colors.text.secondary} />
            <Text style={styles.menuItemText}>View Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleEditMiner(miner)}
          >
            <Icon name="pencil" size={18} color={colors.text.secondary} />
            <Text style={styles.menuItemText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDanger]}
            onPress={() => handleDeleteMiner(miner)}
          >
            <Icon name="delete" size={18} color={colors.status.danger} />
            <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={32} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Miners</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Add New Miner Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddMiner}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Add New Miner</Text>
        </TouchableOpacity>

        {/* Miners List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading miners...</Text>
          </View>
        ) : miners.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="account-off" size={48} color={colors.text.light} />
            <Text style={styles.emptyText}>No miners assigned yet</Text>
            <Text style={styles.emptySubtext}>
              Add miners to your team to get started
            </Text>
          </View>
        ) : (
          <View style={styles.minersList}>
            {miners.map(renderMinerCard)}
          </View>
        )}
      </ScrollView>
    </View>
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
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
    position: 'relative',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    marginBottom: 2,
  },
  minerId: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  minerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: colors.status.successLight,
  },
  statusInactive: {
    backgroundColor: colors.gray[200],
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextActive: {
    color: colors.status.success,
  },
  statusTextInactive: {
    color: colors.text.secondary,
  },
  zoneText: {
    fontSize: 12,
    color: colors.text.light,
  },
  menuButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 56,
    right: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
    minWidth: 140,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    marginTop: 4,
    paddingTop: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: 10,
  },
  menuItemTextDanger: {
    color: colors.status.danger,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: colors.white,
    borderRadius: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export default SupervisorManageMinersScreen;
