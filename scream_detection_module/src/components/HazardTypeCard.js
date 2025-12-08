import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

const HazardTypeCard = ({ 
  icon, 
  label, 
  onPress, 
  selected = false 
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.containerSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Icon 
          name={icon} 
          size={48} 
          color={selected ? colors.primary : colors.text.primary} 
        />
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 160,
    justifyContent: 'center',
  },
  containerSelected: {
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: '#FFF5F0',
  },
  iconContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.primary,
  },
});

export default HazardTypeCard;