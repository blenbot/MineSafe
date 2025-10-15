import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../utils/colors';

const PPEChecklistItem = ({ label, checked, onToggle }) => {
  return (
    <TouchableOpacity 
      style={[styles.chip, checked && styles.chipActive]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, checked && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.white,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.primary,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default PPEChecklistItem;
