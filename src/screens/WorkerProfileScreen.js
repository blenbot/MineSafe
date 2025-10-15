import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

const WorkerProfileScreen = ({ navigation }) => {
  const badges = [
    { id: 1, name: 'Safety Certified', icon: 'shield-check', color: colors.badge.gold },
    { id: 2, name: 'First Aid', icon: 'medical-bag', color: colors.primary },
    { id: 3, name: 'Advanced Mining', icon: 'pickaxe', color: colors.badge.bronze },
    { id: 4, name: 'Emergency Response', icon: 'fire-extinguisher', color: colors.primary },
  ];

  const trainingHistory = [
    { id: 1, module: 'Module 1: Basic Safety', date: '2023-08-15' },
    { id: 2, module: 'Module 2: Equipment Operation', date: '2023-09-22' },
    { id: 3, module: 'Module 3: Emergency Procedures', date: '2023-10-10' },
  ];

  const incidentHistory = [
    { id: 1, type: 'Minor Injury', status: 'Open' },
    { id: 2, type: 'Equipment Malfunction', status: 'Closed' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: 'https://placeholder.com/120' }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>Ethan Carter</Text>
          <Text style={styles.profileId}>ID: 123456</Text>
        </View>

        {/* Worker Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Worker Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Site Name</Text>
            <Text style={styles.infoValue}>Sunrise Mine</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Shift Timing</Text>
            <Text style={styles.infoValue}>7:00 AM - 3:00 PM</Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgeGrid}>
            {badges.map((badge) => (
              <View key={badge.id} style={styles.badgeCard}>
                <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
                  <Icon name={badge.icon} size={28} color={badge.color} />
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Training History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training History</Text>
          {trainingHistory.map((training) => (
            <View key={training.id} style={styles.historyCard}>
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle}>{training.module}</Text>
                <Text style={styles.historyDate}>Completed: {training.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Incident History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident History</Text>
          {incidentHistory.map((incident) => (
            <View key={incident.id} style={styles.incidentCard}>
              <View style={styles.incidentInfo}>
                <Text style={styles.incidentType}>Incident #{incident.id}: {incident.type}</Text>
                <Text style={styles.incidentStatus}>Status: {incident.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Analytics Button */}
        <TouchableOpacity style={styles.analyticsButton}>
          <Text style={styles.analyticsButtonText}>View Analytics (Supervisor Only)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2C2416',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#2C2416',
    alignItems: 'center',
    paddingBottom: 40,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray[300],
    marginBottom: 16,
    borderWidth: 4,
    borderColor: colors.white,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    backgroundColor: colors.white,
    padding: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  infoLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  incidentCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  incidentInfo: {
    flex: 1,
  },
  incidentType: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  incidentStatus: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  analyticsButton: {
    backgroundColor: '#1E3A5F',
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyticsButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default WorkerProfileScreen;