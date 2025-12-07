import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
} from 'react-native';

import PPEChecklistCard from '../components/PPEChecklistCard';
import { fetchPPEChecklist } from '../api';
import screenStyles from '../styles/ppeScreenStyles';

const ORANGE = '#F97316';

export default function PPEChecklistScreen() {
  const [ppeItems, setPpeItems] = useState([]);
  const [loadingPpe, setLoadingPpe] = useState(false);

  const loadPPEChecklist = async () => {
    try {
      setLoadingPpe(true);
      const data = await fetchPPEChecklist();
      setPpeItems(data.items || []);
    } catch (err) {
      console.warn('Error fetching PPE checklist:', err.message);
    } finally {
      setLoadingPpe(false);
    }
  };

  useEffect(() => {
    loadPPEChecklist();
  }, []);

  const handleToggleItem = (id, value) => {
    setPpeItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: value } : item
      ),
    );
  };

  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <View style={screenStyles.container}>
        {/* Top bar */}
        <View style={screenStyles.header}>
          <Text style={screenStyles.headerIcon}>🌐</Text>
          {/* You can keep "Home" or change to "PPE Checklist" */}
          <Text style={screenStyles.headerTitle}>Home</Text>
          <Text style={screenStyles.headerIcon}>🔔</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Safety Tip Card */}
          <View style={screenStyles.card}>
            <Text style={screenStyles.safetyLabel}>TODAY'S SAFETY TIP</Text>
            <Text style={screenStyles.safetyTitle}>Stay Alert, Stay Safe</Text>
            <Text style={screenStyles.safetyBody}>
              Maintain situational awareness.{'\n'}
              Report any hazards immediately.
            </Text>
          </View>

          {/* PPE Checklist section */}
          <Text style={screenStyles.sectionTitle}>PPE Checklist</Text>

          <PPEChecklistCard
            items={ppeItems}
            loading={loadingPpe}
            onToggleItem={handleToggleItem}
          />

          {/* DGMS Advisory */}
          <View style={[screenStyles.card, { marginTop: 16 }]}>
            <View style={screenStyles.advisoryRow}>
              <Text style={screenStyles.advisoryTitle}>DGMS Advisory</Text>
              <Text style={screenStyles.advisoryChevron}>⌄</Text>
            </View>
          </View>

          {/* Training Progress */}
          <Text style={[screenStyles.sectionTitle, { marginTop: 24 }]}>
            Training Progress
          </Text>

          <View style={screenStyles.progressContainer}>
            <View style={screenStyles.progressBarBackground}>
              <View
                style={[
                  screenStyles.progressBarFill,
                  { width: '40%' }, // 2 of 5 modules
                ]}
              />
            </View>
            <Text style={screenStyles.progressText}>
              2 of 5 modules completed
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
