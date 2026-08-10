import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type StatusType = 'pending' | 'processing' | 'approved' | 'completed' | 'cancelled' | 'ready' | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const LIGHT_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  processing: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  approved: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  completed: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  ready: { bg: '#D1FAE5', text: '#065F46', dot: '#22C55E' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  default: { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' },
};

const DARK_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: '#78350F', text: '#FEF3C7', dot: '#F59E0B' },
  processing: { bg: '#1E3A8A', text: '#DBEAFE', dot: '#3B82F6' },
  approved: { bg: '#064E3B', text: '#D1FAE5', dot: '#10B981' },
  completed: { bg: '#064E3B', text: '#D1FAE5', dot: '#10B981' },
  ready: { bg: '#064E3B', text: '#D1FAE5', dot: '#22C55E' },
  cancelled: { bg: '#7F1D1D', text: '#FEE2E2', dot: '#EF4444' },
  default: { bg: '#374151', text: '#F3F4F6', dot: '#9CA3AF' },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const CONFIG = isDark ? DARK_CONFIG : LIGHT_CONFIG;
  
  const key = status?.toLowerCase() ?? 'default';
  const config = CONFIG[key] ?? CONFIG.default;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.text, { color: config.text }]}>{label ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
