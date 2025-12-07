import { StyleSheet } from 'react-native';

const ORANGE = '#F97316';

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  container: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  safetyLabel: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  safetyBody: {
    fontSize: 14,
    color: '#4B5563',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  advisoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  advisoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  advisoryChevron: {
    marginLeft: 'auto',
    fontSize: 18,
    color: '#6B7280',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: ORANGE,
  },
  progressText: {
    marginTop: 8,
    fontSize: 13,
    color: '#4B5563',
  },
});
