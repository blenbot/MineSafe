import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';

const PPEChecklistScreen = ({ navigation }) => {
  // State to track which items are checked
  const [checkedItems, setCheckedItems] = useState({});

  const ppeItems = [
    { 
      id: 1, 
      name: 'Safety Helmet', 
      icon: '⛑️',
      // YAHAN APNI ICON IMAGE KA PATH ADD KARO
      // iconImage: require('./assets/icons/helmet.png')
    },
    { 
      id: 2, 
      name: 'Protective Gloves', 
      icon: '🧤',
      // iconImage: require('./assets/icons/gloves.png')
    },
    { 
      id: 3, 
      name: 'Safety Shoes', 
      icon: '👟',
      // iconImage: require('./assets/icons/shoes.png')
    },
    { 
      id: 4, 
      name: 'High Visibility Vest', 
      icon: '👁️',
      // iconImage: require('./assets/icons/vest.png')
    },
    { 
      id: 5, 
      name: 'Safety Goggles', 
      icon: '🥽',
      // iconImage: require('./assets/icons/goggles.png')
    },
    { 
      id: 6, 
      name: 'Dust Mask / Respirator', 
      icon: '😷',
      // iconImage: require('./assets/icons/mask.png')
    },
    { 
      id: 7, 
      name: 'Ear Protection', 
      icon: '👂',
      // iconImage: require('./assets/icons/ear-protection.png')
    },
    { 
      id: 8, 
      name: 'Face Shield', 
      icon: '🛡️',
      // iconImage: require('./assets/icons/face-shield.png')
    },
  ];

  const toggleCheckbox = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
    console.log(`Item ${itemId} toggled`);
  };

  const handleItemPress = (item) => {
    // YAHAN ITEM DETAILS SCREEN PE NAVIGATE KAR SAKTE HO
    console.log(`Navigating to details for: ${item.name}`);
    // navigation.navigate('PPEItemDetail', { item: item });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PPE Checklist</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PPE Items List */}
        {ppeItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.checklistItem}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
          >
            {/* Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => toggleCheckbox(item.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                checkedItems[item.id] && styles.checkboxChecked
              ]}>
                {checkedItems[item.id] && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.iconContainer}>
              {/* YAHAN APNI IMAGE ADD KARO (agar hai toh) */}
              {/* {item.iconImage ? (
                <Image 
                  source={item.iconImage} 
                  style={styles.itemIcon}
                  resizeMode="contain"
                />
              ) : ( */}
                <Text style={styles.iconEmoji}>{item.icon}</Text>
              {/* )} */}
            </View>

            {/* Item Name */}
            <Text style={styles.itemName}>{item.name}</Text>

            {/* Arrow for more details */}
            <Text style={styles.chevronIcon}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => {
            // YAHAN HOME SCREEN PE NAVIGATE KARO
            // navigation.navigate('Home');
            console.log('Navigate to Home');
          }}
        >
          <Text style={styles.navIconActive}>🏠</Text>
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {
            // YAHAN VIDEO SCREEN PE NAVIGATE KARO
            // navigation.navigate('Video');
            console.log('Navigate to Video');
          }}
        >
          <Text style={styles.navIcon}>🎥</Text>
          <Text style={styles.navText}>Video</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {
            // YAHAN TRAINING SCREEN PE NAVIGATE KARO
            // navigation.navigate('Training');
            console.log('Navigate to Training');
          }}
        >
          <Text style={styles.navIcon}>🎓</Text>
          <Text style={styles.navText}>Training</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {
            // YAHAN PROFILE SCREEN PE NAVIGATE KARO
            // navigation.navigate('Profile');
            console.log('Navigate to Profile');
          }}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  checkboxContainer: {
    marginRight: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  iconEmoji: {
    fontSize: 28,
  },
  itemIcon: {
    width: 32,
    height: 32,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  chevronIcon: {
    fontSize: 28,
    color: '#CCCCCC',
    marginLeft: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B00',
  },
  navIcon: {
    fontSize: 22,
    marginBottom: 4,
    opacity: 0.6,
  },
  navIconActive: {
    fontSize: 22,
    marginBottom: 4,
  },
  navText: {
    fontSize: 11,
    color: '#999999',
  },
  navTextActive: {
    fontSize: 11,
    color: '#FF6B00',
    fontWeight: '600',
  },
});

export default PPEChecklistScreen;