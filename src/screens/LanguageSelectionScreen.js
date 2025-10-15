// src/screens/LanguageSelectionScreen.js

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

const LanguageSelectionScreen = ({ navigation }) => {
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Language</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Choose your language</Text>
        <Text style={styles.subtitle}>Select your preferred language for the app</Text>
        
        {languages.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={styles.languageCard}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.languageName}>{language.name}</Text>
            <Text style={styles.languageNative}>{language.nativeName}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  languageCard: {
    backgroundColor: '#F7FAFC',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  languageNative: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export default LanguageSelectionScreen;

//##############

// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import colors from '../utils/colors';

// const languages = [
//   { id: 'en', name: 'English' },
//   { id: 'hi', name: 'Hindi' },
//   { id: 'ta', name: 'Tamil' },
//   { id: 'bn', name: 'Bengali' },
//   { id: 'te', name: 'Telugu' },
//   { id: 'kn', name: 'Kannada' },
//   { id: 'ml', name: 'Malayalam' },
// ];

// const LanguageSelectionScreen = ({ navigation }) => {
//   const [selectedLanguage, setSelectedLanguage] = useState('en');

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Icon name="chevron-left" size={28} color={colors.text.primary} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Select Language</Text>
//         <View style={{ width: 28 }} />
//       </View>

//       <ScrollView style={styles.content}>
//         <View style={styles.languageGrid}>
//           {languages.map((lang) => (
//             <TouchableOpacity
//               key={lang.id}
//               style={[
//                 styles.languageCard,
//                 selectedLanguage === lang.id && styles.languageCardActive,
//               ]}
//               onPress={() => setSelectedLanguage(lang.id)}
//             >
//               <Icon 
//                 name="web" 
//                 size={32} 
//                 color={selectedLanguage === lang.id ? colors.primary : colors.text.primary} 
//               />
//               <Text 
//                 style={[
//                   styles.languageName,
//                   selectedLanguage === lang.id && styles.languageNameActive,
//                 ]}
//               >
//                 {lang.name}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </ScrollView>

//       <View style={styles.footer}>
//         <TouchableOpacity 
//           style={styles.button}
//           onPress={() => navigation.navigate('Home')}
//         >
//           <Text style={styles.buttonText}>Save Changes</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.white,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.gray[200],
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: colors.text.primary,
//   },
//   content: {
//     flex: 1,
//     padding: 20,
//   },
//   languageGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   languageCard: {
//     width: '48%',
//     backgroundColor: colors.white,
//     borderWidth: 2,
//     borderColor: colors.gray[200],
//     borderRadius: 12,
//     padding: 24,
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   languageCardActive: {
//     borderColor: colors.primary,
//     backgroundColor: colors.secondary,
//   },
//   languageName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.text.primary,
//     marginTop: 12,
//   },
//   languageNameActive: {
//     color: colors.primary,
//   },
//   footer: {
//     padding: 20,
//     borderTopWidth: 1,
//     borderTopColor: colors.gray[200],
//   },
//   button: {
//     backgroundColor: colors.primary,
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: colors.white,
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default LanguageSelectionScreen;