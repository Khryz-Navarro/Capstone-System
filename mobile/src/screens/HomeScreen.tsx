import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getDocumentTypes, getNotifications, getProfile, listRequests, markAllNotificationsRead } from '../services/api';
import { TabName } from '../components/BottomTabBar';
import { useTheme } from '../theme/ThemeContext';
import AppHeader from '../components/AppHeader';

interface HomeScreenProps {
  onNavigate: (tab: TabName) => void;
  onRequestDocument: (documentTypeId: number) => void;
}

export default function HomeScreen({ onNavigate, onRequestDocument }: HomeScreenProps) {
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { colors } = useTheme();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [profileData, requestsData, docTypesData, notifData] = await Promise.all([
        getProfile(),
        listRequests(),
        getDocumentTypes().catch(() => []),
        getNotifications().catch(() => []),
      ]);

      setProfile(profileData);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      setDocumentTypes(Array.isArray(docTypesData) ? docTypesData : []);

      const notifs = Array.isArray(notifData) ? notifData : [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.read_at).length);
    } catch {
      Alert.alert('Error', 'Unable to load your dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead().catch(() => null);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
  }


  // NOTE: field names below (verification_status, philsys_id, barangay.name) are
  // placeholders based on likely shape — confirm against UserResource.php and adjust.
  const verificationStatus: string = profile?.resident_profile?.verification_status ?? 'pending';
  const isVerified = verificationStatus === 'verified' || verificationStatus === 'approved';
  const philSysId: string = '—'; // No PhilSys ID field exists in ResidentProfileResource yet
  const barangayName: string = profile?.barangay?.name ?? '—';

  const readyToClaimCount = requests.filter((r: any) => r.status === 'ready_for_pickup').length;
  const pendingReviewCount = requests.filter((r: any) =>
  r.status === 'submitted' || r.status === 'under_review'
  ).length;
  const recentRequests = requests.slice(0, 3);

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
           <AppHeader
        profile={profile}
        subtitle={`BARANGAY ${barangayName.toUpperCase()}`}
        unreadCount={unreadCount}
        onBellPress={handleMarkAllRead}
        onAvatarPress={() => onNavigate('profile')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {!isVerified && (
          <View style={[styles.pendingBanner, { borderColor: '#E8B93B', backgroundColor: '#2A2410' }]}>
            <Text style={[styles.pendingBannerTitle, { color: '#E8B93B' }]}>⚠ Government ID: Pending</Text>
            <Text style={[styles.pendingBannerText, { color: colors.textMuted }]}>
              Your uploaded ID/self is currently queued for manual validation by barangay officers.
            </Text>
            <Pressable>
              <Text style={[styles.pendingBannerLink, { color: '#E8B93B' }]}>Edit / Re-upload</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.passCard, { backgroundColor: '#0F3D2E', borderColor: colors.primary }]}>
          <View style={styles.passHeaderRow}>
            <View style={[styles.passBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.passBadgeText}>CITIZEN PASS</Text>
            </View>
            <View style={[styles.passStatusBadge, { backgroundColor: '#E8B93B' }]}>
              <Text style={styles.passStatusText}>ID: Pending (70%)</Text>
            </View>
          </View>

          <View style={styles.passBodyRow}>
            <View style={styles.passAvatarWrap}>
              <Text style={styles.passAvatarIcon}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.passName}>{profile?.name ?? 'Resident'}</Text>
              <Text style={styles.passSub}>Barangay {barangayName}, Kidapawan</Text>
            </View>
            <View style={styles.qrPlaceholder}>
              <Text style={{ fontSize: 20 }}>▦</Text>
            </View>
          </View>

          <Text style={styles.passId}>PHILSYS: {philSysId}</Text>

          <Pressable>
            <Text style={[styles.viewPassLink, { color: colors.primary }]}>View Full Pass →</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Ready to Claim</Text>
            <View style={styles.statValueRow}>
              <Text style={[styles.statValue, { color: colors.text }]}>{readyToClaimCount}</Text>
              <Text style={{ color: colors.primary }}>✓</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending Review</Text>
            <View style={styles.statValueRow}>
              <Text style={[styles.statValue, { color: colors.text }]}>{pendingReviewCount}</Text>
              <Text style={{ color: '#E8B93B' }}>⏱</Text>
            </View>
          </View>
        </View>

        {!isVerified && (
          <View style={[styles.lockedCard, { borderColor: colors.danger, backgroundColor: '#2A1414' }]}>
            <View style={styles.lockedHeaderRow}>
              <Text style={styles.lockedIcon}>🔒</Text>
              <Text style={[styles.lockedTitle, { color: colors.text }]}>Document Requests Locked</Text>
            </View>
            <Text style={[styles.lockedText, { color: colors.textMuted }]}>
              Requires verified government ID to submit formal clearances.
            </Text>
            <Pressable style={[styles.checkIdBtn, { backgroundColor: colors.danger }]}>
              <Text style={styles.checkIdBtnText}>Check ID Status</Text>
            </Pressable>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Certifications</Text>

        <View style={{ gap: 10 }}>
          {(documentTypes.length > 0
            ? documentTypes
            : [
                { id: 1, name: 'Barangay Clearance', description: 'For job employment, bank requirements, general clearance purposes.', fee: 50 },
                { id: 2, name: 'Certificate of Indigency', description: 'For educational scholarship, medical/financial assistance.', fee: 0 },
                { id: 3, name: 'Certificate of Residency', description: 'Proof of residence within Kidapawan City municipality.', fee: 50 },
              ]
          ).map((doc: any) => (
            <Pressable
                  key={doc.id}
                  style={[styles.certCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => onRequestDocument(doc.id)}
                >
              <Text style={styles.certIcon}>📄</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.certName, { color: colors.text }]}>{doc.name}</Text>
                <Text style={[styles.certDesc, { color: colors.textMuted }]} numberOfLines={1}>
                  {doc.description}
                </Text>
              </View>
              <Text style={[styles.certFee, { color: doc.fee === 0 ? colors.primary : colors.text }]}>
                {doc.fee === 0 ? 'FREE' : `₱${doc.fee}`}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>My Recent Requests</Text>

        {recentRequests.length === 0 ? (
          <View style={[styles.emptyRecentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.emptyRecentIcon}>▤</Text>
            <Text style={[styles.emptyRecentText, { color: colors.textMuted }]}>No document requests yet.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {recentRequests.map((req: any) => (
              <Pressable
                key={req.id}
                style={[styles.certCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => onNavigate('documents')}
              >
                <Text style={styles.certIcon}>📄</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.certName, { color: colors.text }]}>{req.document_type?.name ?? 'Document Request'}</Text>
                  <Text style={[styles.certDesc, { color: colors.textMuted }]}>{req.status}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 14 },

  pendingBanner: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  pendingBannerTitle: { fontSize: 13, fontWeight: '800' },
  pendingBannerText: { fontSize: 11, lineHeight: 16 },
  pendingBannerLink: { fontSize: 11, fontWeight: '700', marginTop: 4 },

  passCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  passHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  passBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  passBadgeText: { fontSize: 10, fontWeight: '800', color: '#041720' },
  passStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  passStatusText: { fontSize: 10, fontWeight: '700', color: '#2A2410' },
  passBodyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passAvatarWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  passAvatarIcon: { fontSize: 20 },
  passName: { fontSize: 16, fontWeight: '800', color: '#EAF6FF' },
  passSub: { fontSize: 11, color: '#9FD9C8' },
  qrPlaceholder: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  passId: { fontSize: 12, fontWeight: '700', color: '#2EE6C8' },
  viewPassLink: { fontSize: 12, fontWeight: '700', textAlign: 'right' },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statValue: { fontSize: 26, fontWeight: '800' },

  lockedCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  lockedHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lockedIcon: { fontSize: 16 },
  lockedTitle: { fontSize: 14, fontWeight: '800' },
  lockedText: { fontSize: 11, lineHeight: 16 },
  checkIdBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginTop: 4 },
  checkIdBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  sectionTitle: { fontSize: 15, fontWeight: '800', marginTop: 4 },

  certCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  certIcon: { fontSize: 18 },
  certName: { fontSize: 13, fontWeight: '700' },
  certDesc: { fontSize: 11, marginTop: 2 },
  certFee: { fontSize: 12, fontWeight: '800' },

  emptyRecentCard: { borderWidth: 1, borderRadius: 14, padding: 24, alignItems: 'center', gap: 8 },
  emptyRecentIcon: { fontSize: 28 },
  emptyRecentText: { fontSize: 12 },
});