// src/screens/HomeScreen.js

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

const HomeScreen = ({ navigation }) => {
  const [ppeChecklist, setPpeChecklist] = useState({
    helmet: true,
    glasses: false,
    gloves: true,
    boots: false,
  });

  const togglePPE = (item) => {
    setPpeChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mine Site Alpha</Text>
        <TouchableOpacity>
          <Icon name="web" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Safety Tip */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Safety Tip</Text>
          <View style={styles.safetyCard}>
            <Image 
              source={{ uri: 'https://placeholder.com/300x150' }}
              style={styles.safetyImage}
            />
            <Text style={styles.safetyText}>
              Always double-check your equipment before entering the mine.
            </Text>
          </View>
        </View>

        {/* PPE Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PPE Checklist</Text>
          <View style={styles.ppeCard}>
            <Text style={styles.ppeDescription}>
              Ensure all required gear is worn before starting your shift.
            </Text>
            <View style={styles.ppeItems}>
              <TouchableOpacity 
                style={[styles.ppeChip, ppeChecklist.helmet && styles.ppeChipActive]}
                onPress={() => togglePPE('helmet')}
              >
                <Text style={[styles.ppeChipText, ppeChecklist.helmet && styles.ppeChipTextActive]}>
                  Helmet
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.ppeChip, ppeChecklist.glasses && styles.ppeChipActive]}
                onPress={() => togglePPE('glasses')}
              >
                <Text style={[styles.ppeChipText, ppeChecklist.glasses && styles.ppeChipTextActive]}>
                  Glasses
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.ppeChip, ppeChecklist.gloves && styles.ppeChipActive]}
                onPress={() => togglePPE('gloves')}
              >
                <Text style={[styles.ppeChipText, ppeChecklist.gloves && styles.ppeChipTextActive]}>
                  Gloves
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.ppeChip, ppeChecklist.boots && styles.ppeChipActive]}
                onPress={() => togglePPE('boots')}
              >
                <Text style={[styles.ppeChipText, ppeChecklist.boots && styles.ppeChipTextActive]}>
                  Boots
                </Text>
              </TouchableOpacity>
            </View>
            <Image 
              source={{ uri: 'https://placeholder.com/80x80' }}
              style={styles.ppeImage}
            />
          </View>
        </View>

        {/* Training Progress */}
        <View style={styles.section}>
          <View style={styles.progressCard}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>75%</Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Training Progress</Text>
              <Text style={styles.progressSubtitle}>Keep up the great work!</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Incidents</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Near Misses</Text>
          </View>
        </View>

        {/* DGMS Advisory */}
        <TouchableOpacity style={styles.advisoryCard}>
          <Text style={styles.advisoryText}>DGMS Advisory</Text>
          <Icon name="chevron-down" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.notificationCard}>
            <View style={styles.notificationIcon}>
              <Icon name="alert-circle-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Safety Update</Text>
              <Text style={styles.notificationText}>New safety guidelines available.</Text>
            </View>
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.notificationIcon}>
              <Icon name="check-circle-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Training Complete</Text>
              <Text style={styles.notificationText}>Module "Hazard Recognition" finished.</Text>
            </View>
          </View>
        </View>

        {/* SOS Button */}
        <TouchableOpacity 
          style={styles.sosButton}
          onPress={() => navigation.navigate('SOS')}
        >
          <Text style={styles.sosText}>SOS SOS — Press & Hold</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  safetyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  safetyImage: {
    width: '100%',
    height: 150,
    backgroundColor: colors.gray[200],
  },
  safetyText: {
    padding: 16,
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  ppeCard: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 16,
    padding: 16,
    position: 'relative',
  },
  ppeDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  ppeItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ppeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  ppeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ppeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.primary,
  },
  ppeChipTextActive: {
    color: colors.white,
  },
  ppeImage: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gray[200],
  },
  progressCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: colors.primary,
    borderTopColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.secondaryLight,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  advisoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  advisoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  sosButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  sosText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default HomeScreen;