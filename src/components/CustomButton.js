import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import colors from '../utils/colors';

const CustomButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'danger'
  size = 'large', // 'small', 'medium', 'large'
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${size}`]];
    
    switch (variant) {
      case 'secondary':
        return [...baseStyle, styles.buttonSecondary];
      case 'outline':
        return [...baseStyle, styles.buttonOutline];
      case 'danger':
        return [...baseStyle, styles.buttonDanger];
      default:
        return [...baseStyle, styles.buttonPrimary];
    }
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`buttonText_${size}`]];
    
    switch (variant) {
      case 'outline':
        return [...baseStyle, styles.buttonTextOutline];
      default:
        return baseStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[
        ...getButtonStyle(),
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? colors.primary : colors.white} 
          size="small" 
        />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_small: {
    height: 40,
    paddingHorizontal: 20,
  },
  button_medium: {
    height: 48,
    paddingHorizontal: 24,
  },
  button_large: {
    height: 56,
    paddingHorizontal: 32,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonSecondary: {
    backgroundColor: colors.secondaryLight,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonDanger: {
    backgroundColor: colors.status.danger,
    shadowColor: colors.status.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
  },
  buttonText_small: {
    fontSize: 14,
  },
  buttonText_medium: {
    fontSize: 16,
  },
  buttonText_large: {
    fontSize: 18,
  },
  buttonTextOutline: {
    color: colors.primary,
  },
});

export default CustomButton;
