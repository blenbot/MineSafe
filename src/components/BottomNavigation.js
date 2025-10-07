// src/components/BottomNavigation.js
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import COLORS from '../constants/colors';

const BottomNavigation = ({ activeScreen, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', icon: 'apps', label: 'Live' },
    { id: 'sos', icon: 'shield-checkmark-outline', label: 'SOS' },
    { id: 'settings', icon: 'settings-outline', label: 'Settings' },
    { id: 'alert', icon: 'notifications-outline', label: 'Alert' },
  ];

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = activeScreen === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={() => onNavigate(item.id)}
          >
            <Icon
              name={item.icon}
              size={24}
              color={isActive ? COLORS.activeTab : COLORS.inactiveTab}
            />
            <Text style={[styles.navText, isActive && styles.navTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  navItem: {
    alignItems: 'center',
    gap: 5,
  },
  navText: {
    color: COLORS.inactiveTab,
    fontSize: 12,
  },
  navTextActive: {
    color: COLORS.activeTab,
  },
});

export default BottomNavigation;