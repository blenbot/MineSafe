import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2500);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="hard-hat" size={80} color={colors.primary} />
        <View style={styles.dotContainer}>
          <View style={[styles.dot, styles.dotLeft]} />
          <View style={[styles.dot, styles.dotRight]} />
        </View>
      </View>
      <Text style={styles.title}>Intelligent Mobile</Text>
      <Text style={styles.title}>Safety Companion</Text>
      <Text style={styles.subtitle}>Smart Safety. Quick Reports. Short Training.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  dotContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -30,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginHorizontal: 6,
  },
  dotLeft: {
    marginRight: 30,
  },
  dotRight: {
    marginLeft: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default SplashScreen;