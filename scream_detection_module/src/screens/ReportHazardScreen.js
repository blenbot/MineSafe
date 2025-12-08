// src/screens/ReportHazardScreen.js

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

const hazardTypes = [
  { id: 'slip', icon: 'walk', label: 'Slip/Trip' },
  { id: 'equipment', icon: 'wrench', label: 'Equipment Failure' },
  { id: 'gas', icon: 'gas-cylinder', label: 'Gas Leak' },
  { id: 'electrical', icon: 'flash', label: 'Electrical Fault' },
  { id: 'roof', icon: 'home-roof', label: 'Roof Fall' },
  { id: 'other', icon: 'help-circle', label: 'Other' },
];

const ReportHazardScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report a Hazard</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.hazardGrid}>
          {hazardTypes.map((hazard) => (
            <TouchableOpacity
              key={hazard.id}
              style={styles.hazardCard}
              onPress={() => navigation.navigate('HazardDetails', { type: hazard.label })}
            >
              <View style={styles.hazardIconContainer}>
                <Icon name={hazard.icon} size={40} color={colors.text.primary} />
              </View>
              <Text style={styles.hazardLabel}>{hazard.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => navigation.navigate('HazardDetails')}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Icon name="arrow-right" size={20} color={colors.white} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  hazardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  hazardCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  hazardIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  hazardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportHazardScreen;