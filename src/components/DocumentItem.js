// src/components/DocumentItem.js
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import COLORS from '../constants/colors';

const DocumentItem = ({ iconName, iconColor, title, value, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.documentItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon name={iconName} size={20} color={iconColor} />
      <View style={styles.documentTextContainer}>
        <Text style={styles.documentTitle}>{title}</Text>
        <Text style={styles.documentValue}>{value}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color={COLORS.textDark} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.iconBackgroundLight,
    padding: 18,
    borderRadius: 12,
    gap: 15,
  },
  documentTextContainer: {
    flex: 1,
  },
  documentTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentValue: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});

export default DocumentItem;