// src/components/ActionCard.js
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import COLORS from '../constants/colors';

const ActionCard = ({ title, iconName, iconColor, onPress }) => {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <Text style={styles.actionCardTitle}>{title}</Text>
      <View style={styles.actionIconContainer}>
        <Icon name={iconName} size={40} color={iconColor} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionCard: {
    backgroundColor: COLORS.secondaryCard,
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 15,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  actionCardTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  actionIconContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
});

export default ActionCard;