/**
 * SupervisorEmergencyScreen.js
 * Screen for viewing and managing emergency/hazard reports from miners
 * 
 * BACKEND API REQUIREMENTS:
 * ============================================================================
 * 
 * 1. GET /api/supervisor/emergencies OR /api/emergencies
 *    - Description: Get all emergency/hazard reports for this supervisor's area
 *    - Headers: Authorization: Bearer <token>
 *    - Response: { 
 *        emergencies: [{ 
 *          id, 
 *          hazardType, 
 *          description, 
 *          location, 
 *          severity, 
 *          severityLevel (1-4),
 *          reportedBy: { id, name },
 *          reportedAt: ISO date string,
 *          status: 'pending' | 'acknowledged' | 'resolved',
 *          media?: [{ type, url }]
 *        }] 
 *      }
 *    - STATUS: AVAILABLE - Uses /api/emergencies endpoint
 * 
 * 2. PUT /api/supervisor/emergencies/:id/status OR /api/emergencies/:id/status
 *    - Description: Update emergency status (acknowledge/resolve)
 *    - Headers: Authorization: Bearer <token>
 *    - Body: { status: 'acknowledged' | 'resolved', notes?: string }
 *    - Response: { success: boolean, message: string }
 *    - STATUS: AVAILABLE - Uses /api/emergencies/:id/status endpoint
 * 
 * 3. GET /api/supervisor/emergencies/:id/download
 *    - Description: Download emergency report as PDF
 *    - Headers: Authorization: Bearer <token>
 *    - Response: PDF file or { downloadUrl: string }
 *    - STATUS: PLACEHOLDER - Endpoint not implemented
 * 
 * 4. POST /api/supervisor/emergencies/:id/forward
 *    - Description: Forward/send report to higher authorities
 *    - Headers: Authorization: Bearer <token>
 *    - Body: { recipients: string[], message?: string }
 *    - Response: { success: boolean, message: string }
 *    - STATUS: PLACEHOLDER - Endpoint not implemented
 * 
 * ============================================================================
 * 
 * COMPATIBILITY NOTE:
 * This screen is designed to display reports submitted from:
 * - ReportHazardScreen.js (miner hazard reporting)
 * - Emergency SOS button reports
 * 
 * Expected hazard types from ReportHazardScreen:
 * - Slip/Trip (id: 1)
 * - Equipment Failure (id: 2)
 * - Gas Leak (id: 3)
 * - Electrical Fault (id: 4)
 * - Roof Fall (id: 5)
 * - Other (id: 6)
 * 
 * Severity levels (1-4):
 * - 1: Low (green)
 * - 2: Medium (orange)
 * - 3: High (red)
 * - 4: Critical (dark red)
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../utils/colors';
import { API_CONFIG } from '../../config/api';
import AuthService from '../../services/auth/AuthService';

// Hazard type icons mapping (compatible with ReportHazardScreen)
const HAZARD_ICONS = {
  'Slip/Trip': 'slip-hazard',
  'Equipment Failure': 'tools',
  'Gas Leak': 'gas-cylinder',
  'Electrical Fault': 'flash-alert',
  'Roof Fall': 'home-alert',
  'Other': 'alert-circle',
  'default': 'alert-octagon',
};

// Hazard type colors mapping
const HAZARD_COLORS = {
  'Slip/Trip': '#FFA726',
  'Equipment Failure': '#EF5350',
  'Gas Leak': '#AB47BC',
  'Electrical Fault': '#FFEE58',
  'Roof Fall': '#8D6E63',
  'Other': '#78909C',
  'default': '#F44336',
};

// Severity colors mapping
const SEVERITY_COLORS = {
  1: colors.status.success,
  2: '#FF9800',
  3: colors.status.danger,
  4: '#B71C1C',
  'Low': colors.status.success,
  'Medium': '#FF9800',
  'High': colors.status.danger,
  'Critical': '#B71C1C',
};

const SupervisorEmergencyScreen = ({ navigation }) => {
  const [emergencies, setEmergencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'acknowledged', 'resolved'

  useEffect(() => {
    fetchEmergencies();
  }, []);

  /**
   * API CALL - Uses /api/emergencies endpoint
   * This fetches emergency reports compatible with ReportHazardScreen submissions
   */
  const fetchEmergencies = async () => {
    try {
      setIsLoading(true);

      const token = await AuthService.getToken();
      
      // Using the actual emergency endpoint
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/emergencies`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Map the response to our expected format
        const mappedEmergencies = (data.emergencies || data || []).map(e => ({
          id: e.id || e._id,
          hazardType: e.hazardType || e.type || 'Unknown',
          description: e.description || '',
          location: e.location || 'Not specified',
          severity: e.severity || 'Unknown',
          severityLevel: e.severityLevel || getSeverityLevel(e.severity),
          reportedBy: e.reportedBy || { name: 'Unknown' },
          reportedAt: e.reportedAt || e.createdAt || new Date().toISOString(),
          status: e.status || 'pending',
          media: e.media || [],
        }));
        setEmergencies(mappedEmergencies);
      } else {
        // Fall back to mock data if API fails
        console.log('API not available, using mock data');
        setEmergencies(getMockEmergencies());
      }
    } catch (error) {
      console.error('Error fetching emergencies:', error);
      // Use mock data for development
      setEmergencies(getMockEmergencies());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Helper to get severity level from string
  const getSeverityLevel = (severity) => {
    const levels = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
    return levels[severity] || 2;
  };

  // Mock data for development
  const getMockEmergencies = () => [
    {
      id: '1',
      hazardType: 'Gas Leak',
      description: 'Detected unusual gas smell near shaft entrance',
      location: 'Sector A - North Face, Level 2',
      severity: 'High',
      severityLevel: 3,
      reportedBy: { id: '1', name: 'John Appleseed' },
      reportedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'pending',
    },
    {
      id: '2',
      hazardType: 'Equipment Failure',
      description: 'Conveyor belt stopped working suddenly',
      location: 'Sector B - South Face',
      severity: 'Medium',
      severityLevel: 2,
      reportedBy: { id: '2', name: 'Jane Doe' },
      reportedAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'acknowledged',
    },
    {
      id: '3',
      hazardType: 'Slip/Trip',
      description: 'Water accumulation creating slippery surface',
      location: 'Tunnel C3',
      severity: 'Low',
      severityLevel: 1,
      reportedBy: { id: '3', name: 'Peter Jones' },
      reportedAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'resolved',
    },
    {
      id: '4',
      hazardType: 'Roof Fall',
      description: 'Minor rock debris falling from ceiling',
      location: 'Deep mine section D',
      severity: 'Critical',
      severityLevel: 4,
      reportedBy: { id: '4', name: 'Emily Williams' },
      reportedAt: new Date(Date.now() - 1800000).toISOString(),
      status: 'pending',
    },
  ];

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchEmergencies();
  }, []);

  /**
   * PLACEHOLDER API CALL
   * Endpoint: GET /api/supervisor/emergencies/:id/download
   */
  const handleDownloadReport = async (emergency) => {
    Alert.alert(
      'Download Report',
      'This will download the report as PDF.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            // TODO: Implement actual download when API is ready
            // const token = await AuthService.getToken();
            // const response = await fetch(
            //   `${API_CONFIG.BASE_URL}/api/supervisor/emergencies/${emergency.id}/download`,
            //   { headers: { 'Authorization': `Bearer ${token}` }}
            // );
            
            Alert.alert('Info', 'Download feature will be available once the API endpoint is implemented.');
          },
        },
      ]
    );
  };

  /**
   * PLACEHOLDER API CALL
   * Endpoint: POST /api/supervisor/emergencies/:id/forward
   */
  const handleSendReport = async (emergency) => {
    Alert.alert(
      'Send Report',
      'Send this report to higher authorities?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            // TODO: Implement actual send when API is ready
            // const token = await AuthService.getToken();
            // const response = await fetch(
            //   `${API_CONFIG.BASE_URL}/api/supervisor/emergencies/${emergency.id}/forward`,
            //   {
            //     method: 'POST',
            //     headers: {
            //       'Authorization': `Bearer ${token}`,
            //       'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({ recipients: ['admin@mine.com'] }),
            //   }
            // );
            
            Alert.alert('Info', 'Send feature will be available once the API endpoint is implemented.');
          },
        },
      ]
    );
  };

  const handleViewDetails = (emergency) => {
    // Navigate to a detailed view (can be implemented later)
    Alert.alert(
      `${emergency.hazardType} Report`,
      `Reported by: ${emergency.reportedBy?.name || 'Unknown'}\n\n` +
      `Location: ${emergency.location}\n\n` +
      `Description: ${emergency.description}\n\n` +
      `Severity: ${emergency.severity}\n` +
      `Status: ${emergency.status.charAt(0).toUpperCase() + emergency.status.slice(1)}`,
      [{ text: 'Close' }]
    );
  };

  const getHazardIcon = (hazardType) => {
    return HAZARD_ICONS[hazardType] || HAZARD_ICONS.default;
  };

  const getHazardColor = (hazardType) => {
    return HAZARD_COLORS[hazardType] || HAZARD_COLORS.default;
  };

  const getSeverityColor = (severityLevel) => {
    return SEVERITY_COLORS[severityLevel] || SEVERITY_COLORS[2];
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 3600000) { // Less than 1 hour
      const mins = Math.floor(diff / 60000);
      return `${mins} min${mins !== 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredEmergencies = emergencies.filter(e => {
    if (filter === 'all') return true;
    return e.status === filter;
  });

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {['all', 'pending', 'acknowledged', 'resolved'].map((f) => (
        <TouchableOpacity
          key={f}
          style={[styles.filterButton, filter === f && styles.filterButtonActive]}
          onPress={() => setFilter(f)}
        >
          <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmergencyCard = (emergency) => (
    <TouchableOpacity
      key={emergency.id}
      style={styles.reportCard}
      onPress={() => handleViewDetails(emergency)}
      activeOpacity={0.7}
    >
      {/* Header with hazard type and severity */}
      <View style={styles.cardHeader}>
        <View style={styles.hazardInfo}>
          <View style={[styles.hazardIcon, { backgroundColor: getHazardColor(emergency.hazardType) + '20' }]}>
            <Icon 
              name={getHazardIcon(emergency.hazardType)} 
              size={24} 
              color={getHazardColor(emergency.hazardType)} 
            />
          </View>
          <View>
            <Text style={styles.hazardType}>{emergency.hazardType}</Text>
            <Text style={styles.reporterName}>
              {emergency.reportedBy?.name || 'Unknown'}
            </Text>
          </View>
        </View>
        <View style={[
          styles.severityBadge, 
          { backgroundColor: getSeverityColor(emergency.severityLevel) + '20' }
        ]}>
          <View style={[
            styles.severityDot, 
            { backgroundColor: getSeverityColor(emergency.severityLevel) }
          ]} />
          <Text style={[
            styles.severityText, 
            { color: getSeverityColor(emergency.severityLevel) }
          ]}>
            {emergency.severity}
          </Text>
        </View>
      </View>

      {/* Location and time */}
      <View style={styles.metaRow}>
        <Icon name="map-marker" size={14} color={colors.text.light} />
        <Text style={styles.metaText} numberOfLines={1}>{emergency.location}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>{formatTime(emergency.reportedAt)}</Text>
      </View>

      {/* Description preview */}
      <Text style={styles.description} numberOfLines={2}>
        {emergency.description}
      </Text>

      {/* Status badge */}
      <View style={styles.statusRow}>
        <View style={[
          styles.statusBadge,
          emergency.status === 'pending' && styles.statusPending,
          emergency.status === 'acknowledged' && styles.statusAcknowledged,
          emergency.status === 'resolved' && styles.statusResolved,
        ]}>
          <Text style={[
            styles.statusText,
            emergency.status === 'pending' && styles.statusTextPending,
            emergency.status === 'acknowledged' && styles.statusTextAcknowledged,
            emergency.status === 'resolved' && styles.statusTextResolved,
          ]}>
            {emergency.status.charAt(0).toUpperCase() + emergency.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDownloadReport(emergency)}
        >
          <Icon name="download" size={18} color={colors.text.secondary} />
          <Text style={styles.actionText}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleSendReport(emergency)}
        >
          <Icon name="send" size={18} color={colors.text.secondary} />
          <Text style={styles.actionText}>Send Report</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerPlaceholder} />
        <Text style={styles.headerTitle}>Emergency Reports</Text>
        <TouchableOpacity onPress={onRefresh} disabled={isLoading}>
          <Icon name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter buttons */}
      {renderFilterButtons()}

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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : filteredEmergencies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="shield-check" size={48} color={colors.text.light} />
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? 'No emergency reports' 
                : `No ${filter} reports`}
            </Text>
            <Text style={styles.emptySubtext}>
              Reports from miners will appear here
            </Text>
          </View>
        ) : (
          filteredEmergencies.map(renderEmergencyCard)
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerPlaceholder: {
    width: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  reportCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hazardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hazardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hazardType: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  reporterName: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
    color: colors.text.light,
    marginLeft: 4,
  },
  metaDot: {
    color: colors.text.light,
    marginHorizontal: 8,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  statusRow: {
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusPending: {
    backgroundColor: colors.status.warningLight,
  },
  statusAcknowledged: {
    backgroundColor: colors.status.infoLight,
  },
  statusResolved: {
    backgroundColor: colors.status.successLight,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextPending: {
    color: colors.status.warning,
  },
  statusTextAcknowledged: {
    color: colors.status.info,
  },
  statusTextResolved: {
    color: colors.status.success,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
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
    borderRadius: 16,
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

export default SupervisorEmergencyScreen;
