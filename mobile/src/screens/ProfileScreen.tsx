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
import { useTheme } from '../theme/ThemeContext';

interface ProfileScreenProps {
  onLogout: () => void;
}

function calculateAge(birthdate?: string): string {
  if (!birthdate) return 'Not provided';
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return 'Not provided';
  const diff = Date.now() - dob.getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} y/o`;
}

function formatBirthdate(birthdate?: string): string {
  if (!birthdate) return 'Not provided';
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return birthdate;
  return dob.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatAddress(residentProfile: any): string {
  if (!residentProfile?.address) return 'Not provided';
  const { house_number, street, purok, sitio, city, province } = residentProfile.address;
  return [house_number, street, purok, sitio, city, province].filter(Boolean).join(', ') || 'Not provided';
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => Alert.alert('Error', 'Unable to load your profile.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await logoutUser();
    onLogout();
  }

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const residentProfile = profile?.resident_profile;

  const initials = (profile?.name ?? 'Resident')
    .split(' ')
    .map((n: string) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: '#071A27' }]}>⌂</Text>
          </View>
          <Text style={[styles.logoTitle, { color: colors.headerText }]}>KIDAPAWAN CITY</Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable style={styles.headerBtn}>
            <Text style={styles.headerBtnIcon}>🔔</Text>
          </Pressable>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.headerBg }]}>{initials}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.headerBg, borderColor: colors.primary }]}>
              <Text style={[styles.avatarCircleText, { color: colors.primary }]}>{initials}</Text>
            </View>

            <View style={styles.profileMeta}>
              <Text style={[styles.profileName, { color: colors.text }]}>{profile?.name ?? 'Resident'}</Text>
              <Text style={[styles.profileRole, { color: colors.textMuted }]}>{profile?.role_label ?? 'Resident'}</Text>
            </View>

            <Pressable style={[styles.editBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.editBtnText, { color: '#071A27' }]}>EDIT DETAILS</Text>
            </Pressable>
          </View>

          <View style={[styles.idRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <View style={styles.idInfo}>
              {/* NOTE: token_id has no backend field yet — shows user ID as a fallback */}
              <Text style={[styles.idLabel, { color: colors.textMuted }]}>Resident ID</Text>
              <Text style={[styles.idValue, { color: colors.text }]}>{profile?.id ? `#${profile.id}` : 'Not provided'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: colors.successBg }]}>
              <Text style={[styles.statusText, { color: colors.success }]}>
                {residentProfile?.verification_status === 'approved' ? 'Active' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal & Demographic</Text>
          </View>

          <View style={styles.grid}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Full Legal Name</Text>
              <Text style={[styles.value, { color: colors.text }]}>{profile?.name ?? 'Not provided'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Birth Date / Age</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {formatBirthdate(residentProfile?.birthdate)} / {calculateAge(residentProfile?.birthdate)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Gender</Text>
              <Text style={[styles.value, { color: colors.text }]}>{residentProfile?.gender ?? 'Not provided'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Civil Status</Text>
              <Text style={[styles.value, { color: colors.text }]}>{residentProfile?.civil_status ?? 'Not provided'}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact & Address</Text>
          </View>

          <View style={styles.grid}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Mobile Number</Text>
              <Text style={[styles.value, { color: colors.text }]}>{residentProfile?.mobile_number ?? 'Not provided'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Email Address</Text>
              <Text style={[styles.value, { color: colors.text }]}>{profile?.email ?? 'Not provided'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Address</Text>
              <Text style={[styles.value, { color: colors.text }]}>{formatAddress(residentProfile)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Barangay</Text>
              <Text style={[styles.value, { color: colors.text }]}>{profile?.barangay?.name ?? 'Not provided'}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Education & Livelihood</Text>
          </View>

          <View style={styles.grid}>
            {/* NOTE: educational_attainment has no backend field yet */}
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Educational Attainment</Text>
              <Text style={[styles.value, { color: colors.text }]}>Not provided</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Current Occupation</Text>
              <Text style={[styles.value, { color: colors.text }]}>{residentProfile?.occupation ?? 'Not provided'}</Text>
            </View>
            {/* NOTE: estimated_monthly_income has no backend field yet */}
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Estimated Monthly Income</Text>
              <Text style={[styles.value, { color: colors.text }]}>Not provided</Text>
            </View>
            {/* NOTE: philsys_id has no backend field yet */}
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>PhilSys ID</Text>
              <Text style={[styles.value, { color: colors.text }]}>Not provided</Text>
            </View>
          </View>
        </View>

        <View style={[styles.footerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.footerRow}>
            <Text style={[styles.footerLabel, { color: colors.textMuted }]}>Verification Status</Text>
            <Text style={[styles.footerValue, { color: colors.text }]}>
              {residentProfile?.verification_status
                ? residentProfile.verification_status.charAt(0).toUpperCase() + residentProfile.verification_status.slice(1)
                : 'Not provided'}
            </Text>
          </View>
          {residentProfile?.rejection_reason && (
            <View style={styles.footerRow}>
              <Text style={[styles.footerLabel, { color: colors.textMuted }]}>Rejection Reason</Text>
              <Text style={[styles.footerValue, { color: colors.danger }]}>{residentProfile.rejection_reason}</Text>
            </View>
          )}
        </View>

        <Pressable
          style={[styles.logoutBtn, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: colors.danger }]}>SIGN OUT OF RESIDENT MOBILE PORTAL</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 14,
    fontWeight: '700',
  },
  logoTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    padding: 6,
  },
  headerBtnIcon: {
    fontSize: 18,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 34,
    gap: 14,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarCircleText: {
    fontSize: 21,
    fontWeight: '800',
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileRole: {
    fontSize: 12,
  },
  editBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  editBtnText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  idInfo: {
    gap: 2,
  },
  idLabel: {
    fontSize: 11,
  },
  idValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    flex: 1,
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  footerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerLabel: {
    fontSize: 12,
    flex: 1,
  },
  footerValue: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  logoutBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});