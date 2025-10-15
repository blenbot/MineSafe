import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

const BadgeCard = ({ 
  icon, 
  name, 
  color = colors.badge.gold,
  earned = true,
  onPress 
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!earned}
    >
      <View 
        style={[
          styles.iconContainer, 
          { backgroundColor: earned ? color + '20' : 'rgba(255, 255, 255, 0.1)' }
        ]}
      >
        <Icon 
          name={icon} 
          size={32} 
          color={earned ? color : 'rgba(255, 255, 255, 0.3)'} 
        />
      </View>
      <Text style={[styles.name, !earned && styles.nameLocked]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  nameLocked: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

export default BadgeCard;