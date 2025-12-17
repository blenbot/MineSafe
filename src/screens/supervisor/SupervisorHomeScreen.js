/**
 * SupervisorHomeScreen.js
 * Main home screen for supervisors with bottom tab navigation
 * 
 * This serves as a tab navigator container for the supervisor screens
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../utils/colors';

// Import supervisor tab screens
import SupervisorModulesScreen from './SupervisorModulesScreen';
import SupervisorMinersScreen from './SupervisorMinersScreen';
import SupervisorEmergencyScreen from './SupervisorEmergencyScreen';
import SupervisorProfileScreen from './SupervisorProfileScreen';
import SupervisorBottomNavBar from '../../components/SupervisorBottomNavBar';

const SupervisorHomeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('modules');

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'modules':
        return <SupervisorModulesScreen navigation={navigation} />;
      case 'miners':
        return <SupervisorMinersScreen navigation={navigation} />;
      case 'emergency':
        return <SupervisorEmergencyScreen navigation={navigation} />;
      case 'profile':
        return <SupervisorProfileScreen navigation={navigation} />;
      default:
        return <SupervisorModulesScreen navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Active Screen Content */}
      <View style={styles.content}>
        {renderActiveScreen()}
      </View>
      
      {/* Floating Action Button - Upload Video */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('SupervisorUploadModule')}
        activeOpacity={0.8}
      >
        <Icon name="plus" size={28} color={colors.white} />
      </TouchableOpacity>
      
      {/* Bottom Navigation */}
      <SupervisorBottomNavBar 
        activeTab={activeTab} 
        onTabPress={setActiveTab} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 100,
  },
});

export default SupervisorHomeScreen;
