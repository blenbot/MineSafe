// src/styles/touristIdStyles.js
import { StyleSheet } from 'react-native';
import COLORS from '../constants/colors';

export const touristIdStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 40,
  },
  kycImageCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  kycImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.kycLight,
    borderRadius: 15,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kycLabel: {
    position: 'absolute',
    left: 50,
    top: 35,
    backgroundColor: COLORS.kycBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  kycLabelText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  kycMainIcon: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.kycBackground,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 40,
    top: 60,
  },
  kycIconGrid: {
    position: 'absolute',
    right: 30,
    top: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 120,
    gap: 8,
  },
  kycSmallIcon: {
    width: 35,
    height: 35,
    backgroundColor: COLORS.kycIconBg,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handPointer: {
    position: 'absolute',
    bottom: 30,
    left: 80,
  },
  handEmoji: {
    fontSize: 40,
  },
  secureIdCard: {
    backgroundColor: COLORS.black,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  secureIdTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  secureIdDesc: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  documentList: {
    gap: 15,
  },
});

export default touristIdStyles;