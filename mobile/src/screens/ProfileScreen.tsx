import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// ---------- Types (match ResidentProfileResource output) ----------

interface ResidentAddress {
  house_number: string | null;
  street: string | null;
  purok: string | null;
  sitio: string | null;
  city: string | null;
  province: string | null;
}

interface SocialSector {
  is_senior_citizen: boolean;
  is_pwd: boolean;
  is_4ps_beneficiary: boolean;
  is_solo_parent: boolean;
  is_indigent_household: boolean;
  is_out_of_school_youth: boolean;
  is_ip_tribe_resident: boolean;
}

interface ResidentProfile {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  full_name: string;
  gender: string | null;
  birthdate: string | null;
  civil_status: string | null;
  occupation: string | null;
  mobile_number: string | null;
  email_address?: string | null;
  address: ResidentAddress;
  length_of_stay: string | null;
  household_role: string | null;
  educational_attainment: string | null;
  estimated_monthly_income: number | null;
  philsys_id: string | null;
  comelec_voter_status: string | null;
  social_sector: SocialSector;
  id_verification_type: string | null;
  id_document_number: string | null;
  verification_status: 'pending' | 'verified' | 'rejected' | string;
  verified_at: string | null;
  rejection_reason: string | null;
  token?: string;
  verification_scan_url?: string | null;
}

interface ProfileScreenProps {
  profile: ResidentProfile;
  onEditDetails?: () => void;
  onEditSection?: (section: string) => void;
  onLogout?: () => void;
}

// ---------- Helpers ----------

function calculateAge(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const bd = new Date(birthdate);
  const diff = Date.now() - bd.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function formatBirthdate(birthdate: string | null): string {
  if (!birthdate) return '—';
  const bd = new Date(birthdate);
  return bd.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '₱0.00';
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function formatAddress(address: ResidentAddress): string {
  return [address.house_number, address.street, address.sitio]
    .filter(Boolean)
    .join(' ');
}

function statusColor(status: string): string {
  switch (status) {
    case 'verified':
      return '#22C55E';
    case 'rejected':
      return '#EF4444';
    default:
      return '#F59E0B'; // pending
  }
}

// ---------- Small presentational pieces ----------

const SectionHeader: React.FC<{ title: string; onEdit?: () => void }> = ({
  title,
  onEdit,
}) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onEdit && (
      <TouchableOpacity onPress={onEdit}>
        <Text style={styles.editLink}>Edit</Text>
      </TouchableOpacity>
    )}
  </View>
);

const InfoRow: React.FC<{ label: string; value: string | null | undefined }> = ({
  label,
  value,
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '—'}</Text>
  </View>
);

const SocialSectorItem: React.FC<{ label: string; active: boolean }> = ({
  label,
  active,
}) => (
  <View style={styles.socialItem}>
    <Text style={styles.socialLabel}>{label}</Text>
    <View
      style={[
        styles.socialBadge,
        active ? styles.socialBadgeYes : styles.socialBadgeNo,
      ]}
    >
      <Text
        style={[
          styles.socialBadgeText,
          active ? styles.socialBadgeTextYes : styles.socialBadgeTextNo,
        ]}
      >
        {active ? 'YES' : 'NO'}
      </Text>
    </View>
  </View>
);

