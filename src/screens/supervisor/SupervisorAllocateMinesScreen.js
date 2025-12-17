/**
 * SupervisorAllocateMinesScreen.js
 * Screen for assigning miners to mine zones/departments
 * 
 * BACKEND API REQUIREMENTS:
 * ============================================================================
 * 
 * 1. GET /api/supervisor/miners
 *    - Description: Get list of miners to assign
 *    - Headers: Authorization: Bearer <token>
 *    - Response: { miners: [{ id, name, currentZone }] }
 *    - STATUS: PLACEHOLDER - Endpoint available as /api/miners
 * 
 * 2. GET /api/supervisor/zones
 *    - Description: Get list of available mine zones/departments
 *    - Headers: Authorization: Bearer <token>
 *    - Response: { zones: [{ id, name, location, capacity, currentCount }] }
 *    - STATUS: PLACEHOLDER - Endpoint not implemented
 * 
 * 3. POST /api/supervisor/allocate
 *    - Description: Assign a miner to a specific zone
 *    - Headers: Authorization: Bearer <token>
 *    - Body: { minerId: string, zoneId: string }
 *    - Response: { success: boolean, message: string }
 *    - STATUS: PLACEHOLDER - Endpoint not implemented
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

const SupervisorAllocateMinesScreen = ({ navigation }) => {
  const [selectedMiner, setSelectedMiner] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [miners, setMiners] = useState([]);
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [minerDropdownOpen, setMinerDropdownOpen] = useState(false);
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  /**
   * PLACEHOLDER API CALLS
   * Endpoints: GET /api/supervisor/miners, GET /api/supervisor/zones
   */
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // TODO: Replace with actual API calls
      // const token = await AuthService.getToken();
      // const [minersRes, zonesRes] = await Promise.all([
      //   fetch(`${API_CONFIG.BASE_URL}/api/miners`, {
      //     headers: { 'Authorization': `Bearer ${token}` }
      //   }),
      //   fetch(`${API_CONFIG.BASE_URL}/api/supervisor/zones`, {
      //     headers: { 'Authorization': `Bearer ${token}` }
      //   })
      // ]);
      // const minersData = await minersRes.json();
      // const zonesData = await zonesRes.json();
      // setMiners(minersData.miners);
      // setZones(zonesData.zones);

      // Mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      setMiners([
        { id: '1', name: 'John Doe', currentZone: 'Sector A - North Face' },
        { id: '2', name: 'Jane Smith', currentZone: 'Unassigned' },
        { id: '3', name: 'Carlos Garcia', currentZone: 'Sector B - South Face' },
        { id: '4', name: 'Aisha Khan', currentZone: 'Unassigned' },
      ]);
      setZones([
        { id: 'z1', name: 'Sector A - North Face', capacity: 20, currentCount: 15 },
        { id: 'z2', name: 'Sector B - South Face', capacity: 15, currentCount: 10 },
        { id: 'z3', name: 'Sector C - East Face', capacity: 25, currentCount: 18 },
        { id: 'z4', name: 'Sector D - West Face', capacity: 10, currentCount: 5 },
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * PLACEHOLDER API CALL
   * Endpoint: POST /api/supervisor/allocate
   */
  const handleAssign = async () => {
    if (!selectedMiner) {
      Alert.alert('Selection Required', 'Please select a miner');
      return;
    }
    if (!selectedZone) {
      Alert.alert('Selection Required', 'Please select a mine zone');
      return;
    }

    try {
      setIsAssigning(true);

      // TODO: Replace with actual API call
      // const token = await AuthService.getToken();
      // const response = await fetch(`${API_CONFIG.BASE_URL}/api/supervisor/allocate`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     minerId: selectedMiner.id,
      //     zoneId: selectedZone.id,
      //   }),
      // });
      // const data = await response.json();

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Success',
        `${selectedMiner.name} has been assigned to ${selectedZone.name}`,
        [{ text: 'OK', onPress: () => {
          setSelectedMiner(null);
          setSelectedZone(null);
          fetchData(); // Refresh data
        }}]
      );
    } catch (error) {
      console.error('Error assigning miner:', error);
      Alert.alert('Error', 'Failed to assign miner. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleMinerDropdown = () => {
    setMinerDropdownOpen(!minerDropdownOpen);
    setZoneDropdownOpen(false);
  };

  const toggleZoneDropdown = () => {
    setZoneDropdownOpen(!zoneDropdownOpen);
    setMinerDropdownOpen(false);
  };

  const selectMiner = (miner) => {
    setSelectedMiner(miner);
    setMinerDropdownOpen(false);
  };

  const selectZone = (zone) => {
    setSelectedZone(zone);
    setZoneDropdownOpen(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={32} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Allocate Mines</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Select Miner Dropdown */}
        <View style={[styles.dropdownCard, { zIndex: 20 }]}>
          <Text style={styles.label}>Select Miner</Text>
          <TouchableOpacity
            style={styles.selectWrapper}
            onPress={toggleMinerDropdown}
          >
            <Text style={[
              styles.selectText,
              !selectedMiner && styles.selectPlaceholder
            ]}>
              {selectedMiner ? selectedMiner.name : 'Choose a miner...'}
            </Text>
            <Icon 
              name={minerDropdownOpen ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color={colors.text.secondary} 
            />
          </TouchableOpacity>
          
          {minerDropdownOpen && (
            <View style={styles.dropdownList}>
              {miners.map((miner) => (
                <TouchableOpacity
                  key={miner.id}
                  style={[
                    styles.dropdownItem,
                    selectedMiner?.id === miner.id && styles.dropdownItemSelected
                  ]}
                  onPress={() => selectMiner(miner)}
                >
                  <View style={styles.dropdownItemContent}>
                    <Text style={styles.dropdownItemText}>{miner.name}</Text>
                    <Text style={styles.dropdownItemSubtext}>
                      Current: {miner.currentZone}
                    </Text>
                  </View>
                  {selectedMiner?.id === miner.id && (
                    <Icon name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Select Zone Dropdown */}
        <View style={[styles.dropdownCard, { zIndex: 10 }]}>
          <Text style={styles.label}>Select Mine Zone/Department</Text>
          <TouchableOpacity
            style={styles.selectWrapper}
            onPress={toggleZoneDropdown}
          >
            <Text style={[
              styles.selectText,
              !selectedZone && styles.selectPlaceholder
            ]}>
              {selectedZone ? selectedZone.name : 'Choose a zone...'}
            </Text>
            <Icon 
              name={zoneDropdownOpen ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color={colors.text.secondary} 
            />
          </TouchableOpacity>
          
          {zoneDropdownOpen && (
            <View style={styles.dropdownList}>
              {zones.map((zone) => (
                <TouchableOpacity
                  key={zone.id}
                  style={[
                    styles.dropdownItem,
                    selectedZone?.id === zone.id && styles.dropdownItemSelected
                  ]}
                  onPress={() => selectZone(zone)}
                >
                  <View style={styles.dropdownItemContent}>
                    <Text style={styles.dropdownItemText}>{zone.name}</Text>
                    <Text style={styles.dropdownItemSubtext}>
                      Capacity: {zone.currentCount}/{zone.capacity}
                    </Text>
                  </View>
                  {selectedZone?.id === zone.id && (
                    <Icon name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Selection Summary */}
        {selectedMiner && selectedZone && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Assignment Summary</Text>
            <View style={styles.summaryRow}>
              <Icon name="account" size={20} color={colors.text.secondary} />
              <Text style={styles.summaryText}>{selectedMiner.name}</Text>
            </View>
            <View style={styles.summaryArrow}>
              <Icon name="arrow-down" size={24} color={colors.primary} />
            </View>
            <View style={styles.summaryRow}>
              <Icon name="map-marker" size={20} color={colors.text.secondary} />
              <Text style={styles.summaryText}>{selectedZone.name}</Text>
            </View>
          </View>
        )}

        {/* Assign Button */}
        <TouchableOpacity
          style={[
            styles.assignButton,
            (!selectedMiner || !selectedZone || isAssigning) && styles.assignButtonDisabled
          ]}
          onPress={handleAssign}
          activeOpacity={0.8}
          disabled={!selectedMiner || !selectedZone || isAssigning}
        >
          {isAssigning ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Icon name="check-circle" size={20} color={colors.white} />
              <Text style={styles.assignButtonText}>Assign Miner to Mine</Text>
            </>
          )}
        </TouchableOpacity>
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
  dropdownCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: colors.text.light,
    marginBottom: 8,
    fontWeight: '500',
  },
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  selectText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  selectPlaceholder: {
    color: colors.text.light,
    fontWeight: '400',
  },
  dropdownList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: 12,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primaryFaded,
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dropdownItemSubtext: {
    fontSize: 12,
    color: colors.text.light,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: colors.primaryFaded,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  summaryArrow: {
    marginVertical: 8,
  },
  assignButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  assignButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  assignButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    marginLeft: 8,
  },
});

export default SupervisorAllocateMinesScreen;
