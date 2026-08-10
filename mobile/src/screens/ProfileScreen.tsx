import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Switch,
} from 'react-native';
import { getProfile, logoutUser } from '../services/api';
import { useTheme } from '../theme/ThemeContext';

interface ProfileScreenProps {
  onLogout: () => void;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme, colors, toggleTheme } = useTheme();

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logoutUser();
          onLogout();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initials = (profile?.name ?? 'R')
    .split(' ')
    .map((n: string) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={styles.headerLogoRow}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: colors.headerText }]}>⌂</Text>
          </View>
          <Text style={[styles.logoTitle, { color: colors.headerText }]}>Barangay Connect</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.headerBg, borderColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>{profile?.name ?? 'Resident'}</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{profile?.email ?? ''}</Text>
          {profile?.barangay?.name && (
            <View style={[styles.barangayBadge, { backgroundColor: colors.warningBg }]}>
              <Text style={[styles.barangayText, { color: colors.warningText }]}>📍 {profile.barangay.name}</Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoCardTitle, { color: colors.text }]}>Account Information</Text>
          {[
            { label: 'Full Name', value: profile?.name },
            { label: 'Email', value: profile?.email },
            { label: 'Mobile', value: profile?.resident_profile?.mobile_number },
            { label: 'Barangay', value: profile?.barangay?.name },
            { label: 'City', value: profile?.resident_profile?.city },
            { label: 'Province', value: profile?.resident_profile?.province },
          ]
            .filter((row) => row.value)
            .map((row) => (
              <View key={row.label} style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{row.label}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{row.value}</Text>
              </View>
            ))}
        </View>

        {/* Menu Items */}
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}>
            <Text style={styles.menuIcon}>🌙</Text>
            <Text style={[styles.menuLabel, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {[
            { icon: '🔔', label: 'Notifications' },
            { icon: '🔒', label: 'Change Password' },
            { icon: '❓', label: 'Help & Support' },
            { icon: '📜', label: 'Terms & Privacy' },
          ].map((item, index) => (
            <Pressable key={item.label} style={[styles.menuItem, index !== 3 && { borderBottomColor: colors.borderLight }]}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.menuArrow, { color: colors.border }]}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable style={[styles.logoutBtn, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out</Text>
        </Pressable>

        <Text style={[styles.version, { color: colors.borderLight }]}>Barangay Connect v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
  },
  headerLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: {
    width: 28, height: 28, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 14 },
  logoTitle: { fontWeight: '700', fontSize: 15 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40, alignItems: 'stretch' },
  avatarSection: { alignItems: 'center', gap: 6, paddingVertical: 12 },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3,
  },
  avatarText: { fontSize: 26, fontWeight: '800' },
  profileName: { fontSize: 20, fontWeight: '800' },
  profileEmail: { fontSize: 13 },
  barangayBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 999, marginTop: 2,
  },
  barangayText: { fontSize: 12, fontWeight: '600' },
  infoCard: {
    borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1,
  },
  infoCardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 13, fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, gap: 12,
  },
  menuIcon: { fontSize: 18 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  menuArrow: { fontSize: 18 },
  logoutBtn: {
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1,
  },
  logoutText: { fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', fontSize: 11 },
});