// ---------- Main screen ----------

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onEditDetails,
  onEditSection,
  onLogout,
}) => {
  const age = calculateAge(profile.birthdate);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Citizen Profile & Pass</Text>
          <Text style={styles.headerSubtitle}>
            Full residency file and digital identification
          </Text>
        </View>
        <TouchableOpacity style={styles.editDetailsButton} onPress={onEditDetails}>
          <Feather name="edit-2" size={12} color="#0B1220" />
          <Text style={styles.editDetailsText}>EDIT DETAILS</Text>
        </TouchableOpacity>
      </View>

      {/* ID Card */}
      <View style={styles.idCard}>
        <View style={styles.idCardTopRow}>
          <View style={styles.avatarCircle}>
            <Feather name="user" size={22} color="#0B1220" />
          </View>
          <View style={styles.qrButton}>
            <Feather name="maximize" size={18} color="#0B1220" />
          </View>
        </View>

        <Text style={styles.idCardName}>{profile.full_name}</Text>
        <Text style={styles.idCardBarangay}>Barangay Poblacion</Text>

        <View style={styles.idCardFooterRow}>
          <Text style={styles.tokenText}>TOKEN: {profile.token ?? '—'}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor(profile.verification_status) },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              ID STATUS: {profile.verification_status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Personal & Demographic */}
      <View style={styles.card}>
        <SectionHeader
          title="PERSONAL & DEMOGRAPHIC"
          onEdit={() => onEditSection?.('personal')}
        />
        <InfoRow label="Full Legal Name" value={profile.full_name} />
        <InfoRow
          label="Birth Date / Age"
          value={
            profile.birthdate
              ? `${formatBirthdate(profile.birthdate)} (${age} y/o)`
              : null
          }
        />
      </View>

      {/* Contact & Address */}
      <View style={styles.card}>
        <SectionHeader
          title="CONTACT & ADDRESS"
          onEdit={() => onEditSection?.('contact')}
        />
        <InfoRow label="Mobile Number" value={profile.mobile_number} />
        <InfoRow label="Email Address" value={profile.email_address} />
        <InfoRow label="Street Address" value={formatAddress(profile.address)} />
        <InfoRow label="Purok / Zone" value={profile.address.purok} />
        <InfoRow label="Length of Stay" value={profile.length_of_stay} />
        <InfoRow label="Household Role" value={profile.household_role} />
      </View>

      {/* Education & Livelihood */}
      <View style={styles.card}>
        <SectionHeader
          title="EDUCATION & LIVELIHOOD"
          onEdit={() => onEditSection?.('education')}
        />
        <InfoRow
          label="Educational Attainment"
          value={profile.educational_attainment}
        />
        <InfoRow label="Current Occupation" value={profile.occupation} />
        <InfoRow
          label="Estimated Monthly Income"
          value={formatCurrency(profile.estimated_monthly_income)}
        />
        <InfoRow label="PhilSys ID" value={profile.philsys_id} />
        <InfoRow
          label="COMELEC Voter ID Status"
          value={profile.comelec_voter_status}
        />
      </View>

      {/* Social Sector & Demographics */}
      <View style={styles.card}>
        <SectionHeader title="SOCIAL SECTOR & DEMOGRAPHICS" />
        <View style={styles.socialGrid}>
          <View style={styles.socialColumn}>
            <SocialSectorItem
              label="Senior Citizen"
              active={profile.social_sector.is_senior_citizen}
            />
            <SocialSectorItem
              label="4Ps/DCT Beneficiary"
              active={profile.social_sector.is_4ps_beneficiary}
            />
            <SocialSectorItem
              label="Indigent Household"
              active={profile.social_sector.is_indigent_household}
            />
            <SocialSectorItem
              label="IP Tribe Resident"
              active={profile.social_sector.is_ip_tribe_resident}
            />
          </View>
          <View style={styles.socialColumn}>
            <SocialSectorItem
              label="PWD (Disabled)"
              active={profile.social_sector.is_pwd}
            />
            <SocialSectorItem
              label="Solo Parent"
              active={profile.social_sector.is_solo_parent}
            />
            <SocialSectorItem
              label="Out of School Youth"
              active={profile.social_sector.is_out_of_school_youth}
            />
          </View>
        </View>
      </View>

      {/* Submitted Verification Document */}
      <View style={styles.card}>
        <SectionHeader title="SUBMITTED VERIFICATION DOCUMENT" />
        <InfoRow
          label="ID Verification Type"
          value={profile.id_verification_type}
        />
        <InfoRow
          label="ID Document Number"
          value={profile.id_document_number}
        />
        <Text style={styles.previewLabel}>Verification Scan Preview</Text>
        <View style={styles.previewBox}>
          {profile.verification_scan_url ? (
            <Image
              source={{ uri: profile.verification_scan_url }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : (
            <Feather name="file" size={28} color="#4B5563" />
          )}
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutButton} onPress={onLogout}>
        <Text style={styles.signOutText}>SIGN OUT OF RESIDENT MOBILE PORTAL</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ---------- Styles ----------

const CARD_BG = '#111A2A';
const SCREEN_BG = '#0B1220';
const BORDER = '#1F2A3D';
const GREEN = '#22C55E';
const TEXT_MUTED = '#8B95A7';
const TEXT_MAIN = '#F1F5F9';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    color: TEXT_MAIN,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginTop: 4,
    maxWidth: 220,
  },
  editDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  editDetailsText: {
    color: '#0B1220',
    fontSize: 10,
    fontWeight: '700',
  },
  idCard: {
    backgroundColor: '#0F2A20',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E4A38',
  },
  idCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idCardName: {
    color: TEXT_MAIN,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  idCardBarangay: {
    color: '#9CCFB5',
    fontSize: 12,
    marginTop: 2,
  },
  idCardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  tokenText: {
    color: '#9CCFB5',
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: '#0B1220',
    fontSize: 10,
    fontWeight: '700',
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: GREEN,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  editLink: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    color: TEXT_MUTED,
    fontSize: 13,
  },
  infoValue: {
    color: TEXT_MAIN,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  socialGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  socialColumn: {
    flex: 1,
  },
  socialItem: {
    marginBottom: 14,
  },
  socialLabel: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginBottom: 6,
  },
  socialBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  socialBadgeYes: {
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  socialBadgeNo: {
    backgroundColor: 'rgba(148,163,184,0.12)',
  },
  socialBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  socialBadgeTextYes: {
    color: GREEN,
  },
  socialBadgeTextNo: {
    color: TEXT_MUTED,
  },
  previewLabel: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  previewBox: {
    height: 90,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1220',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

export default ProfileScreen;