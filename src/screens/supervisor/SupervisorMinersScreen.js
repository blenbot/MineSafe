/**
 * SupervisorMinersScreen.js
 * Options screen for miner management
 * 
 * This screen provides navigation to:
 * - Manage Miners (view, edit, delete miners)
 * - Allocate Mines (assign miners to zones/departments)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../utils/colors';

const SupervisorMinersScreen = ({ navigation }) => {
  const options = [
    {
      id: 'manage',
      title: 'Manage Miners',
      subtitle: 'View and manage all miners',
      icon: 'account-group',
      screen: 'SupervisorManageMiners',
    },
    {
      id: 'allocate',
      title: 'Allocate Mines',
      subtitle: 'Assign miners to zones',
      icon: 'map-marker-radius',
      screen: 'SupervisorAllocateMines',
    },
  ];

  const handleOptionPress = (screen) => {
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerPlaceholder} />
        <Text style={styles.headerTitle}>Miners</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Options Cards */}
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionCard}
            onPress={() => handleOptionPress(option.screen)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Icon name={option.icon} size={28} color={colors.primary} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <Icon name="chevron-right" size={28} color={colors.text.light} />
          </TouchableOpacity>
        ))}

        {/* Quick Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Quick Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>--</Text>
              <Text style={styles.statLabel}>Total Miners</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>--</Text>
              <Text style={styles.statLabel}>Active Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>--</Text>
              <Text style={styles.statLabel}>Unassigned</Text>
            </View>
          </View>
          <Text style={styles.statsNote}>
            Stats will load from server when API is available
          </Text>
        </View>
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
    width: 40,
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
    padding: 20,
    paddingBottom: 100,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
  },
  statsNote: {
    fontSize: 11,
    color: colors.text.light,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default SupervisorMinersScreen;
