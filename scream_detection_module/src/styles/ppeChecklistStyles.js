
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  itemLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
});
