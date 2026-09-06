import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getProfile } from '../services/api';
import AppHeader from '../components/AppHeader';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => {
        // Header falls back to a generic initial if this fails; not worth blocking the screen.
      });
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader profile={profile} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Notifications & Alerts</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Updates on document requests & community alerts</Text>
        </View>

        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.emptyIconWrap, { borderColor: colors.primary }]}>
            <Text style={styles.emptyIcon}>🔔</Text>
          </View>

          <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            You’ll be alerted up on document request updates. System alerts or barangay bulletins will appear here.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  titleRow: {
    gap: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#2EE6C8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIcon: {
    fontSize: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});