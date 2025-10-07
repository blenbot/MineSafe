// src/screens/TouristIdScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DocumentItem from '../components/DocumentItem';
import touristIdStyles from '../styles/touristIdStyles';
import { commonStyles } from '../styles/commonStyles';
import COLORS from '../constants/colors';

const TouristIdScreen = ({ onBack }) => {
  return (
    <ScrollView style={commonStyles.scrollView}>
      <View style={touristIdStyles.container}>
        {/* Header */}
        <View style={touristIdStyles.header}>
          <TouchableOpacity style={commonStyles.backButton} onPress={onBack}>
            <Icon name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={touristIdStyles.logo}>
            <Icon name="shield-checkmark" size={28} color={COLORS.primary} />
            <Text style={touristIdStyles.logoText}>SafeTrip</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={touristIdStyles.title}>
          Blockchain powered{'\n'}Tourist ID
        </Text>

        {/* KYC Image Card - CLICKABLE */}
        <TouchableOpacity
          style={touristIdStyles.kycImageCard}
          onPress={() => alert('KYC Details page - Coming soon!')}
          activeOpacity={0.8}
        >
          <View style={touristIdStyles.kycImagePlaceholder}>
            <View style={touristIdStyles.kycLabel}>
              <Text style={touristIdStyles.kycLabelText}>KYC</Text>
            </View>
            <View style={touristIdStyles.kycMainIcon}>
              <Icon name="person" size={40} color={COLORS.white} />
            </View>
            <View style={touristIdStyles.kycIconGrid}>
              <View style={touristIdStyles.kycSmallIcon}>
                <Icon name="document-text" size={20} color={COLORS.textDark} />
              </View>
              <View style={touristIdStyles.kycSmallIcon}>
                <Icon name="key" size={20} color={COLORS.textDark} />
              </View>
              <View style={touristIdStyles.kycSmallIcon}>
                <Icon name="finger-print" size={20} color={COLORS.textDark} />
              </View>
              <View style={touristIdStyles.kycSmallIcon}>
                <Icon name="document" size={20} color={COLORS.textDark} />
              </View>
              <View style={touristIdStyles.kycSmallIcon}>
                <Icon name="skull" size={20} color={COLORS.textDark} />
              </View>
              <View style={touristIdStyles.kycSmallIcon}>
                <Icon name="shield" size={20} color={COLORS.textDark} />
              </View>
            </View>
            <View style={touristIdStyles.handPointer}>
              <Text style={touristIdStyles.handEmoji}>👆</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Secure Digital ID - CLICKABLE */}
        <TouchableOpacity
          style={touristIdStyles.secureIdCard}
          onPress={() => alert('Secure Digital ID page - Coming soon!')}
          activeOpacity={0.8}
        >
          <Text style={touristIdStyles.secureIdTitle}>SECURE DIGITAL ID</Text>
          <Text style={touristIdStyles.secureIdDesc}>
            create and manage blockchain{'\n'}verified digital ID
          </Text>
        </TouchableOpacity>

        {/* Document List - ALL CLICKABLE */}
        <View style={touristIdStyles.documentList}>
          <DocumentItem
            iconName="card"
            iconColor="#FF6B6B"
            title="Aadhaar Number"
            value="XXXX-XXXX-1789"
            onPress={() => alert('Aadhaar Details page - Coming soon!')}
          />
          <DocumentItem
            iconName="airplane"
            iconColor={COLORS.warning}
            title="Passport Number"
            value="ABC123XXZ"
            onPress={() => alert('Passport Details page - Coming soon!')}
          />
          <DocumentItem
            iconName="map"
            iconColor={COLORS.primary}
            title="Trip Itinerary"
            value="Sikkim, India"
            onPress={() => alert('Trip Itinerary page - Coming soon!')}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default TouristIdScreen;