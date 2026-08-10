import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export type TabName = 'home' | 'documents' | 'tracking' | 'request' | 'profile';

interface Tab {
  name: TabName;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { name: 'home', label: 'Home', icon: '⌂' },
  { name: 'documents', label: 'Documents', icon: '☰' },
  { name: 'tracking', label: 'Tracking', icon: '◎' },
  { name: 'request', label: 'Request', icon: '✎' },
  { name: 'profile', label: 'Profile', icon: '⊙' },
];

interface BottomTabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

export default function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <Pressable
            key={tab.name}
            style={styles.tab}
            onPress={() => onTabPress(tab.name)}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            <Text style={[styles.icon, { color: colors.textMuted }, isActive && { color: colors.primary }]}>{tab.icon}</Text>
            <Text style={[styles.label, { color: colors.textMuted }, isActive && { color: colors.primary, fontWeight: '700' }]}>{tab.label}</Text>
            {isActive && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
});
