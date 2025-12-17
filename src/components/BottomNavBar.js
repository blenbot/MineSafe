import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

const NAV_ITEMS = {
  miner: [
    { key: 'home', icon: 'home', label: 'Home', route: 'MinerHome' },
    { key: 'video', icon: 'play-circle-outline', label: 'Video', route: 'Training' },
    { key: 'training', icon: 'school-outline', label: 'Training', route: 'TrainingModule' },
    { key: 'profile', icon: 'account-outline', label: 'Profile', route: 'Profile' },
  ],
  operator: [
    { key: 'home', icon: 'home', label: 'Home', route: 'OperatorHome' },
    { key: 'checklist', icon: 'clipboard-check-outline', label: 'Checklists', route: 'Checklists' },
    { key: 'training', icon: 'school-outline', label: 'Training', route: 'Training' },
    { key: 'profile', icon: 'account-outline', label: 'Profile', route: 'Profile' },
  ],
  supervisor: [
    { key: 'home', icon: 'home', label: 'Dashboard', route: 'SupervisorHome' },
    { key: 'miners', icon: 'account-group-outline', label: 'Miners', route: 'MinersList' },
    { key: 'reports', icon: 'file-document-outline', label: 'Reports', route: 'Reports' },
    { key: 'profile', icon: 'account-outline', label: 'Profile', route: 'Profile' },
  ],
};

const BottomNavBar = ({ activeRoute, navigation, role = 'miner' }) => {
  const navItems = NAV_ITEMS[role.toLowerCase()] || NAV_ITEMS.miner;

  const handleNavPress = (route) => {
    if (route !== activeRoute) {
      navigation.navigate(route);
    }
  };

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = activeRoute === item.route || activeRoute === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => handleNavPress(item.route)}
            activeOpacity={0.7}
          >
            <Icon
              name={isActive ? item.icon.replace('-outline', '') : item.icon}
              size={24}
              color={isActive ? colors.primary : colors.gray[400]}
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
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    marginTop: -2,
  },
  navText: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 4,
  },
  navTextActive: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default BottomNavBar;
