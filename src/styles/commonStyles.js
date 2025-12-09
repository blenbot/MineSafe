// src/styles/commonStyles.js
import { StyleSheet } from 'react-native';
import COLORS from '../constants/colors';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  iconButton: {
    backgroundColor: COLORS.iconBackground,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.iconBackgroundMedium,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default commonStyles;