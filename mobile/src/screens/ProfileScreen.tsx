import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getProfile, logoutUser } from '../services/api';

interface ProfileScreenProps {
  onLogout: () => void;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#C9A227" />
      </View>
    );
  }

  const initials = (profile?.name ?? 'R')
    .split(' ')
    .map((n: string) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>⌂</Text>
          </View>
          <Text style={styles.logoTitle}>Barangay Connect</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{profile?.name ?? 'Resident'}</Text>
          <Text style={styles.profileEmail}>{profile?.email ?? ''}</Text>
          {profile?.barangay?.name && (
            <View style={styles.barangayBadge}>
              <Text style={styles.barangayText}>📍 {profile.barangay.name}</Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Account Information</Text>
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
              <View key={row.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {[
            { icon: '🔔', label: 'Notifications' },
            { icon: '🔒', label: 'Change Password' },
            { icon: '❓', label: 'Help & Support' },
            { icon: '📜', label: 'Terms & Privacy' },
          ].map((item) => (
            <Pressable key={item.label} style={styles.menuItem}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.version}>Barangay Connect v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6FA' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' },
  header: {
    backgroundColor: '#1a1a2e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
  },
  headerLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: '#C9A227', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 14 },
  logoTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40, alignItems: 'stretch' },
  avatarSection: { alignItems: 'center', gap: 6, paddingVertical: 12 },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#C9A227',
  },
  avatarText: { color: '#C9A227', fontSize: 26, fontWeight: '800' },
  profileName: { fontSize: 20, fontWeight: '800', color: '#0D1B2A' },
  profileEmail: { fontSize: 13, color: '#6B7280' },
  barangayBadge: {
    backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 999, marginTop: 2,
  },
  barangayText: { fontSize: 12, color: '#92400E', fontWeight: '600' },
  infoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  infoCardTitle: { fontSize: 14, fontWeight: '700', color: '#0D1B2A', marginBottom: 2 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  infoLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#0D1B2A', fontWeight: '600', flex: 1, textAlign: 'right' },
  menuCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12,
  },
  menuIcon: { fontSize: 18 },
  menuLabel: { flex: 1, fontSize: 14, color: '#0D1B2A', fontWeight: '500' },
  menuArrow: { fontSize: 18, color: '#D1D5DB' },
  logoutBtn: {
    backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', fontSize: 11, color: '#D1D5DB' },
});
