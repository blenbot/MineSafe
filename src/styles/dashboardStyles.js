// src/styles/dashboardStyles.js
import { StyleSheet } from 'react-native';
import COLORS from '../constants/colors';

export const dashboardStyles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: COLORS.primaryCard,
    marginHorizontal: 15,
    borderRadius: 20,
    padding: 20,
    marginBottom: 80,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  iconGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  locationSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  locationText: {
    fontSize: 28,
    color: COLORS.white,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  actionCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  damodarButton: {
    backgroundColor: COLORS.secondaryCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 15,
    marginBottom: 20,
    gap: 10,
  },
  damodarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  safetyScoreCard: {
    backgroundColor: COLORS.secondaryCard,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  safetyScoreTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: COLORS.mapBackground,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapMarker: {
    position: 'absolute',
    top: '30%',
    right: '20%',
  },
  alertCard: {
    backgroundColor: COLORS.secondaryCard,
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.danger,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  alertTitle: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: 'bold',
  },
  alertText: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default dashboardStyles;