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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthService from '../services/auth/AuthService';
import colors from '../utils/colors';

const AdminHomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await AuthService.getUserData();
      setUserData(user);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const renderProfileTab = () => (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Avatar Card */}
      <View style={styles.avatarCard}>
        <View style={styles.avatarCircle}>
          <Icon name="account" size={48} color={colors.text.light} />
        </View>
      </View>

      {/* Name Card */}
      <View style={styles.nameCard}>
        <Text style={styles.nameText}>{userData?.name || 'Admin User'}</Text>
        <Text style={styles.roleTag}>Administrator</Text>
      </View>

      {/* Details Card */}
      <View style={styles.detailsCard}>
        {/* Mobile Number Row */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Mobile Number</Text>
          <Text style={styles.detailValue}>{userData?.phone || 'Not set'}</Text>
        </View>
        <View style={styles.divider} />

        {/* Admin ID Row */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Admin ID</Text>
          <Text style={styles.detailValue}>{userData?.user_id || 'N/A'}</Text>
        </View>
        <View style={styles.divider} />

        {/* Email Row */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{userData?.email || 'Not set'}</Text>
        </View>
        <View style={styles.divider} />

        {/* Mine Site Row */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Mine Site</Text>
          <Text style={styles.detailValue}>{userData?.mining_site || 'Not assigned'}</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color={colors.status.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderMinersTab = () => (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Add New Miner Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AddMiner')}
      >
        <Icon name="plus" size={20} color={colors.white} />
        <Text style={styles.addButtonText}>Add New Miner</Text>
      </TouchableOpacity>

      {/* View All Miners */}
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => navigation.navigate('MinersList')}
      >
        <Icon name="account-group" size={24} color={colors.primary} />
        <View style={styles.viewAllContent}>
          <Text style={styles.viewAllTitle}>View All Miners</Text>
          <Text style={styles.viewAllSubtitle}>Manage miner records</Text>
        </View>
        <Icon name="chevron-right" size={24} color={colors.text.light} />
      </TouchableOpacity>

      {/* Quick Stats Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Quick Actions</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('MinersList')}
          >
            <Icon name="account-search" size={28} color={colors.primary} />
            <Text style={styles.statLabel}>Search Miner</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('AddMiner')}
          >
            <Icon name="account-plus" size={28} color={colors.status.success} />
            <Text style={styles.statLabel}>Add Miner</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderSupervisorsTab = () => (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Add Supervisor Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AddSupervisor')}
      >
        <Icon name="plus" size={20} color={colors.white} />
        <Text style={styles.addButtonText}>Add Supervisor</Text>
      </TouchableOpacity>

      {/* View All Supervisors */}
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => navigation.navigate('SupervisorsList')}
      >
        <Icon name="shield-account" size={24} color={colors.primary} />
        <View style={styles.viewAllContent}>
          <Text style={styles.viewAllTitle}>View All Supervisors</Text>
          <Text style={styles.viewAllSubtitle}>Manage supervisor records</Text>
        </View>
        <Icon name="chevron-right" size={24} color={colors.text.light} />
      </TouchableOpacity>

      {/* Quick Stats Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Quick Actions</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('SupervisorsList')}
          >
            <Icon name="account-search" size={28} color={colors.primary} />
            <Text style={styles.statLabel}>Search Supervisor</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('AddSupervisor')}
          >
            <Icon name="shield-plus" size={28} color={colors.status.success} />
            <Text style={styles.statLabel}>Add Supervisor</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'miners':
        return renderMinersTab();
      case 'supervisors':
        return renderSupervisorsTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('profile')}
        >
          <Icon 
            name="account" 
            size={24} 
            color={activeTab === 'profile' ? colors.primary : colors.text.light} 
          />
          <Text style={[
            styles.tabLabel,
            activeTab === 'profile' && styles.tabLabelActive
          ]}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('miners')}
        >
          <Icon 
            name="pickaxe" 
            size={24} 
            color={activeTab === 'miners' ? colors.primary : colors.text.light} 
          />
          <Text style={[
            styles.tabLabel,
            activeTab === 'miners' && styles.tabLabelActive
          ]}>Miners</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('supervisors')}
        >
          <Icon 
            name="shield-account" 
            size={24} 
            color={activeTab === 'supervisors' ? colors.primary : colors.text.light} 
          />
          <Text style={[
            styles.tabLabel,
            activeTab === 'supervisors' && styles.tabLabelActive
          ]}>Supervisors</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  roleTag: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primaryFaded,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  detailLabel: {
    fontSize: 15,
    color: colors.text.secondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'right',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.status.danger,
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 50,
    padding: 18,
    marginBottom: 20,
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  viewAllContent: {
    flex: 1,
    marginLeft: 16,
  },
  viewAllTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  viewAllSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    padding: 16,
  },
  statLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 8,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.light,
    marginTop: 4,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default AdminHomeScreen;
