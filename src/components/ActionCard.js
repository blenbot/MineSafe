import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

const ActionCard = ({
  title,
  subtitle,
  icon,
  iconBackgroundColor = colors.secondaryLight,
  iconColor = colors.primary,
  onPress,
  showChevron = true,
  variant = 'default', // 'default', 'danger', 'success', 'warning'
  style,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'danger':
        return {
          container: styles.containerDanger,
          iconBg: '#FFE6E6',
          iconColor: colors.status.danger,
          textColor: colors.status.danger,
        };
      case 'success':
        return {
          container: styles.containerSuccess,
          iconBg: '#E6FFE6',
          iconColor: colors.status.success,
          textColor: colors.status.success,
        };
      case 'warning':
        return {
          container: styles.containerWarning,
          iconBg: '#FFF5E6',
          iconColor: colors.status.warning,
          textColor: colors.status.warning,
        };
      default:
        return {
          container: {},
          iconBg: iconBackgroundColor,
          iconColor: iconColor,
          textColor: colors.text.primary,
        };
    }
  };

  const variantStyle = getVariantStyle();

  return (
    <TouchableOpacity
      style={[styles.container, variantStyle.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: variantStyle.iconBg }]}>
          <Icon name={icon} size={22} color={variantStyle.iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: variantStyle.textColor }]}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showChevron && (
        <Icon 
          name="chevron-right" 
          size={24} 
          color={variant === 'default' ? colors.gray[400] : variantStyle.iconColor} 
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  containerDanger: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  containerSuccess: {
    backgroundColor: '#F5FFF5',
    borderWidth: 1,
    borderColor: '#E0FFE0',
  },
  containerWarning: {
    backgroundColor: '#FFFAF5',
    borderWidth: 1,
    borderColor: '#FFE8D0',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    marginLeft: 14,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.light,
    marginTop: 2,
  },
});

export default ActionCard;
