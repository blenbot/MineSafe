/**
 * MineSafe App
 * Smart Mine Safety Application
 * 
 * Flow: Welcome (Onboarding) → Login → Role-based Home Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import LanguageSelectScreen from './src/screens/LanguageSelectScreen';
import MinerHomeScreen from './src/screens/MinerHomeScreen';
import MinerProfileScreen from './src/screens/MinerProfileScreen';
import PreStartChecklistScreen from './src/screens/PreStartChecklistScreen';
import PPEChecklistScreen from './src/screens/PPEChecklistScreen';
import DamodarChatScreen from './src/screens/DamodarChatScreen';
import TrainingListScreen from './src/screens/TrainingListScreen';
import TrainingQuizScreen from './src/screens/TrainingQuizScreen';
import VideoModuleScreen from './src/screens/VideoModuleScreen';
import SafetyShoesVerificationScreen from './src/screens/SafetyShoesVerificationScreen';
import ReportHazardScreen from './src/screens/ReportHazardScreen';

// Admin Screens
import AdminHomeScreen from './src/screens/AdminHomeScreen';
import MinersListScreen from './src/screens/MinersListScreen';
import AddMinerScreen from './src/screens/AddMinerScreen';
import SupervisorsListScreen from './src/screens/SupervisorsListScreen';
import AddSupervisorScreen from './src/screens/AddSupervisorScreen';
import RegisterAdminScreen from './src/screens/RegisterAdminScreen';

// Supervisor Screens
import {
  SupervisorHomeScreen,
  SupervisorModulesScreen,
  SupervisorUploadModuleScreen,
  SupervisorManageMinersScreen,
  SupervisorAllocateMinesScreen,
} from './src/screens/supervisor';

// Services
import AuthService from './src/services/auth/AuthService';

// Utils
import colors from './src/utils/colors';

// i18n - Translation support
import { initI18n } from './src/i18n';

const Stack = createNativeStackNavigator();

// Placeholder screens for features not yet implemented
const PlaceholderScreen = ({ route, navigation }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderTitle}>{route.name}</Text>
    <Text style={styles.placeholderText}>This screen is coming soon!</Text>
    <Text 
      style={styles.placeholderBack}
      onPress={() => navigation.goBack()}
    >
      ← Go Back
    </Text>
  </View>
);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    try {
      // Initialize i18n (translations)
      await initI18n();
      
      // Check if user has seen onboarding
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      setIsFirstLaunch(hasSeenOnboarding !== 'true');

      // Check if user is authenticated
      const isAuth = await AuthService.isAuthenticated();
      setIsAuthenticated(isAuth);

      if (isAuth) {
        const userData = await AuthService.getUserData();
        setUserRole(userData?.role || 'MINER');
      }
    } catch (error) {
      console.error('Error checking initial state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark onboarding as seen
  const markOnboardingSeen = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading MineSafe...</Text>
      </View>
    );
  }

  const getInitialRoute = () => {
    if (isAuthenticated) {
      switch (userRole) {
        case 'MINER':
          return 'MinerHome';
        case 'ADMIN':
          return 'AdminHome';
        case 'SUPERVISOR':
          return 'SupervisorHome';
        default:
          return 'MinerHome';
      }
    }
    // Not authenticated - show welcome if first launch, otherwise login
    if (isFirstLaunch) return 'Welcome';
    return 'Login';
  };

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* Onboarding */}
        <Stack.Screen 
          name="Welcome" 
          options={{ animation: 'fade' }}
        >
          {(props) => (
            <WelcomeScreen 
              {...props} 
              onComplete={markOnboardingSeen}
            />
          )}
        </Stack.Screen>

        {/* Authentication */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ animation: 'slide_from_right' }}
        />
        
        <Stack.Screen 
          name="LanguageSelect" 
          component={LanguageSelectScreen}
        />

        {/* Miner Screens */}
        <Stack.Screen 
          name="MinerHome" 
          component={MinerHomeScreen}
          options={{ animation: 'fade' }}
        />
        
        <Stack.Screen 
          name="MinerProfile" 
          component={MinerProfileScreen}
        />
        
        <Stack.Screen 
          name="PreStartChecklist" 
          component={PreStartChecklistScreen}
        />
        
        <Stack.Screen 
          name="PPEChecklist" 
          component={PPEChecklistScreen}
        />
        
        <Stack.Screen 
          name="DamodarChat" 
          component={DamodarChatScreen}
        />
        
        <Stack.Screen 
          name="TrainingList" 
          component={TrainingListScreen}
        />
        
        <Stack.Screen 
          name="TrainingQuiz" 
          component={TrainingQuizScreen}
        />
        
        <Stack.Screen 
          name="VideoModule" 
          component={VideoModuleScreen}
          options={{ animation: 'fade' }}
        />
        
        <Stack.Screen 
          name="SafetyShoesVerification" 
          component={SafetyShoesVerificationScreen}
        />
        
        <Stack.Screen 
          name="ReportHazard" 
          component={ReportHazardScreen}
        />

        {/* Admin Screens */}
        <Stack.Screen 
          name="AdminHome" 
          component={AdminHomeScreen}
          options={{ animation: 'fade' }}
        />
        
        <Stack.Screen 
          name="MinersList" 
          component={MinersListScreen}
        />
        
        <Stack.Screen 
          name="AddMiner" 
          component={AddMinerScreen}
        />
        
        <Stack.Screen 
          name="SupervisorsList" 
          component={SupervisorsListScreen}
        />
        
        <Stack.Screen 
          name="AddSupervisor" 
          component={AddSupervisorScreen}
        />
        
        <Stack.Screen 
          name="RegisterAdmin" 
          component={RegisterAdminScreen}
        />

        {/* Supervisor Screens */}
        <Stack.Screen 
          name="SupervisorHome" 
          component={SupervisorHomeScreen}
          options={{ animation: 'fade' }}
        />
        
        <Stack.Screen 
          name="SupervisorUploadModule" 
          component={SupervisorUploadModuleScreen}
        />
        
        <Stack.Screen 
          name="SupervisorManageMiners" 
          component={SupervisorManageMinersScreen}
        />
        
        <Stack.Screen 
          name="SupervisorAllocateMines" 
          component={SupervisorAllocateMinesScreen}
        />
        
        <Stack.Screen 
          name="SupervisorAddMiner" 
          component={AddMinerScreen}
        />
        
        <Stack.Screen 
          name="SupervisorEditMiner" 
          component={PlaceholderScreen}
        />

        {/* Placeholder/Alias Screens */}
        <Stack.Screen name="Profile" component={MinerProfileScreen} />
        <Stack.Screen name="Training" component={TrainingListScreen} />
        <Stack.Screen name="TrainingModule" component={TrainingQuizScreen} />
        <Stack.Screen name="VideoPlayer" component={VideoModuleScreen} />
        <Stack.Screen name="Chatbot" component={DamodarChatScreen} />
        <Stack.Screen name="SOS" component={ReportHazardScreen} />
        <Stack.Screen name="Home" component={MinerHomeScreen} />
        <Stack.Screen name="EditMiner" component={PlaceholderScreen} />
        <Stack.Screen name="EditSupervisor" component={PlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  placeholderBack: {
    marginTop: 24,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
});
