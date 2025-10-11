import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../utils/colors';

const ProgressCircle = ({ 
  percentage = 75, 
  size = 80,
  strokeWidth = 8,
  color = colors.primary,
  backgroundColor = '#FFE4D1'
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View 
        style={[
          styles.circle, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
            borderLeftColor: color,
            borderTopColor: color,
          }
        ]}
      >
        <View style={styles.innerCircle}>
          <Text style={[styles.percentageText, { color }]}>
            {percentage}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
  innerCircle: {
    transform: [{ rotate: '-135deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: '700',
  },
});

export default ProgressCircle;
