import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export type TabName = 'home' | 'documents' | 'tracking' | 'request' | 'notifications' | 'profile';

interface Tab {
  name: TabName;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { name: 'home', label: 'Home', icon: '⌂' },
  { name: 'tracking', label: 'Requests', icon: '☰' },
  { name: 'request', label: 'Request', icon: '+' },
  { name: 'notifications', label: 'Alerts', icon: '◔' },
  { name: 'profile', label: 'My ID', icon: '◉' },
];

interface BottomTabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

export default function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.headerBg, borderTopColor: colors.border }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name;
        const isCenter = tab.name === 'request';

        if (isCenter) {
          return (
            <Pressable
              key={tab.name}
              onPress={() => onTabPress(tab.name)}
              style={[
                styles.centerAction,
                { backgroundColor: colors.primary, shadowColor: colors.primary },
              ]}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
            >
              <Text style={styles.centerActionText}>{tab.icon}</Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={tab.name}
            onPress={() => onTabPress(tab.name)}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            <Text
              style={[
                styles.icon,
                { color: isActive ? colors.primary : colors.textMuted },
              ]}
            >
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.primary : colors.textMuted },
                isActive && styles.labelActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    minHeight: 72,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelActive: {
    fontWeight: '700',
  },
  centerAction: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 8,
  },
  centerActionText: {
    color: '#041720',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 28,
  },
});
