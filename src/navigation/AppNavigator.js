// src/navigation/AppNavigator.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

// Import Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import ReportHazardScreen from '../screens/ReportHazardScreen';
import HazardDetailsScreen from '../screens/HazardDetailsScreen';
import ReviewReportScreen from '../screens/ReviewReportScreen';
import SOSScreen from '../screens/SOSScreen';
import TrainingModuleScreen from '../screens/TrainingModuleScreen';
import WorkerProfileScreen from '../screens/WorkerProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TrainingTab"
        component={TrainingModuleScreen}
        options={{
          tabBarLabel: 'Training',
          tabBarIcon: ({ color, size }) => (
            <Icon name="school" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportHazardScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <Icon name="file-document" size={size} color={color} />
          ),
          tabBarBadge: 3,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: colors.white,
          },
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatbotScreen}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Icon name="message" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={WorkerProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator
function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        <Stack.Screen name="Home" component={MainTabs} />
        <Stack.Screen name="Chatbot" component={ChatbotScreen} />
        <Stack.Screen name="ReportHazard" component={ReportHazardScreen} />
        <Stack.Screen name="HazardDetails" component={HazardDetailsScreen} />
        <Stack.Screen name="ReviewReport" component={ReviewReportScreen} />
        <Stack.Screen 
          name="SOS" 
          component={SOSScreen}
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="TrainingModule" component={TrainingModuleScreen} />
        <Stack.Screen name="WorkerProfile" component={WorkerProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;