// src/screens/ReviewReportScreen.js

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

const ReviewReportScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Report</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.offlineBanner}>
        <Text style={styles.offlineText}>
          No internet — Saved offline, will auto-upload when connected.
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Hazard Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hazard Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hazard Type</Text>
            <Text style={styles.detailValue}>Fall Hazard</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>Section 3B, Level 2</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>Unsecured railing on the platform</Text>
          </View>
        </View>

        {/* Risk Assessment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Severity</Text>
            <Text style={styles.detailValue}>High</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Probability</Text>
            <Text style={styles.detailValue}>Medium</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Risk Level</Text>
            <View style={styles.riskBadge}>
              <Text style={styles.riskBadgeText}>High</Text>
            </View>
          </View>
        </View>

        {/* Actions Taken */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions Taken</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Immediate Actions</Text>
            <Text style={styles.detailValue}>Reported to supervisor</Text>
          </View>
        </View>

        {/* Attachments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attachments</Text>
          <View style={styles.attachmentPlaceholder}>
            <Icon name="file-image" size={32} color={colors.gray[400]} />
            <Text style={styles.attachmentText}>3 photos attached</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={() => {
            // Show success and navigate to home
            alert('Report submitted successfully!');
            navigation.navigate('Home');
          }}
        >
          <Icon name="send" size={20} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.downloadButton}
        >
          <Icon name="download" size={20} color={colors.text.primary} style={{ marginRight: 8 }} />
          <Text style={styles.downloadButtonText}>Download Report</Text>
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  offlineBanner: {
    backgroundColor: colors.text.primary,
    padding: 12,
  },
  offlineText: {
    color: colors.white,
    fontSize: 13,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  riskBadge: {
    backgroundColor: colors.status.danger,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  attachmentPlaceholder: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  attachmentText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  downloadButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReviewReportScreen;