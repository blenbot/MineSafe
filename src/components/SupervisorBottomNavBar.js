/**
 * SupervisorBottomNavBar.js
 * Bottom navigation bar component for supervisor screens
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

const SupervisorBottomNavBar = ({ activeTab, onTabPress }) => {
  const tabs = [
    { id: 'modules', label: 'Modules', icon: 'video-box', activeIcon: 'video-box' },
    { id: 'miners', label: 'Miners', icon: 'account-group-outline', activeIcon: 'account-group' },
    { id: 'emergency', label: 'Emergency', icon: 'alert-outline', activeIcon: 'alert' },
    { id: 'profile', label: 'Profile', icon: 'account-outline', activeIcon: 'account' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <Icon
              name={isActive ? tab.activeIcon : tab.icon}
              size={24}
              color={isActive ? colors.primary : colors.text.light}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabItemActive: {
    backgroundColor: colors.primaryFaded,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.light,
    marginTop: 4,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default SupervisorBottomNavBar;
