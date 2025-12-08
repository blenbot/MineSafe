import React from 'react';
import { View, Text, Switch, ActivityIndicator } from 'react-native';
import styles from '../styles/ppeChecklistStyles';

const ORANGE = '#F97316';

export default function PPEChecklistCard({
  items,
  loading,
  onToggleItem,
}) {
  if (loading) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.row}>
          <ActivityIndicator />
          <Text style={{ marginLeft: 8 }}>Loading PPE items...</Text>
        </View>
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.row}>
          <Text style={styles.itemLabel}>No PPE items configured.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      {items.map((item, index) => (
        <View
          key={item.id}
          style={[
            styles.row,
            index === items.length - 1 && styles.rowLast,
          ]}
        >
          <Text style={styles.itemLabel}>{item.label}</Text>
          <View style={{ flex: 1 }} />
          <Switch
            trackColor={{ false: '#E5E7EB', true: '#FED7AA' }}
            thumbColor={item.checked ? ORANGE : '#F9FAFB'}
            ios_backgroundColor="#E5E7EB"
            value={!!item.checked}
            onValueChange={(value) => onToggleItem(item.id, value)}
          />
        </View>
      ))}
    </View>
  );
}
