// src/screens/DashboardScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionCard from '../components/ActionCard';
import dashboardStyles from '../styles/dashboardStyles';
import { commonStyles } from '../styles/commonStyles';
import COLORS from '../constants/colors';

const DashboardScreen = ({ onNavigateToTouristId }) => {
  const location = 'Sikkim, India';
  const date = 'Monday, 15 Aug';
  const safetyScore = 8;

  return (
    <ScrollView style={commonStyles.scrollView}>
      {/* Header */}
      <View style={dashboardStyles.header}>
        <Text style={dashboardStyles.headerTitle}>Dashboard</Text>
      </View>

      {/* Main Card */}
      <View style={dashboardStyles.mainCard}>
        {/* Top Bar with Logo and Icons */}
        <View style={dashboardStyles.topBar}>
          <View style={dashboardStyles.logoContainer}>
            <Icon name="shield-checkmark" size={24} color={COLORS.white} />
            <Text style={dashboardStyles.logoText}>SafeTrip</Text>
          </View>
          <View style={dashboardStyles.iconGroup}>
            <TouchableOpacity style={commonStyles.iconButton}>
              <Icon name="notifications" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={commonStyles.iconButton}>
              <Icon name="menu" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location and Date */}
        <View style={dashboardStyles.locationSection}>
          <Text style={dashboardStyles.locationText}>{location}</Text>
          <Text style={dashboardStyles.dateText}>{date}</Text>
        </View>

        {/* Action Cards Row */}
        <View style={dashboardStyles.actionCardsRow}>
          <ActionCard
            title="KYC"
            iconName="checkmark-circle"
            iconColor={COLORS.success}
            onPress={onNavigateToTouristId}
          />
          <ActionCard
            title={`Share\nlocation`}
            iconName="location"
            iconColor={COLORS.danger}
            onPress={() => alert('Share Location - Coming soon!')}
          />
          <ActionCard
            title={`Tourist\nID`}
            iconName="flower"
            iconColor={COLORS.pink}
            onPress={() => alert('Tourist ID - Coming soon!')}
          />
        </View>

        {/* Ask Damodar Button */}
        <TouchableOpacity style={dashboardStyles.damodarButton}>
          <Icon name="chatbubbles" size={24} color={COLORS.white} />
          <Text style={dashboardStyles.damodarText}>Ask Damodar (our AI chatbot)</Text>
        </TouchableOpacity>

        {/* Safety Score Card */}
        <View style={dashboardStyles.safetyScoreCard}>
          <Text style={dashboardStyles.safetyScoreTitle}>
            Safety Score: {safetyScore}/10
          </Text>
          <View style={dashboardStyles.mapPlaceholder}>
            <Icon name="map" size={100} color="#555" />
            <View style={dashboardStyles.mapMarker}>
              <Icon name="location" size={30} color={COLORS.danger} />
            </View>
          </View>
        </View>

        {/* Geo Fencing Alert */}
        <View style={dashboardStyles.alertCard}>
          <View style={dashboardStyles.alertHeader}>
            <Icon name="shield-outline" size={24} color={COLORS.danger} />
            <Text style={dashboardStyles.alertTitle}>GEO FENCING ALERTS</Text>
          </View>
          <Text style={dashboardStyles.alertText}>
            You are entering a high risk zone, please proceed with caution!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;