// src/components/AppHeader.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface AppHeaderProps {
  /** The logged-in user's profile object, as returned by getProfile(). */
  profile: any;
  /** Optional subtitle shown under the main title (e.g. barangay name). */
  subtitle?: string;
  /** Show the notification bell. Defaults to true. */
  showNotifications?: boolean;
  /** Unread notification count. Shows a badge when > 0. */
  unreadCount?: number;
  /** Called when the bell is pressed. */
  onBellPress?: () => void;
  /** Called when the avatar is pressed (e.g. navigate to profile tab). */
  onAvatarPress?: () => void;
}

export default function AppHeader({
  profile,
  subtitle,
  showNotifications = true,
  unreadCount = 0,
  onBellPress,
  onAvatarPress,
}: AppHeaderProps) {
  const { colors } = useTheme();

  const firstName = profile?.name?.split(' ')[0] ?? 'Resident';
  const initial = firstName?.charAt(0)?.toUpperCase() ?? 'R';

  return (
    <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
      <View style={styles.headerLeft}>
        <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
          <Text style={[styles.logoText, { color: '#071A27' }]}>⌂</Text>
        </View>
        <View>
          <Text style={[styles.logoTitle, { color: colors.headerText }]}>KIDAPAWAN CITY</Text>
          {subtitle && (
            <Text style={[styles.logoSubtitle, { color: colors.primary }]}>{subtitle}</Text>
          )}
        </View>
      </View>

      <View style={styles.headerRight}>
        {showNotifications && (
          <Pressable style={styles.headerBtn} onPress={onBellPress}>
            <Text style={styles.headerBtnIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        )}

        <Pressable onPress={onAvatarPress}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.headerBg }]}>{initial}</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 14, fontWeight: '700' },
  logoTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  logoSubtitle: { fontSize: 9, fontWeight: '600', letterSpacing: 0.4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { position: 'relative', padding: 6 },
  headerBtnIcon: { fontSize: 18 },
  badge: {
    position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700' },
});